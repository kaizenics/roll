"use client";

import MuxPlayer, { type MuxPlayerRefAttributes } from "@mux/mux-player-react";
import { muxThumbnailUrl } from "@roll/shared";
import {
  ChevronLeft,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Scissors,
  SkipBack,
  SkipForward,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { trimVideo } from "@/lib/api-client";
import {
  formatTimecode,
  isUntrimmed,
  moveEdge,
  rulerTicks,
  secondsAt,
  type TrimRange,
} from "@/lib/trim";

const FRAME_COUNT = 12;
type Drag = "start" | "end" | "playhead" | null;

function ToolButton({
  label,
  shortcut,
  onClick,
  children,
}: {
  label: string;
  shortcut?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-md text-white/70 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/50 [&_svg]:size-4"
    >
      {children}
    </button>
  );
}

/** Timeline trim editor: preview, filmstrip, draggable in/out handles and playhead. */
export function TrimEditor({
  videoId,
  shortId,
  playbackId,
  title,
  durationSeconds,
}: {
  videoId: string;
  shortId: string;
  playbackId: string;
  title: string;
  durationSeconds: number;
}) {
  const router = useRouter();
  const player = useRef<MuxPlayerRefAttributes>(null);
  const track = useRef<HTMLDivElement>(null);
  const duration = durationSeconds;
  const [range, setRange] = useState<TrimRange>({ start: 0, end: duration });
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [drag, setDrag] = useState<Drag>(null);
  const [saving, setSaving] = useState(false);

  const seek = useCallback((seconds: number) => {
    if (player.current) player.current.currentTime = seconds;
    setTime(seconds);
  }, []);

  const togglePlay = useCallback(() => {
    const el = player.current;
    if (!el) return;
    if (el.paused) {
      // Always play inside the kept range.
      if (el.currentTime < range.start || el.currentTime >= range.end - 0.05) seek(range.start);
      void el.play();
    } else {
      el.pause();
    }
  }, [range, seek]);

  // Loop playback inside the trimmed range.
  function onTimeUpdate() {
    const el = player.current;
    if (!el) return;
    if (!el.paused && el.currentTime >= range.end) {
      el.pause();
      seek(range.start);
      return;
    }
    if (drag !== "playhead") setTime(el.currentTime);
  }

  const setEdge = useCallback(
    (edge: "start" | "end", seconds: number) => {
      setRange((current) => moveEdge(current, edge, seconds, duration));
    },
    [duration],
  );

  function pointerSeconds(event: PointerEvent) {
    const rect = track.current?.getBoundingClientRect();
    return rect ? secondsAt(event.clientX - rect.left, rect.width, duration) : 0;
  }

  function startDrag(kind: Exclude<Drag, null>, event: PointerEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    track.current?.setPointerCapture(event.pointerId);
    setDrag(kind);
    player.current?.pause();
    if (kind === "playhead") seek(pointerSeconds(event));
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const seconds = pointerSeconds(event);
    if (drag === "playhead") seek(seconds);
    else {
      setEdge(drag, seconds);
      seek(seconds); // Preview the frame under the handle, like CapCut.
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 1 : 0.1;
    const keys: Record<string, () => void> = {
      " ": togglePlay,
      ArrowLeft: () => seek(Math.max(0, time - step)),
      ArrowRight: () => seek(Math.min(duration, time + step)),
      i: () => setEdge("start", time),
      o: () => setEdge("end", time),
    };
    const action = keys[event.key.length === 1 ? event.key.toLowerCase() : event.key];
    if (!action) return;
    event.preventDefault();
    action();
  }

  // Keep the playhead inside the kept range after an edge moves past it.
  useEffect(() => {
    if (drag) return;
    if (time < range.start) seek(range.start);
    else if (time > range.end) seek(range.end);
  }, [range, drag, time, seek]);

  async function save() {
    if (isUntrimmed(range, duration)) return;
    setSaving(true);
    try {
      await trimVideo(videoId, Math.round(range.start * 10) / 10, Math.round(range.end * 10) / 10);
      toast.success("Trimming started. The new version will appear when it's ready.");
      router.push(`/v/${shortId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't trim the video");
      setSaving(false);
    }
  }

  const pct = (seconds: number) => `${(seconds / duration) * 100}%`;
  const kept = range.end - range.start;
  const frames = Array.from(
    { length: FRAME_COUNT },
    (_, i) => ((i + 0.5) / FRAME_COUNT) * duration,
  );
  const unchanged = isUntrimmed(range, duration);

  return (
    <div
      // The editor is keyboard-driven; focus it to use the shortcuts.
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="overflow-hidden rounded-2xl bg-[#121110] text-white outline-none ring-1 ring-white/10 focus-visible:ring-white/30"
    >
      {/* Top bar */}
      <header className="flex items-center gap-3 border-b border-white/10 px-3 py-2">
        <Link
          href={`/v/${shortId}`}
          className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Back
        </Link>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-medium">{title}</p>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || unchanged}
          className="bg-record flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-[filter,opacity] hover:brightness-110 disabled:opacity-40"
        >
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Export
        </button>
      </header>

      {/* Preview */}
      {/* Clicking the preview toggles playback; the play button is the accessible control. */}
      <div className="flex justify-center bg-black px-4 py-4" onClick={togglePlay}>
        <MuxPlayer
          ref={player}
          playbackId={playbackId}
          streamType="on-demand"
          title={title}
          nohotkeys
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={onTimeUpdate}
          className="aspect-video max-h-[50vh] w-auto max-w-full"
          style={{ "--controls": "none" }}
        />
      </div>

      {/* Transport */}
      <div className="flex items-center gap-2 border-y border-white/10 px-3 py-2">
        <div className="flex flex-1 items-center gap-1">
          <ToolButton
            label="Set start at playhead"
            shortcut="I"
            onClick={() => setEdge("start", time)}
          >
            <Scissors className="-scale-x-100" />
          </ToolButton>
          <ToolButton label="Set end at playhead" shortcut="O" onClick={() => setEdge("end", time)}>
            <Scissors />
          </ToolButton>
          <ToolButton label="Reset trim" onClick={() => setRange({ start: 0, end: duration })}>
            <RotateCcw />
          </ToolButton>
        </div>

        <div className="flex items-center gap-1">
          <ToolButton label="Jump to start" onClick={() => seek(range.start)}>
            <SkipBack />
          </ToolButton>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="flex size-10 items-center justify-center rounded-full bg-white text-black outline-none transition-transform focus-visible:ring-2 focus-visible:ring-white/50 active:scale-95 [&_svg]:size-4"
          >
            {playing ? (
              <Pause className="fill-current" />
            ) : (
              <Play className="translate-x-px fill-current" />
            )}
          </button>
          <ToolButton label="Jump to end" onClick={() => seek(range.end)}>
            <SkipForward />
          </ToolButton>
        </div>

        <p className="flex-1 text-right font-mono text-xs tabular-nums text-white/60">
          <span className="text-white">{formatTimecode(time)}</span> / {formatTimecode(duration)}
        </p>
      </div>

      {/* Timeline */}
      <div className="px-4 pb-5 pt-3">
        <div className="relative mb-2 h-4 select-none font-mono text-[10px] text-white/40">
          {rulerTicks(duration).map((tick) => (
            <span key={tick} className="absolute -translate-x-1/2" style={{ left: pct(tick) }}>
              {formatTimecode(tick).replace(/\.0$/, "")}
            </span>
          ))}
        </div>

        <div
          ref={track}
          role="slider"
          aria-label="Playhead"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={Math.round(time * 10) / 10}
          aria-valuetext={formatTimecode(time)}
          onPointerDown={(event) => startDrag("playhead", event)}
          onPointerMove={onPointerMove}
          onPointerUp={() => setDrag(null)}
          onPointerCancel={() => setDrag(null)}
          className="relative h-16 cursor-pointer touch-none select-none"
        >
          {/* Filmstrip */}
          <div className="absolute inset-0 flex overflow-hidden rounded-md bg-white/5">
            {frames.map((t) => (
              <div
                key={t}
                className="h-full flex-1 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${muxThumbnailUrl(playbackId, Math.round(t * 10) / 10)}&width=160)`,
                }}
              />
            ))}
          </div>

          {/* Cut-away regions */}
          <div
            className="absolute inset-y-0 left-0 rounded-l-md bg-black/70"
            style={{ width: pct(range.start) }}
          />
          <div
            className="absolute inset-y-0 right-0 rounded-r-md bg-black/70"
            style={{ width: `calc(100% - ${pct(range.end)})` }}
          />

          {/* Kept region frame with handles */}
          <div
            className="pointer-events-none absolute inset-y-0 rounded-md border-y-[3px] border-white"
            style={{ left: pct(range.start), width: pct(kept) }}
          >
            {(["start", "end"] as const).map((edge) => (
              <button
                key={edge}
                type="button"
                aria-label={edge === "start" ? "Trim start" : "Trim end"}
                aria-valuetext={formatTimecode(range[edge])}
                onPointerDown={(event) => startDrag(edge, event)}
                className={`pointer-events-auto absolute inset-y-[-3px] flex w-3.5 cursor-ew-resize items-center justify-center bg-white outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${edge === "start" ? "-left-3.5 rounded-l-md" : "-right-3.5 rounded-r-md"}`}
              >
                <span className="h-5 w-0.5 rounded-full bg-black/50" />
              </button>
            ))}
          </div>

          {/* Playhead */}
          <div
            className="bg-record pointer-events-none absolute -inset-y-2 w-0.5 -translate-x-1/2"
            style={{ left: pct(time) }}
          >
            <span className="bg-record absolute -top-1 left-1/2 size-3 -translate-x-1/2 rounded-full" />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/50">
          <span>
            Keeping{" "}
            <span className="font-mono text-white">
              {formatTimecode(range.start)} to {formatTimecode(range.end)}
            </span>{" "}
            ({formatTimecode(kept)})
          </span>
          <span className="hidden gap-4 sm:flex">
            <span>
              <kbd className="font-mono text-white/80">Space</kbd> play
            </span>
            <span>
              <kbd className="font-mono text-white/80">← →</kbd> nudge
            </span>
            <span>
              <kbd className="font-mono text-white/80">I</kbd> /{" "}
              <kbd className="font-mono text-white/80">O</kbd> set start / end
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
