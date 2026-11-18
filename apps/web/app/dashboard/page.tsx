import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { VideoGrid } from "@/components/dashboard/video-grid";
import { PageHeading } from "@/components/page-heading";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getAppUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { syncPendingVideos } from "@/lib/mux-sync";
import { listVideosForOwner, toVideoDTO } from "@/lib/videos";
import { createWebhookRepo } from "@/lib/webhook-repo";

export const metadata: Metadata = { title: "Your videos" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const appUrl = getAppUrl();
  let rows = await listVideosForOwner(supabase, user.id);
  if (await syncPendingVideos(createWebhookRepo(), rows)) {
    rows = await listVideosForOwner(supabase, user.id);
  }
  const videos = rows.map((row) => toVideoDTO(row, appUrl));

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-[1600px] px-4 py-12 sm:px-8 md:py-16">
        <PageHeading
          title="Your videos"
          description="Everything you record lands here, private until you share it."
          actions={
            <Button asChild size="lg">
              <Link href="/record">
                New recording
                <ArrowUpRight aria-hidden />
              </Link>
            </Button>
          }
        />
        <VideoGrid initialVideos={videos} />
      </main>
    </>
  );
}
