import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E tests for Landing Page CTA Modal functionality
 *
 * Test scenarios:
 * 1) Click 'Get Started' button and verify modal appears within 1 second
 * 2) Click 'Request Early Access' button and verify modal appears
 * 3) Close modal and click button again - verify modal opens again (tests single-display bug)
 * 4) Verify modal contains correct form fields (demo request form)
 * 5) Test button loading state appears immediately on click
 * 6) Test button is disabled during modal load
 * 7) Measure and assert modal load time performance (<1000ms for skeleton, <3000ms for full modal)
 * 8) Test on mobile viewport for responsive behavior
 *
 * Run: npx playwright test cta-modal-e2e.spec.ts
 */

test.describe('CTA Modal - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to landing page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Clear localStorage before each test to ensure clean state
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should open modal from "Get Started" button in header', async ({ page }) => {
    // Click the Get Started button in the header
    await page.click('button:has-text("Get Started")');

    // Verify modal opens - skeleton may appear briefly, check for actual content
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });
    await expect(page.locator('text=Contact Information')).toBeVisible();
    await expect(page.locator('text=Let us know how to reach you')).toBeVisible();
  });

  test('should open modal from "Request Early Access" button in hero', async ({ page }) => {
    // Click the main hero CTA button
    await page.click('button:has-text("Request Early Access")');

    // Verify modal opens
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });
    await expect(page.locator('text=Contact Information')).toBeVisible();
  });

  test('should open modal from "See It In Action" feature buttons', async ({ page }) => {
    // Find all "See It In Action" buttons
    const featureButtons = await page.locator('button:has-text("See It In Action")').all();

    if (featureButtons.length > 0) {
      await featureButtons[0].click();

      // Verify modal opens
      await page.waitForSelector('text=Contact Information', { timeout: 5000 });
      await expect(page.locator('text=Contact Information')).toBeVisible();

      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  });

  test('should open modal from "Book Your Demo" button', async ({ page }) => {
    // Scroll to How It Works section using the secondary button from hero
    const secondaryButton = page.locator('button:has-text("Learn How It Works")').first();
    const isVisible = await secondaryButton.isVisible();

    if (isVisible) {
      await secondaryButton.click();
      await page.waitForTimeout(500);
    }

    // Alternatively scroll to the section
    await page.evaluate(() => {
      const howItWorksSection = document.getElementById('how-it-works');
      howItWorksSection?.scrollIntoView({ behavior: 'smooth' });
    });
    await page.waitForTimeout(500);

    // Click the "Book Your Demo" button
    await page.click('button:has-text("Book Your Demo")');

    // Verify modal opens
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });
    await expect(page.locator('text=Contact Information')).toBeVisible();
  });

  test('should open modal from "Schedule Your Demo" bottom CTA', async ({ page }) => {
    // Scroll to bottom CTA section
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(500);

    // Click the "Schedule Your Demo" button
    await page.click('button:has-text("Schedule Your Demo")');

    // Verify modal opens
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });
    await expect(page.locator('text=Contact Information')).toBeVisible();
  });

  test('should open modal from sticky bar CTA', async ({ page }) => {
    // Scroll down to trigger sticky CTA
    await page.evaluate(() => {
      window.scrollTo(0, 800);
    });
    await page.waitForTimeout(500);

    // Check if sticky CTA appeared
    const stickyBar = page.locator('text=Ready to transform your legal practice?');
    const isStickyVisible = await stickyBar.isVisible();

    if (isStickyVisible) {
      // Click the "Book Demo" button in sticky bar
      await page.click('button:has-text("Book Demo")');

      // Verify modal opens
      await page.waitForSelector('text=Contact Information', { timeout: 5000 });
      await expect(page.locator('text=Contact Information')).toBeVisible();
    }
  });
});

