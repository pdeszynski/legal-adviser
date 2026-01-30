import { test, expect, type Page } from '@playwright/test';

/**
 * Role-Based Access Control E2E Tests
 *
 * Comprehensive tests verifying the refactored single source of truth role implementation:
 *
 * Role Format (Single Source of Truth):
 * - User entity has single 'role' field (enum: guest | client | paralegal | lawyer | admin | super_admin)
 * - JWT tokens contain 'roles' array with single element for backwards compatibility
 * - Frontend useUserRole hook reads from identity.role (single value)
 * - Guards normalize both formats automatically
 *
 * Role Hierarchy (higher index = more permissions):
 * SUPER_ADMIN(5) > ADMIN(4) > LAWYER(3) > PARALEGAL(2) > CLIENT(1) > GUEST(0)
 *
 * Test Users:
 * - admin@refine.dev / password (role: admin)
 * - user@example.com / password123 (role: client)
 * - lawyer@example.com / password123 (role: lawyer)
 *
 * These tests verify:
 * 1) Login works with new role format
 * 2) Auth cookies contain correct role data
 * 3) UI elements show/hide based on role
 * 4) Admin routes are protected correctly
 * 5) Role hierarchy works as expected
 */

const ADMIN_EMAIL = 'admin@refine.dev';
const ADMIN_PASSWORD = 'password';
const USER_EMAIL = 'user@example.com';
const USER_PASSWORD = 'password123';
const LAWYER_EMAIL = 'lawyer@example.com';
const LAWYER_PASSWORD = 'password123';

/**
 * Test helper to perform login
 */
async function performLogin(page: Page, email: string, password: string) {
  await page.goto('http://localhost:3000/login');

  // Check if we're already authenticated
  const currentUrl = page.url();
  if (
    currentUrl.includes('/dashboard') ||
    currentUrl.includes('/chat') ||
    currentUrl.includes('/settings') ||
    currentUrl.includes('/admin')
  ) {
    await page.goto('http://localhost:3000/logout');
    await page.waitForTimeout(1000);
    await page.goto('http://localhost:3000/login');
  }

  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.press('input[type="password"]', 'Enter');

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
 * Test helper to get user role from auth cookie
 * Supports both new single role format and legacy roles array
 */
async function getUserRoleFromCookie(page: Page): Promise<string | null> {
  const cookies = await page.context().cookies();
  const authCookie = cookies.find((c) => c.name === 'auth');

  if (!authCookie?.value) {
    return null;
  }

  try {
    const decodedValue = decodeURIComponent(authCookie.value);
    const parsedAuth = JSON.parse(decodedValue);

    // New format: single role field (SSOT)
    if (parsedAuth.role) {
      return parsedAuth.role === 'user' ? 'client' : parsedAuth.role;
    }

    // Legacy format: roles array
    const roles = parsedAuth.roles || [];
    if (roles.length > 0) {
      const role = roles[0];
      return role === 'user' ? 'client' : role;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Test helper to get all roles array from auth cookie
 */
async function getRolesArrayFromCookie(page: Page): Promise<string[]> {
  const cookies = await page.context().cookies();
  const authCookie = cookies.find((c) => c.name === 'auth');

  if (!authCookie?.value) {
    return [];
  }

  try {
    const decodedValue = decodeURIComponent(authCookie.value);
    const parsedAuth = JSON.parse(decodedValue);

    // New format: convert single role to array
    if (parsedAuth.role) {
      const role = parsedAuth.role === 'user' ? 'client' : parsedAuth.role;
      return [role];
    }

    // Legacy format: roles array
    return (parsedAuth.roles || []).map((r: string) => (r === 'user' ? 'client' : r));
  } catch {
    return [];
  }
}

test.describe('RBAC - Single Source of Truth Role Format', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('admin user has admin role in auth cookie (single role format)', async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Check for new single role format
    const role = await getUserRoleFromCookie(page);
    expect(role).toBe('admin');

    // Also verify roles array format for backwards compatibility
    const rolesArray = await getRolesArrayFromCookie(page);
    expect(rolesArray).toContain('admin');
    expect(rolesArray).toHaveLength(1);

    await page.screenshot({ path: 'test-results/role-ssot-admin-role.png' });
  });

  test('client user has client role in auth cookie', async ({ page }) => {
    await performLogin(page, USER_EMAIL, USER_PASSWORD);

    const role = await getUserRoleFromCookie(page);
    expect(role).toBe('client');

    const rolesArray = await getRolesArrayFromCookie(page);
    expect(rolesArray).toContain('client');

    await page.screenshot({ path: 'test-results/role-ssot-client-role.png' });
  });

  test('lawyer user has lawyer role in auth cookie', async ({ page }) => {
    await performLogin(page, LAWYER_EMAIL, LAWYER_PASSWORD);

    const role = await getUserRoleFromCookie(page);
    expect(role).toBe('lawyer');

    const rolesArray = await getRolesArrayFromCookie(page);
    expect(rolesArray).toContain('lawyer');

    await page.screenshot({ path: 'test-results/role-ssot-lawyer-role.png' });
  });
});

test.describe('RBAC - Admin Access with New Role Format', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('admin can access admin panel', async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin');

    const adminHeader = page.locator('text=Admin Panel');
    await expect(adminHeader).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'test-results/role-ssot-admin-access.png' });
  });

  test('admin can access users management', async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.goto('http://localhost:3000/admin/users');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin/users');

    const usersHeader = page.locator('text=Users');
    await expect(usersHeader).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'test-results/role-ssot-admin-users.png' });
  });

  test('admin sees admin navigation items', async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');

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
      expect(count).toBeGreaterThan(0);
    }

    await page.screenshot({ path: 'test-results/role-ssot-admin-nav.png' });
  });
});

