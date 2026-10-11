import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestAuth } from "@/lib/auth";
import type { VideoRow } from "@/lib/supabase/database.types";
import type * as VideosModule from "@/lib/videos";

vi.mock("@/lib/auth", () => ({ getRequestAuth: vi.fn() }));
vi.mock("@/lib/mux", () => ({
  createDirectUpload: vi.fn(),
  deleteMuxAsset: vi.fn(),
  cancelMuxUpload: vi.fn(),
}));
vi.mock("@/lib/videos", async (importOriginal) => {
  const actual = await importOriginal<typeof VideosModule>();
  return {
    ...actual,
    listVideosForOwner: vi.fn(),
    getVideoForOwner: vi.fn(),
    insertVideo: vi.fn(),
    updateVideoTitle: vi.fn(),
    deleteVideoRow: vi.fn(),
  };
});

const { getRequestAuth } = await import("@/lib/auth");
const mux = await import("@/lib/mux");
const videos = await import("@/lib/videos");
const collection = await import("./route");
const item = await import("./[id]/route");

const OWNER = "11111111-1111-4111-8111-111111111111";
const VIDEO_ID = "22222222-2222-4222-8222-222222222222";

function row(overrides: Partial<VideoRow> = {}): VideoRow {
  return {
    id: VIDEO_ID,
    short_id: "abcd23XYZq",
    owner_id: OWNER,
    title: "Demo",
    status: "ready",
    mux_upload_id: "upload_1",
    mux_asset_id: "asset_1",
    mux_playback_id: "play_1",
    duration_seconds: 12,
    aspect_ratio: "16:9",
    view_count: 3,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function signedIn(userId = OWNER) {
  vi.mocked(getRequestAuth).mockResolvedValue({
    userId,
    supabase: {} as RequestAuth["supabase"],
  });
}

function request(method: string, body?: unknown, path = "/api/videos") {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json", authorization: "Bearer token" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const ctx = (id = VIDEO_ID) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getRequestAuth).mockResolvedValue(null);
});

describe("authentication", () => {
  it("rejects anonymous callers on every route", async () => {
    const responses = await Promise.all([
      collection.GET(request("GET")),
      collection.POST(request("POST", {})),
      item.GET(request("GET"), ctx()),
      item.PATCH(request("PATCH", { title: "x" }), ctx()),
      item.DELETE(request("DELETE"), ctx()),
    ]);
    for (const response of responses) {
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({ error: { code: "unauthorized" } });
    }
    expect(mux.createDirectUpload).not.toHaveBeenCalled();
    expect(mux.deleteMuxAsset).not.toHaveBeenCalled();
  });
});

describe("POST /api/videos", () => {
  it("creates an upload and a row owned by the caller", async () => {
    signedIn();
    vi.mocked(mux.createDirectUpload).mockResolvedValue({
      uploadId: "upload_1",
      uploadUrl: "https://storage.googleapis.com/upload",
    });
    vi.mocked(videos.insertVideo).mockResolvedValue(row({ status: "uploading" }));

    const response = await collection.POST(request("POST", { title: "Hello" }));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      id: VIDEO_ID,
      shortId: "abcd23XYZq",
      uploadUrl: "https://storage.googleapis.com/upload",
      shareUrl: expect.stringMatching(/\/v\/abcd23XYZq$/),
    });
    expect(vi.mocked(videos.insertVideo).mock.calls[0]?.[1]).toMatchObject({
      ownerId: OWNER,
      title: "Hello",
      muxUploadId: "upload_1",
    });
  });

  it("validates the body", async () => {
    signedIn();
    const response = await collection.POST(request("POST", { title: "a".repeat(200) }));
    expect(response.status).toBe(400);
    expect(mux.createDirectUpload).not.toHaveBeenCalled();
  });

  it("maps Mux failures to 502", async () => {
    signedIn();
    vi.mocked(mux.createDirectUpload).mockRejectedValue(new Error("mux down"));
    const response = await collection.POST(request("POST", {}));
    expect(response.status).toBe(502);
    expect(videos.insertVideo).not.toHaveBeenCalled();
  });
});

describe("ownership", () => {
  it("returns 404 when another user requests the video", async () => {
    signedIn("33333333-3333-4333-8333-333333333333");
    vi.mocked(videos.getVideoForOwner).mockResolvedValue(null);
    vi.mocked(videos.updateVideoTitle).mockResolvedValue(null);

    expect((await item.GET(request("GET"), ctx())).status).toBe(404);
    expect((await item.PATCH(request("PATCH", { title: "Hijack" }), ctx())).status).toBe(404);
    expect((await item.DELETE(request("DELETE"), ctx())).status).toBe(404);

    expect(vi.mocked(videos.updateVideoTitle).mock.calls[0]?.[2]).toBe(
      "33333333-3333-4333-8333-333333333333",
    );
    expect(mux.deleteMuxAsset).not.toHaveBeenCalled();
    expect(videos.deleteVideoRow).not.toHaveBeenCalled();
  });

  it("lets the owner rename", async () => {
    signedIn();
    vi.mocked(videos.updateVideoTitle).mockResolvedValue(row({ title: "Renamed" }));
    const response = await item.PATCH(request("PATCH", { title: " Renamed " }), ctx());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ title: "Renamed" });
    expect(videos.updateVideoTitle).toHaveBeenCalledWith(
      expect.anything(),
      VIDEO_ID,
      OWNER,
      "Renamed",
    );
  });

  it("rejects an empty title", async () => {
    signedIn();
    const response = await item.PATCH(request("PATCH", { title: "  " }), ctx());
    expect(response.status).toBe(400);
  });

  it("deletes the Mux asset and the row for the owner", async () => {
    signedIn();
    vi.mocked(videos.getVideoForOwner).mockResolvedValue(row());
    const response = await item.DELETE(request("DELETE"), ctx());
    expect(response.status).toBe(204);
    expect(mux.deleteMuxAsset).toHaveBeenCalledWith("asset_1");
    expect(videos.deleteVideoRow).toHaveBeenCalledWith(expect.anything(), VIDEO_ID, OWNER);
  });

  it("cancels the pending upload when no asset exists yet", async () => {
    signedIn();
    vi.mocked(videos.getVideoForOwner).mockResolvedValue(
      row({ status: "uploading", mux_asset_id: null }),
    );
    await item.DELETE(request("DELETE"), ctx());
    expect(mux.cancelMuxUpload).toHaveBeenCalledWith("upload_1");
    expect(mux.deleteMuxAsset).not.toHaveBeenCalled();
  });

  it("keeps the row when Mux deletion fails", async () => {
    signedIn();
    vi.mocked(videos.getVideoForOwner).mockResolvedValue(row());
    vi.mocked(mux.deleteMuxAsset).mockRejectedValue(new Error("boom"));
    const response = await item.DELETE(request("DELETE"), ctx());
    expect(response.status).toBe(502);
    expect(videos.deleteVideoRow).not.toHaveBeenCalled();
  });

  it("treats malformed ids as not found", async () => {
    signedIn();
    const response = await item.GET(request("GET"), ctx("not-a-uuid"));
    expect(response.status).toBe(404);
    expect(videos.getVideoForOwner).not.toHaveBeenCalled();
  });
});