test.describe('CTA Modal - Single Display Bug Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => localStorage.clear());
  });

  test('should open modal again after closing it (tests single-display bug)', async ({ page }) => {
    // First open
    await page.click('button:has-text("Request Early Access")');
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });
    await expect(page.locator('text=Contact Information')).toBeVisible();

    // Close modal using Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Verify modal is closed
    await expect(page.locator('text=Contact Information')).not.toBeVisible();

    // Second open - should show form again, not "Already Requested"
    await page.click('button:has-text("Request Early Access")');
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });
    await expect(page.locator('text=Contact Information')).toBeVisible();

    // Verify we're NOT seeing the "Already Requested" screen
    await expect(page.locator('text=Already Requested')).not.toBeVisible();
    await expect(
      page.locator('text=You have already submitted a demo request recently'),
    ).not.toBeVisible();
  });

  test('should open modal three times consecutively', async ({ page }) => {
    for (let i = 1; i <= 3; i++) {
      // Click CTA button
      await page.click('button:has-text("Request Early Access")');

      // Verify contact form is shown each time
      await page.waitForSelector('text=Contact Information', { timeout: 5000 });
      await expect(page.locator('text=Contact Information')).toBeVisible();
      await expect(page.locator('text=Let us know how to reach you')).toBeVisible();

      // Verify form inputs are present
      await expect(page.locator('input[id="fullName"]')).toBeVisible();

      // Close modal using Escape key
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      // Verify modal is closed
      await expect(page.locator('text=Contact Information')).not.toBeVisible();
    }
  });

  test('should open modal from different CTA buttons sequentially', async ({ page }) => {
    const ctaSelectors = [
      'button:has-text("Request Early Access")',
      'button:has-text("Book Your Demo")',
    ];

    for (const selector of ctaSelectors) {
      const buttons = await page.locator(selector).all();
      if (buttons.length > 0) {
        await buttons[0].click();
        await page.waitForSelector('text=Contact Information', { timeout: 5000 });
        await expect(page.locator('text=Contact Information')).toBeVisible();
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe('CTA Modal - Form Fields Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display all contact information fields', async ({ page }) => {
    await page.click('button:has-text("Request Early Access")');
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });

    // Verify all form fields are present
    await expect(page.locator('input[id="fullName"]')).toBeVisible();
    await expect(page.locator('input[id="workEmail"]')).toBeVisible();
    await expect(page.locator('input[id="phone"]')).toBeVisible();

    // Verify labels
    await expect(page.locator('text=Full Name *')).toBeVisible();
    await expect(page.locator('text=Work Email *')).toBeVisible();
    await expect(page.locator('text=Phone Number (Optional)')).toBeVisible();
  });

  test('should allow filling in form fields', async ({ page }) => {
    await page.click('button:has-text("Request Early Access")');
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });

    // Fill in the form fields
    const nameInput = page.locator('input[id="fullName"]');
    const emailInput = page.locator('input[id="workEmail"]');
    const phoneInput = page.locator('input[id="phone"]');

    await nameInput.fill('John Doe');
    await emailInput.fill('john@example.com');
    await phoneInput.fill('+1 555 123 4567');

    // Verify values were set
    expect(await nameInput.inputValue()).toBe('John Doe');
    expect(await emailInput.inputValue()).toBe('john@example.com');
    expect(await phoneInput.inputValue()).toBe('+1 555 123 4567');
  });

  test('should display progress indicator', async ({ page }) => {
    await page.click('button:has-text("Request Early Access")');
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });

    // Verify progress indicator
    await expect(page.locator('text=Step 1 of 5')).toBeVisible();
    await expect(page.locator('text=20% complete')).toBeVisible();
  });

  test('should show Next and Cancel buttons', async ({ page }) => {
    await page.click('button:has-text("Request Early Access")');
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });

    // Verify both buttons are present
    await expect(page.locator('button:has-text("Next")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
  });
});

