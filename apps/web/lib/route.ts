import { apiError, withCors } from "@/lib/http";

/**
 * Wraps a route handler: adds CORS headers for the extension and turns
 * unexpected exceptions into the standard `{ error }` envelope.
 */
export async function handle(request: Request, fn: () => Promise<Response>): Promise<Response> {
  try {
    return withCors(request, await fn());
  } catch (error) {
    console.error(`[api] ${request.method} ${new URL(request.url).pathname} failed`, error);
    return withCors(request, apiError("internal_error", "Something went wrong. Please try again."));
  }
}
