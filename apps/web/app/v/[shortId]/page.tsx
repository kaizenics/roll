import { AlertTriangle, Eye, Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildShareUrl, muxDownloadUrl, muxMp4Url, muxPosterJpgUrl } from "@roll/shared";
import { SiteHeader } from "@/components/site-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CopyLinkButton } from "@/components/video/copy-link-button";
import { OwnerControls } from "@/components/viewer/owner-controls";
import { ProcessingRefresher } from "@/components/viewer/processing-refresher";
import { VideoPlayer } from "@/components/viewer/video-player";
import { ViewTracker } from "@/components/viewer/view-tracker";
import { getAppUrl } from "@/lib/env";
import { getPublicVideo } from "@/lib/public-video";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate, formatViews, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ shortId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shortId } = await params;
  const video = await getPublicVideo(shortId);
  if (!video) return { title: "Video not found", robots: { index: false } };
  // Private videos expose nothing to link unfurlers.
  if (!video.isShared) return { title: "Private video", robots: { index: false } };

  const url = buildShareUrl(getAppUrl(), video.shortId);
  const description = video.owner.name
    ? `A video from ${video.owner.name} on Roll`
    : "Watch this video on Roll";
  const image = video.playbackId ? muxPosterJpgUrl(video.playbackId) : undefined;

  return {
    title: video.title,
    description,
    robots: { index: false },
    alternates: { canonical: url },
    openGraph: {
      type: "video.other",
      url,
      title: video.title,
      description,
      siteName: "Roll",
      images: image ? [{ url: image, width: 1200, alt: video.title }] : undefined,
      videos: video.playbackId
        ? [
            {
              url: muxMp4Url(video.playbackId),
              secureUrl: muxMp4Url(video.playbackId),
              type: "video/mp4",
            },
          ]
        : undefined,
    },
    twitter: {
      card: video.playbackId ? "player" : "summary",
      title: video.title,
      description,
      images: image ? [image] : undefined,
      players: video.playbackId
        ? [
            {
              playerUrl: `https://player.mux.com/${video.playbackId}`,
              streamUrl: muxMp4Url(video.playbackId),
              width: 1280,
              height: 720,
            },
          ]
        : undefined,
    },
  };
}

async function viewerUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export default async function ViewerPage({ params }: Props) {
  const { shortId } = await params;
  const video = await getPublicVideo(shortId);
  if (!video) notFound();

  const isOwner = (await viewerUserId()) === video.ownerId;
  // Private until the owner generates a shareable link.
  if (!video.isShared && !isOwner) notFound();
  const shareUrl = buildShareUrl(getAppUrl(), video.shortId);

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6">
        <div className="overflow-hidden rounded-xl bg-[#161513]">
          {video.status === "ready" && video.playbackId ? (
            <VideoPlayer playbackId={video.playbackId} title={video.title} videoId={video.id} />
          ) : video.status === "errored" ? (
            <div
              role="alert"
              className="flex aspect-video flex-col items-center justify-center gap-3 p-6 text-center text-white"
            >
              <AlertTriangle className="size-10 text-amber-400" aria-hidden />
              <p className="text-lg font-medium">This video couldn’t be processed.</p>
              <p className="text-sm text-white/70">The recording may be corrupted or too short.</p>
            </div>
          ) : (
            <div
              role="status"
              className="flex aspect-video flex-col items-center justify-center gap-3 p-6 text-center text-white"
            >
              <Loader2 className="size-10 animate-spin" aria-hidden />
              <p className="text-lg font-medium">Processing…</p>
              <p className="text-sm text-white/70">
                {video.status === "uploading"
                  ? "The recording is still uploading."
                  : "Your video will be ready in a moment."}{" "}
                This page updates automatically.
              </p>
              <ProcessingRefresher />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-3">
            <h1 className="break-words font-serif text-4xl tracking-[-0.01em]">{video.title}</h1>
            <div className="flex items-center gap-3">
              <Avatar>
                {video.owner.avatarUrl && <AvatarImage src={video.owner.avatarUrl} alt="" />}
                <AvatarFallback>{initials(video.owner.name)}</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium">{video.owner.name ?? "Roll user"}</p>
                <p className="text-muted-foreground flex items-center gap-2">
                  <time dateTime={video.createdAt}>{formatDate(video.createdAt)}</time>
                  <span aria-hidden>·</span>
                  <span className="flex items-center gap-1">
                    <Eye className="size-3" aria-hidden />
                    {formatViews(video.viewCount)}
                  </span>
                </p>
              </div>
            </div>
          </div>
          {isOwner ? (
            <OwnerControls
              videoId={video.id}
              title={video.title}
              shareUrl={shareUrl}
              isShared={video.isShared}
              downloadUrl={
                video.status === "ready" && video.playbackId
                  ? muxDownloadUrl(video.playbackId, video.title)
                  : null
              }
              canEdit={video.status === "ready"}
              editHref={`/v/${video.shortId}/edit`}
            />
          ) : (
            <CopyLinkButton url={shareUrl} variant="default" />
          )}
        </div>
        {video.status === "ready" && video.isShared && !isOwner && (
          <ViewTracker videoId={video.id} />
        )}
      </main>
    </>
  );
}
