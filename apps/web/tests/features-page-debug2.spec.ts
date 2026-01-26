import { test, expect } from '@playwright/test';

test('debug - check console errors', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    console.log('Page error:', error.message);
    consoleErrors.push(error.message);
  });

  await page.goto('http://localhost:3000/features');

  // Wait a bit for rendering
  await page.waitForTimeout(5000);

  console.log('Console errors:', consoleErrors);

  // Take a screenshot
  await page.screenshot({ path: 'debug-features-page2.png' });
});
