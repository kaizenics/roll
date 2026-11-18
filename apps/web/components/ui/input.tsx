import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "focus-visible:border-record aria-invalid:border-record flex h-11 w-full min-w-0 border-0 border-b-2 border-white/25 bg-transparent px-0 py-1 text-base outline-none transition-colors duration-300 placeholder:text-[#6b6b67] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
