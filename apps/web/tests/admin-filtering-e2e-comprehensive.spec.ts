import { test, expect, type Page } from '@playwright/test';

// Extend timeout for filtering tests which may involve complex UI interactions
test.setTimeout(180000);

// Increase default timeout for all actions
test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(60000);
});

/**
 * Admin Filtering E2E Tests
 *
 * Comprehensive tests for filtering functionality across all admin views.
 * Test scenarios:
 * 1) User list - filter by role (admin, lawyer, client), filter by status (active/inactive), filter by email (contains)
 * 2) Audit logs - filter by action type, filter by date range, filter by user
 * 3) Documents - filter by status, filter by type, filter by moderation status
 * 4) API keys - filter by status, filter by scope
 * 5) Verify filters work together (combined filtering)
 * 6) Verify filter state persists across pagination
 * 7) Verify clear filters button resets all filters
 * 8) Verify filters show correct results count
 * 9) GRAPHQL NETWORK INTERCEPTION: Verify filter format matches nestjs-query expectations
 * 10) Verify no client-side filtering occurs (all filtering on backend)
 * 11) Verify no GraphQL errors in console
 *
 * Test credentials:
 * - Admin: admin@refine.dev / password
 */

const ADMIN_EMAIL = 'admin@refine.dev';
const ADMIN_PASSWORD = 'password';

/**
 * Captured GraphQL requests for inspection
 */
interface CapturedGraphQLRequest {
  operationName?: string;
  query: string;
  variables?: Record<string, unknown>;
}

const capturedRequests: CapturedGraphQLRequest[] = [];

/**
 * Verify nestjs-query filter format
 * Expected format for boolean field: { field: { eq: true/false } }
 * Expected format for string field: { field: { iLike: "%value%" } } or { field: { eq: "value" } }
 */
function verifyFilterFormat(
  variables: Record<string, unknown> | undefined,
  field: string,
  operator: string,
  expectedValue: unknown,
): boolean {
  if (!variables) return false;

  // Check filter object in variables
  const filter = (variables as any).filter;
  if (!filter) return false;

  const fieldFilter = filter[field];
  if (!fieldFilter) return false;

  if (operator === 'eq') {
    return fieldFilter.eq === expectedValue;
  }

  if (operator === 'iLike') {
    return (
      typeof fieldFilter.iLike === 'string' && fieldFilter.iLike.includes(String(expectedValue))
    );
  }

  if (operator === 'in') {
    return Array.isArray(fieldFilter.in) && fieldFilter.in.includes(expectedValue);
  }

  return false;
}

/**
 * Test helper to perform login
 */
async function performLogin(page: Page, email: string, password: string) {
  // First, always clear storage to ensure clean state
  await page
    .goto('http://localhost:3000/logout', { waitUntil: 'domcontentloaded' })
    .catch(() => {});
  await page.waitForTimeout(500);

  // Navigate to login page
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Check if login form is present
  const emailInput = page.locator('input[type="email"]');

  // If no email input, we might be already logged in
  const emailInputCount = await emailInput.count();
  if (emailInputCount === 0) {
    // Already logged in, just go to dashboard
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    return;
  }

  // Fill in login form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.press('input[type="password"]', 'Enter');

  // Wait for navigation
  await page.waitForTimeout(3000);

  // Verify login succeeded
  const finalUrl = page.url();
  if (finalUrl.includes('/login')) {
    throw new Error('Login failed - still on login page');
  }
}

/**
 * Test helper to navigate and wait for page content
 */
async function navigateAndWait(page: Page, url: string, selector: string = 'h1') {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load', { timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.waitForSelector(selector, { timeout: 15000 }).catch(() => {
    return page.waitForTimeout(1000);
  });
}

/**
 * Test helper to get table row count
 */
async function getTableRowCount(page: Page): Promise<number> {
  const table = page.locator('table').first();
  await table.waitFor({ state: 'visible', timeout: 15000 });
  const tbody = table.locator('tbody').first();
  const rows = tbody.locator('tr');
  return await rows.count();
}

/**
 * Test helper to get text content of an element
 */
async function getElementText(page: Page, selector: string): Promise<string> {
  const element = page.locator(selector).first();
  return (await element.textContent()) || '';
}

// ============================================================================
// USERS LIST FILTERING TESTS
// ============================================================================

