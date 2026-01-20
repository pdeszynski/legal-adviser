import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for backend GraphQL API tests
 * Uses port 3333 to avoid conflicts with frontend on port 3000
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3333',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'PORT=3333 pnpm run start',
    url: 'http://localhost:3333/graphql',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
