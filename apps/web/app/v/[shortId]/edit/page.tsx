import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { PageHeading } from "@/components/page-heading";
import { TrimEditor } from "@/components/viewer/trim-editor";
import { getPublicVideo } from "@/lib/public-video";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit video", robots: { index: false } };

export default async function EditVideoPage({ params }: { params: Promise<{ shortId: string }> }) {
  const { shortId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/v/${shortId}/edit`);

  const video = await getPublicVideo(shortId);
  if (!video || video.ownerId !== user.id) notFound();
  if (video.status !== "ready" || !video.playbackId || !video.durationSeconds) {
    redirect(`/v/${shortId}`);
  }

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-[1600px] px-4 py-12 sm:px-8 md:py-16">
        <PageHeading
          title="Edit video"
          description="Trim the start and end. The original stays available until the trimmed version is ready."
        />
        <TrimEditor
          videoId={video.id}
          shortId={video.shortId}
          playbackId={video.playbackId}
          title={video.title}
          durationSeconds={video.durationSeconds}
        />
      </main>
    </>
  );
}
