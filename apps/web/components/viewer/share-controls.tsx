"use client";

import { Code2, Link2, Loader2, MoreHorizontal, Unlink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CopyLinkButton } from "@/components/video/copy-link-button";
import { revokeShare, shareVideo } from "@/lib/api-client";

export function embedCode(shareUrl: string): string {
  const src = shareUrl.replace("/v/", "/embed/");
  return `<iframe src="${src}" width="640" height="360" style="border:0;aspect-ratio:16/9;width:100%;height:auto" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
}

async function copy(text: string, success: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(success);
  } catch {
    toast.error("Couldn't copy. Select the text and copy it manually.");
  }
}

/** Private by default: owners generate a link, then can embed or revoke it. */
export function ShareControls({
  videoId,
  shareUrl,
  isShared,
}: {
  videoId: string;
  shareUrl: string;
  isShared: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [dialog, setDialog] = useState<"embed" | "revoke" | null>(null);

  async function generate() {
    setPending(true);
    try {
      const shared = await shareVideo(videoId);
      await copy(shared.shareUrl, "Shareable link copied");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't create the link");
    } finally {
      setPending(false);
    }
  }

  async function revoke() {
    setPending(true);
    try {
      const revoked = await revokeShare(videoId);
      toast.success("Link revoked. The old link no longer works.");
      // The link id rotates on revoke, so move the owner to the new URL.
      router.replace(`/v/${revoked.shortId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't revoke the link");
    } finally {
      setPending(false);
    }
  }

  if (!isShared) {
    return (
      <div className="flex flex-col items-start gap-1 sm:items-end">
        <Button onClick={() => void generate()} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Link2 aria-hidden />}
          Generate shareable link
        </Button>
        <p className="text-muted-foreground text-xs">
          Only you can see this video until you share it.
        </p>
      </div>
    );
  }

  const code = embedCode(shareUrl);

  return (
    <div className="flex items-center gap-1">
      <CopyLinkButton url={shareUrl} variant="default" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Sharing options" disabled={pending}>
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialog("embed")}>
            <Code2 aria-hidden />
            Embed code
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDialog("revoke")}>
            <Unlink aria-hidden />
            Revoke shareable link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <AlertDialogContent>
          {dialog === "embed" ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Embed this video</AlertDialogTitle>
                <AlertDialogDescription>
                  Paste this into your site, docs or Notion. It stops working if you revoke the
                  link.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <label htmlFor="embed-code" className="sr-only">
                Embed code
              </label>
              <textarea
                id="embed-code"
                readOnly
                value={code}
                rows={4}
                onFocus={(event) => event.currentTarget.select()}
                className="border-input bg-muted w-full resize-none rounded-md border p-3 font-mono text-xs"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
                <Button onClick={() => void copy(code, "Embed code copied")}>Copy code</Button>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke the shareable link?</AlertDialogTitle>
                <AlertDialogDescription>
                  Anyone with the current link or embed loses access. You can generate a new link
                  later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => void revoke()}>Revoke link</AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
