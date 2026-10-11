import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import { forgetTab, injectPageUi } from "@/lib/background/page-ui";
import { recoverInterruptedRecordings } from "@/lib/background/recovery";
import { handleBackgroundMessage } from "@/lib/background/router";
import { ensureLoaded, getRuntime, getState, publishState } from "@/lib/background/state";
import { isMessage, type BackgroundRequest, type BackgroundResponse } from "@/lib/messaging";
import { isCapturing } from "@/lib/recorder-machine";

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
    if (!isMessage(message) || message.target !== "background") return undefined;
    ensureLoaded()
      .then(() => handleBackgroundMessage(message as BackgroundRequest, sender))
      .then(sendResponse, (error: unknown) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        } satisfies BackgroundResponse),
      );
    return true;
  });

  // Re-inject the bubble/controls after the recorded tab navigates.
  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status !== "complete") return;
    void ensureLoaded().then(async () => {
      const state = getState();
      if (!isCapturing(state) || !("options" in state)) return;
      const { uiTabIds } = getRuntime();
      const isRecordedTab = state.options.source === "tab" && state.options.tabId === tabId;
      if (isRecordedTab || uiTabIds.includes(tabId)) {
        await injectPageUi(tabId, state.options.camera);
        publishState();
      }
    });
  });

  // When recording a screen/window, the bubble follows the tab the user switches to.
  browser.tabs.onActivated.addListener(({ tabId }) => {
    void ensureLoaded().then(async () => {
      const state = getState();
      if (!isCapturing(state) || !("options" in state) || state.options.source === "tab") return;
      if (await injectPageUi(tabId, state.options.camera)) publishState();
    });
  });

  browser.tabs.onRemoved.addListener((tabId) => {
    void ensureLoaded().then(() => forgetTab(tabId));
  });

  browser.runtime.onStartup.addListener(() => {
    void recoverInterruptedRecordings().catch((error: unknown) =>
      console.warn("Recording recovery failed", error),
    );
  });
});
