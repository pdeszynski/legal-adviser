import { test, expect } from '@playwright/test';

test('debug - check features page content', async ({ page }) => {
  await page.goto('http://localhost:3000/features');

  // Wait a bit for rendering
  await page.waitForTimeout(5000);

  // Take a screenshot
  await page.screenshot({ path: 'debug-features-page.png' });

  // Get all text on page
  const allText = await page.textContent('body');
  console.log('Page text length:', allText?.length);

  // Get all h1 elements
  const h1Count = await page.locator('h1').count();
  console.log('H1 count:', h1Count);

  // Get all h2 elements
  const h2Count = await page.locator('h2').count();
  console.log('H2 count:', h2Count);

  // List all h1 texts
  for (let i = 0; i < h1Count; i++) {
    const text = await page.locator('h1').nth(i).textContent();
    console.log('H1', i, ':', text);
  }

  // List all h2 texts
  for (let i = 0; i < h2Count; i++) {
    const text = await page.locator('h2').nth(i).textContent();
    console.log('H2', i, ':', text);
  }

  // Check for any button elements
  const buttonCount = await page.locator('button').count();
  console.log('Button count:', buttonCount);
});
