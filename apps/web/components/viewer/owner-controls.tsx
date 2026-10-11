"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteVideoButton } from "@/components/video/delete-video-button";
import { RenameForm } from "@/components/video/rename-form";

export function OwnerControls({ videoId, title }: { videoId: string; title: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <RenameForm
        videoId={videoId}
        initialTitle={title}
        onDone={() => setEditing(false)}
        onSaved={() => router.refresh()}
      />
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
        <Pencil aria-hidden />
        Rename
      </Button>
      <DeleteVideoButton
        videoId={videoId}
        title={title}
        onDeleted={() => router.replace("/dashboard")}
      />
    </>
  );
}