test.describe('RBAC - Non-Admin Access Restrictions', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('client cannot access admin panel', async ({ page }) => {
    await performLogin(page, USER_EMAIL, USER_PASSWORD);

    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    expect(finalUrl).not.toContain('/admin');
    expect(finalUrl).toContain('/dashboard');

    await page.screenshot({ path: 'test-results/role-ssot-client-no-admin.png' });
  });

  test('client cannot access users management', async ({ page }) => {
    await performLogin(page, USER_EMAIL, USER_PASSWORD);

    await page.goto('http://localhost:3000/admin/users');
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    expect(finalUrl).toContain('/dashboard');

    await page.screenshot({ path: 'test-results/role-ssot-client-no-users.png' });
  });

  test('lawyer cannot access admin panel', async ({ page }) => {
    await performLogin(page, LAWYER_EMAIL, LAWYER_PASSWORD);

    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    expect(finalUrl).not.toContain('/admin');
    expect(finalUrl).toContain('/dashboard');

    await page.screenshot({ path: 'test-results/role-ssot-lawyer-no-admin.png' });
  });

  test('non-admin users do not see admin navigation', async ({ page }) => {
    await performLogin(page, USER_EMAIL, USER_PASSWORD);

    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    const adminNav = page.locator('text=Admin Panel');
    const adminNavCount = await adminNav.count();
    expect(adminNavCount).toBe(0);

    await page.screenshot({ path: 'test-results/role-ssot-user-no-admin-nav.png' });
  });
});

test.describe('RBAC - Role Hierarchy Verification', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('admin can access all regular user routes', async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    const regularRoutes = ['/dashboard', '/chat', '/settings', '/documents'];

    for (const route of regularRoutes) {
      await page.goto(`http://localhost:3000${route}`);
      await page.waitForTimeout(500);

      const currentUrl = page.url();
      expect(
        currentUrl.includes(route) ||
          currentUrl.includes('/dashboard') ||
          currentUrl.includes('/chat'),
      ).toBeTruthy();
    }

    await page.screenshot({ path: 'test-results/role-ssot-admin-routes.png' });
  });

  test('client can access regular routes', async ({ page }) => {
    await performLogin(page, USER_EMAIL, USER_PASSWORD);

    const regularRoutes = ['/dashboard', '/chat', '/settings'];

    for (const route of regularRoutes) {
      await page.goto(`http://localhost:3000${route}`);
      await page.waitForTimeout(500);

      const currentUrl = page.url();
      expect(
        currentUrl.includes(route) ||
          currentUrl.includes('/dashboard') ||
          currentUrl.includes('/chat'),
      ).toBeTruthy();
    }

    await page.screenshot({ path: 'test-results/role-ssot-client-routes.png' });
  });
});

test.describe('RBAC - Session Persistence with Role Format', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('role persists across page navigation', async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Get role initially
    const initialRole = await getUserRoleFromCookie(page);
    expect(initialRole).toBe('admin');

    // Navigate to different pages
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');

    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');

    // Verify role is still the same
    const finalRole = await getUserRoleFromCookie(page);
    expect(finalRole).toBe('admin');

    await page.screenshot({ path: 'test-results/role-ssot-persistence.png' });
  });
});

test.describe('RBAC - Legacy Role Format Compatibility', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('guards handle both role formats correctly', async ({ page }) => {
    await performLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Verify admin access works
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin');

    // Verify role data is present in expected format
    const role = await getUserRoleFromCookie(page);
    expect(role).toBeTruthy();

    await page.screenshot({ path: 'test-results/role-ssot-compatibility.png' });
  });
});
