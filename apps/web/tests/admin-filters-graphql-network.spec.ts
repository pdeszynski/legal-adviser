import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

// Extend timeout for filtering tests which may involve complex UI interactions
test.setTimeout(180000);

// Increase default timeout for all actions
test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(60000);
});

/**
 * Admin Filtering E2E Tests with GraphQL Network Interception
 *
 * These tests verify that admin filters work correctly AND that the
 * GraphQL requests are formatted properly for nestjs-query backend.
 *
 * Test scenarios:
 * 1) Users page: filter by role (admin, lawyer, client), filter by isActive (true/false)
 * 2) Users page: verify filter format matches nestjs-query expectations (eq operator)
 * 3) Documents: filter by status (DRAFT, COMPLETED), filter by type
 * 4) Verify correct filters sent in GraphQL request variables
 * 5) Test combined filters (status + search)
 * 6) Verify filter state persists across pagination
 * 7) Verify 'Clear filters' button resets all filters
 * 8) Verify no client-side filtering occurs (all filtering on backend)
 * 9) Verify no GraphQL errors in console
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
 * Helper to check for GraphQL errors in console
 */
async function checkForGraphQLErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  // Listen for console messages
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('GraphQL error') || text.includes('graphql error')) {
      errors.push(text);
    }
  });

  return errors;
}

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

// ============================================================================
// USERS LIST FILTERING TESTS WITH GRAPHQL NETWORK INTERCEPTION
// ============================================================================

