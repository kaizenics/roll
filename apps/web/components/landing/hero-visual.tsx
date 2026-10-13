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
    // Fills its container; the hero decides the size.
    <div className="relative size-full">
      <div className="relative size-full">
        {unsupported ? <StaticMark /> : <HeroScene onUnsupported={onUnsupported} />}
      </div>
    </div>
  );
}
