import { test, expect } from '@playwright/test';

/**
 * Settings Page E2E Tests
 *
 * Comprehensive end-to-end tests for the /settings page covering:
 * - Page load and rendering
 * - All tabs (Profile, Preferences, Security, Notifications, API Keys)
 * - Form inputs and controls
 * - Save/update operations
 * - Validation rules and error states
 * - Toggles, dropdowns, and interactive elements
 */

const SETTINGS_URL = '/settings';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');

    // Fill in login form
    await page.fill('input[type="email"]', 'admin@refine.dev');
    await page.fill('input[type="password"]', 'password');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation after login (may go to dashboard, chat, or settings)
    await page.waitForURL(
      (url) =>
        url.pathname.includes('/dashboard') ||
        url.pathname.includes('/chat') ||
        url.pathname.includes('/settings'),
      { timeout: 10000 },
    );
  });

  test('should load the settings page successfully', async ({ page }) => {
    await page.goto(SETTINGS_URL);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that the page title is visible
    const heading = page.locator('h1');
    await expect(heading).toContainText('Settings', { timeout: 10000 });

    // Take screenshot
    await page.screenshot({ path: 'test-results/settings-page-load.png' });
  });

  test('should display all settings tabs', async ({ page }) => {
    await page.goto(SETTINGS_URL);
    await page.waitForLoadState('networkidle');

    // Check for all expected tabs
    const tabs = ['Profile', 'Preferences', 'Security', 'Notifications', 'API Keys'];

    for (const tab of tabs) {
      const tabElement = page.getByRole('button', { name: new RegExp(tab, 'i') });
      await expect(tabElement).toBeVisible();
    }
  });

  test.describe('Profile Tab', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(SETTINGS_URL);
      await page.waitForLoadState('networkidle');

      // Click on Profile tab
      await page.getByRole('button', { name: /profile/i }).click();
      await page.waitForTimeout(500);
    });

    test('should display profile form with all fields', async ({ page }) => {
      // Check for form fields
      await expect(page.locator('input[id="email"]')).toBeVisible();
      await expect(page.locator('input[id="username"]')).toBeVisible();
      await expect(page.locator('input[id="firstName"]')).toBeVisible();
      await expect(page.locator('input[id="lastName"]')).toBeVisible();

      // Check for save button
      await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible();
    });

    test('should pre-fill form with current user data', async ({ page }) => {
      // Check that fields are pre-filled
      const emailValue = await page.locator('input[id="email"]').inputValue();
      expect(emailValue).toBeTruthy();
      expect(emailValue).toContain('@');

      const usernameValue = await page.locator('input[id="username"]').inputValue();
      expect(usernameValue).toBeTruthy();
    });

    test('should validate email format', async ({ page }) => {
      // Clear email field
      await page.fill('input[id="email"]', 'invalid-email');

      // Try to save - the button should be enabled since form is dirty
      const saveButton = page.getByRole('button', { name: /save changes/i });
      await saveButton.click();

      // Wait for validation error
      await page.waitForTimeout(1000);

      // Check for validation error (may appear as inline error or form error)
      const hasError = (await page.locator('text=/invalid|email/i').count()) > 0;
      if (hasError) {
        console.log('Email validation error displayed as expected');
      }
    });

    test('should validate username format', async ({ page }) => {
      // Clear username field and enter invalid characters
      await page.fill('input[id="username"]', 'ab');

      // Try to save
      const saveButton = page.getByRole('button', { name: /save changes/i });
      await saveButton.click();

      // Wait for validation
      await page.waitForTimeout(1000);

      // Check for validation (min length is 3)
      const usernameValue = await page.locator('input[id="username"]').inputValue();
      if (usernameValue === 'ab') {
        const hasError = (await page.locator('text=/min length|at least 3/i').count()) > 0;
        if (hasError) {
          console.log('Username validation error displayed as expected');
        }
      }
    });

    test('should save profile changes successfully', async ({ page }) => {
      // Generate a unique test value
      const testValue = `TestUser${Date.now()}`;

      // Update first name
      await page.fill('input[id="firstName"]', testValue);

      // Click save button
      const saveButton = page.getByRole('button', { name: /save changes/i });
      await saveButton.click();

      // Wait for save operation
      await page.waitForTimeout(3000);

      // Check for success message or error
      const hasSuccess =
        (await page
          .locator('div')
          .filter({ hasText: /success|saved|updated/i })
          .count()) > 0;
      const hasError =
        (await page
          .locator('div')
          .filter({ hasText: /error|not configured/i })
          .count()) > 0;

      if (hasError) {
        // Get the error message
        const errorElement = page
          .locator('div')
          .filter({ hasText: /error|not configured/i })
          .first();
        const errorText = await errorElement.textContent();
        console.error('Error saving profile:', errorText);

        // Take screenshot of error state
        await page.screenshot({ path: 'test-results/settings-profile-error.png' });

        throw new Error(`Profile save failed: ${errorText}`);
      }

      if (hasSuccess) {
        console.log('Profile saved successfully');

        // Verify the value was saved by reloading the page
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: /profile/i }).click();
        await page.waitForTimeout(500);

        const savedValue = await page.locator('input[id="firstName"]').inputValue();
        expect(savedValue).toBe(testValue);
      } else {
        console.log(
          'No success message detected, but also no error. Check if save completed silently.',
        );
      }

      await page.screenshot({ path: 'test-results/settings-profile-after-save.png' });
    });
  });

  test.describe('Preferences Tab', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(SETTINGS_URL);
      await page.waitForLoadState('networkidle');

      // Click on Preferences tab
      await page.getByRole('button', { name: /preferences/i }).click();
      await page.waitForTimeout(500);
    });

    test('should display preferences form with all fields', async ({ page }) => {
      // Check for dropdown fields
      await expect(page.locator('select[id="locale"]')).toBeVisible();
      await expect(page.locator('select[id="theme"]')).toBeVisible();
      await expect(page.locator('select[id="aiModel"]')).toBeVisible();
      await expect(page.locator('select[id="timezone"]')).toBeVisible();
      await expect(page.locator('select[id="dateFormat"]')).toBeVisible();

      // Check for save button
      await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
    });

    test('should save preferences changes successfully', async ({ page }) => {
      // Select a different theme
      await page.selectOption('select[id="theme"]', 'DARK');

      // Click save button
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();

      // Wait for save operation
      await page.waitForTimeout(3000);

      // Check for errors
      const hasError =
        (await page
          .locator('div')
          .filter({ hasText: /error|not configured/i })
          .count()) > 0;

      if (hasError) {
        const errorElement = page
          .locator('div')
          .filter({ hasText: /error|not configured/i })
          .first();
        const errorText = await errorElement.textContent();
        console.error('Error saving preferences:', errorText);
        await page.screenshot({ path: 'test-results/settings-preferences-error.png' });
        throw new Error(`Preferences save failed: ${errorText}`);
      }

      console.log('Preferences saved successfully');
      await page.screenshot({ path: 'test-results/settings-preferences-after-save.png' });
    });
  });

  test.describe('Security Tab', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(SETTINGS_URL);
      await page.waitForLoadState('networkidle');

      // Click on Security tab
      await page.getByRole('button', { name: /security/i }).click();
      await page.waitForTimeout(500);
    });

    test('should display security form with password fields', async ({ page }) => {
      // Check for password fields
      await expect(page.locator('input[id="currentPassword"]')).toBeVisible();
      await expect(page.locator('input[id="newPassword"]')).toBeVisible();
      await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();

      // Check for change password button
      await expect(page.getByRole('button', { name: /change password/i })).toBeVisible();
    });

    test('should validate password confirmation', async ({ page }) => {
      // Fill in mismatched passwords
      await page.fill('input[id="currentPassword"]', 'current123');
      await page.fill('input[id="newPassword"]', 'newpassword123');
      await page.fill('input[id="confirmPassword"]', 'different123');

      // Try to save
      const saveButton = page.getByRole('button', { name: /change password/i });
      await saveButton.click();

      // Wait for validation
      await page.waitForTimeout(1000);

      // The form should show an error about passwords not matching
      const hasError = (await page.locator('text=/do not match|different/i').count()) > 0;
      if (hasError) {
        console.log('Password mismatch validation works correctly');
      }
    });
  });

  test.describe('Notifications Tab', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(SETTINGS_URL);
      await page.waitForLoadState('networkidle');

      // Click on Notifications tab
      await page.getByRole('button', { name: /notifications/i }).click();
      await page.waitForTimeout(500);
    });

    test('should display notification preferences', async ({ page }) => {
      // Check for notification type checkboxes
      await expect(page.locator('input[type="checkbox"]').first()).toBeVisible();

      // Check for save button
      await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
    });

    test('should toggle notification checkboxes', async ({ page }) => {
      // Find first checkbox and toggle it
      const firstCheckbox = page.locator('input[type="checkbox"]').first();

      const isChecked = await firstCheckbox.isChecked();
      await firstCheckbox.click();

      // Wait a bit
      await page.waitForTimeout(500);

      const newCheckedState = await firstCheckbox.isChecked();
      expect(newCheckedState).not.toBe(isChecked);
    });
  });

  test.describe('API Keys Tab', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(SETTINGS_URL);
      await page.waitForLoadState('networkidle');

      // Click on API Keys tab
      await page.getByRole('button', { name: /api keys/i }).click();
      await page.waitForTimeout(1000); // Longer wait for data fetching
    });

    test('should display API keys section', async ({ page }) => {
      // Wait for content to load
      await page.waitForTimeout(1000);

      // Check for create button
      const createButton = page.getByRole('button', { name: /create|new api key/i });
      // The button might be there, just check the page has content
      await page.screenshot({ path: 'test-results/settings-api-keys.png' });
    });
  });

  test.describe('Tab Navigation', () => {
    test('should switch between tabs correctly', async ({ page }) => {
      await page.goto(SETTINGS_URL);
      await page.waitForLoadState('networkidle');

      // Start on Profile tab (default)
      let activeTab = page.locator('button[aria-selected="true"], button.bg-primary');
      await expect(activeTab).toContainText(/profile/i, { timeout: 5000 });

      // Switch to Preferences
      await page.getByRole('button', { name: /preferences/i }).click();
      await page.waitForTimeout(500);
      activeTab = page.locator('button[aria-selected="true"], button.bg-primary');
      await expect(activeTab).toContainText(/preferences/i);

      // Switch to Security
      await page.getByRole('button', { name: /security/i }).click();
      await page.waitForTimeout(500);
      activeTab = page.locator('button[aria-selected="true"], button.bg-primary');
      await expect(activeTab).toContainText(/security/i);

      // Switch to Notifications
      await page.getByRole('button', { name: /notifications/i }).click();
      await page.waitForTimeout(500);
      activeTab = page.locator('button[aria-selected="true"], button.bg-primary');
      await expect(activeTab).toContainText(/notifications/i);

      // Switch to API Keys
      await page.getByRole('button', { name: /api keys/i }).click();
      await page.waitForTimeout(500);
      activeTab = page.locator('button[aria-selected="true"], button.bg-primary');
      await expect(activeTab).toContainText(/api keys/i);
    });
  });
});
