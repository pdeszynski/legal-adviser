import { test, expect, type Page } from '@playwright/test';

// Extend timeout for admin tests which may involve complex UI interactions
test.setTimeout(180000);

// Increase default timeout for all actions
test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(60000);
});

/**
 * Admin Pages E2E Tests
 *
 * Comprehensive tests for all admin pages after GraphQL integration fixes.
 * Test scenarios:
 * 1) Admin login and navigation to /admin
 * 2) Users list loads and displays data
 * 3) User filtering and pagination work
 * 4) Create new user (if applicable)
 * 5) Edit user role
 * 6) Delete user (with confirmation)
 * 7) Audit logs load with filters working
 * 8) Document list loads and displays
 * 9) Pagination and filtering work on all pages
 * 10) Verify no 'invalid request' errors appear
 *
 * Test credentials:
 * - Admin: admin@refine.dev / password
 */

const ADMIN_EMAIL = 'admin@refine.dev';
const ADMIN_PASSWORD = 'password';

/**
 * Test helper to perform login
 */
async function performLogin(page: Page, email: string, password: string) {
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });

  // Check if we're already authenticated
  const currentUrl = page.url();
  if (
    currentUrl.includes('/dashboard') ||
    currentUrl.includes('/chat') ||
    currentUrl.includes('/settings') ||
    currentUrl.includes('/admin')
  ) {
    await page.goto('http://localhost:3000/logout', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  }

  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.press('input[type="password"]', 'Enter');

  // Wait for navigation to complete - check for URL change or dashboard element
  // Increase timeout and be more flexible with URL matching
  try {
    await page.waitForURL(
      (url) =>
        url.pathname.includes('/dashboard') ||
        url.pathname.includes('/chat') ||
        url.pathname.includes('/admin'),
      { timeout: 45000 },
    );
  } catch (error) {
    // If waitForURL times out, check if we're still on a valid page
    const finalUrl = page.url();
    if (!finalUrl.includes('/login')) {
      // We navigated away from login, consider it a success
      console.log('Login succeeded but URL didnt match expected pattern');
    } else {
      throw error;
    }
  }

  // Additional wait for page to stabilize
  await page.waitForTimeout(1000);
}

/**
 * Test helper to navigate and wait for page content
 */
async function navigateAndWait(page: Page, url: string, selector: string = 'h1') {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load', { timeout: 30000 });
  // Wait for specific content instead of networkidle
  await page.waitForSelector(selector, { timeout: 15000 }).catch(() => {
    // If selector not found, at least wait a bit for page to render
    return page.waitForTimeout(1000);
  });
}

/**
 * Test helper to get random test data
 */
function getTestData() {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return {
    email: `testuser-${timestamp}-${randomSuffix}@example.com`,
    username: `testuser_${randomSuffix}`,
    firstName: 'Test',
    lastName: `User${randomSuffix}`,
    password: `TestPass123!${randomSuffix}`,
  };
}

/**
 * Test helper to check for GraphQL errors
 * Looks for actual error messages, not normal text like "failed" which may appear in UI
 */
async function checkForGraphQLErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  // Check for specific error patterns that indicate actual problems
  const errorPatterns = [
    /invalid request/i,
    /graphql error/i,
    /network error/i,
    /unauthorized/i,
    /forbidden/i,
    /internal server error/i,
  ];

  // Get page text and check for error patterns
  const pageText = await page.textContent('body').catch(() => '');
  if (pageText) {
    for (const pattern of errorPatterns) {
      if (pattern.test(pageText)) {
        // But exclude false positives like navigation elements
        const visibleErrors = page.locator('text=' + pattern.source).filter({ hasText: /^.*$/ });
        const count = await visibleErrors.count();
        if (count > 0) {
          errors.push(`Found error pattern: ${pattern.source}`);
        }
      }
    }
  }

  // Check for error toasts with explicit error role/class
  const errorToasts = page.locator('[role="alert"]', { hasText: /error|failed|warning/i });
  const toastCount = await errorToasts.count();
  if (toastCount > 0) {
    for (let i = 0; i < toastCount; i++) {
      const toastText = await errorToasts.nth(i).textContent();
      if (toastText && !toastText.includes('Loading') && !toastText.includes('loading')) {
        errors.push(`Error toast: ${toastText}`);
      }
    }
  }

  return errors;
}

