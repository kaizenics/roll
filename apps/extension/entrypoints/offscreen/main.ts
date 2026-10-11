import { browser } from "wxt/browser";
import { deleteRecording, readRecordingBlob } from "@/lib/chunk-store";
import {
  broadcast,
  isMessage,
  type OffscreenRequest,
  type OffscreenResponse,
} from "@/lib/messaging";
import type { CaptureSource } from "@/lib/recorder-machine";
import { ScreenRecorder } from "@/lib/recorder";
import { uploadToMux } from "@/lib/upload";

/**
 * Offscreen document: owns the MediaStreams and MediaRecorder (service workers
 * have no DOM/media APIs) and performs the upload, so neither is interrupted
 * when the popup closes or the recorded tab navigates.
 */

const recorder = new ScreenRecorder({
  onTick: (elapsedMs) => broadcast({ target: "background", type: "OFFSCREEN_TICK", elapsedMs }),
  onSourceEnded: () => broadcast({ target: "background", type: "OFFSCREEN_SOURCE_ENDED" }),
  onLimitReached: () => broadcast({ target: "background", type: "OFFSCREEN_LIMIT_REACHED" }),
});

let preparedSource: CaptureSource = "tab";
/** Finished recordings kept in memory so uploads don't need an IndexedDB round trip. */
const finished = new Map<string, Blob>();

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function copyToClipboard(text: string): void {
  // navigator.clipboard requires a focused document, which an offscreen
  // document never is; execCommand works with the CLIPBOARD reason.
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

async function upload(recordingId: string, uploadUrl: string): Promise<void> {
  try {
    const blob = finished.get(recordingId) ?? (await readRecordingBlob(recordingId));
    if (!blob || blob.size === 0) throw new Error("The recording is empty or missing");

    let lastReported = -1;
    await uploadToMux(blob, uploadUrl, (progress) => {
      if (progress === lastReported) return;
      lastReported = progress;
      broadcast({ target: "background", type: "OFFSCREEN_UPLOAD_PROGRESS", recordingId, progress });
    });

    finished.delete(recordingId);
    await deleteRecording(recordingId).catch(() => undefined);
    broadcast({ target: "background", type: "OFFSCREEN_UPLOAD_DONE", recordingId });
  } catch (error) {
    // The blob stays in IndexedDB so the user can retry from the popup.
    finished.delete(recordingId);
    broadcast({
      target: "background",
      type: "OFFSCREEN_UPLOAD_FAILED",
      recordingId,
      message: errorMessage(error),
    });
  }
}

async function handle(message: OffscreenRequest): Promise<OffscreenResponse> {
  switch (message.type) {
    case "PREPARE":
      try {
        preparedSource = message.source;
        await recorder.prepare(message);
        return { ok: true };
      } catch (error) {
        const cancelled = error instanceof DOMException && error.name === "NotAllowedError";
        return { ok: false, cancelled, error: errorMessage(error) };
      }
    case "START":
      await recorder.start(preparedSource);
      return { ok: true };
    case "PAUSE":
      recorder.pause();
      return { ok: true };
    case "RESUME":
      recorder.resume();
      return { ok: true };
    case "STOP": {
      const result = await recorder.stop();
      finished.set(result.recordingId, result.blob);
      return {
        ok: true,
        recording: {
          recordingId: result.recordingId,
          durationMs: result.durationMs,
          size: result.size,
        },
      };
    }
    case "DISCARD": {
      const recordingId = await recorder.discard();
      if (recordingId) await deleteRecording(recordingId).catch(() => undefined);
      return { ok: true };
    }
    case "UPLOAD":
      void upload(message.recordingId, message.uploadUrl);
      return { ok: true };
    case "COPY":
      copyToClipboard(message.text);
      return { ok: true };
  }
}

browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isMessage(message) || message.target !== "offscreen") return undefined;
  handle(message as OffscreenRequest).then(sendResponse, (error: unknown) =>
    sendResponse({ ok: false, error: errorMessage(error) } satisfies OffscreenResponse),
  );
  return true;
});
