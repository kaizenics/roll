import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { NotFoundPoster } from "@/components/not-found-poster";
import { Button } from "@/components/ui/button";

export default function VideoNotFound() {
  return (
    <NotFoundPoster
      title="Video not found"
      description="This link may be mistyped, or the video was deleted by its owner."
    >
      <Button asChild size="lg">
        <Link href="/">
          Go to Roll
          <ArrowUpRight aria-hidden />
        </Link>
      </Button>
    </NotFoundPoster>
  );
}