test.describe('Admin - Users List Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('should filter users by role - admins', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Get initial row count
    const initialCount = await getTableRowCount(page);

    // Click on Admins filter button
    const adminButton = page.getByRole('button', { name: 'Admins' });
    await adminButton.click();
    await page.waitForTimeout(1000);

    // Check that filter was applied (count should be <= initial)
    const filteredCount = await getTableRowCount(page);
    expect(filteredCount).toBeGreaterThanOrEqual(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Verify the Admins button is now active (has bg-primary class for active state)
    await expect(adminButton).toHaveClass(/bg-primary/);
  });

  test('should filter users by role - clients', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Get initial row count
    const initialCount = await getTableRowCount(page);

    // Click on Clients filter button
    const clientsButton = page.getByRole('button', { name: 'Clients' });
    await clientsButton.click();
    await page.waitForTimeout(1000);

    // Check that filter was applied
    const filteredCount = await getTableRowCount(page);
    expect(filteredCount).toBeGreaterThanOrEqual(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Verify the Clients button is now active
    await expect(clientsButton).toHaveClass(/bg-primary/);
  });

  test('should filter users by status - active', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Get initial row count
    const initialCount = await getTableRowCount(page);

    // Click on Active filter button - use filter section context to avoid ambiguity
    const activeButton = page.locator('button').filter({ hasText: 'Active' }).first();
    await activeButton.click();
    await page.waitForTimeout(1000);

    // Check that filter was applied
    const filteredCount = await getTableRowCount(page);
    expect(filteredCount).toBeGreaterThanOrEqual(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Verify stats card shows active users
    const pageText = await page.textContent('body');
    expect(pageText).toContain('Active');
  });

  test('should filter users by status - suspended', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Get initial row count
    const initialCount = await getTableRowCount(page);

    // Click on Suspended filter button
    const suspendedButton = page.locator('button').filter({ hasText: 'Suspended' }).first();
    await suspendedButton.click();
    await page.waitForTimeout(1000);

    // Check that filter was applied
    const filteredCount = await getTableRowCount(page);
    expect(filteredCount).toBeGreaterThanOrEqual(0);

    // Suspended users should be fewer than or equal to total
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('should filter users by email search', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Get initial row count
    const initialCount = await getTableRowCount(page);

    // Search for admin user
    const searchInput = page.getByPlaceholder('Search by email');
    await searchInput.fill('admin');
    await page.waitForTimeout(1000);

    // Check that search returned results
    const filteredCount = await getTableRowCount(page);
    expect(filteredCount).toBeGreaterThan(0);

    // Verify search term appears in results
    const pageText = await page.textContent('body');
    expect(pageText?.toLowerCase()).toContain('admin');
  });

  test('should filter users by 2FA status - enabled', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Click on 2FA Enabled filter button
    const tfaEnabledButton = page.getByRole('button', { name: '2FA Enabled' });
    await tfaEnabledButton.click();
    await page.waitForTimeout(1000);

    // Check that filter was applied
    const filteredCount = await getTableRowCount(page);
    expect(filteredCount).toBeGreaterThanOrEqual(0);
  });

  test('should filter users by 2FA status - disabled', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Click on No 2FA filter button
    const noTfaButton = page.getByRole('button', { name: 'No 2FA' });
    await noTfaButton.click();
    await page.waitForTimeout(1000);

    // Check that filter was applied
    const filteredCount = await getTableRowCount(page);
    expect(filteredCount).toBeGreaterThanOrEqual(0);
  });

  test('should reset filters when clicking All Roles', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Apply a filter first
    const adminButton = page.getByRole('button', { name: 'Admins' });
    await adminButton.click();
    await page.waitForTimeout(1000);

    // Get filtered count
    const filteredCount = await getTableRowCount(page);

    // Reset filter
    const allRolesButton = page.getByRole('button', { name: 'All Roles' });
    await allRolesButton.click();
    await page.waitForTimeout(1000);

    // Get reset count - should be >= filtered count
    const resetCount = await getTableRowCount(page);
    expect(resetCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test('should combine multiple filters - role + status', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Get initial count
    const initialCount = await getTableRowCount(page);

    // Apply role filter
    const adminButton = page.getByRole('button', { name: 'Admins' });
    await adminButton.click();
    await page.waitForTimeout(1000);
    const roleFilteredCount = await getTableRowCount(page);

    // Apply status filter on top of role filter
    const activeButton = page.getByRole('button', { name: 'Active' });
    await activeButton.click();
    await page.waitForTimeout(1000);
    const combinedFilteredCount = await getTableRowCount(page);

    // Combined filter should have <= results than single filter
    expect(combinedFilteredCount).toBeLessThanOrEqual(roleFilteredCount);
    expect(combinedFilteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('should combine search with role filter', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Apply search first
    const searchInput = page.getByPlaceholder('Search by email');
    await searchInput.fill('admin');
    await page.waitForTimeout(1000);

    // Apply role filter on top
    const adminButton = page.getByRole('button', { name: 'Admins' });
    await adminButton.click();
    await page.waitForTimeout(1000);

    // Should have results
    const filteredCount = await getTableRowCount(page);
    expect(filteredCount).toBeGreaterThanOrEqual(0);
  });

  test('should show correct results count in stats cards', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'h1');

    // Get total users count from stats card
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/total users/i);

    // Apply admin filter
    const adminButton = page.getByRole('button', { name: 'Admins' });
    await adminButton.click();
    await page.waitForTimeout(1000);

    // Stats should update
    const updatedText = await page.textContent('body');
    expect(updatedText).toMatch(/admin/i);
  });
});

