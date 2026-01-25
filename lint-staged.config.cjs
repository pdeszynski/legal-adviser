const path = require('path');

module.exports = {
  // TypeScript and JavaScript files in backend
  'apps/backend/**/*.{js,jsx,ts,tsx}': [
    (filenames) =>
      `cd apps/backend && npx eslint --fix ${filenames
        .map((f) => path.basename(f))
        .join(' ')}`,
    'prettier --write', // Format with Prettier
  ],

  // TypeScript and JavaScript files in web
  'apps/web/**/*.{js,jsx,ts,tsx}': [
    (filenames) =>
      `cd apps/web && npx eslint --fix ${filenames
        .map((f) => path.basename(f))
        .join(' ')}`,
    'prettier --write', // Format with Prettier
  ],

  // TypeScript and JavaScript files in packages
  // Note: packages/shared-kernel doesn't have ESLint configured - Prettier only
  'packages/**/*.{js,jsx,ts,tsx}': [
    'prettier --write', // Format with Prettier
  ],

  // JSON files
  '*.{json,jsonc}': [
    'prettier --write',
  ],

  // Markdown files
  '*.md': [
    'prettier --write',
  ],

  // Python files - run on staged files only
  'apps/ai-engine/**/*.py': [
    (filenames) =>
      `cd apps/ai-engine && uv run ruff check --fix ${filenames.join(' ')}`, // Run Ruff with auto-fix on changed files
    (filenames) =>
      `cd apps/ai-engine && uv run ruff format ${filenames.join(' ')}`, // Format changed files
    (filenames) =>
      `cd apps/ai-engine && uv run mypy ${filenames.join(' ')}`, // Type check changed files with MyPy
  ],

  // === GraphQL files ===
  // Run codegen when GraphQL files change
  'apps/web/src/**/*.{gql,graphql}': [
    'cd apps/web && pnpm codegen', // Generate TypeScript types from GraphQL
  ],

  // === Type checking (runs once per affected app) ===
  // When any TS file in backend changes, typecheck the whole backend
  'apps/backend/**/*.{ts,tsx}': () => 'cd apps/backend && npx tsc --noEmit',

  // When any TS file in web changes, typecheck the whole web
  'apps/web/**/*.{ts,tsx}': () => 'cd apps/web && npx tsc --noEmit',

  // When any TS file in packages changes, typecheck all packages
  'packages/**/*.{ts,tsx}': () => 'pnpm typecheck --filter="./packages/*"',
};
