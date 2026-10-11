import { browser } from "wxt/browser";

/**
 * One-time page that requests mic/camera for the extension origin. The
 * offscreen document and camera iframe can't show permission prompts, but
 * they inherit a grant made here.
 */
const params = new URLSearchParams(location.search);
const wantMic = params.get("mic") === "1";
const wantCamera = params.get("camera") === "1";

const title = document.getElementById("title");
const message = document.getElementById("message");
const button = document.getElementById("request");

function show(heading: string, body: string): void {
  if (title) title.textContent = heading;
  if (message) message.textContent = body;
}

async function request(): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: wantMic,
      video: wantCamera,
    });
    stream.getTracks().forEach((track) => track.stop());
    button?.setAttribute("hidden", "");
    show("You're all set ✓", "Access granted. Open Roll from the toolbar to start recording.");
    const tab = await browser.tabs.getCurrent();
    if (tab?.id !== undefined) {
      const tabId = tab.id;
      setTimeout(() => void browser.tabs.remove(tabId), 1500);
    }
  } catch {
    show(
      "Access was blocked",
      "Click the camera icon in the address bar (or the site settings), allow access for Roll, then try again.",
    );
  }
}

if (!wantMic && !wantCamera) {
  show("Nothing to allow", "You can close this tab.");
  button?.setAttribute("hidden", "");
} else {
  button?.addEventListener("click", () => void request());
  void request();
}
