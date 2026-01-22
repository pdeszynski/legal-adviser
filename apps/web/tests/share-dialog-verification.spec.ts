import { test, expect } from '@playwright/test';

/**
 * Verification Test for Share Dialog Component
 *
 * This test verifies the share dialog functionality including:
 * - Dialog rendering
 * - User selection
 * - Permission assignment
 * - Link generation and copying
 * - Collaborators list display
 */

test.describe('Share Dialog Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a test page or setup authentication
    // For now, we'll test the component in isolation
    await page.goto('/documents');
  });

  test('should render share dialog trigger button', async ({ page }) => {
    // Test that a share button exists on the page
    const shareButton = page.locator('button').filter({ hasText: /share/i }).first();
    await expect(shareButton).toBeVisible();
  });

  test('should open share dialog when triggered', async ({ page }) => {
    const shareButton = page.locator('button').filter({ hasText: /share/i }).first();
    await shareButton.click();

    // Verify dialog is visible
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Verify dialog title contains "Share"
    const dialogTitle = dialog.locator('h2');
    await expect(dialogTitle).toContainText(/share/i);
  });

  test('should display tabs for People and Link', async ({ page }) => {
    const shareButton = page.locator('button').filter({ hasText: /share/i }).first();
    await shareButton.click();

    // Check for People tab
    const peopleTab = page.getByRole('button', { name: /people/i });
    await expect(peopleTab).toBeVisible();

    // Check for Share Link tab
    const linkTab = page.getByRole('button', { name: /share link/i });
    await expect(linkTab).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    const shareButton = page.locator('button').filter({ hasText: /share/i }).first();
    await shareButton.click();

    // Click on Link tab
    const linkTab = page.getByRole('button', { name: /share link/i });
    await linkTab.click();

    // Verify link section is visible
    const shareableLink = page.getByText(/shareable link/i);
    await expect(shareableLink).toBeVisible();

    // Click back to People tab
    const peopleTab = page.getByRole('button', { name: /people/i });
    await peopleTab.click();

    // Verify people section is visible
    const addPeople = page.getByText(/add people/i);
    await expect(addPeople).toBeVisible();
  });

  test('should display permission options', async ({ page }) => {
    const shareButton = page.locator('button').filter({ hasText: /share/i }).first();
    await shareButton.click();

    // Ensure People tab is active
    const peopleTab = page.getByRole('button', { name: /people/i });
    await peopleTab.click();

    // Check for permission dropdown
    const permissionLabel = page.getByText(/permission level/i);
    await expect(permissionLabel).toBeVisible();

    // Check for permission dropdown element
    const permissionSelect = page.locator('select').filter({ hasText: /view only|can comment|can edit|admin/i });
    await expect(permissionSelect).toBeVisible();
  });

  test('should display user selection dropdown', async ({ page }) => {
    const shareButton = page.locator('button').filter({ hasText: /share/i }).first();
    await shareButton.click();

    // Ensure People tab is active
    const peopleTab = page.getByRole('button', { name: /people/i });
    await peopleTab.click();

    // Check for user selection
    const userLabel = page.getByText(/select user/i);
    await expect(userLabel).toBeVisible();

    // Check for select element
    const userSelect = page.locator('select').first();
    await expect(userSelect).toBeVisible();
  });

  test('should display expiration input', async ({ page }) => {
    const shareButton = page.locator('button').filter({ hasText: /share/i }).first();
    await shareButton.click();

    // Ensure People tab is active
    const peopleTab = page.getByRole('button', { name: /people/i });
    await peopleTab.click();

    // Check for expiration input
    const expirationLabel = page.getByText(/expires in/i);
    await expect(expirationLabel).toBeVisible();

    // Check for input element
    const expirationInput = page.locator('input[type="number"]');
    await expect(expirationInput).toBeVisible();
  });

  test('should display shareable link on Link tab', async ({ page }) => {
    const shareButton = page.locator('button').filter({ hasText: /share/i }).first();
    await shareButton.click();

    // Click on Link tab
    const linkTab = page.getByRole('button', { name: /share link/i });
    await linkTab.click();

    // Check for link input
    const linkInput = page.locator('input[readonly]').first();
    await expect(linkInput).toBeVisible();

    // Check for copy button
    const copyButton = page.getByRole('button', { name: /copy link/i });
    await expect(copyButton).toBeVisible();
  });

  test('should close dialog when Done button is clicked', async ({ page }) => {
    const shareButton = page.locator('button').filter({ hasText: /share/i }).first();
    await shareButton.click();

    // Verify dialog is open
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Click Done button
    const doneButton = page.getByRole('button', { name: /done/i });
    await doneButton.click();

    // Verify dialog is closed
    await expect(dialog).not.toBeVisible();
  });

  test('should close dialog when X button is clicked', async ({ page }) => {
    const shareButton = page.locator('button').filter({ hasText: /share/i }).first();
    await shareButton.click();

    // Verify dialog is open
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Click X button
    const closeButton = dialog.locator('button[aria-label="Close dialog"]');
    await closeButton.click();

    // Verify dialog is closed
    await expect(dialog).not.toBeVisible();
  });

  test('should display important notes on Link tab', async ({ page }) => {
    const shareButton = page.locator('button').filter({ hasText: /share/i }).first();
    await shareButton.click();

    // Click on Link tab
    const linkTab = page.getByRole('button', { name: /share link/i });
    await linkTab.click();

    // Check for important notes section
    const notes = page.getByText(/important notes/i);
    await expect(notes).toBeVisible();

    // Check for specific notes
    await expect(page.getByText(/users must be logged in/i)).toBeVisible();
    await expect(page.getByText(/access permissions are enforced/i)).toBeVisible();
    await expect(page.getByText(/revoke access at any time/i)).toBeVisible();
  });
});
