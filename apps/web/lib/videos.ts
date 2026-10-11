import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildShareUrl,
  DEFAULT_VIDEO_TITLE,
  videoStatusSchema,
  type VideoDTO,
  type VideoStatus,
} from "@roll/shared";
import type { Database, VideoRow } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export const VIDEO_COLUMNS =
  "id, short_id, owner_id, title, status, mux_upload_id, mux_asset_id, mux_playback_id, duration_seconds, aspect_ratio, view_count, created_at, updated_at";

export function parseStatus(value: string): VideoStatus {
  const parsed = videoStatusSchema.safeParse(value);
  return parsed.success ? parsed.data : "errored";
}

export function toVideoDTO(row: VideoRow, appUrl: string): VideoDTO {
  return {
    id: row.id,
    shortId: row.short_id,
    title: row.title,
    status: parseStatus(row.status),
    playbackId: row.mux_playback_id,
    durationSeconds: row.duration_seconds === null ? null : Number(row.duration_seconds),
    aspectRatio: row.aspect_ratio,
    viewCount: row.view_count,
    shareUrl: buildShareUrl(appUrl, row.short_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listVideosForOwner(supabase: Client, ownerId: string): Promise<VideoRow[]> {
  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_COLUMNS)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return data;
}

/** Explicit owner filter on top of RLS: a row is only returned to its owner. */
export async function getVideoForOwner(
  supabase: Client,
  id: string,
  ownerId: string,
): Promise<VideoRow | null> {
  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_COLUMNS)
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

const UNIQUE_VIOLATION = "23505";

export async function insertVideo(
  supabase: Client,
  input: {
    id: string;
    ownerId: string;
    title?: string;
    muxUploadId: string;
    generateShortId: () => string;
  },
): Promise<VideoRow> {
  // Retry on the (astronomically unlikely) short_id collision.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase
      .from("videos")
      .insert({
        id: input.id,
        owner_id: input.ownerId,
        short_id: input.generateShortId(),
        title: input.title ?? DEFAULT_VIDEO_TITLE,
        mux_upload_id: input.muxUploadId,
      })
      .select(VIDEO_COLUMNS)
      .single();
    if (!error) return data;
    if (error.code !== UNIQUE_VIOLATION || !error.message.includes("short_id")) throw error;
  }
  throw new Error("Could not allocate a unique short id");
}

export async function updateVideoTitle(
  supabase: Client,
  id: string,
  ownerId: string,
  title: string,
): Promise<VideoRow | null> {
  const { data, error } = await supabase
    .from("videos")
    .update({ title })
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select(VIDEO_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteVideoRow(supabase: Client, id: string, ownerId: string): Promise<void> {
  const { error } = await supabase.from("videos").delete().eq("id", id).eq("owner_id", ownerId);
  if (error) throw error;
}
