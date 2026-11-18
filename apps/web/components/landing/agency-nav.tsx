"use client";

import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useLenis } from "lenis/react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { LogoMark } from "@/components/logo";
import { EASE, INTRO_DELAY } from "./motion";

const LINKS = [
  ["#how-it-works", "How it works"],
  ["#features", "Features"],
  ["#questions", "Questions"],
] as const;

/** Label that rolls up on hover, a red copy taking its place. */
function RollText({ children }: { children: ReactNode }) {
  return (
    <span className="relative block overflow-hidden">
      <span className="ease-out-soft block transition-transform duration-500 group-hover:-translate-y-full group-focus-visible:-translate-y-full">
        {children}
      </span>
      <span
        aria-hidden
        className="text-record ease-out-soft absolute inset-0 block translate-y-full transition-transform duration-500 group-hover:translate-y-0 group-focus-visible:translate-y-0"
      >
        {children}
      </span>
    </span>
  );
}

export function AgencyNav({
  signedIn,
  chromeStoreUrl,
}: {
  signedIn: boolean;
  chromeStoreUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const lenis = useLenis();

  // Slide away while reading down, come back as soon as the reader scrolls up.
  useMotionValueEvent(scrollY, "change", (y) => {
    setHidden(y > (scrollY.getPrevious() ?? 0) && y > 200);
    setScrolled(y > 40);
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    lenis?.stop();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      lenis?.start();
    };
  }, [open, lenis]);

  const account: [string, string] = signedIn ? ["/dashboard", "Dashboard"] : ["/login", "Sign in"];
  const close = () => setOpen(false);

  return (
    <>
      <motion.header
        initial={{ y: "-100%" }}
        animate={{ y: hidden && !open ? "-100%" : "0%" }}
        transition={{ duration: 0.6, ease: EASE, delay: scrolled ? 0 : INTRO_DELAY }}
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500 ${
          scrolled && !open
            ? "border-b border-white/10 bg-[#0b0b0b]/80 backdrop-blur-xl"
            : "border-b border-transparent"
        }`}
      >
        <nav
          aria-label="Main"
          className="flex h-16 items-center justify-between gap-6 px-4 sm:px-8 md:h-20"
        >
          <Link
            href="/"
            onClick={close}
            className="group flex items-center gap-2.5 text-xl font-bold tracking-[-0.04em] outline-none"
          >
            <LogoMark className="ease-out-soft size-8 transition-transform duration-500 group-hover:rotate-[-8deg]" />
            Roll
          </Link>

          <ul className="hidden items-center gap-10 text-sm font-medium uppercase tracking-[0.12em] md:flex">
            {LINKS.map(([href, label]) => (
              <li key={href}>
                <a href={href} className="group block outline-none">
                  <RollText>{label}</RollText>
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 sm:gap-6">
            <Link
              href={account[0]}
              className="group hidden text-sm font-medium uppercase tracking-[0.12em] outline-none md:block"
            >
              <RollText>{account[1]}</RollText>
            </Link>
            <Link
              href="/record"
              className="bg-record group hidden h-11 items-center gap-2 overflow-hidden rounded-full pl-5 pr-2 text-sm font-medium text-white outline-none transition-colors duration-300 hover:bg-white hover:text-black focus-visible:ring-[3px] focus-visible:ring-white/40 sm:inline-flex"
            >
              <RollText>Record now</RollText>
              <span className="ease-out-soft flex size-7 items-center justify-center rounded-full bg-white text-black transition-transform duration-500 group-hover:rotate-45 group-hover:bg-black group-hover:text-white">
                <ArrowUpRight className="size-4" aria-hidden />
              </span>
            </Link>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((v) => !v)}
              className={`flex h-11 items-center gap-3 rounded-full border px-4 text-sm font-medium uppercase tracking-[0.12em] outline-none transition-colors duration-300 focus-visible:ring-[3px] focus-visible:ring-white/40 md:hidden ${
                open ? "border-black bg-black text-white" : "border-white/25"
              }`}
            >
              {open ? "Close" : "Menu"}
              <span aria-hidden className="relative block h-2.5 w-4">
                <motion.span
                  animate={open ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="absolute left-0 top-0 h-[1.5px] w-full bg-current"
                />
                <motion.span
                  animate={open ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="absolute bottom-0 left-0 h-[1.5px] w-full bg-current"
                />
              </span>
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="site-menu"
            initial={{ clipPath: "circle(0% at 100% 0%)" }}
            animate={{ clipPath: "circle(150% at 100% 0%)" }}
            exit={{ clipPath: "circle(0% at 100% 0%)" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="bg-record fixed inset-0 z-40 flex flex-col justify-between overflow-y-auto px-4 pb-8 pt-28 text-black sm:px-8"
          >
            <ul className="flex flex-col gap-1">
              {[...LINKS, ["/record", "Record"], account].map(([href, label], i) => (
                <li key={label} className="overflow-hidden">
                  <motion.div
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    exit={{ y: "110%", transition: { duration: 0.3 } }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.06, ease: EASE }}
                  >
                    {href.startsWith("#") ? (
                      <a
                        href={href}
                        onClick={close}
                        className="block text-[clamp(3rem,13vw,6rem)] font-bold uppercase leading-[0.95] tracking-[-0.06em] hover:text-white"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        href={href}
                        onClick={close}
                        className="block text-[clamp(3rem,13vw,6rem)] font-bold uppercase leading-[0.95] tracking-[-0.06em] hover:text-white"
                      >
                        {label}
                      </Link>
                    )}
                  </motion.div>
                </li>
              ))}
            </ul>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.6 } }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-black/25 pt-6 text-sm font-medium"
            >
              <a
                href={chromeStoreUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                Add to Chrome or Edge
              </a>
              {signedIn && (
                <form action="/auth/signout" method="post">
                  <button type="submit" className="hover:text-white">
                    Sign out
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
