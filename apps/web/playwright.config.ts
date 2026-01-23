import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for frontend tests
 * Uses port 3000 for the Next.js dev server
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*-verification.spec.ts',
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
  // Reuse existing server (running via Docker or pnpm dev)
  webServer: {
    command: 'echo "Using existing server"',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 30 * 1000,
  },
});
