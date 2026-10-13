import Link from "next/link";

/** Roll mark: a screen with the camera bubble on its corner. Inherits text colour. */
export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <rect
        x="3"
        y="6"
        width="21"
        height="16"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <circle
        cx="23"
        cy="21"
        r="6"
        className="fill-record stroke-background"
        strokeWidth="3"
        paintOrder="stroke"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <Link
      href="/"
      className="focus-visible:ring-ring/50 flex items-center gap-2 rounded-md text-lg font-semibold tracking-tight outline-none focus-visible:ring-[3px]"
    >
      <LogoMark />
      Roll
    </Link>
  );
}
