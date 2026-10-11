import { deleteRecording, listRecordingMetas } from "../chunk-store";
import { getFailedRecordings, upsertFailedRecording } from "../storage";

/**
 * After a browser restart, recordings left in IndexedDB (crash mid-recording or
 * mid-upload) are surfaced in the popup as "Retry upload" entries.
 */
export async function recoverInterruptedRecordings(): Promise<void> {
  const [metas, failed] = await Promise.all([listRecordingMetas(), getFailedRecordings()]);
  const known = new Set(failed.map((f) => f.recordingId));

  for (const meta of metas) {
    if (known.has(meta.id)) continue;
    // Recordings under a second are almost certainly empty; drop them.
    if (meta.complete && meta.durationMs < 1000) {
      await deleteRecording(meta.id);
      continue;
    }
    await upsertFailedRecording({
      recordingId: meta.id,
      createdAt: meta.createdAt,
      durationMs: meta.durationMs,
      error: "Recovered after the browser closed unexpectedly.",
      videoId: null,
      uploadUrl: null,
      shareUrl: null,
    });
  }
}
