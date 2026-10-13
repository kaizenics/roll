import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WebhookRepo } from "@/lib/mux-webhook";
import type { VideoUpdate } from "@/lib/supabase/database.types";

vi.mock("@/lib/mux", () => ({ getUpload: vi.fn(), getAsset: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: vi.fn() }));

const mux = await import("@/lib/mux");
const { syncPendingVideo } = await import("./mux-sync");

const VIDEO_ID = "6f1c1f7e-9a0b-4a39-8f5e-2f0b1c2d3e4f";

function repo() {
  const updates: VideoUpdate[] = [];
  const r: WebhookRepo = {
    findVideo: vi.fn(),
    updateVideo: vi.fn(async (_id, patch) => void updates.push(patch)),
    deleteOrphanAsset: vi.fn(async () => undefined),
  };
  return { r, updates };
}

const pending = {
  id: VIDEO_ID,
  status: "uploading",
  mux_upload_id: "upload_1",
  mux_asset_id: null,
  mux_playback_id: null,
};

beforeEach(() => vi.clearAllMocks());

describe("syncPendingVideo", () => {
  it("walks an uploaded video straight to ready without a webhook", async () => {
    vi.mocked(mux.getUpload).mockResolvedValue({
      id: "upload_1",
      status: "asset_created",
      asset_id: "asset_1",
    } as never);
    vi.mocked(mux.getAsset).mockResolvedValue({
      id: "asset_1",
      status: "ready",
      duration: 12.3,
      aspect_ratio: "16:9",
      playback_ids: [{ id: "play_1", policy: "public" }],
    } as never);
    const { r, updates } = repo();

    expect(await syncPendingVideo(r, pending)).toBe(true);
    expect(updates).toEqual([
      { status: "processing", mux_asset_id: "asset_1" },
      expect.objectContaining({
        status: "ready",
        mux_playback_id: "play_1",
        duration_seconds: 12.3,
      }),
    ]);
    expect(r.deleteOrphanAsset).not.toHaveBeenCalled();
  });

  it("stays put while Mux is still preparing", async () => {
    vi.mocked(mux.getAsset).mockResolvedValue({ id: "asset_1", status: "preparing" } as never);
    const { r, updates } = repo();
    await syncPendingVideo(r, { ...pending, status: "processing", mux_asset_id: "asset_1" });
    expect(updates).toEqual([]);
  });

  it("marks failed uploads as errored", async () => {
    vi.mocked(mux.getUpload).mockResolvedValue({ id: "upload_1", status: "timed_out" } as never);
    const { r, updates } = repo();
    await syncPendingVideo(r, pending);
    expect(updates).toEqual([{ status: "errored" }]);
  });

  it("skips finished videos and trims in progress", async () => {
    const { r } = repo();
    expect(await syncPendingVideo(r, { ...pending, status: "ready" })).toBe(false);
    expect(
      await syncPendingVideo(r, { ...pending, status: "processing", mux_playback_id: "play_1" }),
    ).toBe(false);
    expect(mux.getUpload).not.toHaveBeenCalled();
    expect(mux.getAsset).not.toHaveBeenCalled();
  });
});
