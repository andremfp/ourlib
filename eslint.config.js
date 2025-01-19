import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import prettier from "eslint-plugin-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,vue}"],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      prettier, // Use Prettier plugin correctly here
    },
    rules: {
      // ESLint rules here
      "import/no-unresolved": 0,
      "prettier/prettier": ["error"], // Enforce Prettier rules
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    plugins: {
      prettier, // Include Prettier plugin
    },
    rules: {
      "prettier/prettier": ["error"], // Enforce Prettier rules for Vue files
    },
  },
  // Adding recommended configurations directly
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/essential"],

  // Overrides for the `functions` folder to disable irrelevant rules
  {
    files: ["functions/**/*"],
    env: {
      node: true, // Make sure the functions use Node.js environment
      commonjs: true,
    },
    languageOptions: {
      globals: globals.node, // Use Node.js globals instead of browser
    },
    rules: {
      "prettier/prettier": "off", // Disable Prettier for functions, if needed
      "import/no-unresolved": "off", // Turn off import rule, if not needed in the functions folder
    },
  },
];
