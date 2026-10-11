import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

function appOrigin(): string {
  // WXT loads .env files after this module is evaluated, so read lazily.
  const url = process.env.WXT_APP_URL || "http://localhost:3000";
  return new URL(url).origin;
}

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  // Load `.output/chrome-mv3-dev` into your own Chrome profile instead (stable extension ID).
  webExt: { disabled: true },
  zip: { artifactTemplate: "roll-{{packageVersion}}-{{browser}}.zip" },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: () => ({
    name: "Roll — Screen & Camera Recorder",
    short_name: "Roll",
    description:
      "Record your screen, tab or window with mic and camera, and share a link instantly.",
    permissions: [
      "tabCapture",
      "offscreen",
      "storage",
      "activeTab",
      "scripting",
      "tabs",
      "clipboardWrite",
    ],
    // `<all_urls>` is added automatically by the runtime-registered content
    // scripts (camera bubble + controls), which must be re-injected after
    // navigations during a tab recording, when activeTab no longer applies.
    host_permissions: [`${appOrigin()}/*`],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'; base-uri 'none';",
    },
    // The camera bubble iframes this page so camera permission belongs to the
    // extension origin instead of every website.
    web_accessible_resources: [{ resources: ["camera-preview.html"], matches: ["<all_urls>"] }],
    action: { default_title: "Roll" },
  }),
});
