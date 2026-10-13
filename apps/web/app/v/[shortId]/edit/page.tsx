import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
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
      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-2 font-serif text-4xl tracking-[-0.01em]">Edit video</h1>
        <p className="text-muted-foreground mb-8 max-w-[60ch]">
          Trim the start and end. The original stays available until the trimmed version is ready.
        </p>
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
