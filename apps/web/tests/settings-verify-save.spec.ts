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
    // Wait for navigation after login - wait for network idle instead
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  });

  test('should save preferences successfully', async ({ page }) => {
    // Track console messages for debugging
    page.on('console', (msg) => {
      console.log(`Console [${msg.type()}]:`, msg.text());
      if (msg.type() === 'error') {
        const args = msg.args();
        args.forEach((arg) => console.log('Error arg:', arg.jsonValue()));
      }
    });

    // Track all GraphQL requests for debugging
    const allRequests: { query: string; variables: any; url: string }[] = [];

    page.on('request', async (request) => {
      const url = request.url();
      if (url.includes('/graphql') && request.method() === 'POST') {
        const postData = request.postData();
        if (postData) {
          try {
            const parsed = JSON.parse(postData);
            allRequests.push({
              query: parsed.query || '',
              variables: parsed.variables,
              url,
            });
            console.log('GraphQL Request:', parsed.query?.substring(0, 200), parsed.variables);
          } catch (e) {
            console.log('Failed to parse GraphQL request');
          }
        }
      }
    });

    // Track GraphQL responses for errors
    page.on('response', async (response) => {
      if (response.url().includes('/graphql')) {
        try {
          const body = await response.text();
          console.log('GraphQL Response status:', response.status());
          if (body.includes('errors')) {
            console.log('GraphQL Error:', body.substring(0, 500));
          }
        } catch (e) {
          // Ignore
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

    // Wait for form to become dirty and button to be enabled
    await page.waitForTimeout(1000);

    // Click the save button
    const saveButton = page.locator('button[type="submit"]').first();
    const saveButtonText = await saveButton.textContent();
    console.log('Save button text:', saveButtonText);
    const isDisabled = await saveButton.isDisabled();
    console.log('Save button disabled:', isDisabled);

    if (isDisabled) {
      console.log('Save button is disabled, form is not dirty');
      // Try clicking anyway to see what happens
      await saveButton.click({ force: true });
    } else {
      await saveButton.click();
    }

    // Wait for mutation to complete
    await page.waitForTimeout(3000);

    // Check for error messages after save
    const errorMessages = await page.locator('text=/error/i').all();
    console.log('Error messages found:', errorMessages.length);
    for (const msg of errorMessages) {
      console.log('Error text:', await msg.textContent());
    }

    // Log all captured requests
    console.log('Total GraphQL requests:', allRequests.length);
    const mutationRequest = allRequests.find(
      (r) => r.query.includes('updateMyPreferences') || r.query.includes('mutation')
    );

    // Verify the mutation was called
    expect(mutationRequest).toBeDefined();

    // Verify the mutation query contains the expected operation
    if (mutationRequest) {
      expect(mutationRequest.query).toContain('updateMyPreferences');
    }

    // Verify no error message is visible
    const errorElements = await page.locator('text=/error|failed|could not/i').count();
    expect(errorElements).toBe(0);
  });
});
