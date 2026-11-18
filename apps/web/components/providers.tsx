"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    // One art direction (black / white / red) everywhere; "dark" keeps the dark
    // status tints and dark: utilities in effect.
    <ThemeProvider attribute="class" forcedTheme="dark" disableTransitionOnChange>
      {children}
      <Toaster richColors closeButton position="bottom-right" />
    </ThemeProvider>
  );
}
