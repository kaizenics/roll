"use client";

import { ArrowRight, Loader2, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
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
  const [invalid, setInvalid] = useState<string | null>(null);

  async function sendMagicLink(event: FormEvent) {
    event.preventDefault();
    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) {
      setInvalid(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    setInvalid(null);
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
      <div role="status" className="flex flex-col items-start gap-5">
        <span className="bg-record flex size-14 items-center justify-center rounded-full text-white">
          <Mail className="size-6" aria-hidden />
        </span>
        <p className="text-3xl font-bold tracking-[-0.04em]">Check your inbox</p>
        <p className="text-muted-foreground text-lg">
          We sent a sign-in link to <strong className="text-foreground">{sentTo}</strong>.
        </p>
        <button
          type="button"
          onClick={() => setSentTo(null)}
          className="hover:text-record text-sm font-medium uppercase tracking-[0.12em] underline-offset-4 outline-none hover:underline focus-visible:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={pending !== null}
        className={`${PILL} border border-white/25 hover:bg-white hover:text-black`}
      >
        {pending === "google" ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>
      <div className="text-muted-foreground flex items-center gap-4 text-xs font-medium uppercase tracking-[0.2em]">
        <span className="bg-border h-px flex-1" />
        or
        <span className="bg-border h-px flex-1" />
      </div>
      <form onSubmit={sendMagicLink} className="flex flex-col gap-6" noValidate>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-muted-foreground text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (invalid) setInvalid(null);
            }}
            required
            aria-invalid={invalid ? true : undefined}
            aria-describedby={invalid ? "email-error" : undefined}
            className="focus:border-record aria-invalid:border-record w-full border-b-2 border-white/25 bg-transparent py-3 text-2xl font-medium tracking-[-0.02em] outline-none transition-colors duration-300 placeholder:text-[#6b6b67]"
          />
          {invalid && (
            <p id="email-error" className="text-record text-sm font-medium">
              {invalid}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={pending !== null}
          className={`${PILL} bg-record group text-white hover:bg-white hover:text-black`}
        >
          {pending === "email" && <Loader2 className="size-5 animate-spin" aria-hidden />}
          Send magic link
          {pending !== "email" && (
            <ArrowRight
              className="ease-out-soft size-5 transition-transform duration-500 group-hover:translate-x-1"
              aria-hidden
            />
          )}
        </button>
      </form>
    </div>
  );
}

const PILL =
  "inline-flex h-14 w-full items-center justify-center gap-3 rounded-full px-7 text-base font-medium outline-none transition-[background-color,color,transform] duration-300 focus-visible:ring-[3px] focus-visible:ring-white/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5">
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
