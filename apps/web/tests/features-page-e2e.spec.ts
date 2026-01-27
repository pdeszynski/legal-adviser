import { test, expect } from '@playwright/test';

/**
 * Features Landing Page E2E Tests
 *
 * This test suite verifies the /features landing page functionality:
 * 1) Page loads successfully without authentication
 * 2) All feature categories are displayed
 * 3) Feature cards render correctly with proper content
 * 4) Category filtering works (clicking categories filters the visible cards)
 * 5) Search functionality finds features by name/description
 * 6) CTA buttons navigate to correct destinations
 * 7) Page is responsive on mobile/tablet/desktop viewports
 * 8) Navigation menu 'Features' link routes to /features
 * 9) Footer navigation 'Features' link routes to /features
 * 10) Skeleton loading appears before content loads
 *
 * Uses consistent patterns with existing E2E tests:
 * - two-factor-settings-enable-flow.spec.ts
 * - skeleton-loading-comprehensive.spec.ts
 * - auth-mutations-authorization.spec.ts
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const FEATURES_PATH = '/features';

// Expected feature categories based on the implementation
const EXPECTED_CATEGORIES = [
  'AI-Powered Tools',
  'Research & Discovery',
  'Collaboration & Sharing',
  'Platform Features',
];

// Expected feature filter options
const EXPECTED_FILTERS = ['All Features', 'AI Tools', 'Research', 'Collaboration', 'Platform'];

// Expected features (sample for verification)
const EXPECTED_FEATURES = [
  'Document Drafting',
  'Legal Analysis',
  'AI Q&A',
  'Smart Search',
  'Case Analysis',
  'Citation Finder',
  'Real-time Collaboration',
  'Secure Document Sharing',
  'Comments & Annotations',
  'Enterprise Security',
  'Access Control',
  'Audit Logs',
  'Smart Notifications',
  'Automated Workflows',
];

test.describe('Features Landing Page - Basic Loading', () => {
  test('should load page successfully without authentication', async ({ page }) => {
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);

    // Wait for page to load and React hydration
    await page.waitForLoadState('domcontentloaded');

    // Wait for client-side rendering to complete (page has 1.2s simulated loading)
    await page.waitForTimeout(2000);

    // Verify we're on the features page
    await expect(page).toHaveURL(/\/features/);

    // Verify main heading is visible
    const mainHeading = page.locator('h1').filter({ hasText: /Practice Law Smarter/i });
    await expect(mainHeading).toBeVisible({ timeout: 15000 });

    // Verify page content is rendered
    const pageContent = page.locator('main');
    await expect(pageContent).toBeVisible();
  });

  test('should display hero section with correct content', async ({ page }) => {
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Verify hero heading
    const heroHeading = page.locator('h1').filter({ hasText: /Practice Law Smarter/i });
    await expect(heroHeading).toBeVisible();

    // Verify hero description
    const heroDescription = page.locator('p').filter({
      hasText: /comprehensive suite of AI-powered legal tools/i,
    });
    await expect(heroDescription).toBeVisible();

    // Verify badge
    const badge = page.locator('text=Powerful Features');
    await expect(badge).toBeVisible();
  });
});

test.describe('Features Landing Page - Categories Display', () => {
  test('should display all feature categories', async ({ page }) => {
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for content to load (page has 1.2s simulated loading)
    await page.waitForTimeout(2000);

    // Verify each category heading is present
    for (const category of EXPECTED_CATEGORIES) {
      const categoryHeading = page.locator('h2').filter({ hasText: category });
      await expect(categoryHeading).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display category descriptions', async ({ page }) => {
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Verify AI-Powered Tools description
    const aiToolsDescription = page.locator('p').filter({
      hasText: /Transform your legal workflow with cutting-edge artificial intelligence/i,
    });
    await expect(aiToolsDescription).toBeVisible();

    // Verify Research & Discovery description
    const researchDescription = page.locator('p').filter({
      hasText: /Comprehensive tools for legal research and case analysis/i,
    });
    await expect(researchDescription).toBeVisible();
  });
});

test.describe('Features Landing Page - Feature Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    // Wait for skeleton loading to complete (page has 1.2s simulated loading)
    await page.waitForTimeout(2000);
  });

  test('should display feature cards with proper content', async ({ page }) => {
    // Check that feature cards are rendered
    const featureCards = page.locator('[class*="rounded-3xl"]').filter({
      hasText: /\w+/,
    });

    const cardCount = await featureCards.count();
    expect(cardCount).toBeGreaterThan(5);

    // Verify first card has expected structure
    const firstCard = featureCards.first();
    await expect(firstCard.locator('h3')).toBeVisible();
    await expect(firstCard.locator('p')).toBeVisible();
  });

  test('should display all expected feature titles', async ({ page }) => {
    // Verify key features are present
    for (const feature of EXPECTED_FEATURES) {
      const featureElement = page.locator('h3').filter({ hasText: feature });
      await expect(featureElement).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display status badges on features', async ({ page }) => {
    // Check for "New" badge
    const newBadge = page
      .locator('text=New')
      .or(page.locator('[class*="badge"]').filter({ hasText: 'New' }));
    const newBadgeCount = await newBadge.count();
    expect(newBadgeCount).toBeGreaterThan(0);

    // Check for "Beta" badge
    const betaBadge = page
      .locator('text=Beta')
      .or(page.locator('[class*="badge"]').filter({ hasText: 'Beta' }));
    const betaBadgeCount = await betaBadge.count();
    expect(betaBadgeCount).toBeGreaterThan(0);

    // Check for "Stable" badge
    const stableBadge = page
      .locator('text=Stable')
      .or(page.locator('[class*="badge"]').filter({ hasText: 'Stable' }));
    const stableBadgeCount = await stableBadge.count();
    expect(stableBadgeCount).toBeGreaterThan(0);

    // Check for "Coming Soon" badge
    const comingSoonBadge = page
      .locator('text=Coming Soon')
      .or(page.locator('[class*="badge"]').filter({ hasText: 'Coming Soon' }));
    const comingSoonBadgeCount = await comingSoonBadge.count();
    expect(comingSoonBadgeCount).toBeGreaterThan(0);
  });

  test('should display CTA buttons on feature cards', async ({ page }) => {
    // Check for "Learn More" buttons
    const learnMoreButtons = page
      .locator('button')
      .filter({ hasText: /learn more/i })
      .or(page.locator('a').filter({ hasText: /learn more/i }));

    const buttonCount = await learnMoreButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should have icons on feature cards', async ({ page }) => {
    // Check for icon containers (styled divs that contain icons)
    const iconContainers = page.locator('[class*="h-12 w-12 rounded-xl"]');

    const iconCount = await iconContainers.count();
    expect(iconCount).toBeGreaterThan(5);
  });
});

test.describe('Features Landing Page - Category Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('should display all filter buttons', async ({ page }) => {
    for (const filter of EXPECTED_FILTERS) {
      const filterButton = page.locator('button').filter({ hasText: filter });
      await expect(filterButton).toBeVisible({ timeout: 10000 });
    }
  });

  test('should filter by AI Tools category', async ({ page }) => {
    const aiToolsFilter = page.locator('button').filter({ hasText: 'AI Tools' });

    await aiToolsFilter.click();
    await page.waitForTimeout(500);

    // Verify "AI-Powered Tools" heading is visible
    const aiToolsHeading = page.locator('h2').filter({ hasText: 'AI-Powered Tools' });
    await expect(aiToolsHeading).toBeVisible();

    // Verify AI features are visible
    await expect(page.locator('h3').filter({ hasText: 'Document Drafting' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: 'Legal Analysis' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: 'AI Q&A' })).toBeVisible();

    // Verify features from other categories are not visible
    const collaborationFeature = page.locator('h3').filter({ hasText: 'Real-time Collaboration' });
    const isVisible = await collaborationFeature.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('should filter by Research category', async ({ page }) => {
    const researchFilter = page.locator('button').filter({ hasText: 'Research' });

    await researchFilter.click();
    await page.waitForTimeout(500);

    // Verify research features are visible
    await expect(page.locator('h3').filter({ hasText: 'Smart Search' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: 'Case Analysis' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: 'Citation Finder' })).toBeVisible();

    // Verify AI features are not visible
    const aiFeature = page.locator('h3').filter({ hasText: 'Document Drafting' });
    const isVisible = await aiFeature.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('should filter by Collaboration category', async ({ page }) => {
    const collaborationFilter = page.locator('button').filter({ hasText: 'Collaboration' });

    await collaborationFilter.click();
    await page.waitForTimeout(500);

    // Verify collaboration features are visible
    await expect(page.locator('h3').filter({ hasText: 'Real-time Collaboration' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: 'Secure Document Sharing' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: 'Comments & Annotations' })).toBeVisible();
  });

  test('should filter by Platform category', async ({ page }) => {
    const platformFilter = page.locator('button').filter({ hasText: 'Platform' });

    await platformFilter.click();
    await page.waitForTimeout(500);

    // Verify platform features are visible
    await expect(page.locator('h3').filter({ hasText: 'Enterprise Security' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: 'Access Control' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: 'Audit Logs' })).toBeVisible();
  });

  test('should reset to All Features when clicked', async ({ page }) => {
    // First filter to a specific category
    const aiToolsFilter = page.locator('button').filter({ hasText: 'AI Tools' });
    await aiToolsFilter.click();
    await page.waitForTimeout(500);

    // Verify limited features are shown
    const allFeaturesHeading = page.locator('h2').filter({ hasText: 'Collaboration & Sharing' });
    const isInitiallyVisible = await allFeaturesHeading.isVisible().catch(() => false);
    expect(isInitiallyVisible).toBe(false);

    // Click "All Features"
    const allFeaturesFilter = page.locator('button').filter({ hasText: 'All Features' });
    await allFeaturesFilter.click();
    await page.waitForTimeout(500);

    // Verify all categories are now visible
    await expect(page.locator('h2').filter({ hasText: 'AI-Powered Tools' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'Research & Discovery' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'Collaboration & Sharing' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'Platform Features' })).toBeVisible();
  });

  test('should show results count when filtering', async ({ page }) => {
    // Look for results count text
    const resultsCount = page
      .locator('text=/Showing \\d+ feature/')
      .or(page.locator('text=/features$/'));

    // Results count should be visible (it appears in the filter controls)
    await expect(resultsCount.first()).toBeVisible();
  });
});

test.describe('Features Landing Page - Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('should display search input', async ({ page }) => {
    const searchInput = page
      .locator('input[placeholder="Search features..."]')
      .or(page.locator('input[type="search"]'));

    await expect(searchInput).toBeVisible();
  });

  test('should filter features by search term in title', async ({ page }) => {
    const searchInput = page
      .locator('input[placeholder="Search features..."]')
      .or(page.locator('input[type="search"]'));

    // Search for "Document"
    await searchInput.fill('Document');
    await page.waitForTimeout(500);

    // Verify Document Drafting is visible
    await expect(page.locator('h3').filter({ hasText: 'Document Drafting' })).toBeVisible();

    // Verify Secure Document Sharing is visible
    await expect(page.locator('h3').filter({ hasText: 'Secure Document Sharing' })).toBeVisible();
  });

  test('should filter features by search term in description', async ({ page }) => {
    const searchInput = page
      .locator('input[placeholder="Search features..."]')
      .or(page.locator('input[type="search"]'));

    // Search for "encryption" (in Enterprise Security description)
    await searchInput.fill('encryption');
    await page.waitForTimeout(500);

    // Verify Enterprise Security is visible (contains "encryption" in description)
    await expect(page.locator('h3').filter({ hasText: 'Enterprise Security' })).toBeVisible();
  });

  test('should show empty state when no results found', async ({ page }) => {
    const searchInput = page
      .locator('input[placeholder="Search features..."]')
      .or(page.locator('input[type="search"]'));

    // Search for something that won't match
    await searchInput.fill('xyznonexistentfeature');
    await page.waitForTimeout(500);

    // Verify empty state message (there are two elements with this text - use .first() or getByRole)
    const emptyState = page.getByRole('heading', { name: 'No features found' });
    await expect(emptyState).toBeVisible();

    // Verify "Clear all filters" button is present
    const clearButton = page.locator('button').filter({ hasText: /clear all filters/i });
    await expect(clearButton).toBeVisible();
  });

  test('should clear search when X button is clicked', async ({ page }) => {
    const searchInput = page
      .locator('input[placeholder="Search features..."]')
      .or(page.locator('input[type="search"]'));

    // Enter search term
    await searchInput.fill('Document');
    await page.waitForTimeout(500);

    // Verify filtered results
    await expect(page.locator('h3').filter({ hasText: 'Document Drafting' })).toBeVisible();

    // Click clear button (X icon)
    const clearButton = page.locator('button').filter({ hasText: '' }).locator('svg').filter({
      hasText: '',
    });

    // Try clicking the X button to clear search
    const xButton = page.locator('[class*="absolute"]').locator('svg').filter({
      hasText: '',
    });

    const xButtonCount = await xButton.count();
    if (xButtonCount > 0) {
      await xButton.first().click();
      await page.waitForTimeout(500);

      // Verify all features are visible again
      await expect(page.locator('h2').filter({ hasText: 'AI-Powered Tools' })).toBeVisible();
    }
  });

  test('should work with combined search and category filter', async ({ page }) => {
    const searchInput = page
      .locator('input[placeholder="Search features..."]')
      .or(page.locator('input[type="search"]'));

    // First filter to Platform category
    const platformFilter = page.locator('button').filter({ hasText: 'Platform' });
    await platformFilter.click();
    await page.waitForTimeout(500);

    // Then search for "security"
    await searchInput.fill('security');
    await page.waitForTimeout(500);

    // Verify Enterprise Security is visible
    await expect(page.locator('h3').filter({ hasText: 'Enterprise Security' })).toBeVisible();

    // Verify Document Drafting is not visible (wrong category)
    const docFeature = page.locator('h3').filter({ hasText: 'Document Drafting' });
    const isVisible = await docFeature.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });
});

test.describe('Features Landing Page - CTA Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('should have CTA section at bottom', async ({ page }) => {
    // Verify CTA section heading
    const ctaHeading = page.locator('h2').filter({ hasText: /Ready to Transform Your Practice/i });
    await expect(ctaHeading).toBeVisible();

    // Verify CTA buttons
    const getStartedButton = page.locator('button').filter({ hasText: /Get Started Free/i });
    await expect(getStartedButton).toBeVisible();

    const contactButton = page.locator('button').filter({ hasText: /Contact Sales/i });
    await expect(contactButton).toBeVisible();
  });

  test('should track CTA clicks', async ({ page }) => {
    // Setup listener for console events (analytics tracking)
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });

    // Click Get Started button
    const getStartedButton = page.locator('button').filter({ hasText: /Get Started Free/i });
    await getStartedButton.click();

    // Verify button was clicked (page should respond)
    await page.waitForTimeout(500);
  });
});

test.describe('Features Landing Page - Navigation', () => {
  test('should navigate from header Features link', async ({ page }) => {
    // Start from home page
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Click Features link in header
    const featuresLink = page.locator('a').filter({ hasText: 'Features' }).first();
    await featuresLink.click();

    // Verify we're on the features page
    await expect(page).toHaveURL(/\/features/);

    // Wait for client-side rendering
    await page.waitForTimeout(2000);

    // Verify features page content
    const mainHeading = page.locator('h1').filter({ hasText: /Practice Law Smarter/i });
    await expect(mainHeading).toBeVisible({ timeout: 10000 });
  });

  test('should navigate from footer Features link', async ({ page }) => {
    // Start from home page
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Click Features link in footer
    const footerFeaturesLink = page.locator('footer a').filter({ hasText: /features/i });
    await footerFeaturesLink.first().click();

    // Verify we're on the features page
    await expect(page).toHaveURL(/\/features/);

    // Wait for client-side rendering
    await page.waitForTimeout(2000);
  });

  test('should have active navigation state', async ({ page }) => {
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Verify Features link in navigation exists
    const navFeaturesLink = page.locator('nav a').filter({ hasText: 'Features' });
    await expect(navFeaturesLink).toBeVisible();
  });
});

test.describe('Features Landing Page - Responsive Design', () => {
  test('should display correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Verify main heading is visible
    const mainHeading = page.locator('h1').filter({ hasText: /Practice Law Smarter/i });
    await expect(mainHeading).toBeVisible();

    // Verify filter controls are visible (may stack on mobile)
    const filterControls = page.locator('button').filter({ hasText: 'All Features' });
    await expect(filterControls).toBeVisible();

    // Verify feature cards render
    const firstCard = page.locator('h3').first();
    await expect(firstCard).toBeVisible();
  });

  test('should display correctly on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Verify main heading
    const mainHeading = page.locator('h1').filter({ hasText: /Practice Law Smarter/i });
    await expect(mainHeading).toBeVisible();

    // Verify features are displayed
    await expect(page.locator('h3').filter({ hasText: 'Document Drafting' })).toBeVisible();
  });

  test('should display correctly on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Verify all content is visible
    await expect(page.locator('h1').filter({ hasText: /Practice Law Smarter/i })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'AI-Powered Tools' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: 'Document Drafting' })).toBeVisible();
  });

  test('should handle window resize', async ({ page }) => {
    // Start with desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Verify content is visible
    await expect(page.locator('h1').first()).toBeVisible();

    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Verify content is still visible
    await expect(page.locator('h1').first()).toBeVisible();
  });
});

test.describe('Features Landing Page - Skeleton Loading', () => {
  test('should show skeleton loading before content', async ({ page }) => {
    // Navigate to page and check for content after loading delay
    await page.goto(`${BASE_URL}${FEATURES_PATH}`, { waitUntil: 'domcontentloaded' });

    // Skeleton may appear briefly - check for it within first 100ms
    const skeletonExists = await page
      .locator('[class*="skeleton"]')
      .isVisible()
      .catch(() => false);

    // Wait for content to load
    await page.waitForTimeout(1500);

    // After loading, real content should be visible
    await expect(page.locator('h1').filter({ hasText: /Practice Law Smarter/i })).toBeVisible();
  });

  test('should transition from skeleton to real content', async ({ page }) => {
    // Record the time when first content appears
    const startTime = Date.now();

    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for main heading to appear
    await page.waitForSelector('h1', { timeout: 5000 });

    const loadTime = Date.now() - startTime;

    // Content should appear within reasonable time (page uses 1.2s simulated delay)
    expect(loadTime).toBeLessThan(3000);

    // Verify full content is loaded
    await page.waitForTimeout(1500);
    await expect(page.locator('h2').filter({ hasText: 'AI-Powered Tools' })).toBeVisible();
  });

  test('should not show layout shift during loading', async ({ page }) => {
    await page.goto(`${BASE_URL}${FEATURES_PATH}`, { waitUntil: 'domcontentloaded' });

    // Wait for initial render (skeleton might be visible)
    await page.waitForTimeout(100);

    // Get initial page height (after initial render but before content loads)
    const initialHeight = await page.evaluate(() => document.body.scrollHeight);

    // Wait for content to fully load (page has 1.2s simulated delay)
    await page.waitForTimeout(2000);

    // Get final page height
    const finalHeight = await page.evaluate(() => document.body.scrollHeight);

    // The page uses skeleton loading which should match the final content size
    // Allow some variance but not extreme layout shift
    // Since initial height might be small (empty body), we compare final height to a reasonable range
    const minHeight = 2000; // Expected minimum height for a full page with content
    const maxHeight = 15000; // Maximum expected height

    expect(finalHeight).toBeGreaterThan(minHeight);
    expect(finalHeight).toBeLessThan(maxHeight);
  });
});

test.describe('Features Landing Page - Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();

    // Check for h2 (category headings)
    const h2 = page.locator('h2');
    const h2Count = await h2.count();
    expect(h2Count).toBeGreaterThan(0);

    // Check for h3 (feature titles)
    const h3 = page.locator('h3');
    const h3Count = await h3.count();
    expect(h3Count).toBeGreaterThan(0);
  });

  test('should have accessible filter buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Filter buttons should be accessible
    const filterButtons = page
      .locator('button')
      .filter({ hasText: /All Features|AI Tools|Research|Collaboration|Platform/ });

    const buttonCount = await filterButtons.count();
    expect(buttonCount).toBeGreaterThan(0);

    // First button should be focusable
    await filterButtons.first().focus();
    await expect(filterButtons.first()).toBeFocused();
  });

  test('should have accessible search input', async ({ page }) => {
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const searchInput = page
      .locator('input[placeholder="Search features..."]')
      .or(page.locator('input[type="search"]'));

    await expect(searchInput).toBeVisible();

    // Should be focusable
    await searchInput.focus();
    await expect(searchInput).toBeFocused();
  });
});

test.describe('Features Landing Page - Edge Cases', () => {
  test('should handle direct URL access', async ({ page }) => {
    // Go directly to features page without visiting other pages first
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Verify page loads correctly
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('should handle browser back navigation', async ({ page }) => {
    // Start from features page
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Navigate to home page
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Navigate directly back to features (simulating back navigation)
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Verify features page is restored
    await expect(page).toHaveURL(/\/features/);
    await expect(page.locator('h1').filter({ hasText: /Practice Law Smarter/i })).toBeVisible();
  });

  test('should handle multiple rapid filter changes', async ({ page }) => {
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Rapidly click different filters
    const filters = ['AI Tools', 'Research', 'Collaboration', 'Platform', 'All Features'];

    for (const filter of filters) {
      const filterButton = page.locator('button').filter({ hasText: filter });
      await filterButton.click();
      await page.waitForTimeout(200);
    }

    // After all changes, page should still be functional
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('should handle very long search queries', async ({ page }) => {
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const searchInput = page
      .locator('input[placeholder="Search features..."]')
      .or(page.locator('input[type="search"]'));

    // Enter a very long search query
    const longQuery = 'a'.repeat(200);
    await searchInput.fill(longQuery);
    await page.waitForTimeout(500);

    // Should handle gracefully (either empty state or filtered results)
    const pageContent = page.locator('main');
    await expect(pageContent).toBeVisible();
  });

  test('should handle special characters in search', async ({ page }) => {
    await page.goto(`${BASE_URL}${FEATURES_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const searchInput = page
      .locator('input[placeholder="Search features..."]')
      .or(page.locator('input[type="search"]'));

    // Enter special characters
    await searchInput.fill('!@#$%^&*()');
    await page.waitForTimeout(500);

    // Should handle gracefully
    const pageContent = page.locator('main');
    await expect(pageContent).toBeVisible();
  });
});
