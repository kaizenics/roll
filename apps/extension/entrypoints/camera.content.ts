import { browser } from "wxt/browser";
import { defineContentScript } from "wxt/utils/define-content-script";
import { isMessage, sendToBackground } from "@/lib/messaging";
import { createCameraBubble } from "@/lib/page-ui/camera-bubble";
import { isCapturing, type RecorderState } from "@/lib/recorder-machine";

declare global {
  interface Window {
    __rollCameraLoaded?: boolean;
  }
}

/** Injects the draggable webcam bubble while a recording with camera is active. */
export default defineContentScript({
  matches: ["<all_urls>"],
  registration: "runtime",
  main() {
    if (window.__rollCameraLoaded) return;
    window.__rollCameraLoaded = true;

    let bubble: Awaited<ReturnType<typeof createCameraBubble>> | null = null;
    let mounting = false;

    const sync = async (state: RecorderState, deviceId: string | null) => {
      const wanted =
        isCapturing(state) &&
        state.status !== "preparing" &&
        "options" in state &&
        state.options.camera;
      if (!wanted) {
        bubble?.destroy();
        bubble = null;
        return;
      }
      if (bubble || mounting) return;
      mounting = true;
      try {
        bubble = await createCameraBubble(deviceId);
      } finally {
        mounting = false;
      }
    };

    browser.runtime.onMessage.addListener((message: unknown) => {
      if (isMessage(message) && message.target === "ui" && message.type === "STATE_CHANGED") {
        const state = message.state;
        void sync(state, "options" in state ? state.options.cameraDeviceId : null);
      }
    });

    void sendToBackground({ target: "background", type: "GET_PAGE_UI" }).then((response) => {
      if (response.ok && response.pageUi) {
        void sync(response.pageUi.state, response.pageUi.camera.deviceId);
      }
    });
  },
});
