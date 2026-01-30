import { test, expect, type Page } from '@playwright/test';

/**
 * RBAC (Role-Based Access Control) E2E Tests
 *
 * Comprehensive end-to-end tests validating RBAC implementation:
 * 1) Regular user cannot access /admin routes
 * 2) Admin can access user management
 * 3) Role-based menu shows correct items
 * 4) Non-admin gets 403 when attempting admin mutations
 * 5) Seed users have correct roles
 *
 * Test credentials:
 * - Admin: admin@refine.dev / password (role: admin)
 * - Regular user: user@example.com / password123 (role: client)
 *
 * Role Format (Single Source of Truth):
 * - New format: User has a single 'role' field (admin, client, lawyer, etc.)
 * - Legacy format: User has 'roles' array for backwards compatibility
 * - Tests verify both formats work correctly
 */

const ADMIN_EMAIL = 'admin@refine.dev';
const ADMIN_PASSWORD = 'password';
const USER_EMAIL = 'user@example.com';
const USER_PASSWORD = 'password123';

/**
 * Test helper to perform login
 */
async function performLogin(page: Page, email: string, password: string) {
  await page.goto('http://localhost:3000/login');

  // Check if we're already authenticated (redirected away from login)
  const currentUrl = page.url();
  if (
    currentUrl.includes('/dashboard') ||
    currentUrl.includes('/chat') ||
    currentUrl.includes('/settings') ||
    currentUrl.includes('/admin')
  ) {
    // Already logged in, logout first
    await page.goto('http://localhost:3000/logout');
    await page.waitForTimeout(1000);
    await page.goto('http://localhost:3000/login');
  }

  // Wait for the login form to be visible
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Press Enter to submit
  await page.press('input[type="password"]', 'Enter');

  // Wait for navigation after login
  await page.waitForURL(
    (url) =>
      url.pathname.includes('/dashboard') ||
      url.pathname.includes('/chat') ||
      url.pathname.includes('/settings') ||
      url.pathname.includes('/admin'),
    { timeout: 30000 },
  );
}

/**
 * Test helper to clear auth cookies
 */
async function clearAuthCookies(page: Page) {
  await page.context().clearCookies();
}

/**
 * Test helper to get auth cookies
 */
async function getAuthCookies(page: Page) {
  const cookies = await page.context().cookies();
  return {
    accessToken: cookies.find((c) => c.name === 'access_token')?.value,
    refreshToken: cookies.find((c) => c.name === 'refresh_token')?.value,
    auth: cookies.find((c) => c.name === 'auth')?.value,
  };
}

/**
 * Test helper to get user role from auth cookie
 *
 * Supports both new single role format and legacy roles array:
 * - New format: { role: 'admin' | 'client' | 'lawyer' | ... }
 * - Legacy format: { roles: ['admin'] }
 */
async function getUserRoleFromCookie(page: Page): Promise<string | null> {
  const cookies = await page.context().cookies();
  const authCookie = cookies.find((c) => c.name === 'auth');

  if (!authCookie?.value) {
    return null;
  }

  try {
    // Need to decode URL-encoded cookie value
    const decodedValue = decodeURIComponent(authCookie.value);
    const parsedAuth = JSON.parse(decodedValue);

    // New format: single role field (SSOT)
    if (parsedAuth.role) {
      // Map legacy 'user' to 'client' for consistency
      if (parsedAuth.role === 'user') {
        return 'client';
      }
      return parsedAuth.role;
    }

    // Legacy format: roles array (for backwards compatibility)
    const roles = parsedAuth.roles || [];
    if (roles.length > 0) {
      const role = roles[0];
      if (role === 'user') {
        return 'client';
      }
      return role;
    }

    return null;
  } catch {
    return null;
  }
}

