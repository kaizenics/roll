import {
  ArrowUpRight,
  Code2,
  Eye,
  Film,
  Lock,
  MonitorPlay,
  PictureInPicture2,
  Puzzle,
  Scissors,
  ShieldCheck,
  Square,
  Unlink,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { BlurText } from "@/components/landing/blur-text";
import { HeroVisual } from "@/components/landing/hero-visual";
import { RecordModes } from "@/components/landing/record-modes";
import { EdgeBlur } from "@/components/edge-blur";
import { LogoMark } from "@/components/logo";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getChromeStoreUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: { absolute: "Roll: record your screen, share a link" },
  description:
    "Record your screen, camera and voice from the browser. Trim it, then share a private-by-default link or embed it anywhere.",
};

const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

const STEPS = [
  {
    verb: "Record",
    icon: MonitorPlay,
    body: "Pick your screen, a window or a tab. Add your microphone and a camera bubble.",
    meta: "3-2-1 countdown, then you're live",
  },
  {
    verb: "Stop",
    icon: Square,
    body: "Hit stop from the floating controls. The video uploads while you get back to work.",
    meta: "Ready to watch in seconds",
  },
  {
    verb: "Share",
    icon: ArrowUpRight,
    body: "Generate a link when you're ready, or embed it in your docs. Revoke it any time.",
    meta: "Viewers don't need an account",
  },
];

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
  className: string;
  detail?: ReactNode;
}

const Chip = ({ children }: { children: ReactNode }) => (
  <span className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 font-mono text-xs">
    {children}
  </span>
);

const FEATURES: Feature[] = [
  {
    icon: Video,
    title: "Your face, wherever you record",
    body: "A round camera bubble you can drag, resize or hide. In the browser it floats above every app, so it lands in the recording exactly where you put it.",
    className: "md:col-span-4",
    detail: (
      <div className="flex gap-2">
        <Chip>S</Chip>
        <Chip>M</Chip>
        <Chip>L</Chip>
        <Chip>Hide</Chip>
      </div>
    ),
  },
  {
    icon: Lock,
    title: "Private until you share",
    body: "Only you can watch a new recording. Generate a link when it's ready.",
    className: "md:col-span-2",
  },
  {
    icon: Scissors,
    title: "Trim on a timeline",
    body: "Drag the handles on a filmstrip, scrub with the playhead, or use I and O. The original stays safe until the cut is ready.",
    className: "md:col-span-3",
  },
  {
    icon: Code2,
    title: "Embed anywhere",
    body: "Copy an iframe for your docs, wiki or site. Revoking the link turns embeds off too.",
    className: "md:col-span-3",
  },
  {
    icon: PictureInPicture2,
    title: "Controls that follow you",
    body: "Pause, stop or discard from a small floating window while you work in other apps.",
    className: "md:col-span-2",
  },
  {
    icon: Film,
    title: "Streams like it should",
    body: "Adaptive streaming that adjusts to slow connections, an MP4 download, and rich previews when you paste the link into Slack or Discord.",
    className: "md:col-span-4",
    detail: (
      <div className="flex flex-wrap gap-2">
        <Chip>Adaptive streaming</Chip>
        <Chip>MP4 download</Chip>
        <Chip>Link previews</Chip>
      </div>
    ),
  },
];

const PRIVACY = [
  {
    icon: Lock,
    title: "Private by default",
    body: "New recordings are visible to you alone. Anyone else opening the link gets a not-found page.",
  },
  {
    icon: Unlink,
    title: "Revoke means revoke",
    body: "Revoking replaces the link entirely, so old links and embeds stop working for good.",
  },
  {
    icon: ShieldCheck,
    title: "Locked down at the database",
    body: "Row-level security means your account can only ever read and change your own videos.",
  },
  {
    icon: Eye,
    title: "Honest view counts",
    body: "One view per viewer session, and your own plays never count.",
  },
];

