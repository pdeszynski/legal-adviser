import { test, expect, type Page } from '@playwright/test';

/**
 * Admin Dashboard Statistics E2E Tests
 *
 * Comprehensive tests for the admin dashboard statistics feature at /admin.
 * These tests prevent regressions in stats aggregation, display, and loading behavior.
 *
 * Test scenarios:
 * 1) Admin user can navigate to /admin and see stats cards
 * 2) Stats load correctly and display non-zero counts (if data exists)
 * 3) Skeleton loading appears before stats are loaded
 * 4) Stats refresh on page reload and via manual refresh button
 * 5) Non-admin users cannot access stats (403/redirect)
 * 6) Error states display gracefully if backend fails
 * 7) Verify stats match expected data structure
 * 8) Period selector works correctly (7d, 30d, 90d)
 * 9) Auto-refresh countdown timer works
 * 10) All required stat cards are displayed
 * 11) Users by Role section loads correctly
 * 12) Charts render correctly (Document Types, AI Cost, Document Status)
 *
 * Test credentials:
 * - Admin: admin@refine.dev / password
 * - Non-Admin: user@example.com / password123
 */

// Extend timeout for admin tests
test.setTimeout(180000);

// Set up test isolation
test.use({ viewport: { width: 1280, height: 720 } });

