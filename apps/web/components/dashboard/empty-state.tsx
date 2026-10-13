import { Puzzle, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getChromeStoreUrl } from "@/lib/env";

export function EmptyState() {
  return (
    <section className="flex flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center">
      <span className="bg-accent text-accent-foreground flex size-12 items-center justify-center rounded-full">
        <Video className="size-6" aria-hidden />
      </span>
      <h2 className="text-lg font-semibold">No recordings yet</h2>
      <ol className="text-muted-foreground max-w-md list-decimal space-y-1 pl-5 text-left text-sm">
        <li>Install the Roll Chrome extension and pin it to your toolbar.</li>
        <li>Click the Roll icon and sign in.</li>
        <li>Pick screen, window or tab, then hit “Start recording”.</li>
        <li>Press stop. Your share link is copied automatically and shows up here.</li>
      </ol>
      <Button asChild>
        <a href={getChromeStoreUrl()} target="_blank" rel="noreferrer">
          <Puzzle aria-hidden />
          Get the extension
        </a>
      </Button>
    </section>
  );
}
