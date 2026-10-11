import { z } from "zod";

/**
 * Env access is lazy so `next build` succeeds without secrets; missing values
 * fail loudly at request time instead.
 */

export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function getChromeStoreUrl(): string {
  return process.env.NEXT_PUBLIC_CHROME_STORE_URL || "https://chromewebstore.google.com/";
}

const publicSupabaseSchema = z.object({
  url: z.url(),
  anonKey: z.string().min(1),
});

export function getPublicSupabaseEnv(): z.infer<typeof publicSupabaseSchema> {
  return publicSupabaseSchema.parse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  MUX_TOKEN_ID: z.string().min(1),
  MUX_TOKEN_SECRET: z.string().min(1),
  MUX_WEBHOOK_SECRET: z.string().min(1),
});

type ServerEnv = z.infer<typeof serverSchema>;

export function getServerEnv<K extends keyof ServerEnv>(key: K): ServerEnv[K] {
  const value = serverSchema.shape[key].safeParse(process.env[key]);
  if (!value.success) throw new Error(`Missing required environment variable ${key}`);
  return value.data;
}

/** `chrome-extension://<id>` or null when EXTENSION_ID is not configured. */
export function getExtensionOrigin(): string | null {
  const id = process.env.EXTENSION_ID?.trim();
  return id ? `chrome-extension://${id}` : null;
}

export function getUpstashEnv(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}
