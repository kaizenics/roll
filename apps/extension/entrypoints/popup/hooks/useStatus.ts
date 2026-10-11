import { useCallback, useEffect, useState } from "react";
import { browser } from "wxt/browser";
import { isMessage, sendToBackground, type StatusResponse } from "@/lib/messaging";

/** Live view of the background's recorder state, user and failed uploads. */
export function useStatus() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await sendToBackground({ target: "background", type: "GET_STATUS" });
    if (response.ok && response.status) {
      setStatus(response.status);
      setLoadError(null);
    } else if (!response.ok) {
      setLoadError(response.error);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const onMessage = (message: unknown) => {
      if (!isMessage(message) || message.target !== "ui" || message.type !== "STATE_CHANGED")
        return;
      const { state } = message;
      setStatus((current) => (current ? { ...current, state } : current));
      // Terminal states change the failed-uploads list.
      if (state.status === "done" || state.status === "error" || state.status === "idle") {
        void refresh();
      }
    };
    const onStorage = () => void refresh();

    browser.runtime.onMessage.addListener(onMessage);
    browser.storage.onChanged.addListener(onStorage);
    return () => {
      browser.runtime.onMessage.removeListener(onMessage);
      browser.storage.onChanged.removeListener(onStorage);
    };
  }, [refresh]);

  return { status, loadError, refresh };
}
