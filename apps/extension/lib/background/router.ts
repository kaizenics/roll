import { browser, type Browser } from "wxt/browser";
import { deleteRecording } from "../chunk-store";
import { APP_ORIGIN, CONNECT_URL } from "../env";
import type { BackgroundRequest, BackgroundResponse } from "../messaging";
import { isCapturing } from "../recorder-machine";
import {
  clearSession,
  getFailedRecordings,
  getSession,
  removeFailedRecording,
  setSession,
} from "../storage";
import {
  canStart,
  discardRecording,
  onUploadDone,
  onUploadFailed,
  onUploadProgress,
  pauseRecording,
  resumeRecording,
  retryUpload,
  startRecording,
  stopRecording,
} from "./recording";
import { dispatch, getState } from "./state";

const ok: BackgroundResponse = { ok: true };
const fail = (error: string): BackgroundResponse => ({ ok: false, error });

function isFromAppOrigin(sender: Browser.runtime.MessageSender): boolean {
  if (!sender.url || sender.id !== browser.runtime.id) return false;
  try {
    return new URL(sender.url).origin === APP_ORIGIN;
  } catch {
    return false;
  }
}

export async function handleBackgroundMessage(
  message: BackgroundRequest,
  sender: Browser.runtime.MessageSender,
): Promise<BackgroundResponse> {
  switch (message.type) {
    case "GET_STATUS": {
      const session = await getSession();
      return {
        ok: true,
        status: {
          state: getState(),
          user: session?.user ?? null,
          failed: await getFailedRecordings(),
        },
      };
    }

    case "GET_PAGE_UI": {
      const state = getState();
      const options = "options" in state ? state.options : null;
      return {
        ok: true,
        pageUi: {
          state,
          camera: {
            enabled: Boolean(options?.camera && isCapturing(state)),
            deviceId: options?.cameraDeviceId ?? null,
          },
        },
      };
    }

    case "START": {
      const blocked = await canStart();
      if (blocked) return fail(blocked);
      // The popup usually closes when the picker opens, so don't make it wait.
      void startRecording(message.options);
      return ok;
    }

    case "PAUSE":
      await pauseRecording();
      return ok;
    case "RESUME":
      await resumeRecording();
      return ok;
    case "STOP":
    case "OFFSCREEN_SOURCE_ENDED":
    case "OFFSCREEN_LIMIT_REACHED":
      void stopRecording();
      return ok;
    case "DISCARD":
      await discardRecording();
      return ok;
    case "RESET":
      await dispatch({ type: "RESET" });
      return ok;

    case "RETRY_UPLOAD": {
      const error = await retryUpload(message.recordingId);
      return error ? fail(error) : ok;
    }
    case "DISMISS_FAILED":
      await removeFailedRecording(message.recordingId);
      await deleteRecording(message.recordingId).catch(() => undefined);
      return ok;

    case "SIGN_IN":
      await browser.tabs.create({ url: CONNECT_URL });
      return ok;
    case "SIGN_OUT":
      await clearSession();
      return ok;

    case "AUTH_SESSION": {
      // Defense in depth: the content script already checks event.origin.
      if (!isFromAppOrigin(sender)) return fail("Untrusted sender");
      await setSession(message.session);
      const tabId = sender.tab?.id;
      if (tabId !== undefined) {
        setTimeout(() => void browser.tabs.remove(tabId).catch(() => undefined), 1500);
      }
      return ok;
    }

    case "OFFSCREEN_TICK":
      await dispatch({ type: "TICK", elapsedMs: message.elapsedMs });
      return ok;
    case "OFFSCREEN_UPLOAD_PROGRESS":
      await onUploadProgress(message.recordingId, message.progress);
      return ok;
    case "OFFSCREEN_UPLOAD_DONE":
      await onUploadDone(message.recordingId);
      return ok;
    case "OFFSCREEN_UPLOAD_FAILED":
      await onUploadFailed(message.recordingId, message.message);
      return ok;
  }
}
