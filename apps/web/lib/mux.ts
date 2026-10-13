import "server-only";
import Mux from "@mux/ts";
import { getServerEnv } from "@/lib/env";

let client: Mux | undefined;

function mux(): Mux {
  client ??= new Mux({
    tokenId: getServerEnv("MUX_TOKEN_ID"),
    tokenSecret: getServerEnv("MUX_TOKEN_SECRET"),
  });
  return client;
}

/** Upload URLs stay valid for 7 days (Mux maximum) so failed uploads can be retried. */
const UPLOAD_TIMEOUT_SECONDS = 7 * 24 * 60 * 60;

export interface DirectUpload {
  uploadId: string;
  uploadUrl: string;
}

/** `corsOrigin` is the browser origin allowed to PUT the file (web app or extension). */
export async function createDirectUpload(
  videoId: string,
  corsOrigin: string,
): Promise<DirectUpload> {
  const upload = await mux().video.uploads.create({
    cors_origin: corsOrigin,
    timeout: UPLOAD_TIMEOUT_SECONDS,
    new_asset_settings: {
      playback_policies: ["public"],
      passthrough: videoId,
      video_quality: "basic",
      // MP4 rendition powers og:video previews in Slack/Discord.
      static_renditions: [{ resolution: "highest" }],
    },
  });
  if (!upload.url) throw new Error(`Mux upload ${upload.id} has no URL`);
  return { uploadId: upload.id, uploadUrl: upload.url };
}

/**
 * Creates a trimmed copy of an existing asset. The webhook swaps it in when
 * ready and deletes the original, so a failed trim leaves the video intact.
 */
export async function createTrimmedAsset(
  videoId: string,
  sourceAssetId: string,
  startSeconds: number,
  endSeconds: number,
): Promise<string> {
  const asset = await mux().video.assets.create({
    inputs: [
      { url: `mux://assets/${sourceAssetId}`, start_time: startSeconds, end_time: endSeconds },
    ],
    playback_policies: ["public"],
    passthrough: videoId,
    video_quality: "basic",
    static_renditions: [{ resolution: "highest" }],
  });
  return asset.id;
}

export function getUpload(uploadId: string) {
  return mux().video.uploads.retrieve(uploadId);
}

export function getAsset(assetId: string) {
  return mux().video.assets.retrieve(assetId);
}

function isNotFound(error: unknown): boolean {
  return error instanceof Mux.APIError && error.status === 404;
}

/** Deletes an asset; a missing asset counts as success. */
export async function deleteMuxAsset(assetId: string): Promise<void> {
  try {
    await mux().video.assets.delete(assetId);
  } catch (error) {
    if (!isNotFound(error)) throw error;
  }
}

/** Cancels a pending direct upload; best effort. */
export async function cancelMuxUpload(uploadId: string): Promise<void> {
  try {
    await mux().video.uploads.cancel(uploadId);
  } catch (error) {
    if (!isNotFound(error)) console.warn("Failed to cancel Mux upload", uploadId, error);
  }
}
