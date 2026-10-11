import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VideoGrid } from "@/components/dashboard/video-grid";
import { SiteHeader } from "@/components/site-header";
import { getAppUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listVideosForOwner, toVideoDTO } from "@/lib/videos";

export const metadata: Metadata = { title: "Your videos" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const appUrl = getAppUrl();
  const videos = (await listVideosForOwner(supabase, user.id)).map((row) =>
    toVideoDTO(row, appUrl),
  );

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Your videos</h1>
        <VideoGrid initialVideos={videos} />
      </main>
    </>
  );
}