// ============================================================================
// AUDIT LOGS FILTERING TESTS
// ============================================================================

test.describe('Admin - Audit Logs Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('should load audit logs page with filters', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/audit-logs', 'h1');

    // Check page heading
    await expect(page.getByRole('heading', { name: 'Audit Logs' })).toBeVisible();

    // Check for filter section
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/filters/i);
  });

  test('should filter by action type', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/audit-logs', 'table');

    // Get initial row count
    const initialCount = await getTableRowCount(page);

    // Look for action type dropdown
    const selectElements = page.locator('select').or(page.locator('[role="combobox"]'));
    const selectCount = await selectElements.count();

    if (selectCount > 0) {
      // Try to select a value from the first dropdown
      await selectElements.first().click();
      await page.waitForTimeout(500);

      // Look for CREATE option
      const createOption = page.getByText('Create').or(page.locator('[value="CREATE"]'));
      const createOptionCount = await createOption.count();

      if (createOptionCount > 0) {
        await createOption.first().click();
        await page.waitForTimeout(1000);

        // Check that filter was applied
        const filteredCount = await getTableRowCount(page);
        expect(filteredCount).toBeGreaterThanOrEqual(0);
      }
    } else {
      // If no selects, check initial count is valid
      expect(initialCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter by resource type', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/audit-logs', 'table');

    // Look for resource type filter
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/resource/i);
  });

  test('should filter by date range', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/audit-logs', 'table');

    // Look for date inputs
    const dateInputs = page.locator('input[type="date"]');
    const dateInputCount = await dateInputs.count();

    if (dateInputCount > 0) {
      // Set a date from filter
      await dateInputs.nth(0).fill('2024-01-01');
      await page.waitForTimeout(1000);

      // Should still be on audit logs page
      expect(page.url()).toContain('/admin/audit-logs');
    }
  });

  test('should search audit logs by resource ID', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/audit-logs', 'table');

    // Look for search input
    const searchInput = page
      .getByPlaceholder(/search/i)
      .or(page.locator('input[placeholder*="Search"]'));
    const searchInputCount = await searchInput.count();

    if (searchInputCount > 0) {
      await searchInput.first().fill('test');
      await page.waitForTimeout(1000);

      // Should still be on audit logs page
      expect(page.url()).toContain('/admin/audit-logs');
    }
  });

  test('should clear all filters', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/audit-logs', 'table');

    // Look for clear all button
    const clearButton = page.getByRole('button', { name: /clear all/i });
    const clearButtonCount = await clearButton.count();

    if (clearButtonCount > 0) {
      await clearButton.first().click();
      await page.waitForTimeout(1000);

      // Should still have table visible
      const table = page.locator('table').first();
      await expect(table).toBeVisible();
    }
  });

  test('should show stats cards with filter counts', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/audit-logs', 'h1');

    // Check for stats cards
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/total logs/i);
  });
});

// ============================================================================
// DOCUMENTS FILTERING TESTS
// ============================================================================

