import { NextResponse } from "next/server";
import {
  buildShareUrl,
  createVideoRequestSchema,
  type CreateVideoResponse,
  type ListVideosResponse,
} from "@roll/shared";
import { getRequestAuth } from "@/lib/auth";
import { getAppUrl } from "@/lib/env";
import { apiError, parseJsonBody, preflight, uploadCorsOrigin } from "@/lib/http";
import { createDirectUpload } from "@/lib/mux";
import { rateLimit } from "@/lib/rate-limit";
import { handle } from "@/lib/route";
import { generateShortId } from "@/lib/shortid";
import { insertVideo, listVideosForOwner, toVideoDTO } from "@/lib/videos";

export const dynamic = "force-dynamic";

const CREATE_LIMIT = 20;
const CREATE_WINDOW_MS = 60 * 60 * 1000;

export function OPTIONS(request: Request) {
  return preflight(request);
}

export function GET(request: Request) {
  return handle(request, async () => {
    const auth = await getRequestAuth(request);
    if (!auth) return apiError("unauthorized", "Sign in to view your videos");

    const rows = await listVideosForOwner(auth.supabase, auth.userId);
    const appUrl = getAppUrl();
    return NextResponse.json<ListVideosResponse>(
      { videos: rows.map((row) => toVideoDTO(row, appUrl)) },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}

export function POST(request: Request) {
  return handle(request, async () => {
    const auth = await getRequestAuth(request);
    if (!auth) return apiError("unauthorized", "Sign in to record videos");

    const limit = await rateLimit(`create:${auth.userId}`, CREATE_LIMIT, CREATE_WINDOW_MS);
    if (!limit.ok) {
      return apiError("rate_limited", "Too many recordings. Please wait a bit.", {
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      });
    }

    const body = await parseJsonBody(request, createVideoRequestSchema);
    if (!body.ok) return body.response;

    // The id is minted here so it can be sent to Mux as `passthrough` before the row exists.
    const id = crypto.randomUUID();
    let upload;
    try {
      upload = await createDirectUpload(id, uploadCorsOrigin(request));
    } catch (error) {
      console.error("Mux direct upload creation failed", error);
      return apiError("upstream_error", "Video service is unavailable. Please try again.");
    }

    const row = await insertVideo(auth.supabase, {
      id,
      ownerId: auth.userId,
      title: body.data.title,
      muxUploadId: upload.uploadId,
      generateShortId,
    });

    return NextResponse.json<CreateVideoResponse>(
      {
        id: row.id,
        shortId: row.short_id,
        uploadUrl: upload.uploadUrl,
        shareUrl: buildShareUrl(getAppUrl(), row.short_id),
      },
      { status: 201 },
    );
  });
}
