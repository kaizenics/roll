"use client";

import "lenis/dist/lenis.css";
import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Lenis smooth scrolling for the landing page. It drives native scroll, so
 * Motion's useScroll keeps working. `anchors` makes the #section links glide too.
 * Skipped for reduced motion.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <>
      <ReactLenis root options={{ lerp: 0.09, anchors: { offset: -96 } }} />
      {children}
    </>
  );
}