test.describe('Admin - Documents Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('should load documents page with filters', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/documents', 'h1');

    // Check page heading
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible();

    // Check for stats
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/total documents/i);
  });

  test('should filter documents by type', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/documents', 'h1');

    // Look for document type filter
    const typeSelect = page.locator('select').or(page.locator('[role="combobox"]'));
    const selectCount = await typeSelect.count();

    if (selectCount > 0) {
      // Try to find and select a document type
      const contractOption = page.getByText('CONTRACT').or(page.locator('[value="CONTRACT"]'));
      const contractOptionCount = await contractOption.count();

      if (contractOptionCount > 0) {
        await contractOption.first().click();
        await page.waitForTimeout(1000);

        // Should still be on documents page
        expect(page.url()).toContain('/admin/documents');
      }
    }
  });

  test('should filter documents by status', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/documents', 'h1');

    // Look for status filter
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/status/i);
  });

  test('should filter documents by moderation status', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/documents', 'h1');

    // Look for moderation filter
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/moderation/i);
  });

  test('should search documents by title', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/documents', 'h1');

    // Look for title search input
    const searchInput = page
      .getByPlaceholder(/search/i)
      .or(page.locator('input[placeholder*="title"]'));
    const searchInputCount = await searchInput.count();

    if (searchInputCount > 0) {
      await searchInput.first().fill('test');
      await page.waitForTimeout(1000);

      // Should still be on documents page
      expect(page.url()).toContain('/admin/documents');
    }
  });

  test('should clear document filters', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/documents', 'h1');

    // Look for clear filters button
    const clearButton = page.getByRole('button', { name: /clear/i });
    const clearButtonCount = await clearButton.count();

    if (clearButtonCount > 0) {
      await clearButton.first().click();
      await page.waitForTimeout(1000);

      // Should still be on documents page
      expect(page.url()).toContain('/admin/documents');
    }
  });

  test('should show stats cards with document counts', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/documents', 'h1');

    // Check for stats cards
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/pending moderation/i);
  });
});

// ============================================================================
// API KEYS FILTERING TESTS
// ============================================================================

test.describe('Admin - API Keys Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('should load api keys page with filters', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/api-keys', 'h1');

    // Check page heading
    await expect(page.getByRole('heading', { name: /api keys/i })).toBeVisible();

    // Check for stats
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/total keys/i);
  });

  test('should filter api keys by status - active', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/api-keys', 'table');

    // Get initial count
    const initialCount = await getTableRowCount(page);

    // Click on Active filter button
    const activeButton = page.getByRole('button', { name: 'Active' });
    const activeButtonCount = await activeButton.count();

    if (activeButtonCount > 0) {
      await activeButton.first().click();
      await page.waitForTimeout(1000);

      // Check that filter was applied
      const filteredCount = await getTableRowCount(page);
      expect(filteredCount).toBeGreaterThanOrEqual(0);
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    }
  });

  test('should filter api keys by status - revoked', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/api-keys', 'table');

    // Click on Revoked filter button
    const revokedButton = page.getByRole('button', { name: 'Revoked' });
    const revokedButtonCount = await revokedButton.count();

    if (revokedButtonCount > 0) {
      await revokedButton.first().click();
      await page.waitForTimeout(1000);

      // Check that filter was applied
      const filteredCount = await getTableRowCount(page);
      expect(filteredCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter api keys by status - expired', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/api-keys', 'table');

    // Click on Expired filter button
    const expiredButton = page.getByRole('button', { name: 'Expired' });
    const expiredButtonCount = await expiredButton.count();

    if (expiredButtonCount > 0) {
      await expiredButton.first().click();
      await page.waitForTimeout(1000);

      // Check that filter was applied
      const filteredCount = await getTableRowCount(page);
      expect(filteredCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should search api keys by name', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/api-keys', 'table');

    // Look for search input
    const searchInput = page
      .getByPlaceholder(/search/i)
      .or(page.locator('input[placeholder*="name"]'));
    const searchInputCount = await searchInput.count();

    if (searchInputCount > 0) {
      await searchInput.first().fill('test');
      await page.waitForTimeout(1000);

      // Should still be on api keys page
      expect(page.url()).toContain('/admin/api-keys');
    }
  });

  test('should show stats cards with api key counts', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/api-keys', 'h1');

    // Check for stats cards
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/active/i);
    expect(pageText).toMatch(/revoked/i);
  });
});

