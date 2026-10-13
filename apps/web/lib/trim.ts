/** Shortest result allowed by the trim API (see trimVideoRequestSchema). */
export const MIN_TRIM_SECONDS = 1;

export interface TrimRange {
  start: number;
  end: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Moves one edge, keeping it inside the video and at least MIN_TRIM_SECONDS from the other. */
export function moveEdge(
  range: TrimRange,
  edge: "start" | "end",
  seconds: number,
  duration: number,
): TrimRange {
  if (edge === "start") {
    return { ...range, start: clamp(seconds, 0, Math.max(0, range.end - MIN_TRIM_SECONDS)) };
  }
  return {
    ...range,
    end: clamp(seconds, Math.min(duration, range.start + MIN_TRIM_SECONDS), duration),
  };
}

/** Converts a pointer x position on the timeline into seconds. */
export function secondsAt(x: number, width: number, duration: number): number {
  if (width <= 0) return 0;
  return clamp((x / width) * duration, 0, duration);
}

/** m:ss.d, e.g. 1:07.4. Tenths make short trims precise without clutter. */
export function formatTimecode(seconds: number): string {
  const tenths = Math.max(0, Math.round(seconds * 10));
  const minutes = Math.floor(tenths / 600);
  const rest = (tenths % 600) / 10;
  return `${minutes}:${rest.toFixed(1).padStart(4, "0")}`;
}

/** Evenly spaced tick marks (in seconds) for the time ruler. */
export function rulerTicks(duration: number, approxCount = 8): number[] {
  if (duration <= 0) return [0];
  const steps = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300];
  const step = steps.find((s) => duration / s < approxCount) ?? 600;
  const ticks: number[] = [];
  for (let t = 0; t <= duration + 1e-6; t += step) ticks.push(Math.round(t * 10) / 10);
  return ticks;
}

export function isUntrimmed(range: TrimRange, duration: number): boolean {
  return range.start < 0.05 && duration - range.end < 0.05;
}
