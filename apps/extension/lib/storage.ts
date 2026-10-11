import { extensionSessionSchema, type ExtensionSession } from "@roll/shared";
import { browser } from "wxt/browser";
import { z } from "zod";
import {
  initialRecorderState,
  type RecorderState,
  type RecordingOptions,
} from "./recorder-machine";

// ── Auth (chrome.storage.local) ──────────────────────────────────────────────
const AUTH_KEY = "auth";

export async function getSession(): Promise<ExtensionSession | null> {
  const stored = await browser.storage.local.get(AUTH_KEY);
  const parsed = extensionSessionSchema.safeParse(stored[AUTH_KEY]);
  return parsed.success ? parsed.data : null;
}

export async function setSession(session: ExtensionSession): Promise<void> {
  await browser.storage.local.set({ [AUTH_KEY]: session });
}

export async function clearSession(): Promise<void> {
  await browser.storage.local.remove(AUTH_KEY);
}

// ── Failed uploads (chrome.storage.local) ────────────────────────────────────
const FAILED_KEY = "failedRecordings";

const failedRecordingSchema = z.object({
  recordingId: z.string(),
  createdAt: z.number(),
  durationMs: z.number(),
  error: z.string(),
  videoId: z.string().nullable(),
  uploadUrl: z.string().nullable(),
  shareUrl: z.string().nullable(),
});

export type FailedRecording = z.infer<typeof failedRecordingSchema>;

export async function getFailedRecordings(): Promise<FailedRecording[]> {
  const stored = await browser.storage.local.get(FAILED_KEY);
  const parsed = z.array(failedRecordingSchema).safeParse(stored[FAILED_KEY]);
  return parsed.success ? parsed.data : [];
}

export async function upsertFailedRecording(entry: FailedRecording): Promise<void> {
  const list = (await getFailedRecordings()).filter((f) => f.recordingId !== entry.recordingId);
  await browser.storage.local.set({ [FAILED_KEY]: [entry, ...list].slice(0, 20) });
}

export async function removeFailedRecording(recordingId: string): Promise<void> {
  const list = await getFailedRecordings();
  await browser.storage.local.set({
    [FAILED_KEY]: list.filter((f) => f.recordingId !== recordingId),
  });
}

// ── Popup preferences (chrome.storage.local) ─────────────────────────────────
const PREFS_KEY = "preferences";

export type Preferences = Pick<
  RecordingOptions,
  "source" | "mic" | "micDeviceId" | "camera" | "cameraDeviceId"
>;

const DEFAULT_PREFS: Preferences = {
  source: "tab",
  mic: true,
  micDeviceId: null,
  camera: false,
  cameraDeviceId: null,
};

export async function getPreferences(): Promise<Preferences> {
  const stored = await browser.storage.local.get(PREFS_KEY);
  return { ...DEFAULT_PREFS, ...(stored[PREFS_KEY] as Partial<Preferences> | undefined) };
}

export async function setPreferences(prefs: Preferences): Promise<void> {
  await browser.storage.local.set({ [PREFS_KEY]: prefs });
}

// ── Live session state (chrome.storage.session, survives SW restarts) ───────
const RUNTIME_KEY = "runtime";

export interface RuntimeState {
  recorder: RecorderState;
  /** Tabs that currently host the camera bubble / controls overlay. */
  uiTabIds: number[];
  /** Upload target for the recording being uploaded. */
  pendingUpload: {
    recordingId: string;
    videoId: string;
    uploadUrl: string;
    shareUrl: string;
    durationMs: number;
  } | null;
}

export const initialRuntimeState: RuntimeState = {
  recorder: initialRecorderState,
  uiTabIds: [],
  pendingUpload: null,
};

export async function loadRuntimeState(): Promise<RuntimeState> {
  const stored = await browser.storage.session.get(RUNTIME_KEY);
  return (stored[RUNTIME_KEY] as RuntimeState | undefined) ?? initialRuntimeState;
}

export async function saveRuntimeState(state: RuntimeState): Promise<void> {
  await browser.storage.session.set({ [RUNTIME_KEY]: state });
}
