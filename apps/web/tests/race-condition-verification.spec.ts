import { test, expect } from '@playwright/test';

/**
 * Verification test for race condition fixes
 *
 * This test verifies that:
 * 1. Login flow completes without null reference errors
 * 2. Navigation after login works smoothly without requiring page refresh
 * 3. User identity is properly loaded before components try to access it
 * 4. Loading states are properly shown during authentication
 */

test.describe('Navigation Race Condition Fixes', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out browser extension errors (like 1Password autofill)
        if (!text.includes('bootstrap-autofill') && !text.includes('chrome-extension')) {
          errors.push(text);
        }
      }
    });
    page.errors = errors;
  });

  test('should handle login flow without null reference errors', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Wait for page to be fully loaded
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Fill in login credentials
    await page.fill('input[type="email"]', 'admin@refine.dev');
    await page.fill('input[type="password"]', 'password');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation to complete - should go to /dashboard after login
    // The auth flow redirects to /documents first, then /dashboard
    await page.waitForURL(/\/(dashboard|documents)/, { timeout: 10000 });

    // Verify we're on an authenticated page
    expect(page.url()).toMatch(/\/(dashboard|documents)/);

    // Check that no JavaScript errors occurred (excluding browser extensions)
    expect(page.errors as string[]).toHaveLength(0);
  });

  test('should show loading state during login', async ({ page }) => {
    await page.goto('/login');

    // Fill in credentials
    await page.fill('input[type="email"]', 'admin@refine.dev');
    await page.fill('input[type="password"]', 'password');

    // Click login and immediately check for loading state
    await page.click('button[type="submit"]');

    // Verify loading indicator appears
    await expect(page.locator('.animate-spin')).toBeVisible({ timeout: 1000 });
  });

  test('should handle landing page redirect for authenticated users', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@refine.dev');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Now navigate to landing page
    await page.goto('/');

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 5000 });

    // Verify no errors occurred
    expect(page.errors as string[]).toHaveLength(0);
  });

  test('should load user identity before displaying in header', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@refine.dev');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for navigation to authenticated page
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Wait for header to be visible with user info
    await expect(page.locator('header')).toBeVisible();

    // The header should not show any broken user info
    // User name should either be displayed or hidden during loading, not showing "undefined" or "null"
    const headerText = await page.locator('header').textContent();
    expect(headerText).not.toContain('undefined');
    expect(headerText).not.toContain('null');
  });

  test('should handle multiple rapid navigation attempts', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@refine.dev');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for initial navigation
    await page.waitForURL(/\/(dashboard|documents)/, { timeout: 10000 });

    // Try rapid navigation between pages
    for (let i = 0; i < 3; i++) {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

      await page.goto('/documents');
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    }

    // Verify no errors occurred
    expect(page.errors as string[]).toHaveLength(0);
  });
});

// Extend the Page interface to include our errors tracking
declare module 'playwright' {
  interface Page {
    errors?: string[];
  }
}
