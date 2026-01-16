/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["./index.js"],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    es2023: true,
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "react/jsx-key": "error",
  },
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "*.config.js",
    "*.config.mjs",
  ],
};
