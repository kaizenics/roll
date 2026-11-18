import { ArrowUpRight, Puzzle } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/landing/motion";
import { Button } from "@/components/ui/button";
import { getChromeStoreUrl } from "@/lib/env";

export function EmptyState() {
  return (
    <Reveal>
      <section className="flex flex-col items-start gap-8 py-10 md:py-16">
        <h2 className="text-[clamp(2.5rem,6vw,5.5rem)] font-bold uppercase leading-[0.88] tracking-[-0.06em]">
          Nothing rolling
          <br />
          <span className="text-outline">yet.</span>
        </h2>
        <p className="text-muted-foreground max-w-[46ch] text-lg">
          Record your screen right in the browser. Press stop and your share link is copied and
          shows up here.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/record">
              Start recording
              <ArrowUpRight aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={getChromeStoreUrl()} target="_blank" rel="noreferrer">
              <Puzzle aria-hidden />
              Get the extension
            </a>
          </Button>
        </div>
      </section>
    </Reveal>
  );
}
