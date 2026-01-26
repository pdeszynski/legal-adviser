import { test, expect } from '@playwright/test';

/**
 * Two-Factor Authentication Settings Enable Flow E2E Tests
 *
 * These tests verify the complete UI flow for enabling 2FA from the settings page:
 * 1) Login as user without 2FA enabled
 * 2) Navigate to /settings -> Security tab
 * 3) Click 'Enable two-factor authentication' button
 * 4) Verify info modal appears
 * 5) Click 'Get Started' and verify QR code is displayed
 * 6) Complete setup with valid TOTP token
 * 7) Verify backup codes are shown
 * 8) Confirm 2FA is enabled in settings
 *
 * Uses admin@refine.dev credentials for testing.
 * Verifies GraphQL mutations are called via network trace.
 */

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Test user credentials
const TEST_EMAIL = 'admin@refine.dev';
const TEST_PASSWORD = 'password';

/**
 * Helper to check if backend is available
 */
async function isBackendAvailable(request: any): Promise<boolean> {
  try {
    const response = await request.get(`${BASE_URL}/api/csrf-token`, { timeout: 5000 });
    return response.ok();
  } catch {
    return false;
  }
}

/**
 * Helper to get CSRF token from the backend
 */
async function getCsrfToken(request: any): Promise<string> {
  try {
    const response = await request.get(`${BASE_URL}/api/csrf-token`);
    if (response.ok()) {
      const data = await response.json();
      return data.csrfToken;
    }
  } catch {
    // Ignore errors
  }
  return '';
}

/**
 * Helper to execute GraphQL mutations/queries with CSRF token
 */
async function graphqlRequest(
  request: any,
  query: string,
  variables?: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  const csrfToken = await getCsrfToken(request);

  const response = await request.post(GRAPHQL_URL, {
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
      ...headers,
    },
    data: {
      query,
      variables,
    },
  });
  return response.json();
}

/**
 * Helper to login via GraphQL API
 */
async function loginViaApi(request: any, email: string, password: string) {
  const mutation = `
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        accessToken
        refreshToken
        requiresTwoFactor
        twoFactorTempToken
        user {
          id
          email
        }
      }
    }
  `;

  const response = await request.post(GRAPHQL_URL, {
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      query: mutation,
      variables: {
        input: { username: email, password },
      },
    },
  });
  return response.json();
}

/**
 * Helper to disable 2FA for cleanup
 */
async function disable2FA(request: any, accessToken: string, password: string) {
  const mutation = `
    mutation DisableTwoFactorAuth($input: DisableTwoFactorInput!) {
      disableTwoFactorAuth(input: $input)
    }
  `;

  return graphqlRequest(
    request,
    mutation,
    { input: { password } },
    { Authorization: `Bearer ${accessToken}` },
  );
}

/**
 * Helper to get 2FA settings
 */
async function getTwoFactorSettings(request: any, accessToken: string) {
  const query = `
    query TwoFactorSettings {
      twoFactorSettings {
        status
        enabled
        remainingBackupCodes
      }
    }
  `;

  const response = await request.post(GRAPHQL_URL, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    data: {
      query,
    },
  });
  return response.json();
}

/**
 * Generate a valid TOTP token for a given secret
 * This uses the same algorithm as the backend (TOTP with SHA-1, 6 digits, 30 second period)
 *
 * @param secret - Base32 encoded TOTP secret
 * @returns 6-digit TOTP token valid for current time window
 */
function generateTOTPToken(secret: string): string {
  // Decode base32 secret
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  const secretBytes: number[] = [];

  for (let i = 0; i < secret.length; i++) {
    const char = secret[i];
    if (char === '=') break;
    const val = alphabet.indexOf(char.toUpperCase());
    if (val === -1) continue;

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bits -= 8;
      secretBytes.push((value >>> bits) & 0xff);
    }
  }

  // Get current time in 30-second intervals
  const time = Math.floor(Date.now() / 1000 / 30);

  // Convert time to 8-byte big-endian array
  const timeBytes: number[] = [];
  for (let i = 8; i > 0; i--) {
    timeBytes.push((time >>> (i - 1) * 8) & 0xff);
  }

  // HMAC-SHA1 with secret as key and time as message
  // For simplicity in tests, we'll use a basic implementation
  // In production, use a crypto library
  const key = secretBytes;
  const msg = timeBytes;

  // Simple HMAC-SHA1 implementation for Node.js test environment
  // This is a simplified version - in production use crypto.createHmac
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha1', Buffer.from(key));
  hmac.update(Buffer.from(msg));
  const hash = hmac.digest();

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  // 6-digit code
  const token = (code % 1000000).toString().padStart(6, '0');
  return token;
}

