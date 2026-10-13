import { formatDuration, MAX_RECORDING_MS } from "@roll/shared";
import { useState } from "react";
import { browser } from "wxt/browser";
import { sendToBackground } from "@/lib/messaging";
import type { RecorderState } from "@/lib/recorder-machine";
import { Alert, Button } from "./ui";

const send = (type: "PAUSE" | "RESUME" | "STOP" | "DISCARD" | "RESET") =>
  void sendToBackground({ target: "background", type });

function ShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={url}
        aria-label="Share link"
        className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-transparent px-2 py-1.5 text-sm dark:border-stone-700"
        onFocus={(event) => event.currentTarget.select()}
      />
      <Button
        variant="secondary"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
        }}
      >
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

/** Popup view for every non-idle recorder state. */
export function StatusView({ state }: { state: Exclude<RecorderState, { status: "idle" }> }) {
  switch (state.status) {
    case "preparing":
      return (
        <section className="flex flex-col gap-3 p-4 text-center">
          <p className="text-sm">Choose what to share in Chrome’s picker…</p>
          <Button variant="secondary" onClick={() => send("DISCARD")}>
            Cancel
          </Button>
        </section>
      );

    case "countdown":
      return (
        <section className="flex flex-col items-center gap-3 p-6">
          <p className="text-5xl font-bold tabular-nums" role="status">
            {state.remaining}
          </p>
          <Button variant="secondary" onClick={() => send("DISCARD")}>
            Cancel
          </Button>
        </section>
      );

    case "recording":
    case "paused": {
      const paused = state.status === "paused";
      return (
        <section className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-center gap-2" role="timer" aria-live="off">
            <span
              aria-hidden
              className={`size-3 rounded-full ${paused ? "bg-amber-500" : "animate-pulse bg-red-500"}`}
            />
            <span className="text-3xl font-semibold tabular-nums">
              {formatDuration(state.elapsedMs)}
            </span>
            <span className="text-sm text-stone-500">{paused ? "Paused" : "Recording"}</span>
          </div>
          {state.warned && (
            <Alert tone="info">
              {formatDuration(MAX_RECORDING_MS - state.elapsedMs)} left. Recordings stop at 30:00.
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => send(paused ? "RESUME" : "PAUSE")}>
              {paused ? "Resume" : "Pause"}
            </Button>
            <Button variant="danger" onClick={() => send("STOP")}>
              Stop & share
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              if (window.confirm("Discard this recording? It can’t be recovered.")) send("DISCARD");
            }}
          >
            Discard recording
          </Button>
        </section>
      );
    }

    case "stopping":
      return (
        <p className="p-6 text-center text-sm" role="status">
          Finishing recording…
        </p>
      );

    case "uploading":
      return (
        <section className="flex flex-col gap-3 p-4">
          <p className="text-sm font-medium">Uploading… {state.progress}%</p>
          <div
            className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={state.progress}
            aria-label="Upload progress"
          >
            <div
              className="bg-brand h-full transition-all"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <p className="text-xs text-stone-500">
            The link is already on your clipboard. Keep Chrome open until the upload finishes.
          </p>
          <ShareLink url={state.shareUrl} />
        </section>
      );

    case "done":
      return (
        <section className="flex flex-col gap-3 p-4">
          <p className="text-sm font-medium">Uploaded. Your video is processing.</p>
          <ShareLink url={state.shareUrl} />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={() => void browser.tabs.create({ url: state.shareUrl })}
            >
              Open video
            </Button>
            <Button onClick={() => send("RESET")}>New recording</Button>
          </div>
        </section>
      );

    case "error":
      return (
        <section className="flex flex-col gap-3 p-4">
          <Alert>{state.message}</Alert>
          <div className="grid grid-cols-2 gap-2">
            {state.recordingId && (
              <Button
                onClick={() =>
                  void sendToBackground({
                    target: "background",
                    type: "RETRY_UPLOAD",
                    recordingId: state.recordingId ?? "",
                  })
                }
              >
                Retry upload
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => send("RESET")}
              className={state.recordingId ? "" : "col-span-2"}
            >
              Dismiss
            </Button>
          </div>
        </section>
      );
  }
}