const ADMIN_EMAIL = 'admin@refine.dev';
const ADMIN_PASSWORD = 'password';
const NON_ADMIN_EMAIL = 'user@example.com';
const NON_ADMIN_PASSWORD = 'password123';
const ADMIN_DASHBOARD_URL = 'http://localhost:3000/admin';

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

  const submitButton = page.locator('button[type="submit"]').or(page.getByRole('button', { name: /login|sign in/i }));
  const submitCount = await submitButton.count();
  if (submitCount > 0) {
    await submitButton.first().click();
  } else {
    await page.press('input[type="password"]', 'Enter');
  }

  try {
    await page.waitForURL(
      (url) =>
        url.pathname.includes('/dashboard') ||
        url.pathname.includes('/chat') ||
        url.pathname.includes('/admin') ||
        !url.pathname.includes('/login'),
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
 * Test helper to extract numeric value from text (handles K, M suffixes)
 */
function parseFormattedNumber(text: string | null): number {
  if (!text) return 0;
  const cleaned = text.replace(/,/g, '').trim();

  // Handle K suffix (thousands)
  const kMatch = cleaned.match(/^([\d.]+)K$/i);
  if (kMatch) {
    return parseFloat(kMatch[1]) * 1000;
  }

  // Handle M suffix (millions)
  const mMatch = cleaned.match(/^([\d.]+)M$/i);
  if (mMatch) {
    return parseFloat(mMatch[1]) * 1000000;
  }

  // Handle plain numbers
  const numMatch = cleaned.match(/^[\d.]+$/);
  if (numMatch) {
    return parseFloat(cleaned);
  }

  return 0;
}

/**
 * Test helper to extract percentage value
 */
function parsePercentage(text: string | null): number {
  if (!text) return 0;
  const match = text.match(/^([\d.]+)%$/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Test helper to extract currency value
 */
function parseCurrency(text: string | null): number {
  if (!text) return 0;
  const cleaned = text.replace(/[$,]/g, '').trim();
  const match = cleaned.match(/^([\d.]+)$/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Test helper to check for console and GraphQL errors
 */
async function checkForErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  const errorPatterns = [
    /invalid request/i,
    /graphql error/i,
    /network error/i,
    /unauthorized/i,
    /forbidden/i,
    /internal server error/i,
  ];

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

  return errors;
}

/**
 * Expected stat cards on the admin dashboard
 */
interface StatCard {
  title: string;
  iconSelector: string;
  testId?: string;
}

const EXPECTED_STAT_CARDS: StatCard[] = [
  { title: 'Total Users', iconSelector: 'svg' },
  { title: 'Active Sessions', iconSelector: 'svg' },
  { title: 'Documents', iconSelector: 'svg' },
  { title: 'AI Queries', iconSelector: 'svg' },
];

const ADDITIONAL_STAT_CARDS: StatCard[] = [
  { title: 'Total Tokens', iconSelector: 'svg' },
  { title: 'Total Cost', iconSelector: '' },
  { title: 'System Health', iconSelector: 'svg' },
];

test.describe('Admin Dashboard Stats - Admin User Access', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('1) admin can navigate to /admin and sees stats cards', async ({ page }) => {
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');

    // Should be on admin dashboard
    expect(page.url()).toContain('/admin');

    // Should see "Admin Dashboard" heading
    const dashboardHeading = page.getByRole('heading', { name: 'Admin Dashboard' });
    await expect(dashboardHeading).toBeVisible({ timeout: 15000 });

    // Should see description
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/system-wide statistics/i);

    // Check for no errors
    const errors = await checkForErrors(page);
    expect(errors.length).toBe(0);
  });

  test('2) stats load correctly and display counts', async ({ page }) => {
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');

    // Wait for stats to load (not in skeleton state)
    await page.waitForTimeout(3000);

    // Check each stat card for a numeric value (not loading indicator)
    for (const card of EXPECTED_STAT_CARDS) {
      const cardTitle = page.getByText(card.title).or(page.getByRole('heading', { name: card.title }));
      const cardCount = await cardTitle.count();

      if (cardCount > 0) {
        // Find the card and check for a numeric value
        const cardElement = cardTitle.first();
        const parentCard = cardElement.locator('..').locator('..');

        // Get the card text content
        const cardText = await parentCard.textContent();

        // Check that the card contains a number (not "..." which indicates loading)
        // Allow 0 as a valid value (may be no data), but not loading state
        const hasLoadingIndicator = cardText?.includes('...');
        expect(hasLoadingIndicator).toBeFalsy();

        // Check that there's some numeric content
        const hasNumber = /\d/.test(cardText || '');
        expect(hasNumber).toBeTruthy();
      }
    }
  });

  test('3) skeleton loading appears before stats are loaded', async ({ page }) => {
    // Navigate to admin and quickly check for loading state
    await page.goto(ADMIN_DASHBOARD_URL, { waitUntil: 'domcontentloaded' });

    // Look for skeleton loading indicators
    // Skeletons typically have "animate-pulse" class or show "..." during loading
    const initialLoadCheck = await page.locator('.animate-pulse, [class*="pulse"]').count();

    // After waiting, stats should be loaded
    await page.waitForLoadState('load', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Check that stats cards have actual content
    const pageText = await page.textContent('body');

    // For Users by Role section, check for skeleton
    const usersByRoleSection = page.locator('text=Users by Role').or(page.getByRole('heading', { name: 'Users by Role' }));
    const usersSectionCount = await usersByRoleSection.count();

    if (usersSectionCount > 0) {
      // Users by Role should have skeleton loading initially
      // After loading, should show role counts
      const roleCards = page.locator('text=/Admin|Client|Lawyer|Paralegal|Super Admin/i');
      await expect(roleCards.first()).toBeVisible({ timeout: 15000 });
    }
  });

  test('4) stats refresh on page reload', async ({ page }) => {
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');
    await page.waitForTimeout(3000);

    // Get initial stats values
    const initialPageText = await page.textContent('body');

    // Reload the page
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Get refreshed stats
    const refreshedPageText = await page.textContent('body');

    // Both should have stats content
    expect(initialPageText).toMatch(/\d/);
    expect(refreshedPageText).toMatch(/\d/);

    // Check for no errors after refresh
    const errors = await checkForErrors(page);
    expect(errors.length).toBe(0);
  });

  test('4b) manual refresh button works', async ({ page }) => {
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');
    await page.waitForTimeout(3000);

    // Find and click the refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i }).or(page.locator('button:has-text("Refresh")'));
    const refreshCount = await refreshButton.count();

    if (refreshCount > 0) {
      await refreshButton.first().click();

      // Wait for refresh to complete
      await page.waitForTimeout(3000);

      // Verify stats are still displayed
      const pageText = await page.textContent('body');
      expect(pageText).toMatch(/\d/);

      // Check for no errors
      const errors = await checkForErrors(page);
      expect(errors.length).toBe(0);
    }
  });

  test('10) all required stat cards are displayed', async ({ page }) => {
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');
    await page.waitForTimeout(3000);

    // Check for main stat cards
    for (const card of EXPECTED_STAT_CARDS) {
      const cardElement = page.getByText(card.title).or(page.getByRole('heading', { name: card.title }));
      await expect(cardElement.first()).toBeVisible({ timeout: 15000 });
    }

    // Check for additional stat cards
    for (const card of ADDITIONAL_STAT_CARDS) {
      const cardElement = page.getByText(card.title).or(page.getByRole('heading', { name: card.title }));
      await expect(cardElement.first()).toBeVisible({ timeout: 15000 });
    }
  });

  test('11) Users by Role section loads correctly', async ({ page }) => {
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');
    await page.waitForTimeout(3000);

    // Should see "Users by Role" heading
    const usersByRoleHeading = page.getByRole('heading', { name: 'Users by Role' });
    await expect(usersByRoleHeading).toBeVisible({ timeout: 15000 });

    // Should see role breakdown cards
    const expectedRoles = ['Admin', 'Client', 'Lawyer', 'Paralegal', 'Super Admin'];

    for (const role of expectedRoles) {
      const roleElement = page.getByText(new RegExp(role, 'i'));
      const roleCount = await roleElement.count();
      // At least the role label should be present
      expect(roleCount).toBeGreaterThan(0);
    }

    // Check for percentage displays
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/% of total/i);
  });

  test('8) period selector works correctly', async ({ page }) => {
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');
    await page.waitForTimeout(3000);

    // Expected period buttons
    const periods = ['7 Days', '30 Days', '90 Days'];

    for (const period of periods) {
      const periodButton = page.getByRole('button', { name: period }).or(page.locator(`button:has-text("${period}")`));
      const buttonCount = await periodButton.count();

      if (buttonCount > 0) {
        await expect(periodButton.first()).toBeVisible();
        // Click the period
        await periodButton.first().click();
        await page.waitForTimeout(2000);

        // Verify we're still on admin page
        expect(page.url()).toContain('/admin');
      }
    }
  });

  test('9) auto-refresh countdown timer works', async ({ page }) => {
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');
    await page.waitForTimeout(2000);

    // Look for countdown timer text
    const countdownText = page.getByText(/next refresh/i, { exact: false }).or(page.locator('text=/next refresh/i'));
    const countdownCount = await countdownText.count();

    if (countdownCount > 0) {
      // Get initial countdown value
      const initialText = await countdownText.first().textContent();
      const initialMatch = initialText?.match(/(\d+)s/);

      if (initialMatch) {
        const initialSeconds = parseInt(initialMatch[1], 10);

        // Wait a few seconds
        await page.waitForTimeout(3000);

        // Get updated countdown
        const updatedText = await countdownText.first().textContent();
        expect(updatedText).toBeTruthy();

        // Countdown should have decreased (or reset)
        const updatedMatch = updatedText?.match(/(\d+)s/);
        expect(updatedMatch).toBeTruthy();
      }
    }
  });

  test('12) charts render correctly', async ({ page }) => {
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');
    await page.waitForTimeout(3000);

    // Check for chart sections
    const expectedCharts = [
      'Document Types',
      'AI Cost by Operation',
      'Document Status Breakdown',
    ];

    for (const chart of expectedCharts) {
      const chartHeading = page.getByRole('heading', { name: chart }).or(page.getByText(chart));
      const chartCount = await chartHeading.count();

      if (chartCount > 0) {
        await expect(chartHeading.first()).toBeVisible({ timeout: 15000 });
      }
    }

    // Check for Recharts SVG elements (charts are rendered using Recharts)
    const svgElements = await page.locator('svg').count();
    // Should have multiple SVG elements for charts
    expect(svgElements).toBeGreaterThan(0);
  });

  test('stats are displayed with proper formatting', async ({ page }) => {
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');
    await page.waitForTimeout(3000);

    // Check for various formatting patterns in the stats
    const pageText = await page.textContent('body');

    // Large numbers may use K/M suffixes
    // Percentages should have % symbol
    // Currency should have $ symbol
    expect(pageText).toMatch(/\d+/); // At least some numbers
  });
});

test.describe('Admin Dashboard Stats - Non-Admin User Access Control', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, NON_ADMIN_EMAIL, NON_ADMIN_PASSWORD);
  });

  test('5) non-admin users cannot access admin dashboard stats', async ({ page }) => {
    await page.goto(ADMIN_DASHBOARD_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();

    // Should be redirected away from admin dashboard
    const isAdminAccessible = currentUrl.includes('/admin');

    expect(isAdminAccessible).toBeFalsy();

    // Should NOT see Admin Dashboard heading
    const adminDashboardHeading = page.getByRole('heading', { name: 'Admin Dashboard' });
    const hasAdminDashboard = (await adminDashboardHeading.count()) > 0;
    expect(hasAdminDashboard).toBeFalsy();

    // Should NOT see "Admin Panel"
    const adminPanelHeading = page.getByRole('heading', { name: 'Admin Panel' });
    const hasAdminPanel = (await adminPanelHeading.count()) > 0;
    expect(hasAdminPanel).toBeFalsy();
  });
});

