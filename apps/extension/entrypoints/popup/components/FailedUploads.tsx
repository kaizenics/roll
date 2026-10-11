import { formatDuration } from "@roll/shared";
import { useState } from "react";
import { sendToBackground } from "@/lib/messaging";
import type { FailedRecording } from "@/lib/storage";
import { Alert, Button } from "./ui";

export function FailedUploads({ items }: { items: FailedRecording[] }) {
  const [error, setError] = useState<string | null>(null);
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-2 border-t border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-sm font-medium">Recordings waiting to upload</h2>
      {error && <Alert>{error}</Alert>}
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.recordingId}
            className="flex items-center gap-2 rounded-lg bg-zinc-50 p-2 text-sm dark:bg-zinc-800/60"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {new Date(item.createdAt).toLocaleString()} · {formatDuration(item.durationMs)}
              </p>
              <p className="truncate text-xs text-zinc-500" title={item.error}>
                {item.error}
              </p>
            </div>
            <Button
              className="px-2 py-1 text-xs"
              onClick={async () => {
                const response = await sendToBackground({
                  target: "background",
                  type: "RETRY_UPLOAD",
                  recordingId: item.recordingId,
                });
                setError(response.ok ? null : response.error);
              }}
            >
              Retry upload
            </Button>
            <Button
              variant="ghost"
              className="px-2 py-1 text-xs"
              aria-label="Delete recording"
              onClick={() =>
                void sendToBackground({
                  target: "background",
                  type: "DISMISS_FAILED",
                  recordingId: item.recordingId,
                })
              }
            >
              ✕
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
