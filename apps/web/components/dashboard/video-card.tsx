"use client";

import { Eye, Film, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatDuration, muxAnimatedGifUrl, muxThumbnailUrl, type VideoDTO } from "@roll/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/video/copy-link-button";
import { DeleteVideoButton } from "@/components/video/delete-video-button";
import { RenameForm } from "@/components/video/rename-form";
import { StatusBadge } from "@/components/video/status-badge";
import { formatDate, formatViews } from "@/lib/utils";

export function VideoCard({
  video,
  onUpdated,
  onDeleted,
}: {
  video: VideoDTO;
  onUpdated: (video: VideoDTO) => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [hovering, setHovering] = useState(false);
  const href = `/v/${video.shortId}`;

  return (
    <Card className="group overflow-hidden">
      <Link
        href={href}
        className="bg-muted focus-visible:ring-ring/50 relative block aspect-video outline-none focus-visible:ring-[3px]"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocus={() => setHovering(true)}
        onBlur={() => setHovering(false)}
        aria-label={`Watch ${video.title}`}
      >
        {video.playbackId ? (
          <Image
            src={hovering ? muxAnimatedGifUrl(video.playbackId) : muxThumbnailUrl(video.playbackId)}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="text-muted-foreground flex size-full items-center justify-center">
            <Film className="size-8" aria-hidden />
          </span>
        )}
        <span className="absolute left-2 top-2">
          <StatusBadge status={video.status} />
        </span>
        {video.durationSeconds !== null && (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium tabular-nums text-white">
            {formatDuration(video.durationSeconds * 1000)}
          </span>
        )}
      </Link>

      <div className="flex flex-col gap-2 p-4">
        {editing ? (
          <RenameForm
            videoId={video.id}
            initialTitle={video.title}
            onDone={() => setEditing(false)}
            onSaved={onUpdated}
          />
        ) : (
          <div className="flex items-start gap-1">
            <h2 className="line-clamp-2 flex-1 font-medium" title={video.title}>
              {video.title}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setEditing(true)}
              aria-label={`Rename ${video.title}`}
            >
              <Pencil aria-hidden />
            </Button>
          </div>
        )}
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <time dateTime={video.createdAt}>{formatDate(video.createdAt)}</time>
          <span aria-hidden>·</span>
          <span className="flex items-center gap-1">
            <Eye className="size-3" aria-hidden />
            {formatViews(video.viewCount)}
          </span>
        </p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <CopyLinkButton url={video.shareUrl} />
          <DeleteVideoButton
            videoId={video.id}
            title={video.title}
            onDeleted={onDeleted}
            iconOnly
          />
        </div>
      </div>
    </Card>
  );
}
