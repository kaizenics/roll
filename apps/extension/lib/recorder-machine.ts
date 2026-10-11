import { COUNTDOWN_SECONDS, RECORDING_WARNING_MS } from "@roll/shared";

export type CaptureSource = "screen" | "window" | "tab";

export interface RecordingOptions {
  source: CaptureSource;
  /** Tab the popup was opened on: recorded for "tab", hosts the UI otherwise. */
  tabId: number;
  mic: boolean;
  micDeviceId: string | null;
  camera: boolean;
  cameraDeviceId: string | null;
}

/**
 * idle → preparing → countdown → recording ⇄ paused → stopping → uploading → done | error
 * `preparing` covers the screen picker / stream acquisition before the countdown.
 */
export type RecorderState =
  | { status: "idle" }
  | { status: "preparing"; options: RecordingOptions }
  | { status: "countdown"; options: RecordingOptions; remaining: number }
  | { status: "recording"; options: RecordingOptions; elapsedMs: number; warned: boolean }
  | { status: "paused"; options: RecordingOptions; elapsedMs: number; warned: boolean }
  | { status: "stopping"; options: RecordingOptions; elapsedMs: number }
  | { status: "uploading"; recordingId: string; shareUrl: string; progress: number }
  | { status: "done"; shareUrl: string }
  | { status: "error"; message: string; recordingId: string | null };

export type RecorderEvent =
  | { type: "PREPARE"; options: RecordingOptions }
  | { type: "PREPARED" }
  | { type: "COUNTDOWN_TICK" }
  | { type: "COUNTDOWN_DONE" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "TICK"; elapsedMs: number }
  | { type: "STOP" }
  | { type: "DISCARD" }
  | { type: "UPLOAD_STARTED"; recordingId: string; shareUrl: string }
  | { type: "UPLOAD_PROGRESS"; progress: number }
  | { type: "UPLOAD_SUCCEEDED" }
  | { type: "FAILED"; message: string; recordingId?: string | null }
  | { type: "RESET" };

export const initialRecorderState: RecorderState = { status: "idle" };

/** Statuses during which media is being captured (or about to be). */
export function isCapturing(state: RecorderState): boolean {
  return (
    state.status === "preparing" ||
    state.status === "countdown" ||
    state.status === "recording" ||
    state.status === "paused"
  );
}

/** Statuses during which a new recording cannot be started. */
export function isBusy(state: RecorderState): boolean {
  return isCapturing(state) || state.status === "stopping" || state.status === "uploading";
}

/**
 * Pure reducer. Invalid transitions return the *same* state object so callers
 * can cheaply detect no-ops.
 */
export function recorderReducer(state: RecorderState, event: RecorderEvent): RecorderState {
  switch (event.type) {
    case "PREPARE":
      return state.status === "idle" || state.status === "done" || state.status === "error"
        ? { status: "preparing", options: event.options }
        : state;

    case "PREPARED":
      return state.status === "preparing"
        ? { status: "countdown", options: state.options, remaining: COUNTDOWN_SECONDS }
        : state;

    case "COUNTDOWN_TICK":
      return state.status === "countdown" && state.remaining > 1
        ? { ...state, remaining: state.remaining - 1 }
        : state;

    case "COUNTDOWN_DONE":
      return state.status === "countdown"
        ? { status: "recording", options: state.options, elapsedMs: 0, warned: false }
        : state;

    case "PAUSE":
      return state.status === "recording" ? { ...state, status: "paused" } : state;

    case "RESUME":
      return state.status === "paused" ? { ...state, status: "recording" } : state;

    case "TICK":
      if (state.status !== "recording" && state.status !== "paused") return state;
      return {
        ...state,
        elapsedMs: Math.max(state.elapsedMs, event.elapsedMs),
        warned: state.warned || event.elapsedMs >= RECORDING_WARNING_MS,
      };

    case "STOP":
      if (state.status === "recording" || state.status === "paused") {
        return { status: "stopping", options: state.options, elapsedMs: state.elapsedMs };
      }
      // Stopping before anything was recorded is the same as cancelling.
      return state.status === "preparing" || state.status === "countdown"
        ? initialRecorderState
        : state;

    case "DISCARD":
      return isCapturing(state) ? initialRecorderState : state;

    case "UPLOAD_STARTED":
      // From `stopping` after a recording, or from a resting state when retrying a failed upload.
      return state.status === "stopping" ||
        state.status === "idle" ||
        state.status === "done" ||
        state.status === "error"
        ? {
            status: "uploading",
            recordingId: event.recordingId,
            shareUrl: event.shareUrl,
            progress: 0,
          }
        : state;

    case "UPLOAD_PROGRESS":
      return state.status === "uploading"
        ? { ...state, progress: Math.min(100, Math.max(state.progress, event.progress)) }
        : state;

    case "UPLOAD_SUCCEEDED":
      return state.status === "uploading" ? { status: "done", shareUrl: state.shareUrl } : state;

    case "FAILED":
      return state.status === "idle"
        ? state
        : { status: "error", message: event.message, recordingId: event.recordingId ?? null };

    case "RESET":
      return state.status === "done" || state.status === "error" ? initialRecorderState : state;
  }
}
