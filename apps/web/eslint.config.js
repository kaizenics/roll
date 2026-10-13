import { nextJsConfig } from "@repo/eslint-config/next-js";

export default [
  ...nextJsConfig,
  {
    ignores: [
      ".next-*/**",
      "playwright-report/**",
      "test-results/**",
      "lib/supabase/database.types.ts",
    ],
  },
];