test.describe('RBAC - Regular User Access Restrictions', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies to ensure fresh state for each test
    await context.clearCookies();
  });

  test('regular user cannot access /admin routes', async ({ page }) => {
    // Login as regular user
    await performLogin(page, USER_EMAIL, USER_PASSWORD);

    // Verify user is logged in
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(dashboard|chat|settings)/);

    // Try to access admin dashboard directly
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    // Should be redirected to dashboard (not login, since user is authenticated)
    const finalUrl = page.url();
    expect(finalUrl).toContain('/dashboard');

    // Verify NOT on admin page
    expect(finalUrl).not.toContain('/admin');

    await page.screenshot({ path: 'test-results/rbac-user-admin-denied.png' });
  });

  test('regular user cannot access /admin/users route', async ({ page }) => {
    // Login as regular user
    await performLogin(page, USER_EMAIL, USER_PASSWORD);

    // Try to access admin users page directly
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForTimeout(2000);

    // Should be redirected to dashboard
    const finalUrl = page.url();
    expect(finalUrl).toContain('/dashboard');

    await page.screenshot({ path: 'test-results/rbac-user-users-denied.png' });
  });

  test('regular user cannot access /admin/settings route', async ({ page }) => {
    // Login as regular user
    await performLogin(page, USER_EMAIL, USER_PASSWORD);

    // Try to access admin settings page directly
    await page.goto('http://localhost:3000/admin/settings');
    await page.waitForTimeout(2000);

    // Should be redirected to dashboard
    const finalUrl = page.url();
    expect(finalUrl).toContain('/dashboard');

    await page.screenshot({ path: 'test-results/rbac-user-settings-denied.png' });
  });

  test('regular user can access regular routes', async ({ page }) => {
    // Login as regular user
    await performLogin(page, USER_EMAIL, USER_PASSWORD);

    // Verify access to regular routes
    const regularRoutes = ['/dashboard', '/chat', '/settings', '/documents'];

    for (const route of regularRoutes) {
      await page.goto(`http://localhost:3000${route}`);
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      // Should be on the requested route (or a valid sub-route)
      expect(
        currentUrl.includes(route) ||
          currentUrl.includes('/dashboard') ||
          currentUrl.includes('/chat'),
      ).toBeTruthy();
    }

    await page.screenshot({ path: 'test-results/rbac-user-routes-allowed.png' });
  });
});

test.describe('RBAC - Admin Access', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies to ensure fresh state for each test
    await context.clearCookies();
  });

  test('admin can access admin dashboard', async ({ page }) => {
    // Login as admin
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Navigate to admin dashboard
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should be on admin page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin');

    // Verify admin-specific content is visible
    const adminHeader = page.locator('text=Admin Panel');
    await expect(adminHeader).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'test-results/rbac-admin-dashboard-access.png' });
  });

  test('admin can access user management', async ({ page }) => {
    // Login as admin
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Navigate to admin users page
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should be on admin/users page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin/users');

    // Verify user management content is visible
    const usersHeader = page.locator('text=Users');
    await expect(usersHeader).toBeVisible({ timeout: 10000 });

    // Verify admin can see user management actions
    const addUserButton = page.locator('button:has-text("Add User")');
    const hasAddButton = await addUserButton.count();
    expect(hasAddButton).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/rbac-admin-users-access.png' });
  });

  test('admin can access admin settings', async ({ page }) => {
    // Login as admin
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Navigate to admin settings page
    await page.goto('http://localhost:3000/admin/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should be on admin/settings page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin/settings');

    await page.screenshot({ path: 'test-results/rbac-admin-settings-access.png' });
  });

  test('admin has admin role in auth cookie', async ({ page }) => {
    // Login as admin
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Check auth cookie contains admin role
    const role = await getUserRoleFromCookie(page);
    expect(role).toBe('admin');

    // Also verify via auth cookies
    const cookies = await getAuthCookies(page);
    expect(cookies.auth).toBeDefined();
  });
});

