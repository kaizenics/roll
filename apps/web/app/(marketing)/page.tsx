import { ArrowUpRight, Link2, MonitorPlay, Puzzle, Video } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getChromeStoreUrl } from "@/lib/env";

const FLOW = [
  {
    icon: MonitorPlay,
    title: "Record",
    description:
      "Pick your screen, a window or the current tab. System audio and your microphone are mixed into one track.",
  },
  {
    icon: Video,
    title: "Show your face",
    description:
      "A camera bubble sits on the page you are recording. Drag it anywhere, resize it, or hide it.",
  },
  {
    icon: Link2,
    title: "Share",
    description:
      "Press stop and the link is already on your clipboard. The video finishes uploading in the background.",
  },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="grid gap-12 pb-24 pt-20 sm:pt-28 md:grid-cols-12 md:pb-32">
          <div className="flex flex-col gap-6 md:col-span-8">
            <p className="reveal text-muted-foreground text-sm">Async video for busy teams</p>
            <h1
              className="reveal font-serif text-5xl leading-[1.05] tracking-[-0.02em] sm:text-7xl"
              style={{ "--i": 1 } as CSSProperties}
            >
              Say it with a video.
              <br />
              <span className="text-muted-foreground italic">Share it with a link.</span>
            </h1>
            <p
              className="reveal text-muted-foreground max-w-[52ch] text-lg"
              style={{ "--i": 2 } as CSSProperties}
            >
              Roll records your screen, camera and voice from Chrome. When you press stop, a share
              link is already on your clipboard.
            </p>
            <div
              className="reveal flex flex-col gap-3 pt-2 sm:flex-row sm:items-center"
              style={{ "--i": 3 } as CSSProperties}
            >
              <Button asChild size="lg">
                <a href={getChromeStoreUrl()} target="_blank" rel="noreferrer">
                  <Puzzle aria-hidden />
                  Add to Chrome, it’s free
                </a>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/dashboard">
                  Go to dashboard
                  <ArrowUpRight aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="how"
          className="border-t pb-28 pt-16 md:grid md:grid-cols-12 md:gap-12"
        >
          <h2
            id="how"
            className="mb-10 font-serif text-3xl tracking-[-0.01em] md:col-span-4 md:mb-0 md:text-4xl"
          >
            From idea to link in under a minute.
          </h2>
          <ol className="flex flex-col md:col-span-8">
            {FLOW.map(({ icon: Icon, title, description }, index) => (
              <li
                key={title}
                className="reveal grid grid-cols-[2.5rem_1fr] gap-4 border-b py-6 first:pt-0 last:border-b-0"
                style={{ "--i": index } as CSSProperties}
              >
                <span className="bg-secondary flex size-10 items-center justify-center rounded-md">
                  <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                </span>
                <div>
                  <h3 className="font-medium">{title}</h3>
                  <p className="text-muted-foreground mt-1 max-w-[60ch]">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm sm:flex-row sm:justify-between sm:px-6">
          <span>Roll</span>
          <Link href="/login" className="hover:text-foreground transition-colors">
            Sign in
          </Link>
        </div>
      </footer>
    </>
  );
}
