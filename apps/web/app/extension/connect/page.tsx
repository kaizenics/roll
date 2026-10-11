import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EXTENSION_CONNECT_PATH } from "@roll/shared";
import { ConnectBridge } from "@/components/extension/connect-bridge";
import { Logo } from "@/components/logo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Connect extension", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ExtensionConnectPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(EXTENSION_CONNECT_PATH)}`);

  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4">
      <Logo />
      <ConnectBridge email={user.email ?? null} />
    </main>
  );
}
