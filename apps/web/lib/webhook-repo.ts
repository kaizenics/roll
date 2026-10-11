import "server-only";
import { deleteMuxAsset } from "@/lib/mux";
import type { WebhookRepo } from "@/lib/mux-webhook";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseStatus } from "@/lib/videos";

/** Service-role implementation of the webhook persistence port. */
export function createWebhookRepo(): WebhookRepo {
  const supabase = createSupabaseAdminClient();
  const columns = "id, status, mux_asset_id, mux_playback_id";

  async function findBy(column: "id" | "mux_upload_id" | "mux_asset_id", value: string | null) {
    if (!value) return null;
    const { data, error } = await supabase
      .from("videos")
      .select(columns)
      .eq(column, value)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? { ...data, status: parseStatus(data.status) } : null;
  }

  return {
    async findVideo(lookup) {
      return (
        (await findBy("id", lookup.videoId)) ??
        (await findBy("mux_upload_id", lookup.uploadId)) ??
        (await findBy("mux_asset_id", lookup.assetId))
      );
    },
    async updateVideo(id, patch) {
      const { error } = await supabase.from("videos").update(patch).eq("id", id);
      if (error) throw error;
    },
    async deleteOrphanAsset(assetId) {
      await deleteMuxAsset(assetId);
    },
  };
}
