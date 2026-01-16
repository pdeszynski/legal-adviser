/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["./index.js", "next/core-web-vitals"],
  env: {
    browser: true,
    node: true,
    es2023: true,
  },
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "react/jsx-key": "error",
    "react-hooks/exhaustive-deps": "warn",
  },
  ignorePatterns: [
    "node_modules/",
    ".next/",
    "out/",
    "public/",
    "*.config.js",
    "*.config.mjs",
  ],
};
