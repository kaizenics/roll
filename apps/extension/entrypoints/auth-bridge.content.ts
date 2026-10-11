import {
  AUTH_BRIDGE_SOURCE_EXTENSION,
  authBridgeWebMessageSchema,
  EXTENSION_CONNECT_PATH,
} from "@roll/shared";
import { defineContentScript } from "wxt/utils/define-content-script";
import { APP_ORIGIN } from "@/lib/env";
import { sendToBackground } from "@/lib/messaging";

/**
 * Runs only on <app>/extension/connect. Receives the Supabase session the page
 * posts via window.postMessage and hands it to the background.
 */
export default defineContentScript({
  matches: [`${APP_ORIGIN}${EXTENSION_CONNECT_PATH}*`],
  runAt: "document_start",
  main() {
    let delivered = false;

    window.addEventListener("message", async (event: MessageEvent<unknown>) => {
      // Only accept messages the page posted to itself, from the configured app origin.
      if (event.source !== window || event.origin !== APP_ORIGIN) return;
      const parsed = authBridgeWebMessageSchema.safeParse(event.data);
      if (!parsed.success || delivered) return;

      delivered = true;
      const response = await sendToBackground({
        target: "background",
        type: "AUTH_SESSION",
        session: parsed.data.session,
      });
      if (!response.ok) {
        delivered = false;
        return;
      }
      window.postMessage(
        { source: AUTH_BRIDGE_SOURCE_EXTENSION, type: "session-received" },
        APP_ORIGIN,
      );
    });
  },
});
