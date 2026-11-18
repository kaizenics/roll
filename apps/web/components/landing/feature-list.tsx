"use client";

import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { EASE } from "./motion";

const FEATURES = [
  {
    title: "Camera bubble",
    body: "A round camera bubble you can drag, resize or hide. It floats above every app, so it lands in the recording exactly where you put it.",
    tags: ["S", "M", "L", "Hide"],
  },
  {
    title: "Private first",
    body: "Only you can watch a new recording. Generate a link when it's ready.",
  },
  {
    title: "Timeline trim",
    body: "Drag the handles on a filmstrip, scrub with the playhead, or use I and O. The original stays safe until the cut is ready.",
  },
  {
    title: "Embed anywhere",
    body: "Copy an iframe for your docs, wiki or site. Revoking the link turns embeds off too.",
  },
  {
    title: "Floating controls",
    body: "Pause, stop or discard from a small floating window while you work in other apps.",
  },
  {
    title: "Streams properly",
    body: "Adaptive streaming for slow connections, an MP4 download, and rich previews when you paste the link into Slack or Discord.",
    tags: ["Adaptive streaming", "MP4 download", "Link previews"],
  },
];

/** Agency-style index: each row floods red from the bottom on hover. */
export function FeatureList() {
  const reduce = useReducedMotion();

  return (
    <ul className="border-b">
      {FEATURES.map(({ title, body, tags }, i) => (
        <motion.li
          key={title}
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, delay: (i % 2) * 0.06, ease: EASE }}
          className="group relative overflow-hidden border-t"
        >
          <motion.div
            initial="rest"
            animate="rest"
            whileHover="hover"
            className="relative grid gap-4 px-4 py-8 sm:px-8 md:grid-cols-[1.25fr_1fr_auto] md:items-center md:gap-10 md:py-10"
          >
            <motion.span
              aria-hidden
              variants={{ rest: { scaleY: 0 }, hover: { scaleY: 1 } }}
              transition={{ duration: 0.55, ease: EASE }}
              className="bg-record absolute inset-0 origin-bottom"
            />
            <motion.h3
              variants={{ rest: { x: 0 }, hover: { x: reduce ? 0 : 24 } }}
              transition={{ duration: 0.55, ease: EASE }}
              className="relative text-[clamp(2.25rem,4.6vw,4.5rem)] font-bold uppercase leading-[0.9] tracking-[-0.05em]"
            >
              {title}
            </motion.h3>
            <div className="relative flex flex-col gap-3">
              <p className="text-muted-foreground max-w-[48ch] transition-colors duration-300 group-hover:text-white">
                {body}
              </p>
              {tags && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border px-3 py-1 font-mono text-xs transition-colors duration-300 group-hover:border-white/50 group-hover:text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <motion.span
              aria-hidden
              variants={{ rest: { rotate: 0 }, hover: { rotate: 45 } }}
              transition={{ duration: 0.55, ease: EASE }}
              className="relative hidden size-14 items-center justify-center rounded-full border transition-colors duration-300 group-hover:border-white group-hover:bg-white group-hover:text-black md:flex"
            >
              <ArrowUpRight className="size-6" strokeWidth={1.5} />
            </motion.span>
          </motion.div>
        </motion.li>
      ))}
    </ul>
  );
}
