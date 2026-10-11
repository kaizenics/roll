import { formatDuration, MAX_RECORDING_MS } from "@roll/shared";
import type { BackgroundRequest } from "../messaging";
import type { RecorderState } from "../recorder-machine";
import { BASE_CSS, createShadowHost, el } from "./shadow-host";

const CSS = `${BASE_CSS}
  .countdown {
    position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 16px; background: rgba(10, 10, 20, 0.45); pointer-events: auto;
  }
  .countdown-number {
    width: 160px; height: 160px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.95); color: #111; font-size: 88px; font-weight: 700;
    box-shadow: 0 20px 60px rgba(0,0,0,.35); animation: pop .9s ease-out;
  }
  @keyframes pop { from { transform: scale(1.25); opacity: .4 } to { transform: scale(1); opacity: 1 } }
  .countdown-cancel { background: rgba(0,0,0,.6); color: #fff; padding: 8px 16px; border-radius: 999px; font-size: 14px; }
  .pill {
    position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); pointer-events: auto;
    display: flex; align-items: center; gap: 4px; padding: 6px; border-radius: 999px;
    background: #16161d; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.35); font-size: 14px;
  }
  .pill.warn { background: #92400e; }
  .time { display: flex; align-items: center; gap: 8px; padding: 0 10px 0 8px; font-variant-numeric: tabular-nums; min-width: 92px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: #ef4444; animation: blink 1.2s infinite; }
  .paused .dot { background: #f59e0b; animation: none; }
  @keyframes blink { 50% { opacity: .3 } }
  .btn { display: flex; align-items: center; justify-content: center; gap: 6px; height: 36px; min-width: 36px;
    padding: 0 12px; border-radius: 999px; background: rgba(255,255,255,.1); color: #fff; font-size: 13px; }
  .btn:hover { background: rgba(255,255,255,.2); }
  .btn.stop { background: #ef4444; }
  .btn.stop:hover { background: #dc2626; }
  .btn.confirm { background: #b91c1c; }
  .warn-text { font-size: 12px; opacity: .9; padding-right: 6px; }
  svg { width: 16px; height: 16px; fill: currentColor; }
`;

const ICONS = {
  pause:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  trash:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h4v2H4V5h4zm-3 6h12l-1 12H7z"/></svg>',
};

type Send = (message: BackgroundRequest) => void;

function iconButton(className: string, icon: string, label: string, onClick: () => void) {
  const button = el("button", {
    className: `btn ${className}`,
    attrs: { type: "button", "aria-label": label },
  });
  button.innerHTML = icon;
  button.addEventListener("click", onClick);
  return button;
}

/** Countdown overlay + floating recording pill. */
export function createControlsUi(send: Send) {
  const { host, root } = createShadowHost("roll-controls", CSS);
  let discardArmedUntil = 0;

  function renderCountdown(remaining: number) {
    const cancel = el("button", {
      className: "countdown-cancel",
      textContent: "Cancel",
      attrs: { type: "button" },
    });
    cancel.addEventListener("click", () => send({ target: "background", type: "DISCARD" }));
    return el(
      "div",
      { className: "countdown", attrs: { role: "status", "aria-live": "assertive" } },
      [el("div", { className: "countdown-number", textContent: String(remaining) }), cancel],
    );
  }

  function renderPill(state: Extract<RecorderState, { status: "recording" | "paused" }>) {
    const paused = state.status === "paused";
    const remainingMs = Math.max(0, MAX_RECORDING_MS - state.elapsedMs);
    const pill = el("div", {
      className: `pill${paused ? " paused" : ""}${state.warned ? " warn" : ""}`,
      attrs: { role: "toolbar", "aria-label": "Roll recording controls" },
    });

    pill.append(
      el("div", { className: "time", attrs: { "aria-live": "off" } }, [
        el("span", { className: "dot" }),
        el("span", { textContent: formatDuration(state.elapsedMs) }),
      ]),
    );
    if (state.warned) {
      pill.append(
        el("span", { className: "warn-text", textContent: `${formatDuration(remainingMs)} left` }),
      );
    }
    pill.append(
      paused
        ? iconButton("", ICONS.play, "Resume recording", () =>
            send({ target: "background", type: "RESUME" }),
          )
        : iconButton("", ICONS.pause, "Pause recording", () =>
            send({ target: "background", type: "PAUSE" }),
          ),
      iconButton("stop", ICONS.stop, "Stop recording and share", () =>
        send({ target: "background", type: "STOP" }),
      ),
    );

    // Two-step discard to avoid losing a recording to a stray click.
    const armed = Date.now() < discardArmedUntil;
    const discard = iconButton(
      armed ? "confirm" : "",
      ICONS.trash,
      armed ? "Confirm discard" : "Discard recording",
      () => {
        if (Date.now() < discardArmedUntil) {
          send({ target: "background", type: "DISCARD" });
        } else {
          discardArmedUntil = Date.now() + 3000;
          discard.classList.add("confirm");
          discard.setAttribute("aria-label", "Click again to discard");
          discard.append(" Discard?");
        }
      },
    );
    if (armed) discard.append(" Discard?");
    pill.append(discard);
    return pill;
  }

  let current: HTMLElement | null = null;

  return {
    render(state: RecorderState) {
      let next: HTMLElement | null = null;
      if (state.status === "countdown") next = renderCountdown(state.remaining);
      else if (state.status === "recording" || state.status === "paused") next = renderPill(state);

      // Don't rebuild while the user is focused inside the pill (keyboard nav).
      const focused = root.activeElement !== null && current?.contains(root.activeElement);
      if (
        focused &&
        next &&
        current?.className === next.className &&
        state.status !== "countdown"
      ) {
        const time = current.querySelector(".time span:last-child");
        if (time && "elapsedMs" in state) time.textContent = formatDuration(state.elapsedMs);
        return;
      }
      current?.remove();
      current = next;
      if (next) root.append(next);
    },
    destroy() {
      host.remove();
    },
  };
}