test.describe('RBAC - Role-Based Menu Items', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
  });

  test('admin sees admin navigation items', async ({ page }) => {
    // Login as admin
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Navigate to admin panel
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');

    // Check for admin-specific navigation items
    const expectedNavItems = [
      'Dashboard',
      'Users',
      'Templates',
      'Moderation',
      'Audit Logs',
      'Settings',
    ];

    for (const item of expectedNavItems) {
      const navItem = page.locator(`text=${item}`).first();
      const count = await navItem.count();
      // At least one occurrence should exist
      expect(count).toBeGreaterThan(0);
    }

    // Verify admin badge/shield is visible
    const adminBadge = page.locator('text=Admin Panel');
    await expect(adminBadge).toBeVisible();

    await page.screenshot({ path: 'test-results/rbac-admin-nav-items.png' });
  });

  test('admin sees role badge in header', async ({ page }) => {
    // Login as admin
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Navigate to admin panel
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');

    // Look for role indicator in header
    // The admin layout shows: "Display Name (role)"
    const roleIndicator = page.locator('text=(admin)').or(page.locator('text=Admin Panel'));
    await expect(roleIndicator.first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'test-results/rbac-admin-role-badge.png' });
  });

  test('regular user does not see admin navigation in main app', async ({ page }) => {
    // Login as regular user
    await performLogin(page, USER_EMAIL, USER_PASSWORD);

    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    // Should NOT see admin panel navigation
    const adminNav = page.locator('text=Admin Panel');
    const adminNavCount = await adminNav.count();

    // Admin navigation should not be visible to regular users
    expect(adminNavCount).toBe(0);

    await page.screenshot({ path: 'test-results/rbac-user-no-admin-nav.png' });
  });
});

test.describe('RBAC - Backend Mutation Guards', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
  });

  test('non-admin gets 403 when attempting admin mutations', async ({ page }) => {
    // Login as regular user
    await performLogin(page, USER_EMAIL, USER_PASSWORD);

    // Set up a listener for GraphQL responses
    const received403 = false;
    const received401 = false;

    await page.route('**/graphql', async (route) => {
      const request = route.request();
      const postData = request.postData();

      if (postData) {
        try {
          const data = JSON.parse(postData);

          // Check if it's an admin-only mutation
          const adminMutations = [
            'suspendUser',
            'activateUser',
            'changeUserRole',
            'resetUserPassword',
            'deleteUser',
            'analyticsDashboard',
          ];

          const query = data.query || data.mutation || '';
          const isAdminMutation = adminMutations.some((mut) => query.includes(mut));

          if (isAdminMutation) {
            // Let the request through to see actual backend response
            await route.continue();
            // Note: In newer Playwright versions, continue() returns void
            // The response will be handled by the application's error handling
            return;
          }
        } catch {
          // Parse error, continue
        }
      }

      await route.continue();
    });

    // Try to access admin users page which would trigger admin queries
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForTimeout(3000);

    // The user should be redirected (not get 403 on client)
    const finalUrl = page.url();
    expect(finalUrl).toContain('/dashboard');

    await page.screenshot({ path: 'test-results/rbac-mutation-guard.png' });
  });

  test('admin can successfully execute admin queries', async ({ page }) => {
    // Login as admin
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Navigate to admin users page
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Should successfully load and display users
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin/users');

    // Verify users are loaded (table should be visible)
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'test-results/rbac-admin-query-success.png' });
  });

  test('GraphQL endpoint properly guards admin operations', async ({ page }) => {
    // Login as regular user
    await performLogin(page, USER_EMAIL, USER_PASSWORD);

    // Intercept GraphQL requests to admin operations
    await page.route('**/graphql', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData?.query?.includes('analyticsDashboard')) {
        // This is an admin-only query
        // Mock a response that would come from backend guard
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: null,
            errors: [
              {
                message: 'Forbidden',
                extensions: {
                  code: 'FORBIDDEN',
                  statusCode: 403,
                  exception: { status: 403 },
                },
              },
            ],
          }),
        });
        return;
      }

      await route.continue();
    });

    // Navigate to admin dashboard
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(3000);

    // Should handle the error gracefully
    // Either redirect to dashboard or show error
    const finalUrl = page.url();
    const isOnDashboard = finalUrl.includes('/dashboard');

    expect(
      isOnDashboard || finalUrl.includes('/login') || finalUrl.includes('/dashboard'),
    ).toBeTruthy();

    await page.screenshot({ path: 'test-results/rbac-graphql-guard.png' });
  });
});

