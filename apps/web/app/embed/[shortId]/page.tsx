import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VideoPlayer } from "@/components/viewer/video-player";
import { getPublicVideo } from "@/lib/public-video";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };

/** Bare player for <iframe> embeds. Only shared, ready videos render. */
export default async function EmbedPage({ params }: { params: Promise<{ shortId: string }> }) {
  const { shortId } = await params;
  const video = await getPublicVideo(shortId);
  if (!video?.isShared || video.status !== "ready" || !video.playbackId) notFound();

  return (
    <main className="flex min-h-dvh items-center bg-black">
      <VideoPlayer playbackId={video.playbackId} title={video.title} videoId={video.id} />
    </main>
  );
}
