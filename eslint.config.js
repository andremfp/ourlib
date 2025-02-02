const globals = require("globals");
const pluginJs = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const pluginVue = require("eslint-plugin-vue");
const prettier = require("eslint-plugin-prettier");

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: globals.browser,
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
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules, // Use rules from the recommended config
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: tsParser,
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
