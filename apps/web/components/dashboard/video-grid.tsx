"use client";

import { useEffect, useState } from "react";
import type { VideoDTO } from "@roll/shared";
import { EmptyState } from "@/components/dashboard/empty-state";
import { VideoCard } from "@/components/dashboard/video-card";
import { fetchVideos } from "@/lib/api-client";

const POLL_INTERVAL_MS = 4000;

function isPending(video: VideoDTO): boolean {
  return video.status === "uploading" || video.status === "processing";
}

export function VideoGrid({ initialVideos }: { initialVideos: VideoDTO[] }) {
  const [videos, setVideos] = useState(initialVideos);
  const hasPending = videos.some(isPending);

  // Poll only while something is still uploading/processing.
  useEffect(() => {
    if (!hasPending) return;
    const timer = setInterval(async () => {
      try {
        setVideos(await fetchVideos());
      } catch {
        // Transient failures are fine; the next tick retries.
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [hasPending]);

  if (videos.length === 0) return <EmptyState />;

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <li key={video.id}>
          <VideoCard
            video={video}
            onUpdated={(updated) =>
              setVideos((current) => current.map((v) => (v.id === updated.id ? updated : v)))
            }
            onDeleted={() => setVideos((current) => current.filter((v) => v.id !== video.id))}
          />
        </li>
      ))}
    </ul>
  );
}
