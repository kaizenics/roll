import globals from "globals";
import { config } from "@repo/eslint-config/react";

export default [
  ...config,
  {
    ignores: [".output/**", ".wxt/**"],
  },
  {
    files: ["scripts/**", "*.config.ts"],
    languageOptions: { globals: globals.node },
  },
];
