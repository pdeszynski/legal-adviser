import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for frontend tests
 * Uses port 3000 for the Next.js dev server
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // Don't use webServer - assume server is already running
  // webServer: undefined,
});