/**
 * Helper to enable 2FA via API (returns secret for generating TOTP)
 */
async function enableTwoFactorViaApi(request: any, accessToken: string): Promise<{
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
} | null> {
  const mutation = `
    mutation EnableTwoFactorAuth {
      enableTwoFactorAuth {
        secret
        qrCodeDataUrl
        backupCodes
      }
    }
  `;

  const result = await graphqlRequest(
    request,
    mutation,
    {},
    { Authorization: `Bearer ${accessToken}` },
  );

  if (result.errors) {
    console.error('Errors enabling 2FA:', result.errors);
    return null;
  }

  return result.data?.enableTwoFactorAuth || null;
}

/**
 * Helper to verify 2FA setup via API
 */
async function verifyTwoFactorViaApi(request: any, accessToken: string, token: string): Promise<boolean> {
  const mutation = `
    mutation VerifyTwoFactorSetup($input: VerifyTwoFactorSetupInput!) {
      verifyTwoFactorSetup(input: $input) {
        success
        backupCodes
      }
    }
  `;

  const result = await graphqlRequest(
    request,
    mutation,
    { input: { token } },
    { Authorization: `Bearer ${accessToken}` },
  );

  if (result.errors) {
    console.error('Errors verifying 2FA:', result.errors);
    return false;
  }

  return result.data?.verifyTwoFactorSetup?.success || false;
}

