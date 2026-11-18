import { ArrowUpRight, Eye, Lock, Puzzle, ShieldCheck, Unlink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/landing/faq";
import { FeatureList } from "@/components/landing/feature-list";
import { AgencyNav } from "@/components/landing/agency-nav";
import {
  Curtain,
  Enter,
  INTRO_DELAY,
  Magnetic,
  MaskLines,
  Parallax,
  Reveal,
  ScrollWords,
} from "@/components/landing/motion";
import { Process } from "@/components/landing/process";
import { RecordModes } from "@/components/landing/record-modes";
import { ScreenZoom } from "@/components/landing/screen-zoom";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { currentUserId } from "@/components/site-header";
import { getChromeStoreUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: { absolute: "Roll: record your screen, share a link" },
  description:
    "Record your screen, camera and voice from the browser. Trim it, then share a private-by-default link or embed it anywhere.",
};

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

const pill =
  "inline-flex h-14 items-center gap-2 rounded-full px-7 text-base font-medium outline-none transition-[background-color,color,transform] duration-300 focus-visible:ring-[3px] focus-visible:ring-white/40 active:scale-[0.98]";

const display = "font-bold uppercase tracking-[-0.065em]";

export default async function LandingPage() {
  const chromeStoreUrl = getChromeStoreUrl();
  const signedIn = Boolean(await currentUserId());

  return (
    <SmoothScroll>
      <div className="landing min-h-dvh">
        <Curtain />
        <div aria-hidden className="landing-grain" />

        <AgencyNav signedIn={signedIn} chromeStoreUrl={chromeStoreUrl} />

        <main id="main" className="overflow-x-clip">
          {/* Hero: two staggered lines of display type; the nav floats over it. */}
          <section className="relative flex min-h-dvh flex-col px-4 pb-12 pt-28 sm:px-8 md:pb-16 md:pt-32">
            <div className="relative flex flex-1 items-end pb-4 md:items-center md:pb-0">
              <h1
                className={`relative z-10 w-full text-[17vw] leading-[0.82] md:text-[clamp(3.25rem,14vw,15.5rem)] ${display}`}
              >
                <span className="sr-only">Record it. Send it.</span>
                <MaskLines
                  delay={INTRO_DELAY}
                  lines={[
                    "Record it.",
                    <span key="send" className="block text-right">
                      <span className="text-outline">Send</span> it
                      <span className="text-record">.</span>
                    </span>,
                  ]}
                />
              </h1>
            </div>

            <div className="relative z-20 mt-10 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
              <Enter delay={INTRO_DELAY + 0.45}>
                <p className="max-w-[34ch] text-lg leading-snug md:text-xl">
                  Record your screen, camera and voice from the browser. Share a link people watch
                  when it suits them.
                </p>
              </Enter>
              <Enter delay={INTRO_DELAY + 0.55} className="flex flex-wrap items-center gap-3">
                <Magnetic strength={0.25}>
                  <Link
                    href="/record"
                    className={`${pill} bg-record text-white hover:bg-white hover:text-black`}
                  >
                    Start recording
                    <ArrowUpRight className="size-5" aria-hidden />
                  </Link>
                </Magnetic>
                <a
                  href={chromeStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${pill} border border-white/25 hover:bg-white hover:text-black`}
                >
                  <Puzzle className="size-5" aria-hidden />
                  Add to Chrome or Edge
                </a>
              </Enter>
            </div>
          </section>

          <ScreenZoom />

          {/* The one flip to white: the pitch, lit word by word as you read. */}
          <section aria-label="Why Roll" className="landing-invert px-4 py-32 sm:px-8 md:py-48">
            <ScrollWords
              className="mx-auto max-w-6xl text-[clamp(2.1rem,5.2vw,5rem)] font-semibold leading-[1.02] tracking-[-0.045em]"
              text="Most updates don't need a meeting. Record your screen, camera and voice once, then send a link people can watch whenever it suits them."
            />
          </section>

          <Process />

          <section aria-labelledby="features" className="border-t py-24 md:py-36">
            <h2
              id="features"
              className={`mb-16 px-4 text-[clamp(2.6rem,7vw,7rem)] leading-[0.88] sm:px-8 md:mb-24 ${display}`}
            >
              <span className="sr-only">
                Everything a quick video needs. Nothing it doesn&apos;t.
              </span>
              <MaskLines
                inView
                lines={[
                  "Everything a",
                  "quick video needs.",
                  <span key="n" className="text-record">
                    Nothing it doesn&apos;t.
                  </span>,
                ]}
              />
            </h2>
            <FeatureList />
          </section>

          <section aria-labelledby="modes" className="bg-card border-t">
            <div className="px-4 py-24 sm:px-8 md:py-36">
              <h2
                id="modes"
                className={`text-[clamp(2.4rem,5.5vw,5.5rem)] leading-[0.9] ${display}`}
              >
                <span className="sr-only">
                  Start in the browser. Add the extension if you like.
                </span>
                <MaskLines
                  inView
                  lines={[
                    "Start in the browser.",
                    <span key="e" className="text-outline">
                      Extension optional.
                    </span>,
                  ]}
                />
              </h2>
              <Reveal className="mb-16 mt-8 max-w-[52ch] md:mb-20">
                <p className="text-muted-foreground text-lg">
                  Both save to the same library, with the same links, editor and privacy. Pick
                  whichever fits how you work.
                </p>
              </Reveal>
              <Reveal>
                <RecordModes chromeStoreUrl={chromeStoreUrl} />
              </Reveal>
            </div>
          </section>

          <section aria-labelledby="privacy" className="border-t">
            <div className="grid md:grid-cols-[1fr_1.2fr]">
              <div className="flex flex-col justify-between gap-16 border-b px-4 py-20 sm:px-8 md:sticky md:top-14 md:h-[calc(100dvh-3.5rem)] md:self-start md:border-b-0 md:border-r md:py-16">
                <h2
                  id="privacy"
                  className={`text-[clamp(2.6rem,6vw,6rem)] leading-[0.88] ${display}`}
                >
                  <span className="sr-only">Your recordings stay yours.</span>
                  <MaskLines
                    inView
                    lines={[
                      "Your",
                      "recordings",
                      <span key="y" className="text-record">
                        stay yours.
                      </span>,
                    ]}
                  />
                </h2>
                <Lock aria-hidden className="text-record size-24 md:size-32" strokeWidth={1} />
              </div>
              <ul>
                {PRIVACY.map(({ icon: Icon, title, body }, i) => (
                  <li key={title} className="border-b last:border-b-0">
                    <Reveal
                      delay={i * 0.05}
                      className="hover:bg-card flex min-h-[50dvh] flex-col justify-end gap-4 px-4 py-14 transition-colors duration-500 sm:px-8 md:px-12"
                    >
                      <Icon aria-hidden className="text-record mb-auto size-8" strokeWidth={1.5} />
                      <h3 className="text-[clamp(1.9rem,3.6vw,3.25rem)] font-bold leading-none tracking-[-0.04em]">
                        {title}
                      </h3>
                      <p className="text-muted-foreground max-w-[46ch] text-lg">{body}</p>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section aria-labelledby="questions" className="border-t px-4 py-24 sm:px-8 md:py-36">
            <div className="mx-auto max-w-4xl">
              <h2
                id="questions"
                className={`mb-14 text-[clamp(2.6rem,7vw,6.5rem)] leading-[0.88] ${display}`}
              >
                <span className="sr-only">Good to know.</span>
                <MaskLines inView lines={["Good to know."]} />
              </h2>
              <Faq />
            </div>
          </section>

          {/* Closing call to action: the round button is pulled toward the cursor. */}
          <section className="relative border-t px-4 py-28 sm:px-8 md:py-40">
            <h2 className={`text-[clamp(3.25rem,12vw,13rem)] leading-[0.82] ${display}`}>
              <span className="sr-only">Skip the meeting. Send a Roll.</span>
              <MaskLines
                inView
                lines={[
                  "Skip the",
                  <span key="m" className="text-outline">
                    meeting.
                  </span>,
                  <span key="s" className="text-record">
                    Send a Roll.
                  </span>,
                ]}
              />
            </h2>
            <div className="mt-14 md:absolute md:right-[7vw] md:top-[38%] md:mt-0">
              <Magnetic strength={0.4}>
                <Link
                  href="/record"
                  className="bg-record flex size-44 flex-col items-center justify-center gap-2 rounded-full text-center text-lg font-medium leading-tight text-white outline-none transition-[background-color,color,transform] duration-500 hover:scale-105 hover:bg-white hover:text-black focus-visible:ring-[3px] focus-visible:ring-white/50 md:size-60 md:text-xl"
                >
                  <ArrowUpRight className="size-7" aria-hidden />
                  Record your
                  <br />
                  first video
                </Link>
              </Magnetic>
            </div>
          </section>
        </main>

        <footer className="overflow-hidden border-t">
          <div className="text-muted-foreground flex flex-col gap-8 px-4 py-10 text-sm sm:px-8 md:flex-row md:items-start md:justify-between">
            <p className="text-foreground max-w-xs text-base">
              Async video messages. Record your screen, camera and voice, then share a link.
            </p>
            <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-2 sm:grid-cols-3">
              {(
                [
                  ["/record", "Record"],
                  ["/dashboard", "Dashboard"],
                  [chromeStoreUrl, "Extension"],
                  ["/login", "Sign in"],
                  ["/privacy", "Privacy"],
                  ["/terms", "Terms"],
                ] as const
              ).map(([href, label]) =>
                href.startsWith("/") ? (
                  <Link key={label} href={href} className="hover:text-record transition-colors">
                    {label}
                  </Link>
                ) : (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-record transition-colors"
                  >
                    {label}
                  </a>
                ),
              )}
            </nav>
          </div>
          <Parallax distance={140}>
            <p
              aria-hidden
              className="select-none whitespace-nowrap px-2 pb-[2vw] text-[50vw] font-bold leading-[0.74] tracking-[-0.08em]"
            >
              Roll<span className="text-record">.</span>
            </p>
          </Parallax>
        </footer>
      </div>
    </SmoothScroll>
  );
}
