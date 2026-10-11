import { Puzzle, Link2, MonitorPlay, Video } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getChromeStoreUrl } from "@/lib/env";

const FEATURES = [
  {
    icon: MonitorPlay,
    title: "Screen, window or tab",
    description: "Capture exactly what you need with system or tab audio and your microphone.",
  },
  {
    icon: Video,
    title: "Camera bubble",
    description: "A draggable webcam bubble keeps the human touch in every walkthrough.",
  },
  {
    icon: Link2,
    title: "Instant share links",
    description: "The link is on your clipboard the moment you hit stop — no export, no waiting.",
  },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-4">
        <section className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <p className="text-muted-foreground rounded-full border px-3 py-1 text-xs font-medium">
            Async video for busy teams
          </p>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Say it with a video, <span className="text-primary">share it with a link.</span>
          </h1>
          <p className="text-muted-foreground max-w-xl text-pretty text-lg">
            Roll records your screen, camera and voice from Chrome. Stop recording and a share link
            is already on your clipboard.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href={getChromeStoreUrl()} target="_blank" rel="noreferrer">
                <Puzzle aria-hidden />
                Add to Chrome — it’s free
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </div>
        </section>

        <section aria-labelledby="features" className="pb-24">
          <h2 id="features" className="sr-only">
            Features
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardHeader>
                  <span className="bg-accent text-accent-foreground mb-2 flex size-10 items-center justify-center rounded-lg">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
