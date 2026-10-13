import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VideoUpdate } from "@/lib/supabase/database.types";
import {
  computeVideoUpdate,
  handleMuxWebhook,
  verifyMuxSignature,
  type VideoState,
  type WebhookRepo,
} from "./mux-webhook";

const SECRET = "whsec_test";
const NOW = 1_760_000_000;
const VIDEO_ID = "6f1c1f7e-9a0b-4a39-8f5e-2f0b1c2d3e4f";

function sign(body: string, timestamp = NOW, secret = SECRET): string {
  const hmac = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${hmac}`;
}

const events = {
  assetCreated: {
    type: "video.upload.asset_created",
    data: { id: "upload_1", asset_id: "asset_1", new_asset_settings: { passthrough: VIDEO_ID } },
  },
  ready: {
    type: "video.asset.ready",
    data: {
      id: "asset_1",
      upload_id: "upload_1",
      passthrough: VIDEO_ID,
      duration: 10.5,
      aspect_ratio: "16:9",
      playback_ids: [{ id: "play_1", policy: "public" }],
    },
  },
  errored: {
    type: "video.asset.errored",
    data: { id: "asset_1", passthrough: VIDEO_ID },
  },
};

/** In-memory repo that applies patches, so we can assert end states. */
function createMemoryRepo(initial: VideoState | null) {
  let row: ({ id: string } & VideoState) | null = initial ? { id: VIDEO_ID, ...initial } : null;
  const updates: VideoUpdate[] = [];
  const repo: WebhookRepo = {
    findVideo: vi.fn(async (lookup) =>
      row && (lookup.videoId === row.id || lookup.uploadId === "upload_1") ? { ...row } : null,
    ),
    updateVideo: vi.fn(async (_id, patch) => {
      updates.push(patch);
      if (row) row = { ...row, ...(patch as Partial<VideoState>) };
    }),
    deleteOrphanAsset: vi.fn(async () => undefined),
  };
  return { repo, updates, current: () => row };
}

function deliver(repo: WebhookRepo, event: unknown, signature?: string) {
  const rawBody = JSON.stringify(event);
  return handleMuxWebhook({
    rawBody,
    signatureHeader: signature ?? sign(rawBody),
    secret: SECRET,
    repo,
    nowSeconds: NOW,
  });
}

const uploading: VideoState = { status: "uploading", mux_asset_id: null, mux_playback_id: null };

describe("verifyMuxSignature", () => {
  const body = '{"type":"x"}';

  it("accepts a valid signature", () => {
    expect(verifyMuxSignature(body, sign(body), SECRET, NOW)).toBe(true);
  });

  it("rejects a missing header, wrong secret, tampered body and stale timestamp", () => {
    expect(verifyMuxSignature(body, null, SECRET, NOW)).toBe(false);
    expect(verifyMuxSignature(body, sign(body, NOW, "other"), SECRET, NOW)).toBe(false);
    expect(verifyMuxSignature(`${body} `, sign(body), SECRET, NOW)).toBe(false);
    expect(verifyMuxSignature(body, sign(body, NOW - 3600), SECRET, NOW)).toBe(false);
    expect(verifyMuxSignature(body, "garbage", SECRET, NOW)).toBe(false);
  });
});

describe("handleMuxWebhook", () => {
  let memory: ReturnType<typeof createMemoryRepo>;

  beforeEach(() => {
    memory = createMemoryRepo(uploading);
  });

  it("rejects bad signatures without touching the database", async () => {
    const result = await deliver(memory.repo, events.ready, "t=1,v1=deadbeef");
    expect(result.status).toBe(401);
    expect(memory.repo.findVideo).not.toHaveBeenCalled();
  });

  it("rejects unsigned requests", async () => {
    const rawBody = JSON.stringify(events.ready);
    const result = await handleMuxWebhook({
      rawBody,
      signatureHeader: null,
      secret: SECRET,
      repo: memory.repo,
      nowSeconds: NOW,
    });
    expect(result.status).toBe(401);
  });

  it("walks uploading → processing → ready", async () => {
    expect((await deliver(memory.repo, events.assetCreated)).status).toBe(200);
    expect(memory.current()).toMatchObject({ status: "processing", mux_asset_id: "asset_1" });

    await deliver(memory.repo, events.ready);
    expect(memory.current()).toMatchObject({ status: "ready", mux_playback_id: "play_1" });
    expect(memory.updates.at(-1)).toMatchObject({ duration_seconds: 10.5, aspect_ratio: "16:9" });
  });

  it("is idempotent for duplicate deliveries", async () => {
    await deliver(memory.repo, events.assetCreated);
    await deliver(memory.repo, events.ready);
    await deliver(memory.repo, events.ready);
    await deliver(memory.repo, events.assetCreated);
    expect(memory.updates).toHaveLength(2);
    expect(memory.current()?.status).toBe("ready");
  });

  it("handles ready arriving before asset_created", async () => {
    await deliver(memory.repo, events.ready);
    await deliver(memory.repo, events.assetCreated);
    expect(memory.current()?.status).toBe("ready");
  });

  it("marks errored assets, but never downgrades a ready video", async () => {
    await deliver(memory.repo, events.errored);
    expect(memory.current()?.status).toBe("errored");

    const ready = createMemoryRepo({
      status: "ready",
      mux_asset_id: "asset_1",
      mux_playback_id: "play_1",
    });
    await deliver(ready.repo, events.errored);
    expect(ready.current()?.status).toBe("ready");
  });

  it("ignores unrelated event types", async () => {
    const result = await deliver(memory.repo, { type: "video.asset.created", data: {} });
    expect(result.status).toBe(200);
    expect(memory.repo.findVideo).not.toHaveBeenCalled();
  });

  it("deletes the Mux asset when the video no longer exists", async () => {
    const gone = createMemoryRepo(null);
    const result = await deliver(gone.repo, events.ready);
    expect(result.status).toBe(200);
    expect(gone.repo.deleteOrphanAsset).toHaveBeenCalledWith("asset_1");
  });

  it("returns 400 for malformed payloads", async () => {
    const result = await deliver(memory.repo, { type: "video.asset.ready", data: {} });
    expect(result.status).toBe(400);
  });
});

describe("trimming (a new asset replaces the old one)", () => {
  const trimmedReady = {
    type: "video.asset.ready",
    data: {
      id: "asset_trim",
      passthrough: VIDEO_ID,
      duration: 6,
      playback_ids: [{ id: "play_trim", policy: "public" }],
    },
  };
  const trimming: VideoState = {
    status: "processing",
    mux_asset_id: "asset_1",
    mux_playback_id: "play_1",
  };

  it("swaps in the trimmed asset and deletes the original", async () => {
    const memory = createMemoryRepo(trimming);
    await deliver(memory.repo, trimmedReady);
    expect(memory.current()).toMatchObject({
      status: "ready",
      mux_asset_id: "asset_trim",
      mux_playback_id: "play_trim",
    });
    expect(memory.repo.deleteOrphanAsset).toHaveBeenCalledWith("asset_1");
  });

  it("falls back to the original when the trim fails", async () => {
    const memory = createMemoryRepo(trimming);
    await deliver(memory.repo, {
      type: "video.asset.errored",
      data: { id: "asset_trim", passthrough: VIDEO_ID },
    });
    expect(memory.current()).toMatchObject({
      status: "ready",
      mux_asset_id: "asset_1",
      mux_playback_id: "play_1",
    });
    expect(memory.repo.deleteOrphanAsset).not.toHaveBeenCalled();
  });

  it("does not delete anything on a normal first ready", async () => {
    const memory = createMemoryRepo(uploading);
    await deliver(memory.repo, events.assetCreated);
    await deliver(memory.repo, events.ready);
    expect(memory.repo.deleteOrphanAsset).not.toHaveBeenCalled();
  });
});

describe("computeVideoUpdate", () => {
  it("returns null for ready without a playback id", () => {
    const event = { type: "video.asset.ready" as const, data: { id: "asset_1" } };
    expect(computeVideoUpdate(uploading, event)).toBeNull();
  });
});
