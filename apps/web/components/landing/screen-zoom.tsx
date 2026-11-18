"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

/**
 * Roll's mark at page scale: a small screen with its red camera bubble grows
 * until it fills the viewport, handing off to the white section below it.
 * For reduced motion, CSS shows it already full size with no pinning.
 */
export function ScreenZoom() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const scale = useTransform(scrollYProgress, [0, 0.85], [0.42, 1]);
  const radius = useTransform(scrollYProgress, [0, 0.85], [56, 0]);
  const bubbleScale = useTransform(scrollYProgress, [0, 0.6, 0.85], [1, 1.15, 0]);
  const copyY = useTransform(scrollYProgress, [0, 0.85], ["30%", "0%"]);
  const copyOpacity = useTransform(scrollYProgress, [0.15, 0.6], [0, 1]);

  return (
    <div ref={ref} aria-hidden className="relative h-[220vh] motion-reduce:h-auto">
      <div className="sticky top-0 flex h-dvh items-center justify-center overflow-hidden motion-reduce:static">
        <motion.div
          style={{ scale, borderRadius: radius }}
          className="motion-reduce:transform-none! motion-reduce:rounded-none! relative flex size-full items-center justify-center bg-[#f4f4f2] text-[#0b0b0b]"
        >
          <motion.p
            style={{ y: copyY, opacity: copyOpacity }}
            className="motion-reduce:transform-none! motion-reduce:opacity-100! px-6 text-center text-[16vw] font-bold uppercase leading-[0.85] tracking-[-0.065em] md:text-[clamp(3rem,11vw,12rem)]"
          >
            One take.
            <br />
            <span className="text-record">One link.</span>
          </motion.p>
          {/* The camera bubble, sitting on the screen's corner like the logo. */}
          <motion.span
            style={{ scale: bubbleScale }}
            className="bg-record absolute -bottom-[6vmin] -right-[6vmin] size-[22vmin] rounded-full border-[2.4vmin] border-[#0b0b0b] motion-reduce:hidden"
          />
        </motion.div>
      </div>
    </div>
  );
}
