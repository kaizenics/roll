import "server-only";
import { getUpload, getAsset } from "@/lib/mux";
import { applyMuxEvent, muxEventSchema, type MuxEvent, type WebhookRepo } from "@/lib/mux-webhook";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseStatus } from "@/lib/videos";

export interface PendingVideo {
  id: string;
  status: string;
  mux_upload_id: string | null;
  mux_asset_id: string | null;
  mux_playback_id: string | null;
}

/**
 * Pull-based fallback for webhooks: asks Mux where a pending video is and
 * applies the answer through the same transitions the webhook uses. Keeps
 * videos moving when webhooks can't reach the app (localhost) or were missed.
 */
export async function syncPendingVideo(repo: WebhookRepo, video: PendingVideo): Promise<boolean> {
  const status = parseStatus(video.status);
  if (status !== "uploading" && status !== "processing") return false;
  // A trim in progress keeps the original playback id; only the webhook knows the new asset id.
  if (video.mux_playback_id) return false;

  const state = { status, mux_asset_id: video.mux_asset_id, mux_playback_id: null };
  const events: unknown[] = [];

  let assetId = video.mux_asset_id;
  if (!assetId && video.mux_upload_id) {
    const upload = await getUpload(video.mux_upload_id);
    if (
      upload.status === "errored" ||
      upload.status === "cancelled" ||
      upload.status === "timed_out"
    ) {
      events.push({ type: "video.upload.errored", data: { id: upload.id } });
    } else if (upload.asset_id) {
      assetId = upload.asset_id;
      events.push({
        type: "video.upload.asset_created",
        data: { id: upload.id, asset_id: assetId },
      });
    }
  }
  if (assetId) {
    const asset = await getAsset(assetId);
    if (asset.status === "ready") events.push({ type: "video.asset.ready", data: asset });
    if (asset.status === "errored") events.push({ type: "video.asset.errored", data: asset });
  }

  let changed = false;
  let current = { id: video.id, ...state };
  for (const raw of events) {
    const event: MuxEvent = muxEventSchema.parse(raw);
    if (await applyMuxEvent(repo, current, event)) {
      changed = true;
      if (event.type === "video.upload.asset_created") {
        current = { ...current, status: "processing", mux_asset_id: event.data.asset_id ?? null };
      }
    }
  }
  return changed;
}

/** Syncs every pending video in parallel; failures are logged, never thrown. */
export async function syncPendingVideos(
  repo: WebhookRepo,
  videos: PendingVideo[],
): Promise<boolean> {
  const results = await Promise.all(
    videos.map((video) =>
      syncPendingVideo(repo, video).catch((error: unknown) => {
        console.warn("Mux status sync failed", video.id, error);
        return false;
      }),
    ),
  );
  return results.some(Boolean);
}

/** Viewer-page entry point: sync one pending video by its share id. */
export async function syncVideoByShortId(repo: WebhookRepo, shortId: string): Promise<void> {
  const { data } = await createSupabaseAdminClient()
    .from("videos")
    .select("id, status, mux_upload_id, mux_asset_id, mux_playback_id")
    .eq("short_id", shortId)
    .maybeSingle();
  if (data) await syncPendingVideos(repo, [data]);
}