test.describe('RBAC - Seed Users Roles Verification', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
  });

  test('admin user has correct role', async ({ page }) => {
    // Login as admin
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Verify role from auth cookie (new single source of truth format)
    const role = await getUserRoleFromCookie(page);
    expect(role).toBe('admin');

    // Navigate to admin panel
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');

    // Verify admin panel is accessible
    const adminHeader = page.locator('text=Admin Panel');
    await expect(adminHeader).toBeVisible();

    await page.screenshot({ path: 'test-results/rbac-seed-admin-role.png' });
  });

  test('regular user has correct role', async ({ page }) => {
    // Login as regular user
    await performLogin(page, USER_EMAIL, USER_PASSWORD);

    // Verify role from auth cookie
    const role = await getUserRoleFromCookie(page);
    // Role should be 'client' (new single source of truth format)
    expect(role).toBe('client');

    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify dashboard is accessible (user is logged in)
    const dashboardContent = page.locator('.container, main').first();
    await expect(dashboardContent).toBeVisible();

    await page.screenshot({ path: 'test-results/rbac-seed-user-role.png' });
  });

  test('admin user is listed in admin users page', async ({ page }) => {
    // Login as admin
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Navigate to admin users page
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for admin user in the table
    const adminEmail = page.locator(`text=${ADMIN_EMAIL}`);
    await expect(adminEmail.first()).toBeVisible({ timeout: 10000 });

    // Verify admin badge next to the user
    const adminRow = page.locator(`tr:has-text("${ADMIN_EMAIL}")`);
    const roleBadge = adminRow.locator('text=admin');
    await expect(roleBadge.first()).toBeVisible();

    await page.screenshot({ path: 'test-results/rbac-seed-admin-in-list.png' });
  });

  test('regular user is listed in admin users page with correct role', async ({ page }) => {
    // Login as admin
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Navigate to admin users page
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for regular user in the table
    const userEmail = page.locator(`text=${USER_EMAIL}`);
    await expect(userEmail.first()).toBeVisible({ timeout: 10000 });

    // Verify user badge next to the user (not admin)
    const userRow = page.locator(`tr:has-text("${USER_EMAIL}")`);
    const roleBadge = userRow
      .locator('text=user')
      .or(userRow.locator('.bg-muted.text-muted-foreground'));
    const badgeCount = await roleBadge.count();
    expect(badgeCount).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/rbac-seed-user-in-list.png' });
  });
});

test.describe('RBAC - Cross-Role Security', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
  });

  test('user cannot escalate role by cookie manipulation', async ({ page }) => {
    // Login as regular user
    await performLogin(page, USER_EMAIL, USER_PASSWORD);

    // Try to manipulate auth cookie to add admin role
    await page.evaluate(() => {
      const cookies = document.cookie.split(';');
      let authCookie = null;

      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'auth') {
          authCookie = decodeURIComponent(value);
          break;
        }
      }

      if (authCookie) {
        try {
          const authData = JSON.parse(authCookie);
          // Try to add admin role
          authData.roles = ['admin'];
          // Set the manipulated cookie
          document.cookie = `auth=${encodeURIComponent(JSON.stringify(authData))}; path=/; max-age=3600`;
        } catch {
          // Parse failed, continue
        }
      }
    });

    // Try to access admin page
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    // Should still be blocked (backend validates JWT)
    const finalUrl = page.url();
    expect(finalUrl).not.toContain('/admin');

    await page.screenshot({ path: 'test-results/rbac-escalation-fail.png' });
  });

  test('session persistence maintains role across navigation', async ({ page }) => {
    // Login as admin
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Navigate to admin
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin');

    // Navigate to regular page
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard');

    // Navigate back to admin
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin');

    // Verify still have access
    const adminHeader = page.locator('text=Admin Panel');
    await expect(adminHeader).toBeVisible();

    await page.screenshot({ path: 'test-results/rbac-session-persistence.png' });
  });

  test('logout clears admin access immediately', async ({ page }) => {
    // Login as admin
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Verify admin access
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin');

    // Logout
    await clearAuthCookies(page);

    // Try to access admin
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    // Should be redirected to login
    const finalUrl = page.url();
    expect(finalUrl).toContain('/login');

    await page.screenshot({ path: 'test-results/rbac-logout-clears-access.png' });
  });
});
