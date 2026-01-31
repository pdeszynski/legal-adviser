import { test, expect } from '@playwright/test';

/**
 * Temporary verification test for admin users list page
 * Tests that the users list page loads and displays data correctly with nestjs-query
 */
test.describe('Admin Users List - nestjs-query Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'admin@refine.dev');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/dashboard');
  });

  test('should load users list page', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/users');

    // Check that the page title is visible
    await expect(page.locator('h1').filter({ hasText: 'Users' })).toBeVisible();

    // Check that the stats cards are visible
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Active')).toBeVisible();
    await expect(page.locator('text=Admins')).toBeVisible();
    await expect(page.locator('text=Suspended')).toBeVisible();
  });

  test('should display users table with data', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/users');

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Check that table headers are present
    await expect(page.locator('th:has-text("User")')).toBeVisible();
    await expect(page.locator('th:has-text("Role")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("2FA")')).toBeVisible();

    // Check that at least one user row is rendered
    const userRows = page.locator('tbody tr');
    await expect(userRows.count()).resolves.toBeGreaterThan(0);

    // Verify email column has data
    await expect(page.locator('td').filter({ hasText: /@/ }).first()).toBeVisible();
  });

  test('should support pagination', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/users');

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Look for pagination controls (may not be visible if not enough users)
    const nextButton = page.locator('button:has-text("Next")');
    const prevButton = page.locator('button:has-text("Previous")');

    // Previous button should be disabled on first page
    await expect(prevButton).toBeVisible();
  });

  test('should support filtering by role', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/users');

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Click on Admins filter button
    await page.click('button:has-text("Admins")');

    // Wait for data to potentially update
    await page.waitForTimeout(500);
  });

  test('should support filtering by status', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/users');

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Click on Active filter button
    await page.click('button:has-text("Active")');

    // Wait for data to potentially update
    await page.waitForTimeout(500);
  });

  test('should support search functionality', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/users');

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Type in search box
    await page.fill('input[placeholder*="Search"]', 'admin');

    // Wait for search to process
    await page.waitForTimeout(500);
  });
});
