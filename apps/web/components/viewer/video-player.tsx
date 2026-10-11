"use client";

import MuxPlayer from "@mux/mux-player-react";

export function VideoPlayer({
  playbackId,
  title,
  videoId,
}: {
  playbackId: string;
  title: string;
  videoId: string;
}) {
  return (
    <MuxPlayer
      playbackId={playbackId}
      streamType="on-demand"
      accentColor="#6d5dfc"
      metadata={{ video_id: videoId, video_title: title }}
      title={title}
      className="aspect-video w-full"
    />
  );
}
