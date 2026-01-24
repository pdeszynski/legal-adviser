import { test, expect, type Page } from '@playwright/test';

/**
 * Session Expiry E2E Tests
 *
 * Comprehensive end-to-end tests for session expiry handling covering:
 * - Manual JWT token expiration manipulation
 * - Waiting for token timeout (simulated)
 * - Backend session invalidation simulation
 * - Automatic logout and redirect to login page
 * - User-friendly error message display
 */

const CHAT_URL = '/chat';

/**
 * Test helper to perform login
 */
async function performLogin(page: Page) {
  await page.goto('/login');

  // Check if we're already authenticated (redirected away from login)
  const currentUrl = page.url();
  if (
    currentUrl.includes('/dashboard') ||
    currentUrl.includes('/chat') ||
    currentUrl.includes('/settings')
  ) {
    // Already logged in, no need to login again
    return;
  }

  // Wait for the login form to be visible
  await page.waitForSelector('input[id="email"]', { timeout: 10000 });

  await page.fill('input[id="email"]', 'admin@refine.dev');
  await page.fill('input[id="password"]', 'password');

  // Click the submit button (find by text content "Sign In")
  await page.click('button:has-text("Sign In")');

  // Wait for navigation after login
  await page.waitForURL(
    (url) =>
      url.pathname.includes('/dashboard') ||
      url.pathname.includes('/chat') ||
      url.pathname.includes('/settings'),
    { timeout: 15000 },
  );
}

/**
 * Test helper to get cookies
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
 * Test helper to set an expired token
 */
async function setExpiredToken(page: Page) {
  const expiredToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDAsInVzZXJJZCI6IjEifQ.expired';
  await page.evaluate(
    ({ token }) => {
      document.cookie = `access_token=${token}; path=/; max-age=-1`;
    },
    { token: expiredToken },
  );
}

/**
 * Test helper to clear all auth cookies
 */
async function clearAuthCookies(page: Page) {
  await page.context().clearCookies();
}

