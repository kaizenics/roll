import { trimVideoRequestSchema, videoIdSchema } from "@roll/shared";
import { getRequestAuth } from "@/lib/auth";
import { apiError, parseJsonBody } from "@/lib/http";
import { createTrimmedAsset } from "@/lib/mux";
import { handle } from "@/lib/route";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getVideoForOwner, markTrimming, parseStatus } from "@/lib/videos";

export const dynamic = "force-dynamic";

export function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(request, async () => {
    const auth = await getRequestAuth(request);
    if (!auth) return apiError("unauthorized", "Sign in required");
    const { id } = await context.params;
    if (!videoIdSchema.safeParse(id).success) return apiError("not_found", "Video not found");

    const body = await parseJsonBody(request, trimVideoRequestSchema);
    if (!body.ok) return body.response;

    const video = await getVideoForOwner(auth.supabase, id, auth.userId);
    if (!video) return apiError("not_found", "Video not found");
    if (parseStatus(video.status) !== "ready" || !video.mux_asset_id) {
      return apiError("bad_request", "The video must finish processing before it can be edited");
    }
    const duration = Number(video.duration_seconds ?? 0);
    const { startSeconds, endSeconds } = body.data;
    if (endSeconds > duration + 0.5) {
      return apiError("bad_request", "The end time is past the end of the video");
    }

    try {
      await createTrimmedAsset(
        video.id,
        video.mux_asset_id,
        startSeconds,
        Math.min(endSeconds, duration),
      );
    } catch (error) {
      console.error("Mux trim failed", error);
      return apiError("upstream_error", "Video service is unavailable. Please try again.");
    }
    await markTrimming(createSupabaseAdminClient(), video.id, auth.userId);
    return new Response(null, { status: 202 });
  });
}
