"use client";

import * as UpChunk from "@mux/upchunk";
import { UPLOAD_BACKOFF_BASE_MS, UPLOAD_MAX_ATTEMPTS } from "@roll/shared";

/** Chunked, resumable upload to a Mux Direct Upload URL; UpChunk retries each chunk. */
export function uploadToMux(
  blob: Blob,
  uploadUrl: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  const extension = blob.type.includes("mp4") ? "mp4" : "webm";
  return new Promise((resolve, reject) => {
    const upload = UpChunk.createUpload({
      endpoint: uploadUrl,
      file: new File([blob], `recording.${extension}`, { type: blob.type }),
      chunkSize: 8192,
      attempts: UPLOAD_MAX_ATTEMPTS,
      delayBeforeAttempt: UPLOAD_BACKOFF_BASE_MS / 1000,
    });
    upload.on("progress", (event) => {
      if (typeof event.detail === "number") onProgress(Math.round(event.detail));
    });
    upload.on("success", () => resolve());
    upload.on("error", (event) => {
      const detail = event.detail as { message?: string } | undefined;
      reject(new Error(detail?.message ?? "Upload failed"));
    });
  });
}
