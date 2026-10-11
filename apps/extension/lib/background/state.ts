import { browser } from "wxt/browser";
import { broadcast, type StateBroadcast } from "../messaging";
import { recorderReducer, type RecorderEvent, type RecorderState } from "../recorder-machine";
import {
  initialRuntimeState,
  loadRuntimeState,
  saveRuntimeState,
  type RuntimeState,
} from "../storage";

/**
 * Single source of truth for the recorder in the service worker. Mirrored to
 * chrome.storage.session so it survives service-worker restarts.
 */

let runtime: RuntimeState = initialRuntimeState;
let loading: Promise<void> | null = null;
let saving: Promise<void> = Promise.resolve();

export function ensureLoaded(): Promise<void> {
  loading ??= loadRuntimeState().then((stored) => {
    runtime = stored;
  });
  return loading;
}

export function getRuntime(): RuntimeState {
  return runtime;
}

export function getState(): RecorderState {
  return runtime.recorder;
}

function persist(): Promise<void> {
  const snapshot = runtime;
  saving = saving.then(() => saveRuntimeState(snapshot)).catch(() => undefined);
  return saving;
}

export async function updateRuntime(patch: Partial<Omit<RuntimeState, "recorder">>): Promise<void> {
  runtime = { ...runtime, ...patch };
  await persist();
}

const BADGE: Partial<Record<RecorderState["status"], { text: string; color: string }>> = {
  countdown: { text: "•", color: "#dc2626" },
  recording: { text: "REC", color: "#dc2626" },
  paused: { text: "❚❚", color: "#d97706" },
  stopping: { text: "…", color: "#6d5dfc" },
  error: { text: "!", color: "#dc2626" },
};

async function updateBadge(state: RecorderState): Promise<void> {
  const badge =
    state.status === "uploading"
      ? { text: `${state.progress}%`, color: "#6d5dfc" }
      : BADGE[state.status];
  await browser.action.setBadgeText({ text: badge?.text ?? "" });
  if (badge) await browser.action.setBadgeBackgroundColor({ color: badge.color });
}

/** Pushes the state to the popup and to every page hosting the bubble/controls. */
export function publishState(state: RecorderState = runtime.recorder): void {
  const message: StateBroadcast = { target: "ui", type: "STATE_CHANGED", state };
  broadcast(message);
  for (const tabId of runtime.uiTabIds) {
    browser.tabs.sendMessage(tabId, message).catch(() => undefined);
  }
}

/** Applies an event through the pure reducer; no-ops are not persisted or broadcast. */
export async function dispatch(event: RecorderEvent): Promise<RecorderState> {
  const next = recorderReducer(runtime.recorder, event);
  if (next === runtime.recorder) return next;

  const statusChanged = next.status !== runtime.recorder.status;
  runtime = { ...runtime, recorder: next };
  publishState(next);
  if (statusChanged || next.status === "uploading") await updateBadge(next).catch(() => undefined);
  // TICKs are frequent and recomputable; only persist meaningful transitions.
  if (event.type !== "TICK" && event.type !== "UPLOAD_PROGRESS") await persist();
  return next;
}
