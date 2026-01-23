import { test, expect } from '@playwright/test';

/**
 * Settings Preferences Save Verification Test
 *
 * This test verifies that the preferences form on the /settings page
 * correctly saves data using the updateMyPreferences GraphQL mutation.
 *
 * Prerequisites:
 * - Frontend server running on http://localhost:3000
 * - Backend server running on http://localhost:4000
 * - Test user exists: admin@refine.dev / password
 */

test.describe('Settings Preferences Save Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@refine.dev');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    // Wait for navigation after login (may go to dashboard, chat, or settings)
    await page.waitForURL('**/(dashboard|chat|settings)', { timeout: 10000 });
  });

  test('should save preferences successfully', async ({ page }) => {
    // Track GraphQL requests
    let mutationRequest: { query: string; variables: any } | null = null;

    page.on('request', async (request) => {
      if (request.url().includes('/graphql') && request.method() === 'POST') {
        const postData = request.postData();
        if (postData) {
          try {
            const parsed = JSON.parse(postData);
            if (parsed.query && parsed.query.includes('updateMyPreferences')) {
              mutationRequest = {
                query: parsed.query,
                variables: parsed.variables,
              };
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    });

    // Navigate to settings page
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Click on Preferences tab
    await page.getByRole('button', { name: /preferences/i }).click();
    await page.waitForTimeout(1000);

    // Change the locale to make form dirty
    const localeSelect = page.locator('#locale');
    await localeSelect.selectOption('pl');
    await page.waitForTimeout(500);

    // Click the save button
    const saveButton = page.locator('button[type="submit"]').first();
    await saveButton.click();

    // Wait for mutation to complete
    await page.waitForTimeout(3000);

    // Verify the mutation was called
    expect(mutationRequest).not.toBeNull();

    // Verify the mutation query contains the expected operation
    if (mutationRequest) {
      expect(mutationRequest.query).toContain('updateMyPreferences');
    }

    // Verify no error message is visible
    const errorElements = await page.locator('text=/error|failed|could not/i').count();
    expect(errorElements).toBe(0);
  });
});
