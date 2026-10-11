import { videoIdSchema } from "@roll/shared";
import { apiError, clientIp } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { handle } from "@/lib/route";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VIEW_LIMIT = 30;
const VIEW_WINDOW_MS = 60 * 1000;

export function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(request, async () => {
    const { id } = await context.params;
    if (!videoIdSchema.safeParse(id).success) return apiError("not_found", "Video not found");

    const limit = await rateLimit(`view:${clientIp(request)}`, VIEW_LIMIT, VIEW_WINDOW_MS);
    if (!limit.ok) {
      return apiError("rate_limited", "Too many requests", {
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      });
    }

    const supabase = createSupabaseAdminClient();
    const { data: video, error } = await supabase
      .from("videos")
      .select("short_id")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!video) return apiError("not_found", "Video not found");

    const { error: rpcError } = await supabase.rpc("increment_view", { short_id: video.short_id });
    if (rpcError) throw rpcError;
    return new Response(null, { status: 204 });
  });
}
