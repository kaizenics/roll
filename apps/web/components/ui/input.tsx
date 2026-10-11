import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "border-input shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm outline-none transition-colors focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