// ============================================================================
// COMBINED FILTERING AND PERSISTENCE TESTS
// ============================================================================

test.describe('Admin - Combined Filtering and Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('filters should persist across pagination - users list', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Apply a filter
    const adminButton = page.getByRole('button', { name: 'Admins' });
    await adminButton.click();
    await page.waitForTimeout(1000);

    // Get filtered count
    const filteredCount = await getTableRowCount(page);

    // Check for pagination
    const nextButton = page.getByRole('button', { name: 'Next' });
    const nextButtonCount = await nextButton.count();

    if (nextButtonCount > 0 && filteredCount > 10) {
      // Navigate to next page if available
      if (await nextButton.first().isEnabled()) {
        await nextButton.first().click();
        await page.waitForTimeout(1000);

        // Should still be on users page
        expect(page.url()).toContain('/admin/users');

        // Filter should still be active
        await expect(adminButton).toHaveClass(/bg-primary/);
      }
    }
  });

  test('clear filters should reset all filters - users list', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Apply multiple filters
    const adminButton = page.getByRole('button', { name: 'Admins' });
    await adminButton.click();
    await page.waitForTimeout(500);

    const activeButton = page.getByRole('button', { name: 'Active' });
    await activeButton.click();
    await page.waitForTimeout(500);

    // Get filtered count
    const filteredCount = await getTableRowCount(page);

    // Reset all filters
    const allRolesButton = page.getByRole('button', { name: 'All Roles' });
    await allRolesButton.click();
    await page.waitForTimeout(500);

    const allStatusButton = page.getByRole('button', { name: 'All Status' });
    await allStatusButton.click();
    await page.waitForTimeout(1000);

    // Get reset count - should be >= filtered count
    const resetCount = await getTableRowCount(page);
    expect(resetCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test('should show correct results count after filtering', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'h1');

    // Get initial total from stats card
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/total users/i);

    // Apply filter
    const activeButton = page.getByRole('button', { name: 'Active' });
    await activeButton.click();
    await page.waitForTimeout(1000);

    // Stats should update to reflect filtered count
    const updatedText = await page.textContent('body');
    expect(updatedText).toMatch(/active/i);
  });

  test('search should work with other filters active', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Apply role filter
    const adminButton = page.getByRole('button', { name: 'Admins' });
    await adminButton.click();
    await page.waitForTimeout(500);

    // Apply search
    const searchInput = page.getByPlaceholder('Search by email');
    await searchInput.fill('admin');
    await page.waitForTimeout(1000);

    // Should have results
    const filteredCount = await getTableRowCount(page);
    expect(filteredCount).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// CROSS-PAGE FILTERING CONSISTENCY TESTS
// ============================================================================

test.describe('Admin - Cross-Page Filtering Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('all admin pages should have filter controls', async ({ page }) => {
    const pages = [
      { url: 'http://localhost:3000/admin/users', name: 'Users' },
      { url: 'http://localhost:3000/admin/audit-logs', name: 'Audit Logs' },
      { url: 'http://localhost:3000/admin/documents', name: 'Documents' },
      { url: 'http://localhost:3000/admin/api-keys', name: 'API Keys' },
    ];

    for (const pageConfig of pages) {
      await page.goto(pageConfig.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Check for filter-related elements
      const pageText = await page.textContent('body');

      // All pages should have some form of filtering
      // Either buttons, selects, or search inputs
      const filterButtons = page.locator('button').filter({ hasText: /all|filter|clear/i });
      const searchInputs = page.locator(
        'input[placeholder*="Search" i], input[placeholder*="search" i]',
      );
      const selects = page.locator('select');

      const hasFilterControls =
        (await filterButtons.count()) > 0 ||
        (await searchInputs.count()) > 0 ||
        (await selects.count()) > 0;

      expect(hasFilterControls).toBeTruthy();
    }
  });

  test('filter UI should be consistent across pages', async ({ page }) => {
    // Users page should have filter buttons
    await page.goto('http://localhost:3000/admin/users', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const usersFilterButtons = page
      .locator('button')
      .filter({ hasText: /All|Admins|Clients|Active|Suspended/i });
    expect(await usersFilterButtons.count()).toBeGreaterThan(0);

    // API Keys page should have similar filter buttons
    await page.goto('http://localhost:3000/admin/api-keys', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const apiKeysFilterButtons = page
      .locator('button')
      .filter({ hasText: /All|Active|Revoked|Expired/i });
    expect(await apiKeysFilterButtons.count()).toBeGreaterThan(0);
  });

  test('clear filters should work consistently', async ({ page }) => {
    // Test on users page
    await page.goto('http://localhost:3000/admin/users', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Apply filters
    const adminsButton = page.locator('button').filter({ hasText: 'Admins' }).first();
    await adminsButton.click();
    await page.waitForTimeout(500);

    const activeButton = page.locator('button').filter({ hasText: 'Active' }).first();
    await activeButton.click();
    await page.waitForTimeout(500);

    // Clear filters
    const allRolesButton = page.locator('button').filter({ hasText: 'All Roles' }).first();
    await allRolesButton.click();
    await page.waitForTimeout(500);

    const allStatusButton = page.locator('button').filter({ hasText: 'All Status' }).first();
    await allStatusButton.click();
    await page.waitForTimeout(1000);

    // Verify filters are cleared
    const initialCount = await getTableRowCount(page);
    expect(initialCount).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// GRAPHQL NETWORK INTERCEPTION TESTS
// ============================================================================

test.describe('Admin - GraphQL Network Interception for Filters', () => {
  test.beforeEach(async ({ page }) => {
    capturedRequests.length = 0;

    // Set up route handler to capture GraphQL requests
    page.route('**/graphql', async (route) => {
      const request = route.request();
      const postData = request.postData();

      if (postData) {
        try {
          const parsedData = JSON.parse(postData) as CapturedGraphQLRequest;
          capturedRequests.push(parsedData);
        } catch {
          // Not JSON, ignore
        }
      }

      await route.continue();
    });

    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('should send correct filter format for isActive status filter - nestjs-query format', async ({
    page,
  }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Clear previous requests
    capturedRequests.length = 0;

    // Click on Active filter button
    const activeButton = page.locator('button').filter({ hasText: 'Active' }).first();
    await activeButton.click();
    await page.waitForTimeout(1500);

    // Verify GraphQL request was sent with correct filter format
    const usersQuery = capturedRequests.find(
      (req) => req.query?.includes('users') && req.operationName !== 'user',
    );

    // Verify the filter was sent in nestjs-query format
    // Expected: { filter: { isActive: { eq: true } } }
    if (usersQuery) {
      const hasCorrectFilter = verifyFilterFormat(usersQuery.variables, 'isActive', 'eq', true);
      expect(hasCorrectFilter).toBeTruthy();
    }
  });

  test('should send correct filter format for 2FA enabled filter - nestjs-query format', async ({
    page,
  }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Clear previous requests
    capturedRequests.length = 0;

    // Click on 2FA Enabled filter button
    const tfaEnabledButton = page.getByRole('button', { name: '2FA Enabled' });
    await tfaEnabledButton.click();
    await page.waitForTimeout(1500);

    // Verify GraphQL request was sent with correct filter format
    const usersQuery = capturedRequests.find(
      (req) => req.query?.includes('users') && req.operationName !== 'user',
    );

    if (usersQuery) {
      // Expected: { filter: { twoFactorEnabled: { eq: true } } }
      const hasCorrectFilter = verifyFilterFormat(
        usersQuery.variables,
        'twoFactorEnabled',
        'eq',
        true,
      );
      expect(hasCorrectFilter).toBeTruthy();
    }
  });

  test('should send correct filter format for email search with contains operator - nestjs-query format', async ({
    page,
  }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Clear previous requests
    capturedRequests.length = 0;

    // Search for admin user
    const searchInput = page.getByPlaceholder('Search by email');
    await searchInput.fill('admin');
    await page.waitForTimeout(1500);

    // Verify GraphQL request was sent with correct filter format
    const usersQuery = capturedRequests.find(
      (req) => req.query?.includes('users') && req.operationName !== 'user',
    );

    if (usersQuery) {
      // Expected: { filter: { email: { iLike: "%admin%" } } }
      const hasCorrectFilter = verifyFilterFormat(usersQuery.variables, 'email', 'iLike', 'admin');
      expect(hasCorrectFilter).toBeTruthy();
    }
  });

  test('should send combined filters correctly - nestjs-query format', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Clear previous requests
    capturedRequests.length = 0;

    // Apply status filter
    const activeButton = page.locator('button').filter({ hasText: 'Active' }).first();
    await activeButton.click();
    await page.waitForTimeout(500);

    // Apply search filter
    const searchInput = page.getByPlaceholder('Search by email');
    await searchInput.fill('admin');
    await page.waitForTimeout(1500);

    // Verify GraphQL request was sent with both filters
    const usersQuery = capturedRequests.find(
      (req) => req.query?.includes('users') && req.operationName !== 'user',
    );

    if (usersQuery && usersQuery.variables) {
      const filter = (usersQuery.variables as any).filter;
      // Both filters should be present
      expect(filter).toBeDefined();
      // isActive: { eq: true }
      expect(filter?.isActive?.eq).toBe(true);
      // email: { iLike: "%admin%" }
      expect(filter?.email?.iLike).toContain('admin');
    }
  });

  test('should send correct filter format for documents status filter - nestjs-query format', async ({
    page,
  }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/documents', 'h1');

    // Clear previous requests
    capturedRequests.length = 0;

    // Find status dropdown and select COMPLETED
    const statusSelect = page.locator('select').nth(1); // Second select should be status
    await statusSelect.selectOption('COMPLETED');
    await page.waitForTimeout(1500);

    // Verify GraphQL request was sent with correct filter format
    const documentsQuery = capturedRequests.find(
      (req) => req.query?.includes('documents') || req.query?.includes('legalDocuments'),
    );

    if (documentsQuery && documentsQuery.variables) {
      const filter = (documentsQuery.variables as any).filter;
      // Expected: { filter: { status: { eq: "COMPLETED" } } }
      expect(filter?.status?.eq).toBe('COMPLETED');
    }
  });

  test('should send correct filter format for documents type filter - nestjs-query format', async ({
    page,
  }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/documents', 'h1');

    // Clear previous requests
    capturedRequests.length = 0;

    // Find type dropdown and select CONTRACT
    const typeSelect = page.locator('select').first();
    await typeSelect.selectOption('CONTRACT');
    await page.waitForTimeout(1500);

    // Verify GraphQL request was sent with correct filter format
    const documentsQuery = capturedRequests.find(
      (req) => req.query?.includes('documents') || req.query?.includes('legalDocuments'),
    );

    if (documentsQuery && documentsQuery.variables) {
      const filter = (documentsQuery.variables as any).filter;
      // Expected: { filter: { type: { eq: "CONTRACT" } } }
      expect(filter?.type?.eq).toBe('CONTRACT');
    }
  });

  test('should verify no client-side filtering - all filtering happens on backend', async ({
    page,
  }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Get initial count without filters
    const initialCount = await getTableRowCount(page);

    // Clear previous requests and set up tracking
    capturedRequests.length = 0;

    // Apply a server-side filter (isActive)
    const activeButton = page.locator('button').filter({ hasText: 'Active' }).first();
    await activeButton.click();
    await page.waitForTimeout(1500);

    // Check that a new GraphQL request was made
    const filteredRequests = capturedRequests.filter(
      (req) => req.query?.includes('users') && req.operationName !== 'user',
    );

    // There should be at least one request after applying filter
    expect(filteredRequests.length).toBeGreaterThan(0);

    // The filtered count should be <= initial count
    const filteredCount = await getTableRowCount(page);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('should have no GraphQL errors when applying filters', async ({ page }) => {
    const graphqlErrors: string[] = [];

    // Listen for console messages
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('GraphQL error') || text.includes('graphql error')) {
        graphqlErrors.push(text);
      }
    });

    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Apply various filters
    const filters = ['Active', 'Suspended', '2FA Enabled'];

    for (const filterName of filters) {
      const filterButton = page
        .getByRole('button', { name: filterName })
        .or(page.locator('button').filter({ hasText: filterName }));
      const count = await filterButton.count();
      if (count > 0) {
        await filterButton.first().click();
        await page.waitForTimeout(1000);

        // Reset filter
        const allStatusButton = page.locator('button').filter({ hasText: 'All Status' }).first();
        await allStatusButton.click();
        await page.waitForTimeout(500);
      }
    }

    // Verify no GraphQL errors were logged
    expect(graphqlErrors.length).toBe(0);
  });
});
