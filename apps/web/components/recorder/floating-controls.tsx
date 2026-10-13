"use client";

import { formatDuration } from "@roll/shared";
import { Pause, Play, Square, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/logo";

/**
 * Rendered (via portal) inside the floating Picture-in-Picture window.
 * Collapsed: Roll mark + timer. Click to expand into Pause / Stop / Discard.
 */
export function FloatingControls({
  phase,
  countdown,
  elapsedMs,
  camera,
  onTogglePause,
  onStop,
  onDiscard,
}: {
  phase: "countdown" | "recording" | "paused";
  countdown: number;
  elapsedMs: number;
  camera: MediaStream | null;
  onTogglePause: () => void;
  onStop: () => void;
  onDiscard: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = camera;
  }, [camera]);

  useEffect(() => {
    if (!confirmDiscard) return;
    const timer = setTimeout(() => setConfirmDiscard(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmDiscard]);

  const paused = phase === "paused";
  const button =
    "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-[background-color,transform] active:scale-[0.97] [&_svg]:size-3.5";

  return (
    <div className="flex h-dvh flex-col gap-2 p-2">
      {camera && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="min-h-0 w-full flex-1 -scale-x-100 rounded-lg object-cover"
        />
      )}

      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-label={expanded ? "Hide recording controls" : "Show recording controls"}
        className="bg-secondary hover:bg-accent flex h-11 items-center gap-2 rounded-lg px-3 text-left transition-colors"
      >
        <LogoMark className="size-6" />
        <span
          aria-hidden
          className={`size-2 rounded-full ${paused ? "bg-tint-yellow-foreground" : "bg-record animate-pulse"}`}
        />
        <span className="text-sm font-medium tabular-nums">
          {phase === "countdown" ? `Starting in ${countdown}` : formatDuration(elapsedMs)}
        </span>
        <span className="text-muted-foreground ml-auto text-xs">{paused ? "Paused" : "Rec"}</span>
      </button>

      {expanded && phase !== "countdown" && (
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onTogglePause}
            className={`${button} bg-secondary hover:bg-accent`}
          >
            {paused ? <Play aria-hidden /> : <Pause aria-hidden />}
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={onStop}
            className={`${button} bg-primary text-primary-foreground hover:bg-primary/85`}
          >
            <Square aria-hidden />
            Stop
          </button>
          <button
            type="button"
            onClick={() => (confirmDiscard ? onDiscard() : setConfirmDiscard(true))}
            className={`${button} ${confirmDiscard ? "bg-destructive text-destructive-foreground" : "bg-secondary text-destructive hover:bg-accent"}`}
            aria-label={confirmDiscard ? "Click again to discard" : "Discard recording"}
          >
            <Trash2 aria-hidden />
            {confirmDiscard ? "Sure?" : "Discard"}
          </button>
        </div>
      )}
    </div>
  );
}
