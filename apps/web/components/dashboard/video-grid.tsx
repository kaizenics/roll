"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import type { VideoDTO } from "@roll/shared";
import { EmptyState } from "@/components/dashboard/empty-state";
import { VideoCard } from "@/components/dashboard/video-card";
import { EASE } from "@/components/landing/motion";
import { fetchVideos } from "@/lib/api-client";

const POLL_INTERVAL_MS = 4000;

function isPending(video: VideoDTO): boolean {
  return video.status === "uploading" || video.status === "processing";
}

export function VideoGrid({ initialVideos }: { initialVideos: VideoDTO[] }) {
  const [videos, setVideos] = useState(initialVideos);
  const hasPending = videos.some(isPending);
  const reduce = useReducedMotion();

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
    <ul className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {videos.map((video, i) => (
        <motion.li
          key={video.id}
          layout={!reduce}
          initial={reduce ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: Math.min(i, 8) * 0.06, ease: EASE }}
        >
          <VideoCard
            video={video}
            onUpdated={(updated) =>
              setVideos((current) => current.map((v) => (v.id === updated.id ? updated : v)))
            }
            onDeleted={() => setVideos((current) => current.filter((v) => v.id !== video.id))}
          />
        </motion.li>
      ))}
    </ul>
  );
}
