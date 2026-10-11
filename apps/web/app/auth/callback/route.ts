import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/safe-next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Landing point for magic links and OAuth (PKCE code exchange). */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "auth_failed");
  loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}
