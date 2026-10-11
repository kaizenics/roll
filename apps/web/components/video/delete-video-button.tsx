"use client";

import { Trash2 } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteVideo } from "@/lib/api-client";

export function DeleteVideoButton({
  videoId,
  title,
  onDeleted,
  iconOnly = false,
}: {
  videoId: string;
  title: string;
  onDeleted: () => void;
  iconOnly?: boolean;
}) {
  const [pending, setPending] = useState(false);

  async function confirm() {
    setPending(true);
    try {
      await deleteVideo(videoId);
      toast.success("Video deleted");
      onDeleted();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't delete the video");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size={iconOnly ? "icon" : "sm"}
          aria-label={`Delete ${title}`}
          disabled={pending}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 aria-hidden />
          {!iconOnly && <span>Delete</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this video?</AlertDialogTitle>
          <AlertDialogDescription>
            “{title}” and its share link will be permanently removed. This can’t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
