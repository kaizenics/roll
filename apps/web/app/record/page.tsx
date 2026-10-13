import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WebRecorder } from "@/components/recorder/web-recorder";
import { SiteHeader } from "@/components/site-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "New recording" };
export const dynamic = "force-dynamic";

export default async function RecordPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/record");

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-2 font-serif text-4xl tracking-[-0.01em]">New recording</h1>
        <p className="text-muted-foreground mb-8 max-w-[60ch]">
          Record right here, no extension needed. Pick what to share, and the link is ready the
          moment you stop.
        </p>
        <WebRecorder />
      </main>
    </>
  );
}