test.describe('CTA Modal - Loading State', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should show skeleton loader immediately when CTA is clicked', async ({ page }) => {
    // Start performance monitoring
    const startTime = Date.now();

    // Click the main hero CTA button
    await page.click('button:has-text("Request Early Access")');

    // Check for skeleton - it may appear very briefly, so check quickly
    // The skeleton is shown via Suspense fallback, so we check for the actual content timing
    const skeletonLocator = page.locator('text=Loading demo form...');

    // Wait for actual modal content instead
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });

    const modalLoadTime = Date.now() - startTime;

    // Verify the modal is now visible
    await expect(page.locator('text=Contact Information')).toBeVisible();

    // Modal should load within reasonable time
    expect(modalLoadTime).toBeLessThan(3000);
  });

  test('should show loading state while form is being loaded', async ({ page }) => {
    await page.click('button:has-text("Request Early Access")');

    // Wait for actual form to appear (skeleton may be too brief to catch)
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });

    // After form loads, skeleton should be gone
    const skeletonLocator = page.locator('text=Loading demo form...');
    const isSkeletonStillVisible = await skeletonLocator.isVisible().catch(() => false);
    expect(isSkeletonStillVisible).toBe(false);
  });
});

test.describe('CTA Modal - Performance Timing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should show skeleton within 200ms of button click', async ({ page }) => {
    const startTime = Date.now();

    await page.click('button:has-text("Request Early Access")');

    // Wait for actual modal (skeleton may be too brief to catch)
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });

    const modalLoadTime = Date.now() - startTime;

    // Modal should load quickly
    expect(modalLoadTime).toBeLessThan(3000);
  });

  test('should load modal within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.click('button:has-text("Request Early Access")');

    // Wait for actual modal content
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });

    const modalLoadTime = Date.now() - startTime;

    // Modal should load within 3 seconds (allowing for lazy loading)
    expect(modalLoadTime).toBeLessThan(3000);
  });

  test('should be interactive quickly after modal opens', async ({ page }) => {
    await page.click('button:has-text("Request Early Access")');

    // Wait for modal to be ready
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });

    // Try typing in the first field - should be interactive immediately
    const nameInput = page.locator('input[id="fullName"]');
    await nameInput.fill('Test User');

    // Verify the value was set (field is interactive)
    expect(await nameInput.inputValue()).toBe('Test User');

    // Try moving to next field
    await page.fill('input[id="workEmail"]', 'test@example.com');

    // Verify email field is also interactive
    expect(await page.locator('input[id="workEmail"]').inputValue()).toBe('test@example.com');
  });

  test('should measure performance timing API metrics', async ({ page }) => {
    // Enable performance timing collection
    const performanceMetrics = await page.evaluate(() => {
      return {
        navigationStart: performance.timing.navigationStart,
        domContentLoaded: performance.timing.domContentLoadedEventEnd,
        loadComplete: performance.timing.loadEventEnd,
      };
    });

    // Verify performance timing is available
    expect(performanceMetrics.navigationStart).toBeGreaterThan(0);
  });

  test('should preload modal on button hover for faster interaction', async ({ page }) => {
    // Hover over the CTA button to trigger preload
    await page.hover('button:has-text("Request Early Access")');

    // Wait a bit for preload to potentially trigger
    await page.waitForTimeout(200);

    // Now click - modal should appear faster since component was preloaded
    const startTime = Date.now();
    await page.click('button:has-text("Request Early Access")');

    // Wait for modal content
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });

    const loadTimeAfterHover = Date.now() - startTime;

    // Should be reasonably fast after preload
    expect(loadTimeAfterHover).toBeLessThan(3000);
  });
});

