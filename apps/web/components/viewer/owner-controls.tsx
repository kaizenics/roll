"use client";

import { Download, MoreHorizontal, Pencil, Scissors, Trash2 } from "lucide-react";
import Link from "next/link";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RenameForm } from "@/components/video/rename-form";
import { ShareControls } from "@/components/viewer/share-controls";
import { deleteVideo } from "@/lib/api-client";

export function OwnerControls({
  videoId,
  title,
  shareUrl,
  isShared,
  downloadUrl,
  canEdit,
  editHref,
}: {
  videoId: string;
  title: string;
  shareUrl: string;
  isShared: boolean;
  /** null until the video is ready. */
  downloadUrl: string | null;
  canEdit: boolean;
  editHref: string;
}) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function remove() {
    try {
      await deleteVideo(videoId);
      toast.success("Video deleted");
      router.replace("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't delete the video");
    }
  }

  return (
    <div className="flex flex-col items-start gap-3 sm:items-end">
      {renaming ? (
        <RenameForm
          videoId={videoId}
          initialTitle={title}
          onDone={() => setRenaming(false)}
          onSaved={() => router.refresh()}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {downloadUrl ? (
            <Button asChild variant="outline" size="sm">
              <a href={downloadUrl} download>
                <Download aria-hidden />
                Download MP4
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled title="Available once processing finishes">
              <Download aria-hidden />
              Download MP4
            </Button>
          )}
          {canEdit ? (
            <Button asChild variant="outline" size="sm">
              <Link href={editHref}>
                <Scissors aria-hidden />
                Edit video
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled title="Available once processing finishes">
              <Scissors aria-hidden />
              Edit video
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" aria-label="More actions">
                <MoreHorizontal aria-hidden />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setRenaming(true)}>
                <Pencil aria-hidden />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
                <Trash2 aria-hidden />
                Delete video
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <ShareControls videoId={videoId} shareUrl={shareUrl} isShared={isShared} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this video?</AlertDialogTitle>
            <AlertDialogDescription>
              “{title}” and its share link will be permanently removed. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void remove()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
