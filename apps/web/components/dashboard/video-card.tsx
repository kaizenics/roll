"use client";

import { Eye, Film, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatDuration, muxAnimatedGifUrl, muxThumbnailUrl, type VideoDTO } from "@roll/shared";
import { Button } from "@/components/ui/button";
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
    <article className="group">
      <Link
        href={href}
        className="bg-card relative block aspect-video overflow-hidden outline-none focus-visible:ring-[3px] focus-visible:ring-white/40"
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
            className="ease-out-soft object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="text-muted-foreground flex size-full items-center justify-center">
            <Film className="size-8" aria-hidden />
          </span>
        )}
        <span className="absolute left-3 top-3">
          <StatusBadge status={video.status} />
        </span>
        {video.durationSeconds !== null && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/75 px-2.5 py-1 font-mono text-xs tabular-nums text-white">
            {formatDuration(video.durationSeconds * 1000)}
          </span>
        )}
      </Link>

      <div className="flex flex-col gap-2 pt-5">
        {editing ? (
          <RenameForm
            videoId={video.id}
            initialTitle={video.title}
            onDone={() => setEditing(false)}
            onSaved={onUpdated}
          />
        ) : (
          <div className="flex items-start gap-1">
            <h2
              className="group-hover:text-record line-clamp-2 flex-1 text-xl font-bold leading-tight tracking-[-0.03em] transition-colors duration-300"
              title={video.title}
            >
              {video.title}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setEditing(true)}
              aria-label={`Rename ${video.title}`}
            >
              <Pencil aria-hidden />
            </Button>
          </div>
        )}
        <p className="text-muted-foreground flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em]">
          <time dateTime={video.createdAt}>{formatDate(video.createdAt)}</time>
          <span aria-hidden>·</span>
          <span className="flex items-center gap-1">
            <Eye className="size-3" aria-hidden />
            {formatViews(video.viewCount)}
          </span>
        </p>
        <div className="mt-1 flex items-center justify-between gap-2 border-t pt-3">
          {video.isShared ? (
            <CopyLinkButton url={video.shareUrl} />
          ) : (
            <Link
              href={href}
              className="text-muted-foreground hover:text-record text-sm transition-colors"
            >
              Private. Open to share
            </Link>
          )}
          <DeleteVideoButton
            videoId={video.id}
            title={video.title}
            onDeleted={onDeleted}
            iconOnly
          />
        </div>
      </div>
    </article>
  );
}
