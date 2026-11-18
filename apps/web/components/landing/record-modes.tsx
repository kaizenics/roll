"use client";

import { ArrowUpRight, Globe, Puzzle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { EASE } from "./motion";

const MODES = {
  browser: {
    label: "In the browser",
    icon: Globe,
    summary: "Nothing to install. Open Roll, press record, pick what to share.",
    points: [
      "Screen, a window or any tab through your browser's share picker",
      "Microphone mixed with tab or system audio",
      "Floating controls and camera that stay on top of other apps",
      "Works in Chrome, Edge and Firefox on desktop",
    ],
  },
  extension: {
    label: "With the extension",
    icon: Puzzle,
    summary: "Optional. One click from the toolbar, for people who record every day.",
    points: [
      "Record the current tab instantly, no picker",
      "Camera bubble and controls drawn right on the page",
      "Recordings are kept on disk until the upload succeeds",
      "Chrome and Edge",
    ],
  },
} as const;

type Mode = keyof typeof MODES;

const pill =
  "inline-flex h-12 items-center gap-2 rounded-full px-6 font-medium outline-none transition-[background-color,color,transform] duration-300 focus-visible:ring-[3px] focus-visible:ring-white/40 active:scale-[0.98]";

export function RecordModes({ chromeStoreUrl }: { chromeStoreUrl: string }) {
  const [mode, setMode] = useState<Mode>("browser");
  const active = MODES[mode];

  return (
    <div className="flex flex-col gap-10">
      <div
        role="tablist"
        aria-label="Ways to record"
        className="inline-flex self-start rounded-full border p-1"
      >
        {(Object.keys(MODES) as Mode[]).map((key) => {
          const { label, icon: Icon } = MODES[key];
          const selected = key === mode;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              id={`mode-${key}`}
              aria-selected={selected}
              aria-controls="mode-panel"
              onClick={() => setMode(key)}
              className={`relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium outline-none transition-colors duration-300 focus-visible:ring-[3px] focus-visible:ring-white/40 sm:px-5 ${
                selected ? "text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {selected && (
                <motion.span
                  layoutId="mode-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="bg-record absolute inset-0 rounded-full"
                />
              )}
              <Icon className="relative size-4" aria-hidden />
              <span className="relative">{label}</span>
            </button>
          );
        })}
      </div>

      <div id="mode-panel" role="tabpanel" aria-labelledby={`mode-${mode}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="grid gap-10 md:grid-cols-[1fr_1fr] md:gap-16"
          >
            <div className="flex flex-col items-start gap-8">
              <p className="text-3xl font-medium leading-tight tracking-tight md:text-4xl">
                {active.summary}
              </p>
              {mode === "browser" ? (
                <Link href="/record" className={`${pill} bg-white text-black hover:bg-white/85`}>
                  Record in your browser
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              ) : (
                <a
                  href={chromeStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${pill} border border-white/30 hover:bg-white hover:text-black`}
                >
                  <Puzzle className="size-4" aria-hidden />
                  Add to Chrome or Edge
                  <ArrowUpRight className="size-4" aria-hidden />
                </a>
              )}
            </div>
            <ul className="flex flex-col">
              {active.points.map((point) => (
                <li key={point} className="text-muted-foreground flex gap-4 border-t py-4 text-lg">
                  <span aria-hidden className="text-record font-bold">
                    +
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
