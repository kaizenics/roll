import { Puzzle, Video } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getChromeStoreUrl } from "@/lib/env";

export function EmptyState() {
  return (
    <section className="flex flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center">
      <span className="bg-accent text-accent-foreground flex size-12 items-center justify-center rounded-full">
        <Video className="size-6" aria-hidden />
      </span>
      <h2 className="text-lg font-semibold">No recordings yet</h2>
      <p className="text-muted-foreground max-w-md text-sm">
        Record your screen right in the browser. Press stop and your share link is copied and shows
        up here.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild>
          <Link href="/record">
            <span aria-hidden className="bg-record size-2.5 rounded-full" />
            Start recording
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <a href={getChromeStoreUrl()} target="_blank" rel="noreferrer">
            <Puzzle aria-hidden />
            Get the extension (optional)
          </a>
        </Button>
      </div>
    </section>
  );
}
