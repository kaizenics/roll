import type { ExtensionSession, SessionUser } from "@roll/shared";
import { browser } from "wxt/browser";
import type { RecorderState, RecordingOptions } from "./recorder-machine";
import type { FailedRecording } from "./storage";

/**
 * Every runtime message carries a `target` because runtime.sendMessage is
 * broadcast to all extension contexts (popup, offscreen document, background).
 */

// ── Popup / content scripts / offscreen → background ────────────────────────
export type BackgroundRequest =
  | { target: "background"; type: "GET_STATUS" }
  | { target: "background"; type: "START"; options: RecordingOptions }
  | { target: "background"; type: "PAUSE" }
  | { target: "background"; type: "RESUME" }
  | { target: "background"; type: "STOP" }
  | { target: "background"; type: "DISCARD" }
  | { target: "background"; type: "RESET" }
  | { target: "background"; type: "RETRY_UPLOAD"; recordingId: string }
  | { target: "background"; type: "DISMISS_FAILED"; recordingId: string }
  | { target: "background"; type: "SIGN_IN" }
  | { target: "background"; type: "SIGN_OUT" }
  | { target: "background"; type: "AUTH_SESSION"; session: ExtensionSession }
  | { target: "background"; type: "GET_PAGE_UI" }
  // Events emitted by the offscreen document.
  | { target: "background"; type: "OFFSCREEN_TICK"; elapsedMs: number }
  | { target: "background"; type: "OFFSCREEN_SOURCE_ENDED" }
  | { target: "background"; type: "OFFSCREEN_LIMIT_REACHED" }
  | {
      target: "background";
      type: "OFFSCREEN_UPLOAD_PROGRESS";
      recordingId: string;
      progress: number;
    }
  | { target: "background"; type: "OFFSCREEN_UPLOAD_DONE"; recordingId: string }
  | { target: "background"; type: "OFFSCREEN_UPLOAD_FAILED"; recordingId: string; message: string };

export interface StatusResponse {
  state: RecorderState;
  user: SessionUser | null;
  failed: FailedRecording[];
}

export interface PageUiResponse {
  state: RecorderState;
  camera: { enabled: boolean; deviceId: string | null };
}

export type BackgroundResponse =
  { ok: true; status?: StatusResponse; pageUi?: PageUiResponse } | { ok: false; error: string };

// ── Background → offscreen document ─────────────────────────────────────────
export type OffscreenRequest =
  | {
      target: "offscreen";
      type: "PREPARE";
      source: RecordingOptions["source"];
      tabStreamId: string | null;
      mic: boolean;
      micDeviceId: string | null;
    }
  | { target: "offscreen"; type: "START" }
  | { target: "offscreen"; type: "PAUSE" }
  | { target: "offscreen"; type: "RESUME" }
  | { target: "offscreen"; type: "STOP" }
  | { target: "offscreen"; type: "DISCARD" }
  | { target: "offscreen"; type: "UPLOAD"; recordingId: string; uploadUrl: string }
  | { target: "offscreen"; type: "COPY"; text: string };

export type OffscreenResponse =
  | { ok: true; recording?: { recordingId: string; durationMs: number; size: number } }
  | { ok: false; error: string; cancelled?: boolean };

// ── Background → popup / page UIs ───────────────────────────────────────────
export interface StateBroadcast {
  target: "ui";
  type: "STATE_CHANGED";
  state: RecorderState;
}

export type AnyMessage = BackgroundRequest | OffscreenRequest | StateBroadcast;

export function isMessage(value: unknown): value is AnyMessage {
  return typeof value === "object" && value !== null && "target" in value && "type" in value;
}

/** Popup/content → background. Never rejects; failures become `{ ok: false }`. */
export async function sendToBackground(message: BackgroundRequest): Promise<BackgroundResponse> {
  try {
    const response = (await browser.runtime.sendMessage(message)) as BackgroundResponse | undefined;
    return response ?? { ok: false, error: "No response from extension" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Fire-and-forget broadcast; nobody listening is not an error. */
export function broadcast(message: StateBroadcast | BackgroundRequest): void {
  browser.runtime.sendMessage(message).catch(() => undefined);
}