const QUESTIONS = [
  {
    q: "Do I need to install anything?",
    a: "No. Roll records right in Chrome, Edge or Firefox on desktop. The extension is optional and adds one-click tab recording.",
  },
  {
    q: "Do viewers need an account?",
    a: "No. Anyone with a shared link can watch, on any device. They can't rename, delete or download your video.",
  },
  {
    q: "How long can a recording be?",
    a: "Up to 30 minutes. Roll gives you a heads-up at 29:00 and stops on its own at the limit.",
  },
  {
    q: "What happens if the upload fails?",
    a: "You can retry right away. The extension also keeps the recording on disk until the upload goes through.",
  },
  {
    q: "Can I edit a recording?",
    a: "You can trim the start and end on a timeline. Roll keeps the original playable until the trimmed version is ready.",
  },
  {
    q: "Can I download my video?",
    a: "Yes. Once processing finishes, download it as an MP4 from the video page.",
  },
];

function SectionHeading({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <div className="mb-12 max-w-2xl">
      <p className="text-muted-foreground scroll-reveal mb-3 text-sm">{eyebrow}</p>
      <h2 id={id} className="font-serif text-4xl leading-[1.08] tracking-[-0.015em] sm:text-5xl">
        <BlurText text={title} />
      </h2>
    </div>
  );
}