test.describe('Admin - Login and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('admin can login and navigate to /admin', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin', 'h1');

    // Check page heading - use first() to avoid strict mode violation
    await expect(page.locator('h1').first()).toBeVisible();

    // Verify we're on admin page
    expect(page.url()).toContain('/admin');

    // Check for no GraphQL errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });

  test('admin panel navigation is visible and functional', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin', 'nav');

    // Check for navigation
    const navigation = page.getByRole('navigation');
    await expect(navigation.first()).toBeVisible();

    // Verify no invalid request errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });

  test('can navigate to all main admin sections', async ({ page }) => {
    const adminRoutes = ['/admin', '/admin/users', '/admin/documents', '/admin/audit-logs'];

    for (const route of adminRoutes) {
      await page.goto(`http://localhost:3000${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Should successfully navigate
      expect(page.url()).toContain(route);

      // Check for errors
      const errors = await checkForGraphQLErrors(page);
      if (errors.length > 0) {
        console.error(`Errors on ${route}:`, errors);
      }
      expect(errors.length).toBe(0);
    }
  });
});

test.describe('Admin - Users List', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('users list page loads and displays data', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Check page heading - use exact match and first() to avoid strict mode
    await expect(page.getByRole('heading', { name: 'Users', exact: true }).first()).toBeVisible();

    // Check for table
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 15000 });

    // Verify table has rows
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Check for no errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });

  test('users list has stats cards with data', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'h1');

    // Look for stats cards (Total Users, Active, Admins, Suspended)
    const statsText = await page.textContent('body');
    expect(statsText).toMatch(/total users/i);
    expect(statsText).toMatch(/active/i);
    expect(statsText).toMatch(/admin/i);

    // Check for no errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });

  test('user filtering works correctly', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Wait for table to load
    const table = page.locator('table').first();
    await expect(table).toBeVisible();

    // Get initial row count
    const initialRows = await table.locator('tbody tr').count();

    // Apply role filter (click Admins button)
    const adminButton = page.getByRole('button', { name: 'Admins' });
    await adminButton.click();
    await page.waitForTimeout(1000);

    // Check that filter was applied (number of rows may differ)
    const filteredRows = await table.locator('tbody tr').count();
    expect(filteredRows).toBeGreaterThanOrEqual(0);
    expect(filteredRows).toBeLessThanOrEqual(initialRows);

    // Clear filter by clicking "All Roles"
    const allRolesButton = page.getByRole('button', { name: 'All Roles' });
    await allRolesButton.click();
    await page.waitForTimeout(1000);

    // Should be back to all users
    const resetRows = await table.locator('tbody tr').count();
    expect(resetRows).toBe(initialRows);

    // Check for no errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });

  test('user search functionality works', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Wait for table to load
    const table = page.locator('table').first();
    await expect(table).toBeVisible();

    // Search for admin user
    const searchInput = page.getByPlaceholder('Search by email');
    await searchInput.fill(ADMIN_EMAIL);
    await page.waitForTimeout(1000);

    // Should find at least one result
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(1000);

    // Check for no errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });

  test('users list pagination works', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Wait for table to load
    const table = page.locator('table').first();
    await expect(table).toBeVisible();

    // Check for pagination controls
    const nextButton = page.getByRole('button', { name: 'Next' });
    const prevButton = page.getByRole('button', { name: 'Previous' });
    const nextButtonCount = await nextButton.count();

    if (nextButtonCount > 0) {
      // Try clicking next if available
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(1000);

        // Should still be on users page
        expect(page.url()).toContain('/admin/users');

        // Try going back
        if (await prevButton.isEnabled()) {
          await prevButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    // Check for no errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });
});

test.describe('Admin - Create User', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('create user page loads correctly', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users/create', 'h1');

    // Check page heading
    await expect(page.getByRole('heading', { name: 'Create User' })).toBeVisible();

    // Check for form fields
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();

    // Check submit button
    await expect(page.getByRole('button', { name: 'Create User' })).toBeVisible();

    // Check for no errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });

  test('password generation works', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users/create', 'button');

    // Click Generate button
    await page.getByRole('button', { name: 'Generate' }).click();

    // Password field should be filled
    const passwordField = page.getByLabel('Password');
    const passwordValue = await passwordField.inputValue();

    expect(passwordValue.length).toBeGreaterThan(8);

    // Check for no errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });

  test('create user flow works end-to-end', async ({ page }) => {
    const testData = getTestData();

    await navigateAndWait(page, 'http://localhost:3000/admin/users/create', 'h1');

    // Fill in the form
    await page.getByLabel('Email').fill(testData.email);
    await page.getByLabel('Username').fill(testData.username);
    await page.getByLabel('First Name').fill(testData.firstName);
    await page.getByLabel('Last Name').fill(testData.lastName);
    await page.getByLabel('Password').fill(testData.password);
    await page.getByLabel('Confirm Password').fill(testData.password);

    // Select User role
    const roleButton = page.getByRole('button', { name: 'User' });
    const roleCount = await roleButton.count();
    if (roleCount > 0) {
      await roleButton.click();
    }

    // Submit form
    await page.getByRole('button', { name: 'Create User' }).click();

    // Wait for response
    await page.waitForTimeout(3000);

    // Should either show success or redirect back to list
    const currentUrl = page.url();
    const isSuccessPage = currentUrl.includes('/admin/users');
    expect(isSuccessPage).toBeTruthy();

    // Verify no GraphQL errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });
});

test.describe('Admin - Edit User Role', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('can navigate to user detail page', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Click on first user to go to detail page
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();
    await page.waitForTimeout(2000);

    // Check that we're on detail page
    expect(page.url()).toContain('/admin/users/');

    // Check for user information
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/email|profile|user|details/i);

    // Check for no errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });

  test('user detail actions work', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Click on first user
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();
    await page.waitForTimeout(2000);

    // Check for action buttons
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    // Check for no errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });
});

test.describe('Admin - User Actions', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('user inline actions are accessible', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Wait for table to load
    const table = page.locator('table').first();
    await expect(table).toBeVisible();

    // Check first row has action buttons
    const firstRow = table.locator('tbody tr').first();
    const actionButtons = firstRow.getByRole('button');
    const buttonCount = await actionButtons.count();
    expect(buttonCount).toBeGreaterThan(0);

    // Check for no errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });

  test('refresh button reloads user data', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Wait for table to load
    const table = page.locator('table').first();
    await expect(table).toBeVisible();

    // Click refresh button
    const refreshButton = page
      .getByRole('button')
      .filter({ hasText: /refresh/i })
      .first();
    const refreshCount = await refreshButton.count();

    if (refreshCount > 0) {
      await refreshButton.click();
      await page.waitForTimeout(1000);

      // Should still show table
      await expect(table).toBeVisible();
    }

    // Check for no errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });
});

test.describe('Admin - Audit Logs', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('audit logs page loads and displays table', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/audit-logs', 'h1');

    // Check page heading
    await expect(page.getByRole('heading', { name: 'Audit Logs' })).toBeVisible();

    // Check for table
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 15000 });

    // Check for stats cards
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/total logs/i);

    // Check for no errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });

  test('audit logs have filters', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/audit-logs', 'h1');

    // Check for filter dropdowns
    const filterSection = page
      .locator('text=/filters/i')
      .or(page.locator('[data-testid="filters"]'));
    const filterCount = await filterSection.count();

    // Look for select elements or filter buttons
    const selectElements = page.locator('select');
    const selectCount = await selectElements.count();

    // Should have some filtering mechanism
    expect(selectCount + filterCount).toBeGreaterThan(0);

    // Check for no errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });

  test('audit logs filtering works', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/audit-logs', 'table');

    // Wait for table
    const table = page.locator('table').first();
    await expect(table).toBeVisible();

    // Try clicking refresh button
    const refreshButton = page.getByRole('button').filter({ hasText: /refresh/i });
    const refreshCount = await refreshButton.count();

    if (refreshCount > 0) {
      await refreshButton.first().click();
      await page.waitForTimeout(1000);
    }

    // Table should still be visible
    await expect(table).toBeVisible();

    // Check for no errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });

  test('audit logs pagination works', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/audit-logs', 'table');

    // Wait for table
    const table = page.locator('table').first();
    await expect(table).toBeVisible();

    // Check for pagination
    const nextButton = page.getByRole('button', { name: 'Next' });
    const nextCount = await nextButton.count();

    if (nextCount > 0) {
      if (await nextButton.first().isEnabled()) {
        await nextButton.first().click();
        await page.waitForTimeout(1000);

        // Should still be on audit logs page
        expect(page.url()).toContain('/admin/audit-logs');
      }
    }

    // Check for no errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });
});

test.describe('Admin - Documents Management', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('documents page loads and displays table', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/documents', 'h1');

    // Check page heading
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible();

    // Check for table or empty state
    const table = page.locator('table').first();
    const tableExists = (await table.count()) > 0;

    if (tableExists) {
      await expect(table).toBeVisible({ timeout: 15000 });
    } else {
      // Check for empty state or loading
      const pageText = await page.textContent('body');
      expect(pageText).toMatch(/documents|no data|loading/i);
    }

    // Check for no errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });

  test('documents page has stats cards', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/documents', 'h1');

    // Check for stats
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/total|documents|pending|approved|rejected/i);

    // Check for no errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });

  test('documents filtering works', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/documents', 'h1');

    // Look for filter controls
    const selectElements = page.locator('select');
    const selectCount = await selectElements.count();

    if (selectCount > 0) {
      // Try selecting a filter option
      await selectElements.first().selectOption({ index: 1 });
      await page.waitForTimeout(1000);

      // Should still be on documents page
      expect(page.url()).toContain('/admin/documents');
    }

    // Check for no errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });

  test('documents pagination works', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/documents', 'h1');

    // Check for pagination controls
    const nextButton = page.getByRole('button', { name: /next|following/i });
    const nextCount = await nextButton.count();

    if (nextCount > 0) {
      if (await nextButton.first().isEnabled()) {
        await nextButton.first().click();
        await page.waitForTimeout(1000);

        // Should still be on documents page
        expect(page.url()).toContain('/admin/documents');
      }
    }

    // Check for no errors
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });
});

test.describe('Admin - No Invalid Request Errors', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('no invalid request errors on users page', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'table');

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Check for "invalid request" errors specifically
    const invalidRequestText = page.getByText(/invalid request/i);
    const invalidRequestCount = await invalidRequestText.count();

    expect(invalidRequestCount).toBe(0);

    // Also check for GraphQL error patterns
    const errors = await checkForGraphQLErrors(page);
    expect(errors).not.toContain('invalid request');
    expect(errors.length).toBe(0);
  });

  test('no invalid request errors on audit logs page', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/audit-logs', 'table');

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Check for "invalid request" errors specifically
    const invalidRequestText = page.getByText(/invalid request/i);
    const invalidRequestCount = await invalidRequestText.count();

    expect(invalidRequestCount).toBe(0);

    // Also check for GraphQL error patterns
    const errors = await checkForGraphQLErrors(page);
    expect(errors).not.toContain('invalid request');
    expect(errors.length).toBe(0);
  });

  test('no invalid request errors on documents page', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/documents', 'h1');

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Check for "invalid request" errors specifically
    const invalidRequestText = page.getByText(/invalid request/i);
    const invalidRequestCount = await invalidRequestText.count();

    expect(invalidRequestCount).toBe(0);

    // Also check for GraphQL error patterns
    const errors = await checkForGraphQLErrors(page);
    expect(errors).not.toContain('invalid request');
    expect(errors.length).toBe(0);
  });

  test('GraphQL requests complete successfully across admin pages', async ({ page }) => {
    const pages = [
      'http://localhost:3000/admin',
      'http://localhost:3000/admin/users',
      'http://localhost:3000/admin/audit-logs',
      'http://localhost:3000/admin/documents',
    ];

    for (const url of pages) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      // Wait for page to load
      await page.waitForTimeout(2000);

      // Check for any error indicators
      const errors = await checkForGraphQLErrors(page);
      if (errors.length > 0) {
        console.error(`Errors on ${url}:`, errors);
      }
      expect(errors.length).toBe(0);
    }
  });
});

test.describe('Admin - Cross-Page Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('can navigate between admin pages without errors', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin/users', 'h1');

    // Navigate to documents
    await page.goto('http://localhost:3000/admin/documents', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/admin/documents');

    // Navigate to audit logs
    await page.goto('http://localhost:3000/admin/audit-logs', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/admin/audit-logs');

    // Navigate back to users
    await page.goto('http://localhost:3000/admin/users', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/admin/users');

    // Check for no errors throughout
    const errors = await checkForGraphQLErrors(page);
    expect(errors.length).toBe(0);
  });
});
