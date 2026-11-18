import type { ReactNode } from "react";

/** Label that rolls up on hover or focus, a red copy taking its place. Needs a `group` parent. */
export function RollText({ children }: { children: ReactNode }) {
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
