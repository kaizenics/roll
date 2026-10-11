"use client";

import { Loader2, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const emailSchema = z.email("Enter a valid email address");

function callbackUrl(next: string): string {
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("next", next);
  return url.toString();
}

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function sendMagicLink(event: FormEvent) {
    event.preventDefault();
    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    setPending("email");
    try {
      const { error } = await createSupabaseBrowserClient().auth.signInWithOtp({
        email: parsed.data,
        options: { emailRedirectTo: callbackUrl(next) },
      });
      if (error) throw error;
      setSentTo(parsed.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't send the magic link");
    } finally {
      setPending(null);
    }
  }

  async function signInWithGoogle() {
    setPending("google");
    try {
      const { error } = await createSupabaseBrowserClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl(next) },
      });
      if (error) throw error;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed");
      setPending(null);
    }
  }

  if (sentTo) {
    return (
      <div role="status" className="flex flex-col items-center gap-2 py-4 text-center">
        <Mail className="text-primary size-8" aria-hidden />
        <p className="font-medium">Check your inbox</p>
        <p className="text-muted-foreground text-sm">
          We sent a sign-in link to <strong>{sentTo}</strong>.
        </p>
        <Button variant="link" onClick={() => setSentTo(null)}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        variant="outline"
        onClick={signInWithGoogle}
        disabled={pending !== null}
      >
        {pending === "google" ? <Loader2 className="animate-spin" aria-hidden /> : <GoogleIcon />}
        Continue with Google
      </Button>
      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" />
        or
        <span className="bg-border h-px flex-1" />
      </div>
      <form onSubmit={sendMagicLink} className="flex flex-col gap-3" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={pending !== null}>
          {pending === "email" && <Loader2 className="animate-spin" aria-hidden />}
          Send magic link
        </Button>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
