import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Enter, MaskLines } from "@/components/landing/motion";
import { LogoMark } from "@/components/logo";
import { safeNextPath } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Sign in" };

const display = "font-bold uppercase tracking-[-0.065em]";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="landing grid min-h-dvh md:grid-cols-[1.1fr_1fr]">
      {/* Red poster half: on phones it shrinks to a header band above the form. */}
      <aside className="bg-record relative flex flex-col justify-between gap-10 overflow-hidden px-4 pb-8 pt-6 text-[#0b0b0b] sm:px-8 md:min-h-dvh md:pb-10 md:pt-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-xl font-bold tracking-[-0.04em] text-white outline-none focus-visible:underline"
          >
            <LogoMark className="size-8 [&_circle]:fill-[#0b0b0b]" />
            Roll
          </Link>
          <Link
            href="/"
            className="group flex items-center gap-2 text-sm font-medium uppercase tracking-[0.12em] outline-none hover:text-white focus-visible:text-white"
          >
            <ArrowLeft
              className="ease-out-soft size-4 transition-transform duration-500 group-hover:-translate-x-1"
              aria-hidden
            />
            Back
          </Link>
        </div>

        <p
          aria-hidden
          className={`text-[clamp(3.5rem,15vw,12rem)] leading-[0.82] md:text-[clamp(4rem,9vw,11rem)] ${display}`}
        >
          <MaskLines
            delay={0.1}
            lines={[
              "Welcome",
              <span key="b" className="text-white">
                back.
              </span>,
            ]}
          />
        </p>

        <p className="hidden max-w-[34ch] text-lg font-medium leading-snug md:block">
          Your recordings, links and embeds are right where you left them.
        </p>
      </aside>

      <main id="main" className="flex items-center px-4 py-16 sm:px-8 md:py-10">
        <Enter delay={0.35} className="mx-auto w-full max-w-md">
          <h1 className="text-[clamp(2.5rem,5vw,3.75rem)] font-bold leading-[0.95] tracking-[-0.05em]">
            Sign in to Roll
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">
            Use a magic link or your Google account. No password to remember.
          </p>

          {error && (
            <p
              role="alert"
              className="border-record text-foreground mt-8 border-l-2 bg-[#e3181f]/10 px-4 py-3"
            >
              That sign-in link didn’t work. Please request a new one.
            </p>
          )}

          <div className="mt-10">
            <LoginForm next={safeNextPath(next)} />
          </div>

          <p className="text-muted-foreground mt-12 text-sm">
            By continuing you agree to the{" "}
            <Link href="/terms" className="text-foreground underline-offset-4 hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-foreground underline-offset-4 hover:underline">
              Privacy policy
            </Link>
            .
          </p>
        </Enter>
      </main>
    </div>
  );
}
