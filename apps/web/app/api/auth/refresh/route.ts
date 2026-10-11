import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { refreshSessionRequestSchema, type ExtensionSession } from "@roll/shared";
import { getPublicSupabaseEnv } from "@/lib/env";
import { toExtensionSession } from "@/lib/extension-session";
import { apiError, clientIp, parseJsonBody, preflight } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { handle } from "@/lib/route";

export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return preflight(request);
}

/**
 * Exchanges an extension's refresh token for a new session, so the extension
 * never needs to know the Supabase URL or keys.
 */
export function POST(request: Request) {
  return handle(request, async () => {
    const limit = await rateLimit(`refresh:${clientIp(request)}`, 30, 60_000);
    if (!limit.ok) return apiError("rate_limited", "Too many requests");

    const body = await parseJsonBody(request, refreshSessionRequestSchema);
    if (!body.ok) return body.response;

    const { url, anonKey } = getPublicSupabaseEnv();
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: body.data.refreshToken,
    });
    if (error || !data.session) {
      return apiError("unauthorized", "Session expired. Please sign in again.");
    }
    return NextResponse.json<ExtensionSession>(toExtensionSession(data.session), {
      headers: { "Cache-Control": "no-store" },
    });
  });
}
