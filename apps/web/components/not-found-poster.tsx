import Link from "next/link";
import type { ReactNode } from "react";
import { Enter, MaskLines } from "@/components/landing/motion";
import { LogoMark } from "@/components/logo";

/** Shared 404 layout: a giant hollow 404 behind a display heading. */
export function NotFoundPoster({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main id="main" className="relative flex min-h-dvh flex-col overflow-hidden px-4 py-6 sm:px-8">
      <Link
        href="/"
        className="flex items-center gap-2.5 self-start text-xl font-bold tracking-[-0.04em] outline-none focus-visible:underline"
      >
        <LogoMark className="size-8" />
        Roll
      </Link>
      <p
        aria-hidden
        className="text-outline pointer-events-none absolute inset-x-0 bottom-[-0.12em] select-none text-center text-[clamp(10rem,42vw,40rem)] font-bold leading-none tracking-[-0.08em] [--foreground:#e3181f]"
      >
        404
      </p>
      <div className="relative flex flex-1 flex-col justify-center gap-6 py-16">
        <h1 className="text-[clamp(3rem,9vw,8rem)] font-bold uppercase leading-[0.85] tracking-[-0.065em]">
          <span className="sr-only">{title}</span>
          <MaskLines lines={title.split(" ")} />
        </h1>
        <Enter delay={0.35} className="flex flex-col items-start gap-8">
          {description && (
            <p className="text-muted-foreground max-w-[42ch] text-lg">{description}</p>
          )}
          {children}
        </Enter>
      </div>
    </main>
  );
}
