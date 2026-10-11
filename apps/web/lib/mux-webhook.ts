import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { VideoStatus } from "@roll/shared";
import type { VideoUpdate } from "@/lib/supabase/database.types";

const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

/**
 * Verifies a `mux-signature: t=<unix>,v1=<hex hmac>` header.
 * The signed payload is `${t}.${rawBody}` (HMAC-SHA256 with the webhook secret).
 */
export function verifyMuxSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  if (!header) return false;
  const parts = new Map<string, string[]>();
  for (const part of header.split(",")) {
    const [key, value] = part.split("=", 2);
    if (!key || !value) continue;
    parts.set(key.trim(), [...(parts.get(key.trim()) ?? []), value.trim()]);
  }
  const timestamp = Number(parts.get("t")?.[0]);
  const signatures = parts.get("v1") ?? [];
  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  if (Math.abs(nowSeconds - timestamp) > SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest();
  return signatures.some((signature) => {
    const given = Buffer.from(signature, "hex");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

const uploadDataSchema = z.object({
  id: z.string(),
  asset_id: z.string().optional(),
  new_asset_settings: z.object({ passthrough: z.string().optional() }).loose().optional(),
});

const assetDataSchema = z.object({
  id: z.string(),
  upload_id: z.string().optional(),
  passthrough: z.string().optional(),
  duration: z.number().optional(),
  aspect_ratio: z.string().optional(),
  playback_ids: z
    .array(z.object({ id: z.string(), policy: z.string().optional() }).loose())
    .optional(),
});

export const muxEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("video.upload.asset_created"), data: uploadDataSchema }).loose(),
  z.object({ type: z.literal("video.upload.errored"), data: uploadDataSchema }).loose(),
  z.object({ type: z.literal("video.upload.cancelled"), data: uploadDataSchema }).loose(),
  z.object({ type: z.literal("video.asset.ready"), data: assetDataSchema }).loose(),
  z.object({ type: z.literal("video.asset.errored"), data: assetDataSchema }).loose(),
]);

export type MuxEvent = z.infer<typeof muxEventSchema>;

export const HANDLED_EVENT_TYPES = new Set<string>(
  muxEventSchema.options.map((option) => option.shape.type.value),
);

/** Identifiers that can tie an event back to a `videos` row, most specific first. */
export interface VideoLookup {
  videoId: string | null;
  uploadId: string | null;
  assetId: string | null;
}

const uuidSchema = z.uuid();

export function lookupForEvent(event: MuxEvent): VideoLookup {
  const asUuid = (value: string | undefined) =>
    value && uuidSchema.safeParse(value).success ? value : null;

  switch (event.type) {
    case "video.upload.asset_created":
    case "video.upload.errored":
    case "video.upload.cancelled":
      return {
        videoId: asUuid(event.data.new_asset_settings?.passthrough),
        uploadId: event.data.id,
        assetId: event.data.asset_id ?? null,
      };
    case "video.asset.ready":
    case "video.asset.errored":
      return {
        videoId: asUuid(event.data.passthrough),
        uploadId: event.data.upload_id ?? null,
        assetId: event.data.id,
      };
  }
}

export interface VideoState {
  status: VideoStatus;
  mux_asset_id: string | null;
  mux_playback_id: string | null;
}

/**
 * Pure transition function. Returns the patch to apply, or null when the event
 * is a duplicate/out-of-order delivery that must not change anything.
 * `ready` and `errored` are terminal for upload events; `ready` wins over a late `errored`.
 */
export function computeVideoUpdate(current: VideoState, event: MuxEvent): VideoUpdate | null {
  switch (event.type) {
    case "video.upload.asset_created": {
      const assetId = event.data.asset_id;
      if (!assetId) return null;
      if (current.status === "uploading") return { status: "processing", mux_asset_id: assetId };
      if (!current.mux_asset_id) return { mux_asset_id: assetId };
      return null;
    }
    case "video.upload.errored":
    case "video.upload.cancelled":
      return current.status === "uploading" ? { status: "errored" } : null;
    case "video.asset.ready": {
      const playbackId =
        event.data.playback_ids?.find((p) => p.policy === "public")?.id ??
        event.data.playback_ids?.[0]?.id ??
        null;
      if (!playbackId) return null;
      if (current.status === "ready" && current.mux_playback_id === playbackId) return null;
      return {
        status: "ready",
        mux_asset_id: event.data.id,
        mux_playback_id: playbackId,
        duration_seconds: event.data.duration ?? null,
        aspect_ratio: event.data.aspect_ratio ?? null,
      };
    }
    case "video.asset.errored":
      if (current.status === "ready" || current.status === "errored") return null;
      return { status: "errored", mux_asset_id: event.data.id };
  }
}

export interface WebhookRepo {
  findVideo(lookup: VideoLookup): Promise<({ id: string } & VideoState) | null>;
  updateVideo(id: string, patch: VideoUpdate): Promise<void>;
  /** Called when an asset arrives for a video that no longer exists. */
  deleteOrphanAsset(assetId: string): Promise<void>;
}

export interface WebhookResult {
  status: number;
  body: Record<string, unknown>;
}

export async function handleMuxWebhook(input: {
  rawBody: string;
  signatureHeader: string | null;
  secret: string;
  repo: WebhookRepo;
  nowSeconds?: number;
}): Promise<WebhookResult> {
  const { rawBody, signatureHeader, secret, repo, nowSeconds } = input;

  if (!verifyMuxSignature(rawBody, signatureHeader, secret, nowSeconds)) {
    return { status: 401, body: { error: { code: "unauthorized", message: "Bad signature" } } };
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return { status: 400, body: { error: { code: "bad_request", message: "Invalid JSON" } } };
  }

  const type = z.object({ type: z.string() }).safeParse(json);
  if (!type.success) {
    return { status: 400, body: { error: { code: "bad_request", message: "Missing type" } } };
  }
  if (!HANDLED_EVENT_TYPES.has(type.data.type)) {
    return { status: 200, body: { ignored: type.data.type } };
  }

  const parsed = muxEventSchema.safeParse(json);
  if (!parsed.success) {
    return { status: 400, body: { error: { code: "bad_request", message: "Invalid event" } } };
  }
  const event = parsed.data;
  const lookup = lookupForEvent(event);
  const video = await repo.findVideo(lookup);

  if (!video) {
    // The video was deleted while Mux was still processing: don't leak the asset.
    if (lookup.assetId && event.type !== "video.asset.errored") {
      await repo.deleteOrphanAsset(lookup.assetId);
    }
    return { status: 200, body: { ignored: "unknown video" } };
  }

  const patch = computeVideoUpdate(video, event);
  if (!patch) return { status: 200, body: { unchanged: true } };

  await repo.updateVideo(video.id, patch);
  return { status: 200, body: { updated: true } };
}
