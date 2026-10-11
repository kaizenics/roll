import {
  apiErrorSchema,
  createVideoResponseSchema,
  extensionSessionSchema,
  type CreateVideoRequest,
  type CreateVideoResponse,
  type ExtensionSession,
} from "@roll/shared";
import { APP_URL } from "./env";
import { clearSession, getSession, setSession } from "./storage";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export class NotSignedInError extends ApiError {
  constructor() {
    super("Please sign in to Roll first.", 401);
  }
}

let refreshing: Promise<ExtensionSession | null> | null = null;

/** Exchanges the refresh token for a new session; de-duplicates concurrent calls. */
async function refreshSession(current: ExtensionSession): Promise<ExtensionSession | null> {
  refreshing ??= (async () => {
    try {
      const response = await fetch(`${APP_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });
      if (!response.ok) {
        if (response.status === 401) await clearSession();
        return null;
      }
      const session = extensionSessionSchema.parse(await response.json());
      await setSession(session);
      return session;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function errorMessage(response: Response): Promise<string> {
  const parsed = apiErrorSchema.safeParse(await response.json().catch(() => null));
  return parsed.success ? parsed.data.error.message : `Request failed (${response.status})`;
}

/** Authenticated fetch against the web app; refreshes once on 401. */
async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  let session = await getSession();
  if (!session) throw new NotSignedInError();

  // Refresh proactively if the access token is about to expire.
  if (session.expiresAt * 1000 < Date.now() + 30_000) {
    session = (await refreshSession(session)) ?? session;
  }

  const send = (token: string) =>
    fetch(`${APP_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
        Authorization: `Bearer ${token}`,
      },
    });

  let response = await send(session.accessToken);
  if (response.status === 401) {
    const refreshed = await refreshSession(session);
    if (!refreshed) throw new NotSignedInError();
    response = await send(refreshed.accessToken);
  }
  if (response.status === 401) throw new NotSignedInError();
  if (!response.ok) throw new ApiError(await errorMessage(response), response.status);
  return response;
}

export async function createVideo(body: CreateVideoRequest = {}): Promise<CreateVideoResponse> {
  const response = await authedFetch("/api/videos", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return createVideoResponseSchema.parse(await response.json());
}
