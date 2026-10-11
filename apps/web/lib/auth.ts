import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseTokenClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export interface RequestAuth {
  userId: string;
  /** Client scoped to the caller, so RLS applies to every query made with it. */
  supabase: SupabaseClient<Database>;
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

/**
 * Authenticates an API request: `Authorization: Bearer <access_token>` (extension)
 * takes precedence over the Supabase session cookie (web app).
 */
export async function getRequestAuth(request: Request): Promise<RequestAuth | null> {
  const token = bearerToken(request);
  if (token) {
    const supabase = createSupabaseTokenClient(token);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return { userId: data.user.id, supabase };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { userId: data.user.id, supabase };
}