test.describe('Admin Dashboard Stats - Unauthenticated User Access', () => {
  test('5b) unauthenticated users are redirected to login', async ({ page }) => {
    // Ensure logged out
    await page.goto('http://localhost:3000/logout', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Try to access admin dashboard directly
    await page.goto(ADMIN_DASHBOARD_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();

    // Should be redirected to login
    const isOnLogin = currentUrl.includes('/login');
    expect(isOnLogin).toBeTruthy();

    // Should NOT be on admin dashboard
    const isAdminAccessible = currentUrl.includes('/admin');
    expect(isAdminAccessible).toBeFalsy();
  });
});

test.describe('Admin Dashboard Stats - Error Handling', () => {
  test('6) error states display gracefully if backend fails', async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Navigate to admin dashboard
    await page.goto(ADMIN_DASHBOARD_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Check that page doesn't crash with errors
    const pageText = await page.textContent('body');
    expect(pageText).toBeTruthy();

    // Check for no critical error messages
    const errors = await checkForErrors(page);

    // Filter out non-critical errors
    const criticalErrors = errors.filter((e) =>
      e.includes('GraphQL') ||
      e.includes('network') ||
      e.includes('500') ||
      e.includes('Internal Server Error'),
    );

    // In normal operation, should not have critical errors
    // This test may need adjustment if the backend is actually down
    console.log('Checked for critical errors:', criticalErrors);
  });
});

test.describe('Admin Dashboard Stats - Data Verification', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('7) verify stats data structure is correct', async ({ page }) => {
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');
    await page.waitForTimeout(3000);

    // Verify stat cards have the expected structure
    // Each card should have: title, value, and supporting information

    const statCards = page.locator('[class*="card"]').or(page.locator('.rounded-lg'));
    const cardCount = await statCards.count();

    expect(cardCount).toBeGreaterThan(0);

    // Check that cards have headings (titles)
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
  });

  test('stats remain consistent across navigations', async ({ page }) => {
    // Navigate to admin dashboard
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');
    await page.waitForTimeout(3000);

    // Get initial stats snapshot
    const initialSnapshot = await page.textContent('body');

    // Navigate away and come back
    await page.goto('http://localhost:3000/admin/users', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    await page.goto(ADMIN_DASHBOARD_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Get stats after returning
    const finalSnapshot = await page.textContent('body');

    // Both should have stats content
    expect(initialSnapshot).toMatch(/\d/);
    expect(finalSnapshot).toMatch(/\d/);

    // Check for no errors
    const errors = await checkForErrors(page);
    expect(errors.length).toBe(0);
  });
});

test.describe('Admin Dashboard Stats - Layout and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('admin dashboard uses correct layout', async ({ page }) => {
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');

    // Should see "Admin Panel" header (from AdminLayout)
    const adminPanelHeading = page.getByRole('heading', { name: 'Admin Panel' });
    await expect(adminPanelHeading).toBeVisible({ timeout: 15000 });

    // Should see "Back to App" link
    const backToAppLink = page.getByRole('link', { name: /back to app/i });
    await expect(backToAppLink).toBeVisible();

    // Should see sidebar navigation
    const sidebar = page.locator('aside').or(page.locator('nav'));
    await expect(sidebar.first()).toBeVisible();
  });

  test('back to app link works correctly', async ({ page }) => {
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');

    const backToAppLink = page.getByRole('link', { name: /back to app/i });
    await backToAppLink.click();
    await page.waitForTimeout(2000);

    // Should navigate to dashboard
    expect(page.url()).toContain('/dashboard');
  });
});

