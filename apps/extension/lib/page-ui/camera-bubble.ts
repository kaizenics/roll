import { browser } from "wxt/browser";
import { BASE_CSS, createShadowHost, el } from "./shadow-host";

const SIZES = { S: 120, M: 180, L: 260 } as const;
type Size = keyof typeof SIZES;
const PREFS_KEY = "cameraBubble";

interface BubblePrefs {
  size: Size;
  /** Distance from the bottom-left corner of the viewport. */
  left: number;
  bottom: number;
}

const DEFAULT_PREFS: BubblePrefs = { size: "M", left: 24, bottom: 24 };

const CSS = `${BASE_CSS}
  .wrap { position: fixed; pointer-events: auto; touch-action: none; user-select: none; }
  .circle { position: relative; border-radius: 50%; overflow: hidden; background: #111;
    box-shadow: 0 10px 30px rgba(0,0,0,.35); border: 3px solid rgba(255,255,255,.9); cursor: grab; }
  .circle:active { cursor: grabbing; }
  iframe { width: 100%; height: 100%; border: 0; pointer-events: none; display: block; }
  .bar { position: absolute; left: 50%; top: -14px; transform: translate(-50%, -100%); display: flex; gap: 4px;
    padding: 4px; border-radius: 999px; background: #16161d; opacity: 0; transition: opacity .15s; }
  .wrap:hover .bar, .wrap:focus-within .bar { opacity: 1; }
  .bar button { height: 26px; min-width: 26px; padding: 0 8px; border-radius: 999px; background: transparent;
    color: #fff; font-size: 12px; font-weight: 600; }
  .bar button[aria-pressed="true"] { background: rgba(255,255,255,.2); }
  .bar button:hover { background: rgba(255,255,255,.25); }
  .show { pointer-events: auto; position: fixed; padding: 8px 12px; border-radius: 999px; background: #16161d;
    color: #fff; font-size: 12px; box-shadow: 0 6px 20px rgba(0,0,0,.3); }
`;

async function loadPrefs(): Promise<BubblePrefs> {
  const stored = await browser.storage.local.get(PREFS_KEY).catch(() => ({}));
  return {
    ...DEFAULT_PREFS,
    ...((stored as Record<string, Partial<BubblePrefs>>)[PREFS_KEY] ?? {}),
  };
}

function savePrefs(prefs: BubblePrefs): void {
  void browser.storage.local.set({ [PREFS_KEY]: prefs }).catch(() => undefined);
}

/**
 * Circular, draggable webcam bubble. The <video> lives in an extension page
 * iframe (camera-preview.html) so the camera permission belongs to the extension
 * origin; the bubble then simply appears in any screen/tab capture.
 */
export async function createCameraBubble(deviceId: string | null) {
  const prefs = await loadPrefs();
  const { host, root } = createShadowHost("roll-camera", CSS);
  const wrap = el("div", { className: "wrap" });
  const circle = el("div", {
    className: "circle",
    attrs: { role: "img", "aria-label": "Your camera" },
  });
  const src = new URL(browser.runtime.getURL("/camera-preview.html"));
  if (deviceId) src.searchParams.set("deviceId", deviceId);
  const frame = el("iframe", {
    attrs: { src: src.toString(), allow: "camera", title: "Camera preview" },
  });
  circle.append(frame);

  const bar = el("div", {
    className: "bar",
    attrs: { role: "toolbar", "aria-label": "Camera bubble" },
  });
  const sizeButtons = (Object.keys(SIZES) as Size[]).map((size) => {
    const button = el("button", {
      textContent: size,
      attrs: { type: "button", "aria-label": `Camera size ${size}` },
    });
    button.addEventListener("click", () => {
      prefs.size = size;
      layout();
      savePrefs(prefs);
    });
    return button;
  });
  const hide = el("button", {
    textContent: "Hide",
    attrs: { type: "button", "aria-label": "Hide camera" },
  });
  bar.append(...sizeButtons, hide);
  wrap.append(circle, bar);
  root.append(wrap);

  const show = el("button", {
    className: "show",
    textContent: "Show camera",
    attrs: { type: "button" },
  });
  hide.addEventListener("click", () => {
    wrap.remove();
    show.style.left = `${prefs.left}px`;
    show.style.bottom = `${prefs.bottom}px`;
    root.append(show);
  });
  show.addEventListener("click", () => {
    show.remove();
    root.append(wrap);
  });

  function clamp() {
    const size = SIZES[prefs.size];
    prefs.left = Math.min(Math.max(8, prefs.left), Math.max(8, window.innerWidth - size - 8));
    prefs.bottom = Math.min(Math.max(8, prefs.bottom), Math.max(8, window.innerHeight - size - 8));
  }

  function layout() {
    clamp();
    const size = SIZES[prefs.size];
    circle.style.width = `${size}px`;
    circle.style.height = `${size}px`;
    wrap.style.left = `${prefs.left}px`;
    wrap.style.bottom = `${prefs.bottom}px`;
    for (const button of sizeButtons) {
      button.setAttribute("aria-pressed", String(button.textContent === prefs.size));
    }
  }

  // Pointer-based dragging (the iframe ignores pointer events so the circle receives them).
  let drag: { x: number; y: number; left: number; bottom: number } | null = null;
  circle.addEventListener("pointerdown", (event) => {
    drag = { x: event.clientX, y: event.clientY, left: prefs.left, bottom: prefs.bottom };
    circle.setPointerCapture(event.pointerId);
  });
  circle.addEventListener("pointermove", (event) => {
    if (!drag) return;
    prefs.left = drag.left + (event.clientX - drag.x);
    prefs.bottom = drag.bottom - (event.clientY - drag.y);
    layout();
  });
  circle.addEventListener("pointerup", () => {
    if (drag) savePrefs(prefs);
    drag = null;
  });

  const onResize = () => layout();
  window.addEventListener("resize", onResize);
  layout();

  return {
    destroy() {
      window.removeEventListener("resize", onResize);
      host.remove();
    },
  };
}
