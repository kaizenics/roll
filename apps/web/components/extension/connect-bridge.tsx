"use client";

import { CheckCircle2, Loader2, PlugZap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AUTH_BRIDGE_SOURCE_WEB,
  authBridgeExtensionMessageSchema,
  type AuthBridgeWebMessage,
} from "@roll/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getChromeStoreUrl } from "@/lib/env";
import { toExtensionSession } from "@/lib/extension-session";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type State = "connecting" | "connected" | "no-extension" | "error";

const POST_INTERVAL_MS = 500;
const GIVE_UP_AFTER_MS = 8000;

/**
 * Hands the current Supabase session to the extension's auth-bridge content
 * script via window.postMessage (same-origin target only). Re-posts until the
 * content script acknowledges, since it may attach after hydration.
 */
export function ConnectBridge({ email }: { email: string | null }) {
  const [state, setState] = useState<State>("connecting");

  useEffect(() => {
    let message: AuthBridgeWebMessage | null = null;
    let acknowledged = false;

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== window) return;
      if (authBridgeExtensionMessageSchema.safeParse(event.data).success) {
        acknowledged = true;
        setState("connected");
      }
    }
    window.addEventListener("message", onMessage);

    const post = () => {
      if (message && !acknowledged) window.postMessage(message, window.location.origin);
    };

    createSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data, error }) => {
        if (error || !data.session) throw error ?? new Error("No session");
        message = {
          source: AUTH_BRIDGE_SOURCE_WEB,
          type: "session",
          session: toExtensionSession(data.session),
        };
        post();
      })
      .catch(() => setState("error"));

    const interval = setInterval(post, POST_INTERVAL_MS);
    const giveUp = setTimeout(() => {
      clearInterval(interval);
      if (!acknowledged)
        setState((current) => (current === "connecting" ? "no-extension" : current));
    }, GIVE_UP_AFTER_MS);

    return () => {
      window.removeEventListener("message", onMessage);
      clearInterval(interval);
      clearTimeout(giveUp);
    };
  }, []);

  return (
    <Card className="w-full max-w-sm text-center">
      <CardHeader className="items-center">
        {state === "connecting" && (
          <Loader2 className="text-primary size-10 animate-spin" aria-hidden />
        )}
        {state === "connected" && <CheckCircle2 className="size-10 text-emerald-500" aria-hidden />}
        {(state === "no-extension" || state === "error") && (
          <PlugZap className="size-10 text-amber-500" aria-hidden />
        )}
        <CardTitle className="text-xl" role="status">
          {state === "connecting" && "Connecting extension…"}
          {state === "connected" && "Connected ✓"}
          {state === "no-extension" && "Extension not detected"}
          {state === "error" && "Couldn’t read your session"}
        </CardTitle>
        <CardDescription>
          {state === "connected" &&
            `Roll is signed in${email ? ` as ${email}` : ""}. This tab will close automatically.`}
          {state === "connecting" && "Hang tight, this only takes a second."}
          {state === "no-extension" &&
            "Install the Roll extension, then click its icon and choose “Sign in” again."}
          {state === "error" && "Please sign in again and retry from the extension."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center gap-2">
        {state === "no-extension" && (
          <Button asChild>
            <a href={getChromeStoreUrl()} target="_blank" rel="noreferrer">
              Get the extension
            </a>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
