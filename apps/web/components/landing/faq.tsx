"use client";

import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { EASE } from "./motion";

const QUESTIONS = [
  {
    q: "Do I need to install anything?",
    a: "No. Roll records right in Chrome, Edge or Firefox on desktop. The extension is optional and adds one-click tab recording.",
  },
  {
    q: "Do viewers need an account?",
    a: "No. Anyone with a shared link can watch, on any device. They can't rename, delete or download your video.",
  },
  {
    q: "How long can a recording be?",
    a: "Up to 30 minutes. Roll gives you a heads-up at 29:00 and stops on its own at the limit.",
  },
  {
    q: "What happens if the upload fails?",
    a: "You can retry right away. The extension also keeps the recording on disk until the upload goes through.",
  },
  {
    q: "Can I edit a recording?",
    a: "You can trim the start and end on a timeline. Roll keeps the original playable until the trimmed version is ready.",
  },
  {
    q: "Can I download my video?",
    a: "Yes. Once processing finishes, download it as an MP4 from the video page.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const id = useId();

  return (
    <ul className="border-b">
      {QUESTIONS.map(({ q, a }, i) => {
        const expanded = open === i;
        return (
          <li key={q} className="border-t">
            <h3>
              <button
                type="button"
                id={`${id}-q${i}`}
                aria-expanded={expanded}
                aria-controls={`${id}-a${i}`}
                onClick={() => setOpen(expanded ? null : i)}
                className="hover:text-record focus-visible:text-record flex w-full items-center justify-between gap-6 py-6 text-left text-xl font-medium outline-none transition-colors duration-200 md:text-2xl"
              >
                {q}
                <motion.span
                  aria-hidden
                  animate={{ rotate: expanded ? 45 : 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                    expanded ? "bg-record border-record text-white" : ""
                  }`}
                >
                  <Plus className="size-5" strokeWidth={1.5} />
                </motion.span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  id={`${id}-a${i}`}
                  role="region"
                  aria-labelledby={`${id}-q${i}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="overflow-hidden"
                >
                  <p className="text-muted-foreground max-w-[60ch] pb-7 text-lg">{a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
