import { COUNTDOWN_SECONDS } from "@roll/shared";
import { browser } from "wxt/browser";
import { createVideo, NotSignedInError } from "../api";
import { isBusy, type RecordingOptions } from "../recorder-machine";
import {
  getFailedRecordings,
  getSession,
  removeFailedRecording,
  upsertFailedRecording,
} from "../storage";
import { ensureOffscreenDocument, sendToOffscreen } from "./offscreen";
import { clearPageUi, injectPageUi } from "./page-ui";
import { dispatch, getRuntime, getState, updateRuntime } from "./state";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Validates synchronously-ish so the popup can show an error before it closes. */
export async function canStart(): Promise<string | null> {
  if (!(await getSession())) return "Please sign in first.";
  if (isBusy(getState())) return "A recording is already in progress.";
  return null;
}

/** picker / stream acquisition → inject page UI → 3-2-1 → recording. */
export async function startRecording(options: RecordingOptions): Promise<void> {
  await dispatch({ type: "PREPARE", options });
  try {
    await ensureOffscreenDocument();
    // tabCapture stream ids are minted in the service worker (Chrome 116+) and
    // consumed by getUserMedia in the offscreen document.
    const tabStreamId =
      options.source === "tab"
        ? await browser.tabCapture.getMediaStreamId({ targetTabId: options.tabId })
        : null;

    const prepared = await sendToOffscreen({
      target: "offscreen",
      type: "PREPARE",
      source: options.source,
      tabStreamId,
      mic: options.mic,
      micDeviceId: options.micDeviceId,
    });
    if (!prepared.ok) {
      if (prepared.cancelled) {
        await dispatch({ type: "DISCARD" });
        return;
      }
      throw new Error(prepared.error);
    }
    if (getState().status !== "preparing") {
      // Cancelled from the popup while the picker was open.
      await sendToOffscreen({ target: "offscreen", type: "DISCARD" });
      return;
    }

    const hostTabId =
      options.source === "tab" ? options.tabId : ((await activeTabId()) ?? options.tabId);
    await injectPageUi(hostTabId, options.camera);
    await dispatch({ type: "PREPARED" });
    await runCountdown();
  } catch (error) {
    await sendToOffscreen({ target: "offscreen", type: "DISCARD" });
    await clearPageUi();
    await dispatch({ type: "FAILED", message: friendlyCaptureError(error) });
  }
}

function friendlyCaptureError(error: unknown): string {
  const text = message(error);
  if (/chrome:\/\/|Chrome pages cannot be captured|Extension has not been invoked/i.test(text)) {
    return "This tab can't be recorded. Try another tab, or record your screen instead.";
  }
  if (/active stream/i.test(text)) return "This tab is already being captured.";
  return text || "Couldn't start recording.";
}

async function activeTabId(): Promise<number | null> {
  const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
  return tab?.id ?? null;
}

async function runCountdown(): Promise<void> {
  for (let i = 1; i < COUNTDOWN_SECONDS; i += 1) {
    await sleep(1000);
    if (getState().status !== "countdown") return;
    await dispatch({ type: "COUNTDOWN_TICK" });
  }
  await sleep(1000);
  if (getState().status !== "countdown") return;

  // Hide the countdown overlay first so it never ends up in the recording.
  await dispatch({ type: "COUNTDOWN_DONE" });
  const started = await sendToOffscreen({ target: "offscreen", type: "START" });
  if (!started.ok) throw new Error(started.error);
}

export async function pauseRecording(): Promise<void> {
  if (getState().status !== "recording") return;
  const response = await sendToOffscreen({ target: "offscreen", type: "PAUSE" });
  if (response.ok) await dispatch({ type: "PAUSE" });
}

export async function resumeRecording(): Promise<void> {
  if (getState().status !== "paused") return;
  const response = await sendToOffscreen({ target: "offscreen", type: "RESUME" });
  if (response.ok) await dispatch({ type: "RESUME" });
}

export async function discardRecording(): Promise<void> {
  await sendToOffscreen({ target: "offscreen", type: "DISCARD" });
  await dispatch({ type: "DISCARD" });
  await clearPageUi();
}