export default function LandingPage() {
  const chromeStoreUrl = getChromeStoreUrl();

  return (
    <>
      <SiteHeader>
        <div className="mr-2 hidden items-center gap-1 md:flex">
          {[
            ["#how-it-works", "How it works"],
            ["#features", "Features"],
            ["#questions", "Questions"],
          ].map(([href, label]) => (
            <Button key={href} asChild variant="ghost" size="sm" className="text-muted-foreground">
              <a href={href}>{label}</a>
            </Button>
          ))}
        </div>
      </SiteHeader>

      <main id="main" className="overflow-x-clip">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-20 pt-14 sm:px-6 md:grid-cols-[1.05fr_1fr] md:pb-28 md:pt-20">
          <div className="flex flex-col gap-6">
            <p className="reveal text-muted-foreground text-sm">Async video for busy teams</p>
            <h1
              className="reveal font-serif text-5xl leading-[1.02] tracking-[-0.02em] sm:text-7xl"
              style={stagger(1)}
            >
              Say it with a video.
              <br />
              <span className="text-muted-foreground italic">Share it with a link.</span>
            </h1>
            <p className="reveal text-muted-foreground max-w-[50ch] text-lg" style={stagger(2)}>
              Record your screen, camera and voice straight from the browser. Trim it, then share a
              private-by-default link or embed it anywhere. No meeting required.
            </p>
            <div
              className="reveal flex flex-col gap-3 pt-1 sm:flex-row sm:items-center"
              style={stagger(3)}
            >
              <Button asChild size="lg">
                <Link href="/record">
                  <span aria-hidden className="bg-record size-2.5 rounded-full" />
                  Start recording
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <a href={chromeStoreUrl} target="_blank" rel="noreferrer">
                  <Puzzle aria-hidden />
                  Add to Chrome or Edge
                  <ArrowUpRight aria-hidden />
                </a>
              </Button>
            </div>
            <p className="reveal text-muted-foreground text-sm" style={stagger(4)}>
              No install needed. The extension is optional.
            </p>
          </div>
          <div className="reveal flex justify-center md:justify-end" style={stagger(2)}>
            <HeroVisual />
          </div>
        </section>

        {/* How it works: pinned heading beside a step list (not three equal cards). */}
        <section aria-labelledby="how-it-works" className="border-t">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 md:grid-cols-[1fr_1.35fr] md:gap-16 md:py-32">
            <div className="md:sticky md:top-28 md:self-start">
              <SectionHeading
                id="how-it-works"
                eyebrow="How it works"
                title="From idea to link in under a minute."
              />
              <p className="text-muted-foreground scroll-reveal -mt-6 max-w-[42ch]">
                No scheduling, no screen-share call. Record once, and people watch when it suits
                them.
              </p>
            </div>
            <ol className="flex flex-col">
              {STEPS.map(({ verb, icon: Icon, body, meta }) => (
                <li
                  key={verb}
                  className="scroll-reveal grid grid-cols-[3rem_1fr] gap-x-5 border-b py-9 first:pt-0 last:border-b-0"
                >
                  <span className="bg-secondary flex size-12 items-center justify-center rounded-xl">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div className="flex flex-col gap-3">
                    <h3 className="font-serif text-4xl leading-none sm:text-5xl">{verb}</h3>
                    <p className="text-muted-foreground max-w-[48ch] text-lg">{body}</p>
                    <p className="text-sm font-medium">{meta}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section aria-labelledby="features" className="bg-secondary/50 border-t">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32">
            <SectionHeading
              id="features"
              eyebrow="Features"
              title="Everything a quick video needs. Nothing it doesn't."
            />
            <div className="grid gap-4 md:grid-cols-6">
              {FEATURES.map(({ icon: Icon, title, body, className, detail }) => (
                <article
                  key={title}
                  className={`bg-card scroll-reveal flex flex-col gap-4 rounded-2xl border p-7 transition-shadow duration-300 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] ${className}`}
                >
                  <Icon className="size-6" strokeWidth={1.5} aria-hidden />
                  <h3 className="text-xl font-medium">{title}</h3>
                  <p className="text-muted-foreground max-w-[56ch]">{body}</p>
                  {detail && <div className="mt-auto pt-2">{detail}</div>}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Two ways to record */}
        <section aria-labelledby="modes" className="border-t">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 md:grid-cols-[1fr_1.15fr] md:items-center md:py-32">
            <div>
              <SectionHeading
                id="modes"
                eyebrow="Two ways to record"
                title="Start in the browser. Add the extension if you like."
              />
              <p className="text-muted-foreground scroll-reveal -mt-6 max-w-[48ch]">
                Both save to the same library, with the same links, editor and privacy. Pick
                whichever fits how you work.
              </p>
            </div>
            <div className="scroll-reveal">
              <RecordModes chromeStoreUrl={chromeStoreUrl} />
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section aria-labelledby="privacy" className="border-t">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 md:grid-cols-[1fr_1.4fr] md:py-32">
            <div>
              <p className="text-muted-foreground scroll-reveal mb-3 text-sm">Privacy</p>
              <h2
                id="privacy"
                className="font-serif text-4xl leading-[1.08] tracking-[-0.015em] sm:text-5xl"
              >
                <BlurText text="Your recordings stay yours." />
              </h2>
            </div>
            <ul className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
              {PRIVACY.map(({ icon: Icon, title, body }) => (
                <li key={title} className="scroll-reveal flex flex-col gap-2">
                  <span className="bg-secondary mb-1 flex size-10 items-center justify-center rounded-xl">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <h3 className="font-medium">{title}</h3>
                  <p className="text-muted-foreground">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Questions */}
        <section aria-labelledby="questions" className="border-t">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32">
            <SectionHeading id="questions" eyebrow="Questions" title="Good to know." />
            <dl className="grid gap-x-12 gap-y-10 md:grid-cols-2">
              {QUESTIONS.map(({ q, a }) => (
                <div key={q} className="scroll-reveal border-t pt-6">
                  <dt className="text-lg font-medium">{q}</dt>
                  <dd className="text-muted-foreground mt-2">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Final call to action */}
        <section className="border-t">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-24 sm:px-6 md:flex-row md:items-end md:justify-between md:py-32">
            <h2 className="max-w-xl font-serif text-5xl leading-[1.04] tracking-[-0.02em] sm:text-6xl">
              <BlurText text="Skip the meeting." />{" "}
              <span className="text-muted-foreground italic">
                <BlurText text="Send a Roll." offset={3} />
              </span>
            </h2>
            <Button asChild size="lg" className="scroll-reveal">
              <Link href="/record">
                <span aria-hidden className="bg-record size-2.5 rounded-full" />
                Record your first video
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="text-foreground flex items-center gap-2 font-medium">
            <LogoMark className="size-5" />
            Roll
          </span>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/record" className="hover:text-foreground transition-colors">
              Record
            </Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <a
              href={chromeStoreUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Extension
            </a>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign in
            </Link>
          </nav>
        </div>
      </footer>
      <EdgeBlur edge="bottom" className="fixed inset-x-0 bottom-0 z-30 h-16" />
    </>
  );
}