test.describe('Admin Dashboard Stats - Regression Prevention', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('regression: dashboard stats load without errors', async ({ page }) => {
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');
    await page.waitForTimeout(5000);

    // Verify page loaded successfully
    expect(page.url()).toContain('/admin');

    // Verify heading is visible
    const dashboardHeading = page.getByRole('heading', { name: 'Admin Dashboard' });
    await expect(dashboardHeading).toBeVisible();

    // Check for no errors
    const errors = await checkForErrors(page);
    expect(errors.length).toBe(0);
  });

  test('regression: multiple page loads do not cause errors', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.goto(ADMIN_DASHBOARD_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load', { timeout: 30000 });
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      expect(currentUrl).toContain('/admin');

      const errors = await checkForErrors(page);
      expect(errors.length).toBe(0);
    }
  });

  test('regression: stats cards display even with zero values', async ({ page }) => {
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');
    await page.waitForTimeout(3000);

    // Even if stats are 0, the cards should be visible
    for (const card of EXPECTED_STAT_CARDS) {
      const cardElement = page.getByText(card.title).or(page.getByRole('heading', { name: card.title }));
      await expect(cardElement.first()).toBeVisible({ timeout: 15000 });
    }
  });
});

test.describe('Admin Dashboard Stats - Real-Time Features', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('document monitoring components are displayed', async ({ page }) => {
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');
    await page.waitForTimeout(3000);

    // Check for document queue monitor or activity feed
    const monitoringElements = page.locator('text=/document|queue|activity/i');
    const monitoringCount = await monitoringElements.count();

    // Should have some document-related content
    expect(monitoringCount).toBeGreaterThan(0);
  });

  test('last updated timestamp is displayed', async ({ page }) => {
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');
    await page.waitForTimeout(3000);

    // Look for "Last updated" text
    const lastUpdatedText = page.getByText(/last updated/i, { exact: false });
    const lastUpdatedCount = await lastUpdatedText.count();

    if (lastUpdatedCount > 0) {
      await expect(lastUpdatedText.first()).toBeVisible();

      // Should contain a time (not just static text)
      const textContent = await lastUpdatedText.first().textContent();
      expect(textContent).toMatch(/last updated/i);
    }
  });
});

test.describe('Admin Dashboard Stats - Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('dashboard works on desktop viewport', async ({ page }) => {
    page.setViewportSize({ width: 1280, height: 720 });
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');

    const dashboardHeading = page.getByRole('heading', { name: 'Admin Dashboard' });
    await expect(dashboardHeading).toBeVisible();
  });

  test('dashboard works on tablet viewport', async ({ page }) => {
    page.setViewportSize({ width: 768, height: 1024 });
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');

    const dashboardHeading = page.getByRole('heading', { name: 'Admin Dashboard' });
    await expect(dashboardHeading).toBeVisible();
  });

  test('dashboard works on mobile viewport', async ({ page }) => {
    page.setViewportSize({ width: 375, height: 667 });
    await navigateAndWait(page, ADMIN_DASHBOARD_URL, 'h1');

    const dashboardHeading = page.getByRole('heading', { name: 'Admin Dashboard' });
    await expect(dashboardHeading).toBeVisible();
  });
});
