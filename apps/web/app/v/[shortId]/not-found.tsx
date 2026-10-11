import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function VideoNotFound() {
  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center"
    >
      <p className="text-primary text-sm font-medium">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">Video not found</h1>
      <p className="text-muted-foreground max-w-sm">
        This link may be mistyped, or the video was deleted by its owner.
      </p>
      <Button asChild>
        <Link href="/">Go to Roll</Link>
      </Button>
    </main>
  );
}