/** Stop → create video (share link) → copy + open link → upload in the background. */
export async function stopRecording(): Promise<void> {
  const state = getState();
  if (state.status === "preparing" || state.status === "countdown") {
    await discardRecording();
    return;
  }
  if (state.status !== "recording" && state.status !== "paused") return;

  await dispatch({ type: "STOP" });
  const stopped = await sendToOffscreen({ target: "offscreen", type: "STOP" });
  await clearPageUi();
  if (!stopped.ok || !stopped.recording) {
    await dispatch({ type: "FAILED", message: stopped.ok ? "Recording failed" : stopped.error });
    return;
  }
  const { recordingId, durationMs } = stopped.recording;
  await beginUpload({ recordingId, durationMs, existing: null });
}

interface UploadTarget {
  videoId: string;
  uploadUrl: string;
  shareUrl: string;
}

async function beginUpload(input: {
  recordingId: string;
  durationMs: number;
  existing: UploadTarget | null;
}): Promise<void> {
  const { recordingId, durationMs } = input;
  let target = input.existing;
  const isNewVideo = target === null;

  if (!target) {
    try {
      const video = await createVideo();
      target = { videoId: video.id, uploadUrl: video.uploadUrl, shareUrl: video.shareUrl };
    } catch (error) {
      const text =
        error instanceof NotSignedInError
          ? error.message
          : `Couldn't create the video: ${message(error)}`;
      await upsertFailedRecording({
        recordingId,
        createdAt: Date.now(),
        durationMs,
        error: text,
        videoId: null,
        uploadUrl: null,
        shareUrl: null,
      });
      await dispatch({ type: "FAILED", message: text, recordingId });
      return;
    }
  }

  await updateRuntime({ pendingUpload: { recordingId, durationMs, ...target } });
  await dispatch({ type: "UPLOAD_STARTED", recordingId, shareUrl: target.shareUrl });

  if (isNewVideo) {
    // The link exists before the upload finishes; the viewer shows "Processing…".
    await sendToOffscreen({ target: "offscreen", type: "COPY", text: target.shareUrl });
    await browser.tabs.create({ url: target.shareUrl });
  }

  const started = await sendToOffscreen({
    target: "offscreen",
    type: "UPLOAD",
    recordingId,
    uploadUrl: target.uploadUrl,
  });
  if (!started.ok) await onUploadFailed(recordingId, started.error);
}

export async function onUploadProgress(recordingId: string, progress: number): Promise<void> {
  const state = getState();
  if (state.status === "uploading" && state.recordingId === recordingId) {
    await dispatch({ type: "UPLOAD_PROGRESS", progress });
  }
}

export async function onUploadDone(recordingId: string): Promise<void> {
  await removeFailedRecording(recordingId);
  await updateRuntime({ pendingUpload: null });
  await dispatch({ type: "UPLOAD_SUCCEEDED" });
}

export async function onUploadFailed(recordingId: string, error: string): Promise<void> {
  const pending = getRuntime().pendingUpload;
  const text = `Upload failed: ${error}`;
  await upsertFailedRecording({
    recordingId,
    createdAt: Date.now(),
    durationMs: pending?.durationMs ?? 0,
    error: text,
    videoId: pending?.recordingId === recordingId ? pending.videoId : null,
    uploadUrl: pending?.recordingId === recordingId ? pending.uploadUrl : null,
    shareUrl: pending?.recordingId === recordingId ? pending.shareUrl : null,
  });
  await updateRuntime({ pendingUpload: null });
  await dispatch({ type: "FAILED", message: text, recordingId });
}

/** Re-uploads a recording kept in IndexedDB, reusing its share link when possible. */
export async function retryUpload(recordingId: string): Promise<string | null> {
  if (isBusy(getState())) return "Finish the current recording first.";
  const failed = (await getFailedRecordings()).find((f) => f.recordingId === recordingId);
  if (!failed) return "That recording is no longer available.";

  await ensureOffscreenDocument();
  const existing =
    failed.videoId && failed.uploadUrl && failed.shareUrl
      ? { videoId: failed.videoId, uploadUrl: failed.uploadUrl, shareUrl: failed.shareUrl }
      : null;
  void beginUpload({ recordingId, durationMs: failed.durationMs, existing });
  return null;
}
