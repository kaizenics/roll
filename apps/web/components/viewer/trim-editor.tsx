"use client";

import MuxPlayer, { type MuxPlayerRefAttributes } from "@mux/mux-player-react";
import { formatDuration, trimVideoRequestSchema } from "@roll/shared";
import { Loader2, Scissors } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trimVideo } from "@/lib/api-client";

const round = (seconds: number) => Math.round(seconds * 10) / 10;

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
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(round(durationSeconds));
  const [saving, setSaving] = useState(false);

  const currentTime = () => round(player.current?.currentTime ?? 0);
  const parsed = trimVideoRequestSchema.safeParse({ startSeconds: start, endSeconds: end });
  const invalid = !parsed.success
    ? parsed.error.issues[0]?.message
    : end > durationSeconds + 0.5
      ? "End is past the end of the video"
      : null;
  const unchanged = start === 0 && end >= round(durationSeconds);

  async function save() {
    if (invalid || unchanged) return;
    setSaving(true);
    try {
      await trimVideo(videoId, start, end);
      toast.success("Trimming started. The new version will appear when it's ready.");
      router.push(`/v/${shortId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't trim the video");
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_18rem] md:items-start">
      <div className="overflow-hidden rounded-xl bg-[#161513]">
        <MuxPlayer
          ref={player}
          playbackId={playbackId}
          streamType="on-demand"
          accentColor="#e5484d"
          title={title}
          className="aspect-video w-full"
        />
      </div>

      <div className="flex flex-col gap-5">
        {(
          [
            ["start", "Start", start, setStart],
            ["end", "End", end, setEnd],
          ] as const
        ).map(([id, label, value, set]) => (
          <div key={id} className="flex flex-col gap-2">
            <Label htmlFor={`trim-${id}`}>
              {label}{" "}
              <span className="text-muted-foreground font-normal">
                ({formatDuration(value * 1000)})
              </span>
            </Label>
            <div className="flex gap-2">
              <Input
                id={`trim-${id}`}
                type="number"
                min={0}
                max={round(durationSeconds)}
                step={0.1}
                value={value}
                onChange={(event) => set(Number(event.target.value))}
              />
              <Button variant="outline" onClick={() => set(currentTime())}>
                Use current
              </Button>
            </div>
          </div>
        ))}
        <p className="text-muted-foreground text-sm">
          New length: {formatDuration(Math.max(0, end - start) * 1000)} of{" "}
          {formatDuration(durationSeconds * 1000)}
        </p>
        {invalid && (
          <p role="alert" className="bg-tint-red text-tint-red-foreground rounded-md p-3 text-sm">
            {invalid}
          </p>
        )}
        <Button
          size="lg"
          onClick={() => void save()}
          disabled={saving || Boolean(invalid) || unchanged}
        >
          {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Scissors aria-hidden />}
          Save trim
        </Button>
        <Button asChild variant="ghost">
          <Link href={`/v/${shortId}`}>Cancel</Link>
        </Button>
      </div>
    </div>
  );
}
