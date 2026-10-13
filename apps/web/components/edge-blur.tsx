import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * iOS-style progressive blur along a screen edge: content softens gradually as
 * it slides underneath. Purely decorative, never intercepts clicks.
 */
export function EdgeBlur({ edge, className }: { edge: "top" | "bottom"; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("edge-blur", `edge-blur-${edge}`, className)}
      style={{ "--edge": edge } as CSSProperties}
    >
      <div />
      <div />
      <div />
      <div />
    </div>
  );
}
