import { NextResponse } from "next/server";
import type { z } from "zod";
import type { ApiError, ApiErrorCode } from "@roll/shared";
import { getExtensionOrigin } from "@/lib/env";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  rate_limited: 429,
  upstream_error: 502,
  internal_error: 500,
};

export function apiError(
  code: ApiErrorCode,
  message: string,
  init?: { headers?: HeadersInit },
): NextResponse<ApiError> {
  return NextResponse.json<ApiError>(
    { error: { code, message } },
    { status: STATUS_BY_CODE[code], headers: init?.headers },
  );
}

type ParseResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse<ApiError> };

/** Reads and validates a JSON body. An empty body is treated as `{}`. */
export async function parseJsonBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<ParseResult<z.infer<S>>> {
  let raw: unknown = {};
  const text = await request.text();
  if (text.trim().length > 0) {
    try {
      raw = JSON.parse(text);
    } catch {
      return { ok: false, response: apiError("bad_request", "Request body must be valid JSON") };
    }
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request body";
    return { ok: false, response: apiError("bad_request", message) };
  }
  return { ok: true, data: parsed.data };
}

/** CORS headers for the configured extension origin only. */
export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  const allowed = getExtensionOrigin();
  if (!origin || !allowed || origin !== allowed) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization,Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export function withCors<T extends Response>(request: Request, response: T): T {
  for (const [key, value] of Object.entries(corsHeaders(request))) {
    response.headers.set(key, value);
  }
  return response;
}

export function preflight(request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
