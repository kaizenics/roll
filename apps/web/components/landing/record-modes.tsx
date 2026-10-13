"use client";

import { ArrowUpRight, Check, Globe, Puzzle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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

export function RecordModes({ chromeStoreUrl }: { chromeStoreUrl: string }) {
  const [mode, setMode] = useState<Mode>("browser");
  const active = MODES[mode];

  return (
    <div className="bg-card rounded-2xl border p-2">
      <div
        role="tablist"
        aria-label="Ways to record"
        className="bg-secondary grid grid-cols-2 gap-1 rounded-xl p-1"
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
              className={`focus-visible:ring-ring/30 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-[background-color,color,box-shadow] duration-200 focus-visible:ring-[3px] ${
                selected
                  ? "bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>

      <div
        id="mode-panel"
        role="tabpanel"
        aria-labelledby={`mode-${mode}`}
        key={mode}
        className="animate-in fade-in-0 slide-in-from-bottom-1 flex flex-col gap-6 p-5 duration-300 sm:p-7"
      >
        <p className="text-lg">{active.summary}</p>
        <ul className="flex flex-col gap-3">
          {active.points.map((point) => (
            <li key={point} className="flex gap-3">
              <span className="bg-tint-green text-tint-green-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                <Check className="size-3" aria-hidden />
              </span>
              <span className="text-muted-foreground">{point}</span>
            </li>
          ))}
        </ul>
        {mode === "browser" ? (
          <Button asChild className="self-start">
            <Link href="/record">
              <span aria-hidden className="bg-record size-2 rounded-full" />
              Record in your browser
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="self-start">
            <a href={chromeStoreUrl} target="_blank" rel="noreferrer">
              <Puzzle aria-hidden />
              Add to Chrome or Edge
              <ArrowUpRight aria-hidden />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
