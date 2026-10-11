import pluginNext from "@next/eslint-plugin-next";
import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import { config as baseConfig } from "./base.js";

/**
 * ESLint configuration for the Next.js app.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const nextJsConfig = [
  ...baseConfig,
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    plugins: { "@next/next": pluginNext },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
    },
  },
  {
    plugins: { "react-hooks": pluginReactHooks },
    rules: pluginReactHooks.configs.recommended.rules,
  },
];
