import type { Session } from "@supabase/supabase-js";
import type { ExtensionSession } from "@roll/shared";

function metadataString(metadata: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}

/** Converts a Supabase session into the minimal shape the extension stores. */
export function toExtensionSession(session: Session): ExtensionSession {
  const metadata = session.user.user_metadata as Record<string, unknown>;
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in,
    user: {
      id: session.user.id,
      email: session.user.email ?? null,
      name: metadataString(metadata, "full_name", "name"),
      avatarUrl: metadataString(metadata, "avatar_url", "picture"),
    },
  };
}