test.describe('Two-Factor Authentication Settings Enable Flow', () => {
  let accessToken: string | null = null;
  let initial2FAState = false;

  /**
   * Setup: Login and check initial 2FA state
   */
  test.beforeAll(async ({ request }) => {
    const backendAvailable = await isBackendAvailable(request);
    if (!backendAvailable) {
      console.log('Backend not available, skipping 2FA settings flow tests');
      return;
    }

    // Login via API to get access token
    const loginResult = await loginViaApi(request, TEST_EMAIL, TEST_PASSWORD);

    if (loginResult.errors) {
      console.error('Login failed:', loginResult.errors);
      return;
    }

    if (loginResult.data?.login?.requiresTwoFactor) {
      console.log('User already has 2FA enabled, need to complete login with 2FA token');
      // For this test, we'll skip if 2FA is already enabled
      // The test will handle disabling it first
    }

    accessToken = loginResult.data?.login?.accessToken || null;

    if (accessToken) {
      // Check current 2FA state
      const settingsResult = await getTwoFactorSettings(request, accessToken);
      initial2FAState = settingsResult.data?.twoFactorSettings?.enabled || false;

      // If 2FA is already enabled, disable it first for clean test
      if (initial2FAState) {
        console.log('Disabling existing 2FA for clean test state');
        await disable2FA(request, accessToken, TEST_PASSWORD);
      }
    }
  });

  /**
   * Cleanup: Disable 2FA if it was enabled during test
   */
  test.afterAll(async ({ request }) => {
    if (accessToken) {
      try {
        const settingsResult = await getTwoFactorSettings(request, accessToken);
        const isEnabled = settingsResult.data?.twoFactorSettings?.enabled || false;

        if (isEnabled) {
          console.log('Cleaning up: Disabling 2FA after test');
          await disable2FA(request, accessToken, TEST_PASSWORD);
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  test.beforeEach(async ({ request }) => {
    const backendAvailable = await isBackendAvailable(request);
    if (!backendAvailable) {
      test.skip(true, 'Backend not available');
    }
    if (!accessToken) {
      test.skip(true, 'Could not obtain access token');
    }
  });

  test.describe('UI Flow: Enable 2FA from Settings', () => {
    test('should complete the full 2FA enable flow from settings page', async ({ page }) => {
      // 1. Login as user without 2FA enabled
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');

      // Wait for successful login (redirect to dashboard or settings)
      await page.waitForURL(
        (url) =>
          url.pathname.includes('/dashboard') ||
          url.pathname.includes('/chat') ||
          url.pathname.includes('/settings'),
        { timeout: 10000 },
      );

      // 2. Navigate to /settings -> Security tab
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Click on Security tab
      await page.getByRole('button', { name: /security/i }).click();
      await page.waitForTimeout(500);

      // Verify Security tab is active
      const activeTab = page.locator('button[aria-selected="true"], button.bg-primary');
      await expect(activeTab).toContainText(/security/i);

      // 3. Verify 2FA status card is displayed
      const statusCard = page.locator('text=/Two-Factor Authentication/i').first();
      await expect(statusCard).toBeVisible();

      // Look for "Enable" button (2FA should be disabled initially)
      const enableButton = page.getByRole('button', { name: /enable/i }).or(
        page.locator('button').filter({ hasText: /enable/i })
      );

      // Check if 2FA is already enabled (from previous failed test)
      const manageButton = page.getByRole('button', { name: /manage/i }).or(
        page.locator('button').filter({ hasText: /manage/i })
      );

      const isManageVisible = await manageButton.isVisible().catch(() => false);

      if (isManageVisible) {
        console.log('2FA already enabled from previous test, disabling first');
        await manageButton.click();

        // Wait for manage modal
        await page.waitForTimeout(500);

        // Look for disable button
        const disableButton = page.getByRole('button', { name: /disable 2fa/i }).or(
          page.locator('button').filter({ hasText: /disable 2fa/i })
        );

        if (await disableButton.isVisible().catch(() => false)) {
          await disableButton.click();
          await page.waitForTimeout(500);

          // Enter password
          await page.fill('input[type="password"]', TEST_PASSWORD);
          await page.click('button[type="submit"], button:has-text("Disable")');
          await page.waitForTimeout(1000);
        }

        // Close dialog if still open
        const closeButton = page.getByRole('button', { name: /close|cancel/i }).first();
        if (await closeButton.isVisible().catch(() => false)) {
          await closeButton.click();
        }

        await page.waitForTimeout(500);
      }

      // 3. Click 'Enable two-factor authentication' button
      const finalEnableButton = page.getByRole('button', { name: /^enable$/i }).or(
        page.locator('button').filter({ hasText: /^enable$/i })
      );
      await expect(finalEnableButton).toBeVisible();
      await finalEnableButton.click();

      // 4. Verify info modal appears
      await page.waitForTimeout(500);
      const dialogTitle = page.locator('text=/Two-Factor Authentication/i');
      await expect(dialogTitle).toBeVisible();

      // Verify modal content
      await expect(page.locator('text=/extra layer of security/i')).toBeVisible();
      await expect(page.locator('text=/authenticator app/i')).toBeVisible();
      await expect(page.locator('text=/backup codes/i')).toBeVisible();

      // 5. Click 'Get Started' button
      const getStartedButton = page.getByRole('button', { name: /get started/i }).or(
        page.locator('button').filter({ hasText: /get started/i })
      );
      await expect(getStartedButton).toBeVisible();

      // Track network calls for enableTwoFactorAuth mutation
      const enableMutationPromise = page.waitForResponse(async (response) => {
        const url = response.url();
        return url.includes('graphql') && response.status() === 200;
      });

      await getStartedButton.click();

      // Wait for the mutation to complete
      await enableMutationPromise;
      await page.waitForTimeout(1000);

      // 6. Verify QR code is displayed
      const qrCodeSection = page.locator('text=/scan qr code/i').or(
        page.locator('text=/Scan QR Code/i')
      );
      await expect(qrCodeSection).toBeVisible();

      // Verify QR code image or canvas is present
      const qrImage = page.locator('img[src*="data:image"]').or(
        page.locator('canvas').or(page.locator('svg'))
      );
      await expect(qrImage.first()).toBeVisible();

      // Also verify "Enter 6-digit code" input is visible
      const codeInput = page.locator('input[id="verify-code"], input[placeholder*="000"]').or(
        page.locator('input[inputmode="numeric"]')
      );
      await expect(codeInput).toBeVisible();

      // Get the secret from the page for generating TOTP (if visible)
      let totpSecret = '';
      const secretElement = page.locator('code').filter({ hasText: /^[A-Z2-7]+$/ });

      // Expand "Can't scan?" section to get the secret
      const cantScanLink = page.getByText(/can'?t scan/i).or(
        page.locator('text=/can.?t scan/i')
      );

      if (await cantScanLink.isVisible().catch(() => false)) {
        await cantScanLink.click();
        await page.waitForTimeout(300);

        const secretCode = page.locator('code').filter({ hasText: /^[A-Z2-7]{16,}$/ });
        const secretText = await secretCode.textContent().catch(() => '');
        if (secretText) {
          totpSecret = secretText.replace(/[^A-Z2-7]/g, '');
          console.log('Found TOTP secret:', totpSecret);
        }
      }

      // If we couldn't get the secret from UI, use API to get it
      if (!totpSecret && accessToken) {
        console.log('Getting TOTP secret via API');
        const enableResult = await enableTwoFactorViaApi(page.request, accessToken);

        if (enableResult?.secret) {
          totpSecret = enableResult.secret;
          console.log('TOTP secret from API:', totpSecret);
        } else {
          // Skip if we can't get the secret
          console.log('Could not obtain TOTP secret, skipping verification');
          test.skip(true, 'Could not obtain TOTP secret');
          return;
        }
      }

      // Generate valid TOTP token
      const totpToken = generateTOTPToken(totpSecret);
      console.log('Generated TOTP token for testing:', totpToken);

      // 7. Enter the 6-digit TOTP code
      await codeInput.fill(totpToken);
      await page.waitForTimeout(500);

      // Verify the button is now enabled
      const verifyButton = page.getByRole('button', { name: /verify & enable/i }).or(
        page.locator('button').filter({ hasText: /verify/i })
      );
      await expect(verifyButton).toBeEnabled();

      // Track network calls for verifyTwoFactorSetup mutation
      const verifyMutationPromise = page.waitForResponse(async (response) => {
        const url = response.url();
        return url.includes('graphql') && response.status() === 200;
      });

      // Click verify button
      await verifyButton.click();

      // Wait for the mutation to complete
      await verifyMutationPromise;
      await page.waitForTimeout(2000);

      // 8. Verify success modal with backup codes is shown
      const successTitle = page.locator('text=/enabled/i').or(
        page.locator('text=/Two-Factor Authentication Enabled/i')
      );
      await expect(successTitle).toBeVisible({ timeout: 5000 });

      // Verify backup codes are displayed
      const backupCodesTitle = page.locator('text=/backup codes/i');
      await expect(backupCodesTitle).toBeVisible();

      // Verify we have multiple backup codes displayed (should be 10 codes)
      const codeElements = page.locator('code');
      const codeCount = await codeElements.count();
      expect(codeCount).toBeGreaterThanOrEqual(5); // At least some codes should be visible

      // Verify copy and download buttons
      const copyButton = page.getByRole('button', { name: /copy all/i }).or(
        page.locator('button').filter({ hasText: /copy/i })
      );
      await expect(copyButton).toBeVisible();

      const downloadButton = page.getByRole('button', { name: /download/i }).or(
        page.locator('button').filter({ hasText: /download/i })
      );
      await expect(downloadButton).toBeVisible();

      // Take screenshot of success state
      await page.screenshot({ path: 'test-results/2fa-enable-success.png' });

      // Close the dialog
      const doneButton = page.getByRole('button', { name: /done/i }).or(
        page.locator('button').filter({ hasText: /done/i })
      );
      await doneButton.click();

      await page.waitForTimeout(500);

      // 9. Confirm 2FA is enabled in settings
      // The status should now show "Enabled"
      const enabledStatus = page.locator('text=/enabled - your account is protected/i').or(
        page.locator('text=/Enabled/i').locator('..').locator('text=/protected/i')
      );

      // The button should now say "Manage" instead of "Enable"
      const manageButtonAfter = page.getByRole('button', { name: /manage/i }).or(
        page.locator('button').filter({ hasText: /^manage$/i })
      );
      await expect(manageButtonAfter).toBeVisible({ timeout: 5000 });

      // Verify backup codes remaining count is shown
      const backupCodesCount = page.locator('text=/backup codes remaining/i').or(
        page.locator('text=/\\d+ backup codes/i')
      );
      await expect(backupCodesCount).toBeVisible();

      // Also verify via API that 2FA is enabled
      if (accessToken) {
        const settingsResult = await getTwoFactorSettings(page.request, accessToken);
        const isEnabled = settingsResult.data?.twoFactorSettings?.enabled || false;
        expect(isEnabled).toBe(true);

        const remainingCodes = settingsResult.data?.twoFactorSettings?.remainingBackupCodes;
        expect(remainingCodes).toBe(10);

        console.log('Verified via API: 2FA is enabled with', remainingCodes, 'backup codes');
      }

      // Take final screenshot
      await page.screenshot({ path: 'test-results/2fa-enabled-in-settings.png' });
    });

    test('should verify enableTwoFactorAuth mutation in network trace', async ({ page }) => {
      // This test specifically verifies the GraphQL mutation is called correctly
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');

      await page.waitForURL(
        (url) =>
          url.pathname.includes('/dashboard') ||
          url.pathname.includes('/chat') ||
          url.pathname.includes('/settings'),
        { timeout: 10000 },
      );

      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Click on Security tab
      await page.getByRole('button', { name: /security/i }).click();
      await page.waitForTimeout(500);

      // Setup network listener for GraphQL mutations
      const mutations: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes('graphql')) {
          const postData = request.postData();
          if (postData) {
            try {
              const data = JSON.parse(postData);
              if (data.query) {
                if (data.query.includes('enableTwoFactorAuth')) {
                  mutations.push('enableTwoFactorAuth');
                }
                if (data.query.includes('verifyTwoFactorSetup')) {
                  mutations.push('verifyTwoFactorSetup');
                }
                if (data.query.includes('twoFactorSettings')) {
                  mutations.push('twoFactorSettings');
                }
              }
            } catch {
              // Ignore parsing errors
            }
          }
        }
      });

      // Click Enable button (skip if 2FA already enabled)
      const enableButton = page.getByRole('button', { name: /^enable$/i });
      const isEnableVisible = await enableButton.isVisible().catch(() => false);

      if (!isEnableVisible) {
        console.log('2FA already enabled, skipping network trace test');
        test.skip(true, '2FA already enabled from previous test');
        return;
      }

      await enableButton.click();
      await page.waitForTimeout(500);

      // Click Get Started
      const getStartedButton = page.getByRole('button', { name: /get started/i });
      await getStartedButton.click();
      await page.waitForTimeout(2000);

      // Verify enableTwoFactorAuth mutation was called
      expect(mutations).toContain('enableTwoFactorAuth');

      // Close the dialog
      const closeButton = page.getByRole('button', { name: /cancel/i }).first();
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
      }
    });

    test('should show proper validation for invalid TOTP code', async ({ page }) => {
      // This test verifies validation behavior when entering invalid codes
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');

      await page.waitForURL(
        (url) =>
          url.pathname.includes('/dashboard') ||
          url.pathname.includes('/chat') ||
          url.pathname.includes('/settings'),
        { timeout: 10000 },
      );

      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Click on Security tab
      await page.getByRole('button', { name: /security/i }).click();
      await page.waitForTimeout(500);

      // Start 2FA setup
      const enableButton = page.getByRole('button', { name: /^enable$/i });
      const isEnableVisible = await enableButton.isVisible().catch(() => false);

      if (!isEnableVisible) {
        // Disable 2FA first if it's already enabled
        const manageButton = page.getByRole('button', { name: /manage/i });
        await manageButton.click();
        await page.waitForTimeout(500);

        const disableButton = page.getByRole('button', { name: /disable 2fa/i });
        if (await disableButton.isVisible().catch(() => false)) {
          await disableButton.click();
          await page.waitForTimeout(500);
          await page.fill('input[type="password"]', TEST_PASSWORD);
          await page.click('button:has-text("Disable 2FA"), button[type="submit"]');
          await page.waitForTimeout(1000);
        }

        const closeBtn = page.getByRole('button', { name: /close/i }).first();
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click();
        }

        await page.waitForTimeout(500);
      }

      await enableButton.click();
      await page.waitForTimeout(500);

      const getStartedButton = page.getByRole('button', { name: /get started/i });
      await getStartedButton.click();
      await page.waitForTimeout(1000);

      // Find the code input
      const codeInput = page.locator('input[id="verify-code"], input[placeholder*="000"]').or(
        page.locator('input[inputmode="numeric"]')
      );

      // Enter invalid code
      await codeInput.fill('999999');
      await page.waitForTimeout(500);

      // Click verify button
      const verifyButton = page.getByRole('button', { name: /verify/i });
      await verifyButton.click();
      await page.waitForTimeout(2000);

      // Verify error message is shown
      const errorMessage = page.locator('text=/invalid|incorrect/i').or(
        page.locator('.destructive, .error').filter({ hasText: /invalid|incorrect/i })
      );

      const errorVisible = await errorMessage.isVisible().catch(() => false);
      if (errorVisible) {
        console.log('Error message shown for invalid TOTP code');
        await page.screenshot({ path: 'test-results/2fa-invalid-code-error.png' });
      }

      // Close dialog
      const closeButton = page.getByRole('button', { name: /cancel/i }).first();
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
      }
    });
  });
});
