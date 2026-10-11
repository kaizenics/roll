import * as UpChunk from "@mux/upchunk";
import { UPLOAD_BACKOFF_BASE_MS, UPLOAD_MAX_ATTEMPTS } from "@roll/shared";
import { retryWithBackoff } from "./retry";

/** 8 MiB chunks (UpChunk takes KiB and requires multiples of 256). */
const CHUNK_SIZE_KB = 8192;

function uploadOnce(blob: Blob, uploadUrl: string, onProgress: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const upload = UpChunk.createUpload({
      endpoint: uploadUrl,
      file: new File([blob], "recording.webm", { type: blob.type || "video/webm" }),
      chunkSize: CHUNK_SIZE_KB,
      // UpChunk already retries individual chunks; we add whole-upload retries on top.
      attempts: 3,
      delayBeforeAttempt: 1,
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

/** Chunked, resumable upload to a Mux Direct Upload URL with 3× backoff. */
export function uploadToMux(
  blob: Blob,
  uploadUrl: string,
  onProgress: (progress: number) => void,
): Promise<void> {
  return retryWithBackoff(() => uploadOnce(blob, uploadUrl, onProgress), {
    attempts: UPLOAD_MAX_ATTEMPTS,
    baseDelayMs: UPLOAD_BACKOFF_BASE_MS,
    onRetry: (attempt, error) => console.warn(`Upload attempt ${attempt} failed`, error),
  });
}
