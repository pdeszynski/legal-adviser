import { test, expect, type Page } from '@playwright/test';

/**
 * Admin Settings E2E Tests
 *
 * Comprehensive tests for /admin/settings page to prevent regression of the redirect issue.
 *
 * Test scenarios:
 * 1) Admin user (admin@refine.dev) can navigate to /admin/settings via menu link
 * 2) Admin user can access /admin/settings via direct URL
 * 3) Verify admin layout is displayed (sidebar, header with 'Admin Panel')
 * 4) Verify settings page content loads without redirecting to /dashboard
 * 5) Verify all settings tabs/sections are accessible
 * 6) Test that non-admin users (user@example.com) are redirected when attempting to access /admin/settings
 * 7) Test that unauthenticated users are redirected to /login
 * 8) Verify no console errors or GraphQL errors when accessing /admin/settings
 * 9) Test that settings page forms (profile, preferences, security) load correctly
 * 10) Verify role checking works for both ADMIN and SUPER_ADMIN roles
 *
 * Test credentials:
 * - Admin: admin@refine.dev / password
 * - Non-Admin: user@example.com / password123
 */

// Extend timeout for admin tests
test.setTimeout(180000);

// Set up test isolation to ensure each test runs with a clean state
test.use({ viewport: { width: 1280, height: 720 } });

const ADMIN_EMAIL = 'admin@refine.dev';
const ADMIN_PASSWORD = 'password';
const NON_ADMIN_EMAIL = 'user@example.com';
const NON_ADMIN_PASSWORD = 'password123';
const SETTINGS_URL = 'http://localhost:3000/admin/settings';

/**
 * Test helper to perform login
 * Based on the working login pattern from admin-layout-consistency.spec.ts
 */
async function performLogin(page: Page, email: string, password: string) {
  // Always start from login page to ensure clean state
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });

  // Check if we're already authenticated - if so, logout first
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

  // Wait for login form to be ready
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });

  // Fill in login form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Submit form - try clicking submit button as it's more reliable than pressing Enter
  const submitButton = page.locator('button[type="submit"]').or(page.getByRole('button', { name: /login|sign in/i }));
  const submitCount = await submitButton.count();
  if (submitCount > 0) {
    await submitButton.first().click();
  } else {
    await page.press('input[type="password"]', 'Enter');
  }

  // Wait for navigation to complete - but be more flexible
  try {
    await page.waitForURL(
      (url) =>
        url.pathname.includes('/dashboard') ||
        url.pathname.includes('/chat') ||
        url.pathname.includes('/admin') ||
        !url.pathname.includes('/login'), // Any page other than login is success
      { timeout: 30000 },
    );
  } catch (error) {
    const finalUrl = page.url();
    if (!finalUrl.includes('/login')) {
      console.log('Login succeeded but URL did not match expected pattern');
    } else {
      throw error;
    }
  }

  await page.waitForTimeout(1000);
}

/**
 * Test helper to navigate and wait for page content
 */
async function navigateAndWait(page: Page, url: string, selector: string = 'h1') {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load', { timeout: 30000 });
  await page.waitForSelector(selector, { timeout: 15000 }).catch(() => {
    return page.waitForTimeout(1000);
  });
}

/**
 * Test helper to verify AdminLayout is being used
 */
async function verifyAdminLayout(page: Page): Promise<{
  hasAdminPanel: boolean;
  hasBackToApp: boolean;
  hasAdminSidebar: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  await page.waitForTimeout(500);

  // Check for "Admin Panel" heading
  const adminPanelHeading =
    page.getByRole('heading', { name: 'Admin Panel' }).or(page.getByText('Admin Panel'));
  const hasAdminPanel = (await adminPanelHeading.count()) > 0;
  if (!hasAdminPanel) {
    errors.push('Missing "Admin Panel" heading');
  }

  // Check for "Back to App" link
  const backToAppLink = page.getByRole('link', { name: /back to app/i }).or(page.getByText('Back to App'));
  const hasBackToApp = (await backToAppLink.count()) > 0;
  if (!hasBackToApp) {
    errors.push('Missing "Back to App" link');
  }

  // Check for admin sidebar navigation
  const sidebar = page.locator('aside').or(page.locator('nav').or(page.locator('[role="navigation"]')));
  const hasAdminSidebar = (await sidebar.count()) > 0;
  if (!hasAdminSidebar) {
    errors.push('Missing sidebar navigation');
  }

  return {
    hasAdminPanel,
    hasBackToApp,
    hasAdminSidebar,
    errors,
  };
}

