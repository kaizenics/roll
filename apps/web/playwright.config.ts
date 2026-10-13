import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const MOCK_SUPABASE_PORT = 54329;
const baseURL = `http://localhost:${PORT}`;

// The app is built into a separate dist dir against a mock Supabase, so e2e
// runs never clobber the real `.next` build.
const env = {
  NEXT_DIST_DIR: ".next-e2e",
  NEXT_PUBLIC_APP_URL: baseURL,
  NEXT_PUBLIC_SUPABASE_URL: `http://localhost:${MOCK_SUPABASE_PORT}`,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "e2e-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "e2e-service-role-key",
  // Blank (not unset) so values in .env.local can never reach the real Mux API.
  MUX_TOKEN_ID: "",
  MUX_TOKEN_SECRET: "",
  MUX_WEBHOOK_SECRET: "",
  MOCK_SUPABASE_PORT: String(MOCK_SUPABASE_PORT),
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node e2e/mock-supabase.mjs",
      port: MOCK_SUPABASE_PORT,
      env,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm exec next build && pnpm exec next start --port ${PORT}`,
      url: baseURL,
      env,
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
