"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const REFRESH_INTERVAL_MS = 3000;

/** Re-renders the server component every few seconds until the video is ready. */
export function ProcessingRefresher() {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [router]);

  return null;
}
