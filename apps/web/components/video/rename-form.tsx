"use client";

import { Check, X } from "lucide-react";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { TITLE_MAX_LENGTH, updateVideoRequestSchema, type VideoDTO } from "@roll/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renameVideo } from "@/lib/api-client";

/** Inline title editor. Enter saves, Escape cancels. */
export function RenameForm({
  videoId,
  initialTitle,
  onDone,
  onSaved,
}: {
  videoId: string;
  initialTitle: string;
  onDone: () => void;
  onSaved: (video: VideoDTO) => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = updateVideoRequestSchema.safeParse({ title });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid title");
      return;
    }
    if (parsed.data.title === initialTitle) return onDone();

    setSaving(true);
    try {
      onSaved(await renameVideo(videoId, parsed.data.title));
      toast.success("Title updated");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't rename the video");
    } finally {
      setSaving(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") onDone();
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-1">
      <Input
        aria-label="Video title"
        value={title}
        maxLength={TITLE_MAX_LENGTH}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={onKeyDown}
        disabled={saving}
        autoFocus
        className="h-8"
      />
      <Button type="submit" size="icon" variant="ghost" disabled={saving} aria-label="Save title">
        <Check aria-hidden />
      </Button>
      <Button type="button" size="icon" variant="ghost" onClick={onDone} aria-label="Cancel rename">
        <X aria-hidden />
      </Button>
    </form>
  );
}
