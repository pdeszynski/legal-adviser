import { test, expect } from '@playwright/test';

/**
 * Two-Factor Authentication Setup Flow Verification Test
 *
 * This test verifies that the fix for the 2FA setup bug works correctly.
 * The bug was that `twoFactorSecret` was not being selected from the database
 * because it has `select: false` in the entity definition.
 *
 * Test flow:
 * 1. Login as a user without 2FA
 * 2. Enable 2FA (stores secret in DB)
 * 3. Verify 2FA setup (should now be able to read the secret from DB)
 *
 * Expected: verifyTwoFactorSetup should succeed without the error
 * "Two-factor authentication has not been initiated. Call enableTwoFactorAuth first."
 */

const GRAPHQL_URL = 'http://localhost:3333/graphql';

/**
 * Generate a valid TOTP token for a given secret
 */
function generateTOTPToken(secret: string): string {
  const crypto = require('crypto');

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

  // HMAC-SHA1
  const hmac = crypto.createHmac('sha1', Buffer.from(secretBytes));
  hmac.update(Buffer.from(timeBytes));
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

test('should complete 2FA setup without "not initiated" error', async ({ request }) => {
  // Test user credentials (use a fresh test user each time)
  const TEST_EMAIL = `test-2fa-${Date.now()}@example.com`;
  const TEST_USERNAME = `test2fa${Date.now()}`;
  const TEST_PASSWORD = 'testPassword123!';

  // Step 1: Register a new user
  console.log('Registering test user:', TEST_EMAIL);

  const registerMutation = `
    mutation Register($input: RegisterInput!) {
      register(input: $input) {
        accessToken
        refreshToken
        user {
          id
          email
        }
      }
    }
  `;

  const registerResponse = await request.post(GRAPHQL_URL, {
    headers: { 'Content-Type': 'application/json' },
    data: {
      query: registerMutation,
      variables: { input: { email: TEST_EMAIL, username: TEST_USERNAME, password: TEST_PASSWORD } },
    },
  });

  const registerResult = await registerResponse.json();

  expect(registerResult.errors).toBeUndefined();
  expect(registerResult.data?.register).toBeDefined();

  const accessToken = registerResult.data?.register?.accessToken;
  expect(accessToken).toBeDefined();

  // Step 2: Enable 2FA (this stores the secret in database)
  console.log('Enabling 2FA...');

  const enableMutation = `
    mutation EnableTwoFactorAuth {
      enableTwoFactorAuth {
        secret
        qrCodeDataUrl
        backupCodes
      }
    }
  `;

  const enableResponse = await request.post(GRAPHQL_URL, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    data: { query: enableMutation },
  });

  const enableResult = await enableResponse.json();

  expect(enableResult.errors).toBeUndefined();
  expect(enableResult.data?.enableTwoFactorAuth).toBeDefined();

  const { secret, backupCodes } = enableResult.data?.enableTwoFactorAuth || {};
  expect(secret).toBeDefined();
  expect(backupCodes).toHaveLength(10);

  console.log('2FA enabled, got secret:', secret);

  // Step 3: Verify 2FA setup (this should now work with the fix)
  // Generate a valid TOTP token
  const totpToken = generateTOTPToken(secret);
  console.log('Generated TOTP token:', totpToken);

  console.log('Verifying 2FA setup...');

  const verifyMutation = `
    mutation VerifyTwoFactorSetup($input: VerifyTwoFactorSetupInput!) {
      verifyTwoFactorSetup(input: $input) {
        success
        backupCodes
      }
    }
  `;

  const verifyResponse = await request.post(GRAPHQL_URL, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    data: {
      query: verifyMutation,
      variables: { input: { token: totpToken } },
    },
  });

  const verifyResult = await verifyResponse.json();

  // This is the critical check - verifyTwoFactorSetup should succeed
  expect(verifyResult.errors).toBeUndefined();
  expect(verifyResult.data?.verifyTwoFactorSetup?.success).toBe(true);

  console.log('2FA setup verified successfully!');
});

test('should fail verifyTwoFactorSetup when called before enableTwoFactorAuth', async ({ request }) => {
  // Register a new user
  const email = `test-2fa-skip-${Date.now()}@example.com`;
  const username = `test2faskip${Date.now()}`;

  const registerMutation = `
    mutation Register($input: RegisterInput!) {
      register(input: $input) {
        accessToken
        user {
          id
          email
        }
      }
    }
  `;

  const registerResponse = await request.post(GRAPHQL_URL, {
    headers: { 'Content-Type': 'application/json' },
    data: {
      query: registerMutation,
      variables: { input: { email, username, password: 'testPassword123!' } },
    },
  });

  const registerResult = await registerResponse.json();

  expect(registerResult.errors).toBeUndefined();
  const accessToken = registerResult.data?.register?.accessToken;

  // Try to verify 2FA without enabling first
  const verifyMutation = `
    mutation VerifyTwoFactorSetup($input: VerifyTwoFactorSetupInput!) {
      verifyTwoFactorSetup(input: $input) {
        success
      }
    }
  `;

  const verifyResponse = await request.post(GRAPHQL_URL, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    data: {
      query: verifyMutation,
      variables: { input: { token: '123456' } },
    },
  });

  const verifyResult = await verifyResponse.json();

  // Should get an error
  expect(verifyResult.errors).toBeDefined();
  expect(verifyResult.errors?.[0]?.message).toContain(
    'Two-factor authentication has not been initiated',
  );

  console.log('Correctly rejected verification without prior enable');
});
