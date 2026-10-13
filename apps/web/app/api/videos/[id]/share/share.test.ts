import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestAuth } from "@/lib/auth";
import type { VideoRow } from "@/lib/supabase/database.types";
import type * as VideosModule from "@/lib/videos";

vi.mock("@/lib/auth", () => ({ getRequestAuth: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: vi.fn(() => ({})) }));
vi.mock("@/lib/videos", async (importOriginal) => ({
  ...(await importOriginal<typeof VideosModule>()),
  getVideoForOwner: vi.fn(),
  setSharing: vi.fn(),
}));

const { getRequestAuth } = await import("@/lib/auth");
const videos = await import("@/lib/videos");
const route = await import("./route");

const OWNER = "11111111-1111-4111-8111-111111111111";
const VIDEO_ID = "22222222-2222-4222-8222-222222222222";
const ctx = { params: Promise.resolve({ id: VIDEO_ID }) };
const req = (method: string) =>
  new Request(`http://localhost/api/videos/${VIDEO_ID}/share`, { method });
const row = (o: Partial<VideoRow>) =>
  ({ id: VIDEO_ID, short_id: "abcd23XYZq", owner_id: OWNER, is_shared: false, ...o }) as VideoRow;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getRequestAuth).mockResolvedValue({
    userId: OWNER,
    supabase: {} as RequestAuth["supabase"],
  });
});

describe("share / revoke", () => {
  it("requires sign-in", async () => {
    vi.mocked(getRequestAuth).mockResolvedValue(null);
    expect((await route.POST(req("POST"), ctx)).status).toBe(401);
    expect(videos.setSharing).not.toHaveBeenCalled();
  });

  it("refuses videos the caller does not own", async () => {
    vi.mocked(videos.getVideoForOwner).mockResolvedValue(null);
    expect((await route.DELETE(req("DELETE"), ctx)).status).toBe(404);
    expect(videos.setSharing).not.toHaveBeenCalled();
  });

  it("shares and returns the public link", async () => {
    vi.mocked(videos.getVideoForOwner).mockResolvedValue(row({}));
    vi.mocked(videos.setSharing).mockResolvedValue(row({ is_shared: true }));
    const response = await route.POST(req("POST"), ctx);
    expect(await response.json()).toMatchObject({
      isShared: true,
      shareUrl: expect.stringMatching(/\/v\/abcd23XYZq$/),
    });
    expect(vi.mocked(videos.setSharing).mock.calls[0]?.slice(1, 4)).toEqual([
      VIDEO_ID,
      OWNER,
      true,
    ]);
  });

  it("revokes with a rotated link id", async () => {
    vi.mocked(videos.getVideoForOwner).mockResolvedValue(row({ is_shared: true }));
    vi.mocked(videos.setSharing).mockResolvedValue(
      row({ is_shared: false, short_id: "newid23456" }),
    );
    const response = await route.DELETE(req("DELETE"), ctx);
    expect(await response.json()).toMatchObject({ isShared: false, shortId: "newid23456" });
    expect(vi.mocked(videos.setSharing).mock.calls[0]?.[3]).toBe(false);
  });
});
