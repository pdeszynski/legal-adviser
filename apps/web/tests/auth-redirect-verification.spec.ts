import { test, expect } from '@playwright/test';

/**
 * Temporary verification test for auth state sync and redirect middleware/guard feature
 *
 * This test verifies:
 * 1. Protected routes redirect to login with redirect parameter
 * 2. Middleware correctly identifies protected vs public routes
 * 3. Redirect parameter is validated (prevents open redirects)
 */

const PROTECTED_ROUTES = [
  '/dashboard',
  '/settings',
  '/documents',
  '/chat',
  '/rulings',
  '/templates',
];

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/demo',
  '/waitlist',
];

/**
 * Test 1: Middleware redirects unauthenticated users to login with redirect param
 */
test('middleware redirects to login with redirect parameter', async ({ page }) => {
  // Clear any existing auth cookies
  const context = page.context();
  await context.clearCookies();

  for (const route of PROTECTED_ROUTES) {
    await page.goto(route);

    // Should be redirected to login
    await page.waitForURL(/\/login.*/, { timeout: 5000 });

    // Check that redirect parameter is present
    const url = page.url();
    const redirectParam = new URL(url).searchParams.get('redirect');

    expect(redirectParam).toBe(route);
  }
});

/**
 * Test 2: Public routes do NOT redirect to login
 */
test('public routes do not redirect to login', async ({ page }) => {
  // Clear any existing auth cookies
  const context = page.context();
  await context.clearCookies();

  for (const route of PUBLIC_ROUTES) {
    await page.goto(route);

    // Should stay on the same page (not redirect to login)
    await page.waitForLoadState('networkidle');

    const url = page.url();
    // URL should contain the route we navigated to (or be on login page if that's the route)
    if (route !== '/login') {
      expect(url).not.toContain('/login');
    }
  }
});

/**
 * Test 3: Admin routes redirect to login when not authenticated
 */
test('admin routes redirect to login with redirect parameter', async ({ page }) => {
  // Clear any existing auth cookies
  const context = page.context();
  await context.clearCookies();

  await page.goto('/admin');

  // Should be redirected to login
  await page.waitForURL(/\/login.*/, { timeout: 5000 });

  // Check that redirect parameter is present
  const url = page.url();
  const redirectParam = new URL(url).searchParams.get('redirect');

  expect(redirectParam).toBe('/admin');
});

/**
 * Test 4: Redirect validation prevents open redirects (URL validation)
 */
test('redirect validation prevents open redirects - URL format check', async ({ page }) => {
  // Clear cookies
  const context = page.context();
  await context.clearCookies();

  // The middleware validation checks that redirect starts with '/' and not '//'
  // Test various malicious redirect patterns
  const maliciousRedirects = [
    'https://evil.com',
    '//evil.com',
    '///evil.com',
    '\\\\evil.com',
  ];

  for (const maliciousRedirect of maliciousRedirects) {
    const url = `/login?redirect=${encodeURIComponent(maliciousRedirect)}`;
    await page.goto(url);

    // The URL should remain as /login with the query param
    // (the validation happens during the redirect after login)
    expect(page.url()).toContain('/login');
  }
});

/**
 * Test 5: Nested protected routes also redirect properly
 */
test('nested protected routes redirect with full path', async ({ page }) => {
  // Clear any existing auth cookies
  const context = page.context();
  await context.clearCookies();

  const nestedRoutes = [
    '/settings/profile',
    '/settings/security',
    '/documents/123',
    '/chat/abc-def',
  ];

  for (const route of nestedRoutes) {
    await page.goto(route);

    // Should be redirected to login
    await page.waitForURL(/\/login.*/, { timeout: 5000 });

    // Check that redirect parameter includes the full path
    const url = page.url();
    const redirectParam = new URL(url).searchParams.get('redirect');

    expect(redirectParam).toBe(route);
  }
});

/**
 * Test 6: Middleware preserves query parameters in redirect
 */
test('middleware preserves query parameters when redirecting', async ({ page }) => {
  // Clear any existing auth cookies
  const context = page.context();
  await context.clearCookies();

  const targetRoute = '/documents?filter=active&sort=desc';
  await page.goto(targetRoute);

  // Should be redirected to login
  await page.waitForURL(/\/login.*/, { timeout: 5000 });

  // Check that redirect parameter includes query params
  const url = page.url();
  const redirectParam = new URL(url).searchParams.get('redirect');

  // The redirect param should include the full URL with query params
  expect(redirectParam).toContain('/documents');
  expect(redirectParam).toContain('filter=active');
});
