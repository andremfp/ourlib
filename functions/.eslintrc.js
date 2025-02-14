module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    commonjs: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json"],
    sourceType: "module",
    ecmaVersion: 2020,
  },
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    "@typescript-eslint/no-unused-expressions": [
      "error",
      {
        allowShortCircuit: true,
        allowTernary: true,
      },
    ],
    "prettier/prettier": ["error"],
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore the compiled JavaScript in the lib folder
    "/*.js", // Ignore JavaScript files in the root (like .eslintrc.js)
  ],
};
