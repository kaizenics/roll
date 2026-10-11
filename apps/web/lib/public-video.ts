import "server-only";
import { cache } from "react";
import { shortIdSchema, type PublicVideo } from "@roll/shared";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseStatus } from "@/lib/videos";

export interface PublicVideoWithOwner extends PublicVideo {
  /** Server-only; used to decide whether to render owner controls. Never sent to the client. */
  ownerId: string;
}

/**
 * Reads a video for the public share page with the service role, selecting
 * only fields that are safe to show to anyone holding the link.
 */
export const getPublicVideo = cache(
  async (shortId: string): Promise<PublicVideoWithOwner | null> => {
    if (!shortIdSchema.safeParse(shortId).success) return null;

    const { data, error } = await createSupabaseAdminClient()
      .from("videos")
      .select(
        "id, short_id, owner_id, title, status, mux_playback_id, duration_seconds, aspect_ratio, view_count, created_at, owner:profiles(full_name, avatar_url)",
      )
      .eq("short_id", shortId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      shortId: data.short_id,
      ownerId: data.owner_id,
      title: data.title,
      status: parseStatus(data.status),
      playbackId: data.mux_playback_id,
      durationSeconds: data.duration_seconds === null ? null : Number(data.duration_seconds),
      aspectRatio: data.aspect_ratio,
      viewCount: data.view_count,
      createdAt: data.created_at,
      owner: { name: data.owner?.full_name ?? null, avatarUrl: data.owner?.avatar_url ?? null },
    };
  },
);