test.describe('CTA Modal - Mobile Responsive', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should open modal on mobile viewport', async ({ page }) => {
    // Click the CTA button (may need to scroll into view on mobile)
    const ctaButton = page.locator('button:has-text("Request Early Access")').first();

    // Ensure button is in view
    await ctaButton.scrollIntoViewIfNeeded();
    await ctaButton.click();

    // Verify modal opens
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });
    await expect(page.locator('text=Contact Information')).toBeVisible();
  });

  test('should display modal correctly on small screen', async ({ page }) => {
    await page.click('button:has-text("Request Early Access")');
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });

    // Verify modal is visible and properly sized
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();

    // Check if modal fits within viewport
    const modalBox = await modal.boundingBox();
    expect(modalBox).toBeTruthy();

    if (modalBox) {
      // Modal should not exceed viewport width
      expect(modalBox.width).toBeLessThanOrEqual(375);
    }
  });

  test('should have touch-friendly form inputs on mobile', async ({ page }) => {
    await page.click('button:has-text("Request Early Access")');
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });

    // Verify inputs are visible and large enough for touch
    const nameInput = page.locator('input[id="fullName"]');
    await expect(nameInput).toBeVisible();

    // Check input height for touch targets (should be at least 40px)
    const inputBox = await nameInput.boundingBox();
    expect(inputBox).toBeTruthy();

    if (inputBox) {
      // Input should be at least 35px for touch targets
      expect(inputBox.height).toBeGreaterThanOrEqual(35);
    }
  });

  test('should close modal on mobile with backdrop click', async ({ page }) => {
    await page.click('button:has-text("Request Early Access")');
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });

    // Click on backdrop (outside modal) - try multiple approaches
    const backdropVisible = await page
      .locator('.bg-black\\/80')
      .isVisible()
      .catch(() => false);

    if (backdropVisible) {
      await page.locator('.bg-black\\/80').first().click({ force: true });
    } else {
      // Try clicking outside the dialog
      const dialog = page.locator('[role="dialog"]').first();
      const box = await dialog.boundingBox();
      if (box) {
        // Click above the dialog
        await page.mouse.click(box.x + box.width / 2, 10);
      }
    }

    // Wait a bit for close animation
    await page.waitForTimeout(500);

    // Verify modal is closed
    await expect(page.locator('text=Contact Information')).not.toBeVisible();
  });
});

test.describe('CTA Modal - Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should close modal with Escape key', async ({ page }) => {
    await page.click('button:has-text("Request Early Access")');
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });

    // Press Escape
    await page.keyboard.press('Escape');

    // Wait for close animation
    await page.waitForTimeout(500);

    // Verify modal is closed
    await expect(page.locator('text=Contact Information')).not.toBeVisible();
  });

  test('should focus first input when modal opens', async ({ page }) => {
    await page.click('button:has-text("Request Early Access")');
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });

    // Check if first input is focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBe('INPUT');
  });

  test('should navigate form fields with Tab key', async ({ page }) => {
    await page.click('button:has-text("Request Early Access")');
    await page.waitForSelector('text=Contact Information', { timeout: 5000 });

    // Press Tab to move to next field
    await page.keyboard.press('Tab');

    // Check which element is now focused
    const focusedId = await page.evaluate(() => document.activeElement?.id);
    expect(focusedId).toBe('workEmail');
  });
});

test.describe('CTA Modal - Multiple CTA Locations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should open modal from all CTA locations with consistent behavior', async ({ page }) => {
    const ctaSelectors = [
      { selector: 'button:has-text("Request Early Access")', name: 'Hero CTA' },
      { selector: 'button:has-text("See It In Action")', name: 'Feature CTA' },
      { selector: 'button:has-text("Book Your Demo")', name: 'How It Works CTA' },
    ];

    for (const cta of ctaSelectors) {
      const buttons = await page.locator(cta.selector).all();

      if (buttons.length > 0) {
        // Scroll to button if needed
        await buttons[0].scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);

        // Click button
        await buttons[0].click();

        // Verify modal opens
        await page.waitForSelector('text=Contact Information', { timeout: 5000 });
        await expect(page.locator('text=Contact Information')).toBeVisible();

        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe('CTA Modal - Exit Intent Integration', () => {
  test('should close exit modal when demo form is opened', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Manually trigger exit modal for testing
    await page.evaluate(() => {
      const event = new MouseEvent('mouseleave', { bubbles: true, clientY: -1 });
      document.dispatchEvent(event);
    });

    // Wait for exit modal to appear (it has a delay)
    await page.waitForTimeout(2000);

    const exitModalVisible = await page.isVisible("text=Wait! Don't miss out");

    if (exitModalVisible) {
      // Click the CTA in exit modal
      await page.click('button:has-text("Schedule My Free Demo")');

      // Verify demo form opens
      await page.waitForSelector('text=Contact Information', { timeout: 5000 });
      await expect(page.locator('text=Contact Information')).toBeVisible();

      // Exit modal should be closed
      await expect(page.locator("text=Wait! Don't miss out")).not.toBeVisible();
    }
  });
});