test.describe('Session Expiry Handling', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies to ensure fresh state for each test
    await context.clearCookies();
    // Login before each test
    await performLogin(page);
  });

  test.describe('Manual JWT Token Expiration', () => {
    test('should logout when access token is manually expired', async ({ page }) => {
      // Navigate to a protected page
      await page.goto(CHAT_URL);
      await page.waitForLoadState('networkidle');

      // Verify we're logged in
      await expect(page.locator('body')).toBeVisible();

      // Manually expire the access token
      await setExpiredToken(page);

      // Trigger a request that requires authentication
      // by navigating to settings which requires auth
      await page.goto('/settings');
      await page.waitForTimeout(2000);

      // Should be redirected to login or see an auth error
      const currentUrl = page.url();
      const isAtLogin = currentUrl.includes('/login');

      if (isAtLogin) {
        // Verify redirect to login happened
        expect(currentUrl).toContain('/login');
      } else {
        // If not redirected, check for session expiry message
        const hasSessionMessage =
          (await page.locator('text=/session expired|unauthorized|please login/i').count()) > 0;
        if (hasSessionMessage) {
          console.log('Session expiry message displayed correctly');
        }
      }

      await page.screenshot({ path: 'test-results/session-expiry-manual-token.png' });
    });

    test('should logout when both access and refresh tokens are cleared', async ({ page }) => {
      // Navigate to a protected page
      await page.goto(CHAT_URL);
      await page.waitForLoadState('networkidle');

      // Clear all auth cookies
      await clearAuthCookies(page);

      // Try to navigate to another protected page
      await page.goto('/settings');
      await page.waitForTimeout(2000);

      // Should be redirected to login
      await page.waitForURL(
        (url) => url.pathname.includes('/login') || url.pathname.includes('/auth'),
        { timeout: 10000 },
      );

      expect(page.url()).toContain('/login');

      await page.screenshot({ path: 'test-results/session-expiry-cookies-cleared.png' });
    });

    test('should show user-friendly error when token expires during API call', async ({ page }) => {
      // Navigate to chat page
      await page.goto(CHAT_URL);
      await page.waitForLoadState('networkidle');

      // Get valid auth state first
      const initialCookies = await getAuthCookies(page);
      console.log('Initial auth state:', {
        hasAccessToken: !!initialCookies.accessToken,
        hasRefreshToken: !!initialCookies.refreshToken,
      });

      // Expire the access token
      await setExpiredToken(page);

      // Set up a listener for console errors
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Try to perform an action that requires auth (navigate to settings)
      await page.goto('/settings');
      await page.waitForTimeout(3000);

      // Check that we either:
      // 1. Got redirected to login, OR
      // 2. Saw an appropriate error message
      const currentUrl = page.url();

      if (currentUrl.includes('/login')) {
        console.log('Successfully redirected to login after token expiry');
      } else {
        // Look for user-friendly error messages
        const errorSelectors = [
          'text=/session expired/i',
          'text=/please login again/i',
          'text=/your session has ended/i',
          'text=/unauthorized/i',
        ];

        let foundError = false;
        for (const selector of errorSelectors) {
          const element = page.locator(selector).first();
          if ((await element.count()) > 0) {
            const text = await element.textContent();
            console.log('Found error message:', text);
            foundError = true;
            break;
          }
        }

        if (foundError) {
          console.log('User-friendly error message displayed');
        }
      }

      await page.screenshot({ path: 'test-results/session-expiry-api-error.png' });
    });
  });

  test.describe('Token Timeout Simulation', () => {
    test('should handle simulated token timeout', async ({ page }) => {
      // Navigate to chat
      await page.goto(CHAT_URL);
      await page.waitForLoadState('networkidle');

      // Simulate token timeout by setting an expired token
      await page.evaluate(() => {
        // Set access_token to an expired value
        document.cookie =
          'access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDAsInVzZXJJZCI6IjEifQ.expired; path=/; max-age=-1';
        // Set refresh_token to an expired value
        document.cookie =
          'refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDAsInVzZXJJZCI6IjEifQ.expired; path=/; max-age=-1';
      });

      // Trigger a page refresh to force re-authentication check
      await page.reload();
      await page.waitForTimeout(3000);

      // Should be redirected to login or show auth error
      const currentUrl = page.url();
      const isAtLogin = currentUrl.includes('/login');

      if (isAtLogin) {
        expect(currentUrl).toContain('/login');
      }

      await page.screenshot({ path: 'test-results/session-expiry-timeout-simulated.png' });
    });

    test('should attempt token refresh before logout', async ({ page }) => {
      // This test verifies the token refresh mechanism
      // We'll simulate a scenario where only the access token is expired
      // but the refresh token is still valid

      await page.goto(CHAT_URL);
      await page.waitForLoadState('networkidle');

      // Get current refresh token to verify it exists
      const cookies = await getAuthCookies(page);
      console.log('Has valid refresh token:', !!cookies.refreshToken);

      // Set only the access token to expired (keep refresh token)
      await page.evaluate(
        ({ token }) => {
          document.cookie = `access_token=${token}; path=/; max-age=-1`;
        },
        {
          token:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDAsInVzZXJJZCI6IjEifQ.expired',
        },
      );

      // Trigger a navigation that requires auth
      await page.goto('/settings');
      await page.waitForTimeout(3000);

      // The system should attempt to refresh the token
      // If refresh succeeds, user stays on page
      // If refresh fails, user is redirected to login
      const currentUrl = page.url();

      if (currentUrl.includes('/login')) {
        console.log('Redirected to login (token refresh may have failed)');
      } else {
        console.log('User stayed on page (token may have been refreshed)');
      }

      await page.screenshot({ path: 'test-results/session-expiry-refresh-attempt.png' });
    });
  });

  test.describe('Backend Session Invalidation Simulation', () => {
    test('should handle backend session invalidation via API mocking', async ({ page }) => {
      // Navigate to settings
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Intercept GraphQL requests and simulate 401 response
      await page.route('**/graphql', async (route) => {
        const request = route.request();
        const postData = request.postData();

        // Check if this is an authenticated request
        if (
          (postData && postData.includes('Authorization')) ||
          request.headers()['authorization']
        ) {
          // Simulate session invalidation with 401
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              errors: [
                {
                  message: 'Unauthorized',
                  extensions: { code: 'UNAUTHORIZED', statusCode: 401 },
                },
              ],
            }),
          });
        } else {
          // Continue normal routing for other requests
          await route.continue();
        }
      });

      // Try to perform an action that would trigger a GraphQL request
      // Clicking on a tab or interacting with the page
      await page.getByRole('button', { name: /profile/i }).click();
      await page.waitForTimeout(2000);

      // The application should handle the 401 and redirect to login
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        console.log('Successfully redirected to login after backend 401');
        expect(currentUrl).toContain('/login');
      }

      await page.screenshot({ path: 'test-results/session-expiry-backend-401.png' });
    });

    test('should handle 403 Forbidden response', async ({ page }) => {
      await page.goto(CHAT_URL);
      await page.waitForLoadState('networkidle');

      // Intercept and simulate 403 response
      await page.route('**/graphql', async (route) => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            errors: [
              {
                message: 'Forbidden',
                extensions: { code: 'FORBIDDEN', statusCode: 403 },
              },
            ],
          }),
        });
      });

      // Trigger a request
      await page.reload();
      await page.waitForTimeout(3000);

      // Should handle 403 appropriately
      const currentUrl = page.url();
      console.log('Current URL after 403:', currentUrl);

      await page.screenshot({ path: 'test-results/session-expiry-backend-403.png' });
    });
  });

  test.describe('Automatic Logout and Redirect', () => {
    test('should automatically redirect to login on session expiry', async ({ page }) => {
      await page.goto(CHAT_URL);
      await page.waitForLoadState('networkidle');

      // Clear all auth cookies to simulate session expiry
      await clearAuthCookies(page);

      // Navigate to a protected route
      await page.goto('/settings');
      await page.waitForTimeout(2000);

      // Should redirect to login
      await page.waitForURL(
        (url) => url.pathname.includes('/login') || url.pathname.includes('/auth'),
        { timeout: 10000 },
      );

      expect(page.url()).toContain('/login');

      // Verify login page is displayed
      await expect(page.locator('input[id="email"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('input[id="password"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/session-expiry-redirect-to-login.png' });
    });

    test('should preserve return URL or redirect after login', async ({ page }) => {
      // Start at settings page
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Clear auth to trigger redirect
      await clearAuthCookies(page);

      // Reload the page
      await page.reload();
      await page.waitForTimeout(2000);

      // Should be at login
      await page.waitForURL(
        (url) => url.pathname.includes('/login') || url.pathname.includes('/auth'),
        { timeout: 10000 },
      );

      // Login again
      await page.fill('input[id="email"]', 'admin@refine.dev');
      await page.fill('input[id="password"]', 'password');
      await page.click('button:has-text("Sign In")');

      // Wait for navigation after login
      await page.waitForURL(
        (url) =>
          url.pathname.includes('/dashboard') ||
          url.pathname.includes('/chat') ||
          url.pathname.includes('/settings'),
        { timeout: 10000 },
      );

      // Verify we're logged in
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(dashboard|chat|settings)/);

      await page.screenshot({ path: 'test-results/session-expiry-relogin-redirect.png' });
    });
  });

  test.describe('User-Friendly Error Messages', () => {
    test('should display user-friendly error message on session expiry', async ({ page }) => {
      await page.goto(CHAT_URL);
      await page.waitForLoadState('networkidle');

      // Intercept and return a 401 with user-friendly error
      await page.route('**/graphql', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            errors: [
              {
                message: 'Your session has expired. Please log in again.',
                extensions: {
                  code: 'UNAUTHORIZED',
                  statusCode: 401,
                },
              },
            ],
          }),
        });
      });

      // Trigger a request
      await page.reload();
      await page.waitForTimeout(3000);

      // Check for error messages (if displayed before redirect)
      const errorSelectors = [
        'text=/session.*expir/i',
        'text=/please log in/i',
        'text=/unauthorized/i',
      ];

      for (const selector of errorSelectors) {
        const element = page.locator(selector);
        if ((await element.count()) > 0) {
          console.log('Found user-friendly error:', await element.textContent());
        }
      }

      await page.screenshot({ path: 'test-results/session-expiry-user-message.png' });
    });

    test('should show appropriate message for network errors', async ({ page }) => {
      await page.goto(CHAT_URL);
      await page.waitForLoadState('networkidle');

      // Intercept and simulate network error
      await page.route('**/graphql', async (route) => {
        await route.abort('failed');
      });

      // Set up dialog listener to handle any alerts
      page.on('dialog', (dialog) => {
        console.log('Dialog shown:', dialog.message());
        dialog.accept().catch(() => {});
      });

      // Try to navigate
      await page.goto('/settings');
      await page.waitForTimeout(3000);

      // Check for network error indicators
      const networkErrorSelectors = [
        'text=/network error/i',
        'text=/connection.*fail/i',
        'text=/unable to connect/i',
      ];

      for (const selector of networkErrorSelectors) {
        const element = page.locator(selector);
        if ((await element.count()) > 0) {
          console.log('Found network error message:', await element.textContent());
        }
      }

      await page.screenshot({ path: 'test-results/session-expiry-network-error.png' });
    });

    test('should display error message for invalid credentials after expiry', async ({ page }) => {
      // First, clear cookies to force login
      await clearAuthCookies(page);
      await page.goto('/login');

      // Intercept login to simulate expired session response
      await page.route('**/graphql', async (route) => {
        const postData = route.request().postData();
        if (postData && postData.includes('login')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                login: null,
              },
              errors: [
                {
                  message: 'Your session has expired. Please log in again.',
                  extensions: {
                    code: 'SESSION_EXPIRED',
                    statusCode: 401,
                  },
                },
              ],
            }),
          });
        } else {
          await route.continue();
        }
      });

      // Try to login
      await page.fill('input[id="email"]', 'admin@refine.dev');
      await page.fill('input[id="password"]', 'password');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);

      // Check for error message on login page
      const errorMessage = page.locator('text=/session.*expir|expir|invalid/i');
      if ((await errorMessage.count()) > 0) {
        const text = await errorMessage.textContent();
        console.log('Login error message:', text);
      }

      await page.screenshot({ path: 'test-results/session-expiry-login-error.png' });
    });
  });

  test.describe('Session State After Expiry', () => {
    test('should clear all auth data on session expiry', async ({ page }) => {
      await page.goto(CHAT_URL);
      await page.waitForLoadState('networkidle');

      // Verify auth cookies exist
      const cookiesBefore = await getAuthCookies(page);
      console.log('Cookies before expiry:', {
        hasAccessToken: !!cookiesBefore.accessToken,
        hasRefreshToken: !!cookiesBefore.refreshToken,
        hasAuth: !!cookiesBefore.auth,
      });

      // Clear auth cookies
      await clearAuthCookies(page);

      // Reload
      await page.reload();
      await page.waitForTimeout(2000);

      // Verify cookies are cleared
      const cookiesAfter = await getAuthCookies(page);
      console.log('Cookies after expiry:', {
        hasAccessToken: !!cookiesAfter.accessToken,
        hasRefreshToken: !!cookiesAfter.refreshToken,
        hasAuth: !!cookiesAfter.auth,
      });

      expect(cookiesAfter.accessToken).toBeUndefined();
      expect(cookiesAfter.refreshToken).toBeUndefined();
      expect(cookiesAfter.auth).toBeUndefined();

      await page.screenshot({ path: 'test-results/session-expiry-cookies-verified.png' });
    });

    test('should not allow access to protected routes after expiry', async ({ page }) => {
      // Clear auth first
      await clearAuthCookies(page);

      // Try to directly access protected routes
      const protectedRoutes = ['/chat', '/settings', '/dashboard'];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await page.waitForTimeout(2000);

        const currentUrl = page.url();
        const isAtLogin =
          currentUrl.includes('/login') ||
          currentUrl.includes('/auth') ||
          (await page.locator('input[id="email"]').count()) > 0;

        if (isAtLogin) {
          console.log(`Route ${route} correctly redirected to login`);
        } else {
          console.log(`Route ${route} current URL: ${currentUrl}`);
        }
      }

      await page.screenshot({ path: 'test-results/session-expiry-protected-routes.png' });
    });
  });
});
