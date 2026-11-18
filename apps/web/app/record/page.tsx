import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
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
      <main id="main" className="mx-auto max-w-[1600px] px-4 py-12 sm:px-8 md:py-16">
        <PageHeading
          title="New recording"
          description="Record right here, no extension needed. Pick what to share, and the link is ready the moment you stop."
        />
        <WebRecorder />
      </main>
    </>
  );
}
