import { test, expect } from '@playwright/test';

test.describe('Settings Preferences Save Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login');

    // Fill in login credentials
    await page.fill('#email', 'admin@refine.dev');
    await page.fill('#password', 'password');

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for navigation - could be chat or dashboard
    await page.waitForURL(/\/(chat|dashboard)/, { timeout: 10000 });
  });

  test('should load settings page with preferences', async ({ page }) => {
    // Navigate to settings page
    await page.goto('http://localhost:3000/settings');

    // Wait for the page to load
    await page.waitForSelector('nav button', { timeout: 10000 });

    // Check that settings title is visible
    const title = await page.textContent('h1');
    console.log('Page title:', title);
    expect(title).toContain('Settings');

    // Click on Preferences button
    await page.click('nav button:has-text("Preferences")');

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/settings-preferences-debug.png' });

    // Check for any form elements
    const inputs = await page.locator('select, input').count();
    console.log('Form inputs found:', inputs);
    expect(inputs).toBeGreaterThan(0);
  });

  test('should save preferences successfully', async ({ page }) => {
    // Navigate directly to settings page with preferences tab
    await page.goto('http://localhost:3000/settings');

    // Wait for the page to load - look for sidebar nav
    await page.waitForSelector('nav button', { timeout: 10000 });

    // Click on Preferences button in sidebar
    await page.click('nav button:has-text("Preferences")');

    // Wait for preferences form to load - wait a bit longer for data to load
    await page.waitForTimeout(2000);

    // Listen for network requests to capture GraphQL mutation
    let graphqlMutation: string | null = null;
    let graphqlVariables: string | null = null;
    let graphqlResponse: any = null;

    page.on('request', async (request) => {
      if (request.url().includes('/graphql') && request.method() === 'POST') {
        const postData = request.postData();
        if (postData) {
          try {
            const parsed = JSON.parse(postData);
            if (parsed.query && parsed.query.includes('updateMyPreferences')) {
              graphqlMutation = parsed.query;
              graphqlVariables = JSON.stringify(parsed.variables, null, 2);
              console.log('Mutation captured!');
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('/graphql') && response.request().method() === 'POST') {
        const postData = response.request().postData();
        if (postData && postData.includes('updateMyPreferences')) {
          try {
            graphqlResponse = await response.json();
            console.log('Response:', JSON.stringify(graphqlResponse, null, 2));
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    });

    // Change locale to trigger the form being dirty
    const localeSelect = page.locator('#locale');
    await localeSelect.selectOption('pl');

    // Click save button
    await page.click('button[type="submit"]');

    // Wait for mutation to complete
    await page.waitForTimeout(3000);

    // Log results for debugging
    console.log('GraphQL Mutation:', graphqlMutation || 'No mutation captured');
    console.log('Variables:', graphqlVariables || 'No variables captured');

    // Check that the mutation was called
    expect(graphqlMutation).toBeTruthy();

    // Check for success - no error message should be visible
    const errorElements = await page.locator('text=/error|failed|could not/i').count();
    console.log('Error elements found:', errorElements);
    expect(errorElements).toBe(0);
  });
});
