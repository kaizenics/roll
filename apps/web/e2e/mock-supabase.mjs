// Minimal PostgREST/GoTrue stand-in for Playwright: serves seeded `videos`
// rows so viewer states can be tested without a real Supabase project.
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_SUPABASE_PORT ?? 54329);

const owner = { full_name: "Ada Lovelace", avatar_url: null };
const base = {
  owner_id: "00000000-0000-4000-8000-000000000000",
  mux_upload_id: "upload",
  mux_asset_id: null,
  duration_seconds: null,
  aspect_ratio: null,
  view_count: 0,
  is_shared: true,
  created_at: "2026-10-01T12:00:00Z",
  updated_at: "2026-10-01T12:00:00Z",
  owner,
};

const VIDEOS = {
  prcss23456: {
    ...base,
    id: "11111111-1111-4111-8111-111111111111",
    short_id: "prcss23456",
    title: "Still processing",
    status: "processing",
    mux_playback_id: null,
  },
  rdy2345678: {
    ...base,
    id: "22222222-2222-4222-8222-222222222222",
    short_id: "rdy2345678",
    title: "Quarterly roadmap walkthrough",
    status: "ready",
    mux_asset_id: "asset",
    mux_playback_id: "playbackid123",
    duration_seconds: 42.5,
    aspect_ratio: "16:9",
    view_count: 7,
  },
  prvt234567: {
    ...base,
    id: "44444444-4444-4444-8444-444444444444",
    short_id: "prvt234567",
    title: "Not shared yet",
    status: "ready",
    is_shared: false,
    mux_asset_id: "asset",
    mux_playback_id: "privateplayback",
  },
  errd234567: {
    ...base,
    id: "33333333-3333-4333-8333-333333333333",
    short_id: "errd234567",
    title: "Broken upload",
    status: "errored",
    mux_playback_id: null,
  },
};

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(body === undefined ? "" : JSON.stringify(body));
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (url.pathname === "/rest/v1/videos" && req.method === "GET") {
    const shortId = url.searchParams.get("short_id")?.replace(/^eq\./, "");
    const id = url.searchParams.get("id")?.replace(/^eq\./, "");
    const rows = Object.values(VIDEOS).filter(
      (video) => (shortId && video.short_id === shortId) || (id && video.id === id),
    );
    return send(res, 200, rows);
  }
  if (url.pathname === "/rest/v1/rpc/increment_view") return send(res, 204);
  if (url.pathname.startsWith("/auth/v1/")) {
    return send(res, 401, { code: 401, msg: "No session" });
  }
  return send(res, 404, { message: `Not mocked: ${req.method} ${url.pathname}` });
});

server.listen(PORT, () => console.log(`mock supabase listening on ${PORT}`));
