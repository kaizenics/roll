import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { safeNextPath } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4">
      <Logo />
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Sign in to Roll</CardTitle>
          <CardDescription>Use a magic link or your Google account.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p
              role="alert"
              className="bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm"
            >
              That sign-in link didn’t work. Please request a new one.
            </p>
          )}
          <LoginForm next={safeNextPath(next)} />
        </CardContent>
      </Card>
    </main>
  );
}
