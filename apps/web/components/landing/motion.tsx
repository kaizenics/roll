"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef, type ReactNode } from "react";

/** Slow-in, hard-out: the "expo" curve agency sites lean on. */
export const EASE = [0.16, 1, 0.3, 1] as const;
const CURTAIN_EASE = [0.76, 0, 0.24, 1] as const;
/** Hero choreography starts as the curtain clears. */
export const INTRO_DELAY = 0.85;

/** Red curtain that lifts off the page on load. Hidden entirely for reduced motion. */
export function Curtain() {
  return (
    <motion.div
      aria-hidden
      className="bg-record pointer-events-none fixed inset-0 z-[60] flex items-end p-6 motion-reduce:hidden"
      initial={{ y: "0%" }}
      animate={{ y: "-100%" }}
      transition={{ duration: 0.9, delay: 0.35, ease: CURTAIN_EASE }}
    >
      <motion.span
        className="text-[clamp(3rem,12vw,10rem)] font-bold uppercase leading-none tracking-[-0.06em] text-white"
        initial={{ y: 0 }}
        animate={{ y: -80, opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: CURTAIN_EASE }}
      >
        Roll
      </motion.span>
    </motion.div>
  );
}

/** Each line slides up from behind a mask. Screen readers get the plain text. */
export function MaskLines({
  lines,
  className,
  lineClassName,
  delay = 0,
  inView = false,
}: {
  lines: ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  /** Play when scrolled into view instead of on load. */
  inView?: boolean;
}) {
  const reduce = useReducedMotion();
  // The wrapper is what gets observed: the lines start clipped out of view, so
  // an observer on them would never see an intersection.
  return (
    <motion.span
      aria-hidden
      className={`block ${className ?? ""}`}
      initial={reduce ? false : "hidden"}
      {...(inView
        ? { whileInView: "shown", viewport: { once: true, amount: 0.4 } }
        : { animate: "shown" })}
    >
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.06em]">
          <motion.span
            className={`block ${lineClassName ?? ""}`}
            variants={{
              hidden: { y: "110%" },
              shown: {
                y: "0%",
                transition: { duration: 1.1, delay: delay + i * 0.09, ease: EASE },
              },
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 40,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Same as Reveal but plays on load, for hero content. */
export function Enter({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Pulls its child toward the pointer, then springs back. */
export function Magnetic({
  children,
  strength = 0.35,
}: {
  children: ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useSpring(0, { stiffness: 180, damping: 14, mass: 0.4 });
  const y = useSpring(0, { stiffness: 180, damping: 14, mass: 0.4 });

  return (
    <motion.div
      ref={ref}
      className="inline-block"
      style={{ x, y }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

function Word({
  children,
  progress,
  range,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return <motion.span style={{ opacity }}>{children} </motion.span>;
}

/** Words light up one by one as the paragraph scrolls through the viewport. */
export function ScrollWords({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = text.split(" ");

  return (
    <p ref={ref} className={className}>
      {reduce ? (
        text
      ) : (
        <>
          <span className="sr-only">{text}</span>
          <span aria-hidden>
            {words.map((word, i) => (
              <Word
                key={i}
                progress={scrollYProgress}
                range={[i / words.length, (i + 1) / words.length]}
              >
                {word}
              </Word>
            ))}
          </span>
        </>
      )}
    </p>
  );
}

/** Moves its child vertically at a different rate than the scroll. */
export function Parallax({
  children,
  className,
  distance = 120,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const y = useTransform(scrollYProgress, [0, 1], [distance, 0]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}
