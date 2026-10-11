import { Loader2 } from "lucide-react";
import type { VideoStatus } from "@roll/shared";
import { Badge } from "@/components/ui/badge";

const LABELS: Record<VideoStatus, string> = {
  uploading: "Uploading",
  processing: "Processing",
  ready: "Ready",
  errored: "Failed",
};

export function StatusBadge({ status }: { status: VideoStatus }) {
  const variant = status === "ready" ? "success" : status === "errored" ? "destructive" : "warning";
  const busy = status === "uploading" || status === "processing";
  return (
    <Badge variant={variant}>
      {busy && <Loader2 className="size-3 animate-spin" aria-hidden />}
      {LABELS[status]}
    </Badge>
  );
}
