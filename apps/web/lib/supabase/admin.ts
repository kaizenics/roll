import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv, getServerEnv } from "@/lib/env";
import type { Database } from "./database.types";

let adminClient: SupabaseClient<Database> | undefined;

/** Service-role client. Bypasses RLS — only use for webhook/public read paths. */
export function createSupabaseAdminClient(): SupabaseClient<Database> {
  if (adminClient) return adminClient;
  const { url } = getPublicSupabaseEnv();
  adminClient = createClient<Database>(url, getServerEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

/** Client that acts as the user identified by a bearer token (RLS applies). */
export function createSupabaseTokenClient(accessToken: string): SupabaseClient<Database> {
  const { url, anonKey } = getPublicSupabaseEnv();
  return createClient<Database>(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
