import { browser } from "wxt/browser";
import type { OffscreenRequest, OffscreenResponse } from "../messaging";

const OFFSCREEN_PATH = "/offscreen.html";
let creating: Promise<void> | null = null;

async function hasOffscreenDocument(): Promise<boolean> {
  const contexts = await browser.runtime.getContexts({
    contextTypes: [browser.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [browser.runtime.getURL(OFFSCREEN_PATH)],
  });
  return contexts.length > 0;
}

/** Creates the singleton offscreen document if it doesn't exist yet. */
export async function ensureOffscreenDocument(): Promise<void> {
  if (await hasOffscreenDocument()) return;
  creating ??= browser.offscreen
    .createDocument({
      url: OFFSCREEN_PATH,
      reasons: [
        browser.offscreen.Reason.USER_MEDIA,
        browser.offscreen.Reason.DISPLAY_MEDIA,
        browser.offscreen.Reason.CLIPBOARD,
      ],
      justification: "Record the screen, tab, microphone and upload the recording.",
    })
    .finally(() => {
      creating = null;
    });
  await creating;
}

export async function sendToOffscreen(message: OffscreenRequest): Promise<OffscreenResponse> {
  try {
    const response = (await browser.runtime.sendMessage(message)) as OffscreenResponse | undefined;
    return response ?? { ok: false, error: "Recorder is not running" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
