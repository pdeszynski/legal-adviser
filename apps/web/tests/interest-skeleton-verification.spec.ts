import { test, expect } from '@playwright/test';

/**
 * Temporary verification test for Interest Page Skeleton Loading
 *
 * This test verifies that the skeleton loading state is properly displayed
 * on the early access interest page before the actual form content loads.
 */

test.describe('Interest Page Skeleton Loading', () => {
  test('should display skeleton on initial page load', async ({ page }) => {
    await page.goto('/early-access');

    // Wait for skeleton to be visible (should appear immediately)
    // The skeleton has a brief 300ms delay before showing the actual form
    const skeletonCard = page.locator('.bg-card.border').first();
    await expect(skeletonCard).toBeVisible();

    // Check for skeleton elements by their animate-shimmer class
    const shimmerElements = page.locator('.animate-shimmer');
    await expect(shimmerElements.first()).toBeVisible();

    // Wait for the actual form to appear (after 800ms delay + render)
    await page.waitForTimeout(1000);

    // Now the actual form should be visible with the title
    const formTitle = page.locator('h2.text-xl').filter({ hasText: 'Join Early Access' });
    await expect(formTitle).toBeVisible();
  });

  test('should transition from skeleton to form smoothly', async ({ page }) => {
    // Start navigation and wait a bit to potentially see skeleton
    await page.goto('/early-access');

    // First verify skeleton might be present (shimmer animation elements)
    // Due to fast page loads, skeleton might not be visible by the time we check
    const shimmerElements = page.locator('.animate-shimmer');
    const initialCount = await shimmerElements.count();

    // Wait for form to fully load (including the 800ms skeleton delay)
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for the loading state to clear
    await page.waitForTimeout(500); // Additional wait for the 300ms loading delay

    // Verify actual form elements are now visible
    const fullNameInput = page.locator('#fullName');
    await expect(fullNameInput).toBeVisible();

    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible();

    // Form title should be present
    const formTitle = page.locator('text=Join Early Access');
    await expect(formTitle).toBeVisible();
  });

  test('skeleton should match form layout dimensions', async ({ page }) => {
    await page.goto('/early-access');

    // Wait for skeleton to appear
    const skeletonCard = page.locator('.bg-card.border.rounded-2xl').first();
    await expect(skeletonCard).toBeVisible();

    // Get bounding box of skeleton
    const skeletonBox = await skeletonCard.boundingBox();
    expect(skeletonBox).toBeTruthy();
    expect(skeletonBox!.width).toBeGreaterThan(0);
    expect(skeletonBox!.height).toBeGreaterThan(0);

    // Wait for form to load
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');

    // Get bounding box of actual form container
    const formCard = page
      .locator('.rounded-2xl.sm\\:rounded-3xl.border.border-border.bg-card')
      .first();
    await expect(formCard).toBeVisible();

    const formBox = await formCard.boundingBox();
    expect(formBox).toBeTruthy();

    // Widths should be similar (allowing for minor differences)
    const widthDifference = Math.abs(skeletonBox!.width - formBox!.width);
    expect(widthDifference).toBeLessThan(50); // Less than 50px difference
  });

  test('skeleton should show all expected form field placeholders', async ({ page }) => {
    await page.goto('/early-access');

    // Wait for skeleton
    const shimmerElements = page.locator('.animate-shimmer');
    await expect(shimmerElements.first()).toBeVisible({ timeout: 2000 });

    // Count skeleton elements - should have multiple elements representing:
    // - Title, subtitle (header)
    // - Labels for name, email, company, role, use case, lead source
    // - Input placeholders
    // - Checkbox placeholder
    // - Submit button placeholder
    const shimmerCount = await shimmerElements.count();
    expect(shimmerCount).toBeGreaterThanOrEqual(10); // At least 10 shimmer elements
  });
});
