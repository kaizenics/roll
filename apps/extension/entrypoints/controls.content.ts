import { browser } from "wxt/browser";
import { defineContentScript } from "wxt/utils/define-content-script";
import { isMessage, sendToBackground } from "@/lib/messaging";
import { createControlsUi } from "@/lib/page-ui/controls-ui";
import type { RecorderState } from "@/lib/recorder-machine";

declare global {
  interface Window {
    __rollControlsLoaded?: boolean;
  }
}

/** Countdown overlay + floating recording controls, injected on demand by the background. */
export default defineContentScript({
  matches: ["<all_urls>"],
  registration: "runtime",
  main() {
    // executeScript may run this again in the same isolated world; mount once.
    if (window.__rollControlsLoaded) return;
    window.__rollControlsLoaded = true;

    let ui: ReturnType<typeof createControlsUi> | null = null;

    const render = (state: RecorderState) => {
      const visible =
        state.status === "countdown" || state.status === "recording" || state.status === "paused";
      if (!visible) {
        ui?.destroy();
        ui = null;
        return;
      }
      ui ??= createControlsUi((message) => void sendToBackground(message));
      ui.render(state);
    };

    browser.runtime.onMessage.addListener((message: unknown) => {
      if (isMessage(message) && message.target === "ui" && message.type === "STATE_CHANGED") {
        render(message.state);
      }
    });

    void sendToBackground({ target: "background", type: "GET_PAGE_UI" }).then((response) => {
      if (response.ok && response.pageUi) render(response.pageUi.state);
    });
  },
});
