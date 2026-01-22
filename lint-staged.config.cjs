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

  // Python files
  'apps/ai-engine/**/*.py': [
    'cd apps/ai-engine && uv run ruff check --fix', // Run Ruff with auto-fix
    'cd apps/ai-engine && uv run ruff format', // Format with Ruff
  ],
};
