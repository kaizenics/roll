import Link from "next/link";
import type { ReactNode } from "react";
import { EdgeBlur } from "@/components/edge-blur";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function currentUserId(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function SiteHeader({ children }: { children?: ReactNode }) {
  const signedIn = Boolean(await currentUserId());

  return (
    <>
      <header className="site-header sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Logo />
          <nav aria-label="Main" className="ml-auto flex items-center gap-1">
            {children}
            {signedIn ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/record">Record</Link>
                </Button>
                <form action="/auth/signout" method="post">
                  <Button type="submit" variant="ghost" size="sm">
                    Sign out
                  </Button>
                </form>
              </>
            ) : (
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>
      {/* Outside the header: a backdrop blur can't see past an ancestor that has one. */}
      <EdgeBlur edge="top" className="fixed inset-x-0 top-14 z-30 h-6" />
    </>
  );
}
