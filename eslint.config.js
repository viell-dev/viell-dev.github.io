// @ts-check

import js from "@eslint/js";
import ts from "typescript-eslint";

const config = ts.config(
  js.configs.recommended,
  ...ts.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: [
      ".yarn/*",
      ".pnp.*",
      ".vscode/*",
      "!.vscode/settings.json",
      "!.vscode/tasks.json",
      "!.vscode/launch.json",
      "!.vscode/extensions.json",
      "!.vscode/*.code-snippets",
      ".cache",
      ".vitepress/cache",
      ".vitepress/dist",
    ],
  },
);

export default config;
