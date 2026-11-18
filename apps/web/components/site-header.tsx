import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { EdgeBlur } from "@/components/edge-blur";
import { LogoMark } from "@/components/logo";
import { RollText } from "@/components/roll-text";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function currentUserId(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

const link = "group block text-sm font-medium uppercase tracking-[0.12em] outline-none";

/** App header: wordmark, rolling-text links and the red record pill. */
export async function SiteHeader({ children }: { children?: ReactNode }) {
  const signedIn = Boolean(await currentUserId());

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0b0b]/80 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-6 px-4 sm:px-8 md:h-20">
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-xl font-bold tracking-[-0.04em] outline-none"
          >
            <LogoMark className="ease-out-soft size-8 transition-transform duration-500 group-hover:rotate-[-8deg]" />
            Roll
          </Link>
          <nav aria-label="Main" className="ml-auto flex items-center gap-5 sm:gap-8">
            {children}
            {signedIn ? (
              <>
                <Link href="/dashboard" className={link}>
                  <RollText>Dashboard</RollText>
                </Link>
                <form action="/auth/signout" method="post" className="hidden sm:block">
                  <button type="submit" className={link}>
                    <RollText>Sign out</RollText>
                  </button>
                </form>
                <Link
                  href="/record"
                  className="bg-record group inline-flex h-10 items-center gap-2 rounded-full pl-4 pr-1.5 text-sm font-medium text-white outline-none transition-colors duration-300 hover:bg-white hover:text-black focus-visible:ring-[3px] focus-visible:ring-white/40 md:h-11 md:pl-5 md:pr-2"
                >
                  <RollText>Record</RollText>
                  <span className="ease-out-soft flex size-7 items-center justify-center rounded-full bg-white text-black transition-transform duration-500 group-hover:rotate-45 group-hover:bg-black group-hover:text-white">
                    <ArrowUpRight className="size-4" aria-hidden />
                  </span>
                </Link>
              </>
            ) : (
              <Link href="/login" className={link}>
                <RollText>Sign in</RollText>
              </Link>
            )}
          </nav>
        </div>
      </header>
      {/* Outside the header: a backdrop blur can't see past an ancestor that has one. */}
      <EdgeBlur edge="top" className="fixed inset-x-0 top-16 z-30 h-6 md:top-20" />
    </>
  );
}
