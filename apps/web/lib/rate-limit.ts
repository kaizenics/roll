import { getUpstashEnv } from "@/lib/env";

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

interface Window {
  count: number;
  resetAt: number;
}

const memory = new Map<string, Window>();

/** Fixed-window limiter. Per-instance only; fine as a first line of defence. */
export function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): RateLimitResult {
  const current = memory.get(key);
  if (!current || current.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    if (memory.size > 10_000) pruneExpired(now);
    return { ok: true, retryAfterSeconds: 0 };
  }
  current.count += 1;
  if (current.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

function pruneExpired(now: number): void {
  for (const [key, window] of memory) {
    if (window.resetAt <= now) memory.delete(key);
  }
}

async function upstashRateLimit(
  env: { url: string; token: string },
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const response = await fetch(`${env.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.token}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", key],
      ["PEXPIRE", key, String(windowMs), "NX"],
      ["PTTL", key],
    ]),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Upstash responded ${response.status}`);
  const results = (await response.json()) as Array<{ result?: number }>;
  const count = results[0]?.result ?? 0;
  const ttl = results[2]?.result ?? windowMs;
  return count > limit
    ? { ok: false, retryAfterSeconds: Math.max(1, Math.ceil(ttl / 1000)) }
    : { ok: true, retryAfterSeconds: 0 };
}

/** Uses Upstash Redis when configured, otherwise the in-memory limiter. */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const upstash = getUpstashEnv();
  if (upstash) {
    try {
      return await upstashRateLimit(upstash, `roll:rl:${key}`, limit, windowMs);
    } catch (error) {
      console.error("Upstash rate limit failed, falling back to memory", error);
    }
  }
  return memoryRateLimit(key, limit, windowMs);
}
