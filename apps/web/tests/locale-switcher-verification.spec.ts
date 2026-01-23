import { test, expect } from '@playwright/test';

/**
 * Locale Switcher Verification Test
 *
 * This test verifies that the language switcher correctly handles
 * locale changes without causing invalid route navigation.
 */

test.describe('Locale Switcher', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the root page
    await page.goto('/');
  });

  test('should display locale switcher on the page', async ({ page }) => {
    // The locale switcher should be present with Globe icon
    const globeIcon = page.locator('svg').filter({ hasText: '' }).first();
    await expect(page.locator('text=English')).toBeVisible();
  });

  test('should switch to Polish locale from root path', async ({ page }) => {
    // Click on the locale switcher to open dropdown
    const switcher = page.locator('text=English').first();
    await switcher.click();

    // Click on Polish option
    const polishOption = page.locator('text=Polski').first();
    await polishOption.click();

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');

    // Verify URL is /pl (or root with locale set in cookie)
    const url = page.url();
    expect(url).toMatch(/\/pl/);

    // Verify Polish flag is displayed in the switcher
    await expect(page.locator('text=Polski')).toBeVisible();
  });

  test('should switch to German locale from root path', async ({ page }) => {
    // Click on the locale switcher to open dropdown
    const switcher = page.locator('text=English').first();
    await switcher.click();

    // Click on German option
    const germanOption = page.locator('text=Deutsch').first();
    await germanOption.click();

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');

    // Verify URL is /de
    const url = page.url();
    expect(url).toMatch(/\/de/);

    // Verify German flag is displayed in the switcher
    await expect(page.locator('text=Deutsch')).toBeVisible();
  });

  test('should switch back to English from Polish', async ({ page }) => {
    // First switch to Polish
    await page.locator('text=English').first().click();
    await page.locator('text=Polski').first().click();
    await page.waitForLoadState('networkidle');

    // Now switch back to English
    await page.locator('text=Polski').first().click();
    await page.locator('text=English').first().click();
    await page.waitForLoadState('networkidle');

    // Verify URL doesn't have /pl or /de prefix
    const url = page.url();
    expect(url).not.toMatch(/\/(pl|de)(\/|$)/);

    // Verify English is displayed
    await expect(page.locator('text=English')).toBeVisible();
  });

  test('should preserve locale when navigating between pages', async ({ page }) => {
    // Switch to Polish
    await page.locator('text=English').first().click();
    await page.locator('text=Polski').first().click();
    await page.waitForLoadState('networkidle');

    // Verify we're on Polish locale
    let url = page.url();
    expect(url).toMatch(/\/pl/);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify locale is preserved
    url = page.url();
    expect(url).toMatch(/\/pl/);

    // Verify Polish is still displayed
    await expect(page.locator('text=Polski')).toBeVisible();
  });
});