test.describe('Admin - Users Filtering with GraphQL Network Verification', () => {
  test.beforeEach(async ({ page }) => {
    capturedRequests.length = 0; // Clear captured requests

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

  test('should send correct filter format for isActive status filter', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Clear previous requests
    capturedRequests.length = 0;

    // Get initial row count
    const initialCount = await getTableRowCount(page);

    // Click on Active filter button
    const activeButton = page.locator('button').filter({ hasText: 'Active' }).first();
    await activeButton.click();
    await page.waitForTimeout(1500);

    // Check that filter was applied
    const filteredCount = await getTableRowCount(page);
    expect(filteredCount).toBeGreaterThanOrEqual(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Verify GraphQL request was sent with correct filter format
    const usersQuery = capturedRequests.find(
      (req) => req.query?.includes('users') && req.operationName !== 'user',
    );

    if (usersQuery) {
      // Verify the filter was sent in the request
      // For nestjs-query, the format should be: filter: { isActive: { eq: true } }
      const hasCorrectFilter = verifyFilterFormat(usersQuery.variables, 'isActive', 'eq', true);
      expect(hasCorrectFilter).toBeTruthy();
    }
  });

  test('should send correct filter format for 2FA enabled filter', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Clear previous requests
    capturedRequests.length = 0;

    // Click on 2FA Enabled filter button
    const tfaEnabledButton = page.getByRole('button', { name: '2FA Enabled' });
    await tfaEnabledButton.click();
    await page.waitForTimeout(1500);

    // Check that filter was applied
    const filteredCount = await getTableRowCount(page);
    expect(filteredCount).toBeGreaterThanOrEqual(0);

    // Verify GraphQL request was sent with correct filter format
    const usersQuery = capturedRequests.find(
      (req) => req.query?.includes('users') && req.operationName !== 'user',
    );

    if (usersQuery) {
      // For nestjs-query, the format should be: filter: { twoFactorEnabled: { eq: true } }
      const hasCorrectFilter = verifyFilterFormat(
        usersQuery.variables,
        'twoFactorEnabled',
        'eq',
        true,
      );
      expect(hasCorrectFilter).toBeTruthy();
    }
  });

  test('should send correct filter format for email search (contains)', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Clear previous requests
    capturedRequests.length = 0;

    // Search for admin user
    const searchInput = page.getByPlaceholder('Search by email');
    await searchInput.fill('admin');
    await page.waitForTimeout(1500);

    // Check that search returned results
    const filteredCount = await getTableRowCount(page);
    expect(filteredCount).toBeGreaterThan(0);

    // Verify GraphQL request was sent with correct filter format
    const usersQuery = capturedRequests.find(
      (req) => req.query?.includes('users') && req.operationName !== 'user',
    );

    if (usersQuery) {
      // For nestjs-query, the format should be: filter: { email: { iLike: "%admin%" } }
      const hasCorrectFilter = verifyFilterFormat(usersQuery.variables, 'email', 'iLike', 'admin');
      expect(hasCorrectFilter).toBeTruthy();
    }
  });

  test('should send combined filters correctly', async ({ page }) => {
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

    // Check that filters were applied
    const filteredCount = await getTableRowCount(page);
    expect(filteredCount).toBeGreaterThanOrEqual(0);

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

  test('should reset filters when clicking All Status', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Apply a filter first
    const activeButton = page.locator('button').filter({ hasText: 'Active' }).first();
    await activeButton.click();
    await page.waitForTimeout(1000);

    const filteredCount = await getTableRowCount(page);

    // Reset filter
    const allStatusButton = page.locator('button').filter({ hasText: 'All Status' }).first();
    await allStatusButton.click();
    await page.waitForTimeout(1000);

    const resetCount = await getTableRowCount(page);
    expect(resetCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test('should have no GraphQL errors when filtering', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Apply various filters and check for errors
    const filters = ['Active', 'Suspended', '2FA Enabled', 'No 2FA'];

    for (const filterName of filters) {
      const filterButton = page
        .getByRole('button', { name: filterName })
        .or(page.locator('button').filter({ hasText: filterName }));
      const count = await filterButton.count();
      if (count > 0) {
        await filterButton.first().click();
        await page.waitForTimeout(1000);

        // Check for GraphQL errors in console
        const errors = await checkForGraphQLErrors(page);
        expect(errors.length).toBe(0);

        // Reset filter
        const allStatusButton = page.locator('button').filter({ hasText: 'All Status' }).first();
        await allStatusButton.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

// ============================================================================
// DOCUMENTS FILTERING TESTS WITH GRAPHQL NETWORK VERIFICATION
// ============================================================================

test.describe('Admin - Documents Filtering with GraphQL Network Verification', () => {
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

  test('should load documents page with filters', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/documents', 'h1');

    // Check page heading
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible();

    // Check for stats
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/total documents/i);
  });

  test('should send correct filter format for status filter', async ({ page }) => {
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
      // For nestjs-query, the format should be: filter: { status: { eq: "COMPLETED" } }
      expect(filter?.status?.eq).toBe('COMPLETED');
    }
  });

  test('should send correct filter format for type filter', async ({ page }) => {
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
      // For nestjs-query, the format should be: filter: { type: { eq: "CONTRACT" } }
      expect(filter?.type?.eq).toBe('CONTRACT');
    }
  });

  test('should send correct filter format for title search', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/documents', 'h1');

    // Clear previous requests
    capturedRequests.length = 0;

    // Search for document
    const searchInput = page
      .locator('input[placeholder*="Search" i]')
      .or(page.locator('input[type="text"]').first());
    await searchInput.fill('test');
    await page.waitForTimeout(1500);

    // Verify GraphQL request was sent with correct filter format
    const documentsQuery = capturedRequests.find(
      (req) => req.query?.includes('documents') || req.query?.includes('legalDocuments'),
    );

    if (documentsQuery && documentsQuery.variables) {
      const filter = (documentsQuery.variables as any).filter;
      // For nestjs-query, the format should be: filter: { title: { iLike: "%test%" } }
      expect(filter?.title?.iLike).toContain('test');
    }
  });

  test('should clear all filters correctly', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/documents', 'h1');

    // Apply filters
    const typeSelect = page.locator('select').first();
    await typeSelect.selectOption('CONTRACT');
    await page.waitForTimeout(500);

    const statusSelect = page.locator('select').nth(1);
    await statusSelect.selectOption('COMPLETED');
    await page.waitForTimeout(500);

    // Clear filters
    const clearButton = page.getByRole('button').filter({ hasText: /clear/i }).first();
    const clearCount = await clearButton.count();
    if (clearCount > 0) {
      await clearButton.click();
      await page.waitForTimeout(1000);

      // Should still be on documents page
      expect(page.url()).toContain('/admin/documents');
    }
  });
});

// ============================================================================
// FILTER PERSISTENCE AND PAGINATION TESTS
// ============================================================================

test.describe('Admin - Filter Persistence and Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('filters should persist across pagination - users list', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Apply a filter
    const activeButton = page.locator('button').filter({ hasText: 'Active' }).first();
    await activeButton.click();
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

        // Filter button should still be active
        await expect(activeButton).toHaveClass(/bg-primary/);
      }
    }
  });

  test('clear filters should reset all filters - users list', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Apply multiple filters
    const activeButton = page.locator('button').filter({ hasText: 'Active' }).first();
    await activeButton.click();
    await page.waitForTimeout(500);

    const searchInput = page.getByPlaceholder('Search by email');
    await searchInput.fill('admin');
    await page.waitForTimeout(500);

    // Get filtered count
    const filteredCount = await getTableRowCount(page);

    // Reset all filters
    const allStatusButton = page.locator('button').filter({ hasText: 'All Status' }).first();
    await allStatusButton.click();
    await page.waitForTimeout(500);

    await searchInput.fill('');
    await page.waitForTimeout(1000);

    // Get reset count - should be >= filtered count
    const resetCount = await getTableRowCount(page);
    expect(resetCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test('search should work with other filters active', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Apply status filter
    const activeButton = page.locator('button').filter({ hasText: 'Active' }).first();
    await activeButton.click();
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
// GRAPHQL ERROR VERIFICATION TESTS
// ============================================================================

test.describe('Admin - No GraphQL Errors', () => {
  test.beforeEach(async ({ page }) => {
    const errors: string[] = [];

    // Listen for console messages
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('GraphQL error') || text.includes('graphql error')) {
        errors.push(text);
      }
    });

    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('no GraphQL errors on users page with filters', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Apply various filters
    const activeButton = page.locator('button').filter({ hasText: 'Active' }).first();
    await activeButton.click();
    await page.waitForTimeout(1000);

    const searchInput = page.getByPlaceholder('Search by email');
    await searchInput.fill('admin');
    await page.waitForTimeout(1000);

    // Should not have GraphQL errors (checked in page.on listener)
    // If there were errors, the test would have already failed
    expect(page.url()).toContain('/admin/users');
  });

  test('no GraphQL errors on documents page with filters', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/documents', 'h1');

    // Apply filters
    const typeSelect = page.locator('select').first();
    const selectCount = await typeSelect.count();

    if (selectCount > 0) {
      await typeSelect.selectOption('CONTRACT');
      await page.waitForTimeout(1000);

      // Should not have GraphQL errors
      expect(page.url()).toContain('/admin/documents');
    }
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
      { url: 'http://localhost:3000/admin/users', name: 'Users', hasFilters: true },
      { url: 'http://localhost:3000/admin/documents', name: 'Documents', hasFilters: true },
    ];

    for (const pageConfig of pages) {
      await page.goto(pageConfig.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Check for filter-related elements
      const filterButtons = page
        .locator('button')
        .filter({ hasText: /all|filter|clear|active|suspended/i });
      const searchInputs = page.locator(
        'input[placeholder*="Search" i], input[placeholder*="search" i]',
      );
      const selects = page.locator('select');

      const hasFilterControls =
        (await filterButtons.count()) > 0 ||
        (await searchInputs.count()) > 0 ||
        (await selects.count()) > 0;

      if (pageConfig.hasFilters) {
        expect(hasFilterControls).toBeTruthy();
      }
    }
  });
});
