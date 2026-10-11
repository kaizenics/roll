"use client";

import { useEffect } from "react";
import { recordView } from "@/lib/api-client";

/** Counts one view per video per browser session. */
export function ViewTracker({ videoId }: { videoId: string }) {
  useEffect(() => {
    const key = `roll:viewed:${videoId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      return; // Storage disabled: skip counting rather than over-count.
    }
    recordView(videoId).catch(() => undefined);
  }, [videoId]);

  return null;
}
