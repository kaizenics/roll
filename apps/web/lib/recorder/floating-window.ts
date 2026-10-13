"use client";

import { useCallback, useEffect, useState } from "react";

/** Document Picture-in-Picture (Chrome/Edge 116+); not yet in lib.dom.d.ts. */
interface DocumentPictureInPicture {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
  window: Window | null;
}

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPicture;
  }
}

function copyPageStyles(target: Window): void {
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const style = target.document.createElement("style");
      style.textContent = Array.from(sheet.cssRules, (rule) => rule.cssText).join("\n");
      target.document.head.append(style);
    } catch {
      // Cross-origin sheet: link it instead of reading its rules.
      if (sheet.href) {
        const link = target.document.createElement("link");
        link.rel = "stylesheet";
        link.href = sheet.href;
        target.document.head.append(link);
      }
    }
  }
  // Font variables and the dark-mode class live on <html>.
  target.document.documentElement.className = document.documentElement.className;
  target.document.body.className = "bg-background text-foreground font-sans antialiased m-0";
}

/**
 * An always-on-top window for recording controls that stays visible while
 * the user works in other apps. `open()` must run inside a user gesture.
 */
export function useFloatingWindow() {
  const [supported, setSupported] = useState(false);
  const [floating, setFloating] = useState<Window | null>(null);

  useEffect(() => setSupported(Boolean(window.documentPictureInPicture)), []);

  const open = useCallback(async (size: { width: number; height: number }) => {
    const api = window.documentPictureInPicture;
    if (!api) return null;
    try {
      const pip = api.window ?? (await api.requestWindow(size));
      pip.document.title = "Roll";
      copyPageStyles(pip);
      pip.addEventListener("pagehide", () => setFloating(null), { once: true });
      setFloating(pip);
      return pip;
    } catch {
      return null; // No user activation or blocked: the page offers a retry button.
    }
  }, []);

  const close = useCallback(() => {
    window.documentPictureInPicture?.window?.close();
    setFloating(null);
  }, []);

  return { supported, floating, open, close };
}
