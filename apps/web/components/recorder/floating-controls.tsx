"use client";

import { formatDuration } from "@roll/shared";
import { Pause, Play, Square, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LogoMark } from "@/components/logo";

function RoundButton({
  label,
  onClick,
  tone = "neutral",
  size = "md",
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: "neutral" | "record" | "danger";
  size?: "md" | "lg";
  children: ReactNode;
}) {
  const tones = {
    neutral: "bg-white/8 text-white hover:bg-white/14 ring-1 ring-white/10",
    record:
      "bg-record text-white hover:brightness-110 shadow-[0_8px_24px_-6px_rgba(229,72,77,0.6)]",
    danger: "bg-[#3a1a1b] text-[#ffb3b0] hover:bg-[#4a1f21] ring-1 ring-[#e5484d]/40",
  };
  const sizes = { md: "size-12 [&_svg]:size-5", lg: "size-16 [&_svg]:size-6" };
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`flex items-center justify-center rounded-full outline-none transition-[filter,background-color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-white/60 active:scale-95 ${tones[tone]} ${sizes[size]}`}
      >
        {children}
      </button>
      <span className="text-[11px] text-white/55">{label}</span>
    </div>
  );
}

/**
 * Rendered (via portal) inside the always-on-top Picture-in-Picture window.
 * The browser decides the window size, so the layout fills whatever it gets.
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
  const counting = phase === "countdown";

  return (
    <main className="flex min-h-dvh select-none items-center justify-center bg-[#121110] p-4 text-white">
      <div className="flex w-full max-w-xl flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-8">
        {camera && (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="aspect-square w-32 shrink-0 -scale-x-100 rounded-full object-cover ring-2 ring-white/15 sm:w-40"
          />
        )}

        <div className="flex flex-col items-center gap-5">
          {/* The status block doubles as the expand/collapse toggle. */}
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-label={expanded ? "Hide recording controls" : "Show recording controls"}
            className="group flex flex-col items-center gap-3 rounded-2xl px-4 py-2 outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <span className="relative flex size-11 items-center justify-center">
              {!paused && !counting && (
                <span
                  aria-hidden
                  className="bg-record/35 absolute inset-0 animate-ping rounded-full motion-reduce:hidden"
                />
              )}
              <span className="bg-white/8 group-hover:bg-white/14 relative flex size-11 items-center justify-center rounded-full ring-1 ring-white/10 transition-colors">
                <LogoMark className="size-6" />
              </span>
            </span>
            <span className="text-4xl font-medium tabular-nums tracking-tight" role="timer">
              {counting ? countdown : formatDuration(elapsedMs)}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/55">
              <span
                aria-hidden
                className={`size-1.5 rounded-full ${paused ? "bg-amber-400" : "bg-record"}`}
              />
              {counting ? "Starting" : paused ? "Paused" : "Recording"}
              {!expanded && !counting && <span className="text-white/35"> · Tap for controls</span>}
            </span>
          </button>

          {expanded && !counting && (
            <div className="flex items-end gap-5">
              <RoundButton label={paused ? "Resume" : "Pause"} onClick={onTogglePause}>
                {paused ? <Play aria-hidden /> : <Pause aria-hidden />}
              </RoundButton>
              <RoundButton label="Stop" tone="record" size="lg" onClick={onStop}>
                <Square aria-hidden className="fill-current" />
              </RoundButton>
              <RoundButton
                label={confirmDiscard ? "Sure?" : "Discard"}
                tone={confirmDiscard ? "danger" : "neutral"}
                onClick={() => (confirmDiscard ? onDiscard() : setConfirmDiscard(true))}
              >
                <Trash2 aria-hidden />
              </RoundButton>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
