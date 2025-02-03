import globals from "globals";
import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import pluginVue from "eslint-plugin-vue";
import prettier from "eslint-plugin-prettier";
import vueParser from "vue-eslint-parser";

/** @type {import('eslint').Linter.FlatConfig[]} */
// @ts-expect-error: FlatConfig is still supported despite deprecation
export default [
  js.configs.recommended, // ESLint's built-in recommended rules
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: globals.browser, // ✅ Fixes `window`, `fetch`, `setTimeout`, etc.
    },
    plugins: {
      prettier,
    },
    rules: {
      "prettier/prettier": ["error"],
      "import/no-unresolved": "off",
    },
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser, // Use TypeScript parser inside Vue files
        ecmaVersion: "latest",
        sourceType: "module",
        extraFileExtensions: [".vue"],
      },
      globals: globals.browser,
    },
    plugins: {
      prettier,
      vue: pluginVue,
    },
    rules: {
      ...pluginVue.configs["flat/essential"].rules,
      "prettier/prettier": ["error", { trailingComma: "all" }],
    },
  },
  {
    files: ["functions/**/*"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "prettier/prettier": "off",
    },
  },
];
