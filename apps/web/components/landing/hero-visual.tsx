"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { LogoMark } from "@/components/logo";

function StaticMark() {
  return (
    <div className="flex size-full items-center justify-center">
      <LogoMark className="size-40 opacity-90" />
    </div>
  );
}

// three.js loads after first paint and never on the server.
const HeroScene = dynamic(() => import("./hero-scene").then((m) => m.HeroScene), {
  ssr: false,
  loading: () => null,
});

export function HeroVisual() {
  const [unsupported, setUnsupported] = useState(false);
  const onUnsupported = useCallback(() => setUnsupported(true), []);

  return (
    <div className="relative aspect-square w-full max-w-[560px] md:aspect-[5/4]">
      {/* Ambient glow behind the mark. */}
      <div
        aria-hidden
        className="bg-record/10 dark:bg-record/15 absolute inset-[18%] rounded-full blur-3xl"
      />
      <div className="relative size-full">
        {unsupported ? <StaticMark /> : <HeroScene onUnsupported={onUnsupported} />}
      </div>
    </div>
  );
}
