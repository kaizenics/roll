import { NextResponse } from "next/server";
import { buildShareUrl, videoIdSchema, type ShareVideoResponse } from "@roll/shared";
import { getRequestAuth } from "@/lib/auth";
import { getAppUrl } from "@/lib/env";
import { apiError, preflight } from "@/lib/http";
import { handle } from "@/lib/route";
import { generateShortId } from "@/lib/shortid";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getVideoForOwner, setSharing } from "@/lib/videos";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ id: string }>;
}

export function OPTIONS(request: Request) {
  return preflight(request);
}

/** POST turns the public link on; DELETE revokes it (and rotates the link). */
async function toggle(request: Request, context: Context, shared: boolean) {
  const auth = await getRequestAuth(request);
  if (!auth) return apiError("unauthorized", "Sign in required");
  const { id } = await context.params;
  if (!videoIdSchema.safeParse(id).success) return apiError("not_found", "Video not found");

  // Ownership is checked with the caller's own client (RLS) before the service-role write.
  const owned = await getVideoForOwner(auth.supabase, id, auth.userId);
  if (!owned) return apiError("not_found", "Video not found");

  const row = await setSharing(
    createSupabaseAdminClient(),
    id,
    auth.userId,
    shared,
    generateShortId,
  );
  if (!row) return apiError("not_found", "Video not found");
  return NextResponse.json<ShareVideoResponse>({
    shortId: row.short_id,
    shareUrl: buildShareUrl(getAppUrl(), row.short_id),
    isShared: row.is_shared,
  });
}

export function POST(request: Request, context: Context) {
  return handle(request, () => toggle(request, context, true));
}

export function DELETE(request: Request, context: Context) {
  return handle(request, () => toggle(request, context, false));
}