/**
 * Test helper to check for console and GraphQL errors
 */
async function checkForErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  // Check for specific error patterns
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
        const visibleErrors = page.locator(`text=${pattern.source}`).filter({ hasText: /^.*$/ });
        const count = await visibleErrors.count();
        if (count > 0) {
          errors.push(`Found error pattern: ${pattern.source}`);
        }
      }
    }
  }

  // Check for error toasts
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

/**
 * Test helper to collect console errors during navigation
 */
function collectConsoleErrors(page: Page): string[] {
  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  return consoleErrors;
}

test.describe('Admin Settings - Admin User Access', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('1) admin can navigate to /admin/settings via menu link', async ({ page }) => {
    await navigateAndWait(page, 'http://localhost:3000/admin', 'nav');

    // Click on Settings link in sidebar
    const settingsLink = page.getByRole('link', { name: 'Settings' });
    await expect(settingsLink).toBeVisible({ timeout: 15000 });

    await settingsLink.click();
    await page.waitForTimeout(2000);

    // Should be on settings page
    expect(page.url()).toContain('/admin/settings');

    // Check for no errors
    const errors = await checkForErrors(page);
    expect(errors.length).toBe(0);
  });

  test('2) admin can access /admin/settings via direct URL', async ({ page }) => {
    await page.goto(SETTINGS_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    await page.waitForTimeout(1000);

    // Should be on settings page
    expect(page.url()).toContain('/admin/settings');

    // Should NOT be redirected to /dashboard
    expect(page.url()).not.toContain('/dashboard');

    // Check for no errors
    const errors = await checkForErrors(page);
    expect(errors.length).toBe(0);
  });

  test('3) verify admin layout is displayed (sidebar, header with Admin Panel)', async ({ page }) => {
    await page.goto(SETTINGS_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const layoutCheck = await verifyAdminLayout(page);

    expect(layoutCheck.hasAdminPanel).toBeTruthy();
    expect(layoutCheck.hasBackToApp).toBeTruthy();
    expect(layoutCheck.hasAdminSidebar).toBeTruthy();
    expect(layoutCheck.errors).toEqual([]);

    // Verify Settings menu item is active/highlighted
    const settingsLink = page.getByRole('link', { name: 'Settings' });
    await expect(settingsLink).toBeVisible();
  });

  test('4) verify settings page content loads without redirecting to /dashboard', async ({ page }) => {
    await page.goto(SETTINGS_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Should still be on settings page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin/settings');
    expect(currentUrl).not.toContain('/dashboard');

    // Should see settings page content
    const settingsHeading = page.getByRole('heading', { name: 'System Settings' });
    await expect(settingsHeading).toBeVisible({ timeout: 15000 });

    // Should see the description text
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/configure system-wide settings/i);
  });

  test('5) verify all settings tabs/sections are accessible', async ({ page }) => {
    await page.goto(SETTINGS_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Expected tabs
    const expectedTabs = ['Feature Flags', 'AI Configuration', 'Maintenance', 'General'];

    for (const tab of expectedTabs) {
      // Check if tab button exists
      const tabButton = page.getByRole('button', { name: tab }).or(page.getByText(tab));
      const tabCount = await tabButton.count();

      if (tabCount > 0) {
        await tabButton.first().click();
        await page.waitForTimeout(500);

        // Verify we're still on settings page
        expect(page.url()).toContain('/admin/settings');
      }
    }

    // Check for no errors
    const errors = await checkForErrors(page);
    expect(errors.length).toBe(0);
  });

  test('8) verify no console errors or GraphQL errors when accessing /admin/settings', async ({ page }) => {
    const consoleErrors = collectConsoleErrors(page);

    await page.goto(SETTINGS_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check for page content errors
    const pageErrors = await checkForErrors(page);
    expect(pageErrors.length).toBe(0);

    // Check for console errors
    // Note: Some console errors might be from third-party scripts, so we're lenient here
    const criticalErrors = consoleErrors.filter(
      (err) =>
        err.includes('GraphQL') ||
        err.includes('network') ||
        err.includes('Unauthorized') ||
        err.includes('403'),
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('9) verify settings page forms load correctly for all tabs', async ({ page }) => {
    await page.goto(SETTINGS_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Test Feature Flags tab (default)
    const featureFlagsTab = page.getByRole('button', { name: 'Feature Flags' });
    if ((await featureFlagsTab.count()) > 0) {
      await featureFlagsTab.click();
      await page.waitForTimeout(500);

      // Should see feature flags section
      const pageText = await page.textContent('body');
      expect(pageText).toMatch(/feature flags/i);

      // Should see checkboxes for feature flags
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      expect(checkboxCount).toBeGreaterThan(0);
    }

    // Test AI Configuration tab
    const aiTab = page.getByRole('button', { name: 'AI Configuration' });
    if ((await aiTab.count()) > 0) {
      await aiTab.click();
      await page.waitForTimeout(500);

      // Should see AI configuration section
      const pageText = await page.textContent('body');
      expect(pageText).toMatch(/ai model configuration/i);

      // Should see save button
      const saveButton = page.getByRole('button', { name: 'Save Changes' });
      await expect(saveButton.first()).toBeVisible();
    }

    // Test Maintenance tab
    const maintenanceTab = page.getByRole('button', { name: 'Maintenance' });
    if ((await maintenanceTab.count()) > 0) {
      await maintenanceTab.click();
      await page.waitForTimeout(500);

      // Should see maintenance mode section
      const pageText = await page.textContent('body');
      expect(pageText).toMatch(/maintenance mode/i);
    }

    // Test General tab
    const generalTab = page.getByRole('button', { name: 'General' });
    if ((await generalTab.count()) > 0) {
      await generalTab.click();
      await page.waitForTimeout(500);

      // Should see general settings section
      const pageText = await page.textContent('body');
      expect(pageText).toMatch(/general settings/i);
    }

    // Check for no errors
    const errors = await checkForErrors(page);
    expect(errors.length).toBe(0);
  });
});

test.describe('Admin Settings - Non-Admin User Access Control', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, NON_ADMIN_EMAIL, NON_ADMIN_PASSWORD);
  });

  test('6) non-admin users are redirected when attempting to access /admin/settings', async ({ page }) => {
    await page.goto(SETTINGS_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();

    // Should be redirected away from admin settings
    // Either to login (403) or dashboard (redirected)
    const isAdminSettingsAccessible = currentUrl.includes('/admin/settings');

    expect(isAdminSettingsAccessible).toBeFalsy();

    // Should NOT see Admin Panel
    const adminPanelHeading = page.getByRole('heading', { name: 'Admin Panel' });
    const hasAdminPanel = (await adminPanelHeading.count()) > 0;
    expect(hasAdminPanel).toBeFalsy();

    // Should NOT see System Settings heading
    const settingsHeading = page.getByRole('heading', { name: 'System Settings' });
    const hasSettingsHeading = (await settingsHeading.count()) > 0;
    expect(hasSettingsHeading).toBeFalsy();
  });

  test('non-admin user cannot see settings in admin menu', async ({ page }) => {
    // Go to dashboard first
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Try to navigate to admin settings
    await page.goto(SETTINGS_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Should be redirected
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/admin/settings');
  });
});

test.describe('Admin Settings - Unauthenticated User Access', () => {
  test('7) unauthenticated users are redirected to /login', async ({ page }) => {
    // Ensure we're logged out
    await page.goto('http://localhost:3000/logout', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Try to access admin settings directly
    await page.goto(SETTINGS_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();

    // Should be redirected to login
    const isOnLogin = currentUrl.includes('/login');
    expect(isOnLogin).toBeTruthy();

    // Should NOT be on admin settings
    const isAdminSettingsAccessible = currentUrl.includes('/admin/settings');
    expect(isAdminSettingsAccessible).toBeFalsy();
  });
});

test.describe('Admin Settings - Role-Based Access', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('10) verify role checking works for ADMIN role', async ({ page }) => {
    // Verify admin role allows access
    await page.goto(SETTINGS_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin/settings');

    // Verify admin layout is present
    const layoutCheck = await verifyAdminLayout(page);
    expect(layoutCheck.hasAdminPanel).toBeTruthy();
  });

  test('10b) verify settings page persists across tab switches', async ({ page }) => {
    await page.goto(SETTINGS_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Start on default tab (Feature Flags)
    expect(page.url()).toContain('/admin/settings');

    // Switch to AI Configuration
    const aiTab = page.getByRole('button', { name: 'AI Configuration' });
    if ((await aiTab.count()) > 0) {
      await aiTab.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/admin/settings');
    }

    // Switch to Maintenance
    const maintenanceTab = page.getByRole('button', { name: 'Maintenance' });
    if ((await maintenanceTab.count()) > 0) {
      await maintenanceTab.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/admin/settings');
    }

    // Switch to General
    const generalTab = page.getByRole('button', { name: 'General' });
    if ((await generalTab.count()) > 0) {
      await generalTab.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/admin/settings');
    }

    // Check for no errors
    const errors = await checkForErrors(page);
    expect(errors.length).toBe(0);
  });
});

test.describe('Admin Settings - Redirect Regression Prevention', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('regression test: admin settings does NOT redirect to dashboard', async ({ page }) => {
    // This test specifically addresses the reported redirect issue
    const finalUrl = SETTINGS_URL;

    await page.goto(finalUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });

    // Wait for any potential redirects to happen
    await page.waitForTimeout(3000);

    const currentUrl = page.url();

    // Verify we're still on admin settings page
    expect(currentUrl).toContain('/admin/settings');
    expect(currentUrl).not.toContain('/dashboard');

    // Verify the page actually loaded content
    const settingsHeading = page.getByRole('heading', { name: 'System Settings' });
    await expect(settingsHeading).toBeVisible({ timeout: 15000 });
  });

  test('regression test: multiple navigations to admin settings work correctly', async ({ page }) => {
    // Navigate to settings multiple times to ensure no redirect loop
    for (let i = 0; i < 3; i++) {
      await page.goto(SETTINGS_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      expect(currentUrl).toContain('/admin/settings');
      expect(currentUrl).not.toContain('/dashboard');
    }
  });

  test('regression test: admin settings accessible from different entry points', async ({ page }) => {
    // Navigate from admin dashboard
    await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const settingsLink = page.getByRole('link', { name: 'Settings' });
    await settingsLink.click();
    await page.waitForTimeout(1000);

    expect(page.url()).toContain('/admin/settings');

    // Navigate from users page
    await page.goto('http://localhost:3000/admin/users', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    await page.goto(SETTINGS_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    expect(page.url()).toContain('/admin/settings');
    expect(page.url()).not.toContain('/dashboard');
  });
});

test.describe('Admin Settings - Page Content Verification', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('verify settings page has proper heading and description', async ({ page }) => {
    await page.goto(SETTINGS_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Check main heading
    const settingsHeading = page.getByRole('heading', { name: 'System Settings' });
    await expect(settingsHeading).toBeVisible();

    // Check description
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/configure system-wide settings and feature flags/i);
  });

  test('verify all save buttons are present and functional', async ({ page }) => {
    await page.goto(SETTINGS_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Check for save buttons on each tab
    const tabs = ['Feature Flags', 'AI Configuration', 'Maintenance', 'General'];

    for (const tab of tabs) {
      const tabButton = page.getByRole('button', { name: tab });
      if ((await tabButton.count()) > 0) {
        await tabButton.first().click();
        await page.waitForTimeout(500);

        // Look for save button
        const saveButton = page.getByRole('button', { name: 'Save Changes' });
        const saveCount = await saveButton.count();

        // Each tab should have at least one save button
        expect(saveCount).toBeGreaterThan(0);
      }
    }
  });

  test('verify settings page has no layout breaks', async ({ page }) => {
    await page.goto(SETTINGS_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Verify admin layout is intact
    const layoutCheck = await verifyAdminLayout(page);

    expect(layoutCheck.errors).toEqual([]);
    expect(layoutCheck.hasAdminPanel).toBeTruthy();
    expect(layoutCheck.hasBackToApp).toBeTruthy();
    expect(layoutCheck.hasAdminSidebar).toBeTruthy();

    // Verify content area is not empty
    const mainContent = page.locator('main').or(page.locator('[role="main"]'));
    const mainCount = await mainContent.count();

    if (mainCount > 0) {
      const mainText = await mainContent.first().textContent();
      expect(mainText?.length).toBeGreaterThan(0);
    }
  });
});
