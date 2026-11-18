"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";

const STEPS = [
  {
    verb: "Record",
    body: "Pick your screen, a window or a tab. Add your microphone and a camera bubble.",
    meta: "3-2-1 countdown, then you're live",
  },
  {
    verb: "Stop",
    body: "Hit stop from the floating controls. The video uploads while you get back to work.",
    meta: "Ready to watch in seconds",
  },
  {
    verb: "Share",
    body: "Generate a link when you're ready, or embed it in your docs. Revoke it any time.",
    meta: "Viewers don't need an account",
  },
];

/**
 * Vertical scroll pans three full-screen steps sideways (md+). On phones, and
 * for reduced motion, it is a plain vertical list.
 */
export function Process() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", `-${((STEPS.length - 1) / STEPS.length) * 100}%`],
  );
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <section
      ref={ref}
      aria-labelledby="how-it-works"
      className="relative border-t motion-safe:md:h-[300vh]"
    >
      <div className="motion-safe:md:sticky motion-safe:md:top-0 motion-safe:md:flex motion-safe:md:h-dvh motion-safe:md:flex-col motion-safe:md:overflow-hidden">
        <div className="flex items-baseline justify-between px-4 pt-20 sm:px-8 md:pt-24">
          <h2
            id="how-it-works"
            className="text-muted-foreground text-sm font-medium uppercase tracking-[0.2em]"
          >
            How it works
          </h2>
          <p className="text-muted-foreground hidden text-sm md:block">
            From idea to link in under a minute
          </p>
        </div>

        <motion.ol
          style={{ x }}
          className="max-md:transform-none! motion-reduce:transform-none! flex flex-col motion-safe:md:w-[300%] motion-safe:md:flex-1 motion-safe:md:flex-row"
        >
          {STEPS.map(({ verb, body, meta }) => (
            <li
              key={verb}
              className="flex flex-col justify-end gap-8 border-b px-4 py-14 last:border-b-0 sm:px-8 md:grid md:grid-cols-[1.4fr_1fr] md:content-center md:items-end md:gap-16 motion-safe:md:w-1/3 motion-safe:md:shrink-0 motion-safe:md:border-b-0"
            >
              <h3 className="text-[clamp(4.5rem,14vw,16rem)] font-bold uppercase leading-[0.8] tracking-[-0.07em]">
                {verb}
                <span className="text-record">.</span>
              </h3>
              <div className="flex max-w-md flex-col gap-4 md:pb-4">
                <p className="text-xl leading-snug md:text-2xl">{body}</p>
                <p className="text-muted-foreground">{meta}</p>
              </div>
            </li>
          ))}
        </motion.ol>

        <div className="bg-border mx-4 mb-8 hidden h-px sm:mx-8 motion-safe:md:block">
          <motion.div style={{ scaleX: progress }} className="bg-record h-px origin-left" />
        </div>
      </div>
    </section>
  );
}
