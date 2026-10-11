import { NextResponse } from "next/server";
import { updateVideoRequestSchema, videoIdSchema, type VideoDTO } from "@roll/shared";
import { getRequestAuth } from "@/lib/auth";
import { getAppUrl } from "@/lib/env";
import { apiError, parseJsonBody, preflight } from "@/lib/http";
import { cancelMuxUpload, deleteMuxAsset } from "@/lib/mux";
import { handle } from "@/lib/route";
import {
  deleteVideoRow,
  getVideoForOwner,
  parseStatus,
  toVideoDTO,
  updateVideoTitle,
} from "@/lib/videos";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ id: string }>;
}

async function videoId(context: Context): Promise<string | null> {
  const { id } = await context.params;
  return videoIdSchema.safeParse(id).success ? id : null;
}

export function OPTIONS(request: Request) {
  return preflight(request);
}

export function GET(request: Request, context: Context) {
  return handle(request, async () => {
    const auth = await getRequestAuth(request);
    if (!auth) return apiError("unauthorized", "Sign in required");
    const id = await videoId(context);
    if (!id) return apiError("not_found", "Video not found");

    const row = await getVideoForOwner(auth.supabase, id, auth.userId);
    if (!row) return apiError("not_found", "Video not found");
    return NextResponse.json<VideoDTO>(toVideoDTO(row, getAppUrl()), {
      headers: { "Cache-Control": "no-store" },
    });
  });
}

export function PATCH(request: Request, context: Context) {
  return handle(request, async () => {
    const auth = await getRequestAuth(request);
    if (!auth) return apiError("unauthorized", "Sign in required");
    const id = await videoId(context);
    if (!id) return apiError("not_found", "Video not found");

    const body = await parseJsonBody(request, updateVideoRequestSchema);
    if (!body.ok) return body.response;

    const row = await updateVideoTitle(auth.supabase, id, auth.userId, body.data.title);
    if (!row) return apiError("not_found", "Video not found");
    return NextResponse.json<VideoDTO>(toVideoDTO(row, getAppUrl()));
  });
}

export function DELETE(request: Request, context: Context) {
  return handle(request, async () => {
    const auth = await getRequestAuth(request);
    if (!auth) return apiError("unauthorized", "Sign in required");
    const id = await videoId(context);
    if (!id) return apiError("not_found", "Video not found");

    const row = await getVideoForOwner(auth.supabase, id, auth.userId);
    if (!row) return apiError("not_found", "Video not found");

    try {
      if (row.mux_asset_id) {
        await deleteMuxAsset(row.mux_asset_id);
      } else if (row.mux_upload_id && parseStatus(row.status) === "uploading") {
        // No asset yet; if one appears later the webhook deletes it as an orphan.
        await cancelMuxUpload(row.mux_upload_id);
      }
    } catch (error) {
      console.error("Mux asset deletion failed", error);
      return apiError("upstream_error", "Could not delete the video file. Please try again.");
    }

    await deleteVideoRow(auth.supabase, id, auth.userId);
    return new Response(null, { status: 204 });
  });
}
