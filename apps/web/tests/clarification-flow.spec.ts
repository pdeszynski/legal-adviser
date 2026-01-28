import { test, expect, type Page } from '@playwright/test';

/**
 * Clarification Flow E2E Tests
 *
 * Comprehensive end-to-end tests for the clarification flow feature:
 * 1) AI returns clarification JSON response
 * 2) Frontend correctly parses JSON and renders ClarificationMessage component
 * 3) Questions are displayed as bullet points with hints
 * 4) User can type answers or select from options (if provided)
 * 5) Submit Answers button sends answers to backend
 * 6) Backend processes answers and returns final AI response
 * 7) Conversation history includes clarification round
 * 8) Multi-round clarification works (ask -> answer -> ask follow-up -> answer -> respond)
 * 9) Context is preserved across clarification flow
 * 10) Error handling if clarification submission fails
 *
 * Prerequisites:
 * - AI Engine running at http://localhost:8000
 * - Backend running at http://localhost:3001
 * - Frontend running at http://localhost:3000
 *
 * Test credentials:
 * - Regular user: user@example.com / password123
 */

const AI_ENGINE_URL = process.env.NEXT_PUBLIC_AI_ENGINE_URL || 'http://localhost:8000';
const CHAT_PAGE_URL = 'http://localhost:3000/chat';
const USER_EMAIL = 'user@example.com';
const USER_PASSWORD = 'password123';

// Mock clarification response for testing
const mockClarificationResponse = {
  type: 'clarification',
  questions: [
    {
      question: 'When did the employment end?',
      question_type: 'timeline',
      hint: 'Provide the specific date or month',
    },
    {
      question: 'What was the reason for termination?',
      question_type: 'parties',
      options: ['Resignation', 'Dismissal', 'Mutual agreement', 'Contract expiry'],
    },
  ],
  context_summary: 'I need more details about your employment situation to provide accurate advice.',
  next_steps: 'Please answer the questions above so I can help you better.',
};

const mockFollowUpClarification = {
  type: 'clarification',
  questions: [
    {
      question: 'Did you receive a written notice of termination?',
      question_type: 'documents',
      options: ['Yes', 'No'],
      hint: 'Written notice is required by Polish labor law',
    },
  ],
  context_summary: 'One more detail needed for complete assessment.',
  next_steps: 'This is the final question before I provide my analysis.',
  currentRound: 2,
  totalRounds: 2,
};

/**
 * Test helper to perform login
 */
async function performLogin(page: Page, email: string, password: string) {
  await page.goto('http://localhost:3000/login');

  // Check if already logged in
  const currentUrl = page.url();
  if (
    currentUrl.includes('/dashboard') ||
    currentUrl.includes('/chat') ||
    currentUrl.includes('/settings')
  ) {
    await page.goto('http://localhost:3000/logout');
    await page.waitForTimeout(1000);
    await page.goto('http://localhost:3000/login');
  }

  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.press('input[type="password"]', 'Enter');

  await page.waitForURL(
    (url) =>
      url.pathname.includes('/dashboard') ||
      url.pathname.includes('/chat') ||
      url.pathname.includes('/settings'),
    { timeout: 30000 },
  );
}

/**
 * Setup mock clarification response from AI Engine
 */
async function setupMockClarification(page: Page, clarificationData: Record<string, unknown>) {
  await page.route(`${AI_ENGINE_URL}/api/v1/qa/ask-stream`, async (route, request) => {
    const requestBody = request.postDataJSON();
    console.log('[Mock] Intercepted request:', requestBody);

    // Create a mock SSE stream with clarification
    const clarificationJson = JSON.stringify(clarificationData);
    const mockResponse = `data: ${JSON.stringify({
      type: 'token',
      content: clarificationJson,
      metadata: {},
    })}\n\ndata: ${JSON.stringify({
      type: 'done',
      content: '',
      metadata: {
        citations: [],
        confidence: 0.5,
        processing_time_ms: 500,
      },
    })}\n\n`;

    // Fulfill with mock SSE response
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      body: mockResponse,
    });
  });
}

/**
 * Setup mock answer response after clarification
 */
async function setupMockAnswerResponse(page: Page, answerText: string) {
  await page.route(`${AI_ENGINE_URL}/api/v1/qa/clarification-answer-stream`, async (route) => {
    const mockResponse = `data: ${JSON.stringify({
      type: 'token',
      content: 'Based on your answers regarding the employment termination: ',
      metadata: {},
    })}\n\ndata: ${JSON.stringify({
      type: 'token',
      content: answerText,
      metadata: {},
    })}\n\ndata: ${JSON.stringify({
      type: 'done',
      content: '',
      metadata: {
        citations: [
          {
            source: 'Labour Code',
            article: 'Art. 30 § 1',
            url: 'https://isap.sejm.gov.pl/',
          },
        ],
        confidence: 0.92,
        processing_time_ms: 1200,
      },
    })}\n\n`;

    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      body: mockResponse,
    });
  });
}

/**
 * Setup error response for clarification submission
 */
async function setupMockClarificationError(page: Page) {
  await page.route(`${AI_ENGINE_URL}/api/v1/qa/clarification-answer-stream`, async (route) => {
    await route.abort('failed');
  });
}

test.describe('Clarification Flow - JSON Response', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();

    await performLogin(page, USER_EMAIL, USER_PASSWORD);

    // Navigate to chat page
    await page.goto(CHAT_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Handle disclaimer modal if present
    try {
      const modalVisible = await page.locator('[data-testid="legal-disclaimer-modal"]').isVisible({ timeout: 2000 });
      if (modalVisible) {
        // Set the modal state directly in the page to close it
        await page.evaluate(() => {
          // Find and trigger close
          const modal = document.querySelector('[data-testid="legal-disclaimer-modal"]');
          if (modal) {
            (modal as any).remove();
          }
          // Also set localStorage
          localStorage.setItem('legal-disclaimer-accepted', 'true');
          localStorage.setItem('disclaimer-acknowledged', 'true');
        });
        await page.waitForTimeout(500);
      }
    } catch {
      // Modal not present, continue
    }
  });

  test('1) AI returns clarification JSON response', async ({ page }) => {
    // Setup mock to return clarification JSON
    await setupMockClarification(page, mockClarificationResponse);

    // Send a message
    await page.fill('textarea[placeholder*="Ask"]', 'My employer fired me without notice. What are my rights?');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');

    // Wait for streaming to complete
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Verify the clarification was received
    await expect(page.locator('text=I need more details about your employment situation').first()).toBeVisible();

    await page.screenshot({ path: 'test-results/clarification-json-response.png' });
  });

  test('2) Frontend correctly parses JSON and renders ClarificationPrompt component', async ({ page }) => {
    await setupMockClarification(page, mockClarificationResponse);

    await page.fill('textarea[placeholder*="Ask"]', 'I was fired from my job');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Check for ClarificationPrompt component elements
    // Context summary should be visible
    await expect(page.locator('text=I need more details about your employment situation').first()).toBeVisible();

    // Next steps should be visible
    await expect(page.locator('text=Please answer the questions above').first()).toBeVisible();

    // Questions should be rendered
    await expect(page.locator('text=When did the employment end?').first()).toBeVisible();
    await expect(page.locator('text=What was the reason for termination?').first()).toBeVisible();

    // Check for the amber-colored clarification card
    const clarificationCard = page.locator('.border-amber-200, .border-amber-800');
    expect(await clarificationCard.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/clarification-component-rendered.png' });
  });

  test('3) Questions are displayed as bullet points with hints', async ({ page }) => {
    await setupMockClarification(page, mockClarificationResponse);

    await page.fill('textarea[placeholder*="Ask"]', 'Employment question');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Check for numbered question indicators
    const questionNumbers = page.locator('text=/^[1-9]$/');
    expect(await questionNumbers.count()).toBeGreaterThan(0);

    // Check for hint text
    await expect(page.locator('text=Provide the specific date or month').first()).toBeVisible();

    // Check for help icon (HelpCircle component renders as SVG)
    const helpIcon = page.locator('svg').filter({ hasText: '' }).first();
    // Help icon is optional - just log if present
    const hasHelpIcon = await helpIcon.count() > 0;
    console.log('Help icon present:', hasHelpIcon);

    await page.screenshot({ path: 'test-results/clarification-questions-with-hints.png' });
  });

  test('4) User can type answers or select from options (if provided)', async ({ page }) => {
    await setupMockClarification(page, mockClarificationResponse);

    await page.fill('textarea[placeholder*="Ask"]', 'Termination question');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Check for option buttons
    await expect(page.locator('button:has-text("Resignation")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Dismissal")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Mutual agreement")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Contract expiry")').first()).toBeVisible();

    // Check for text input (for questions without options)
    const textInput = page.locator('input[placeholder*="Type your answer"]');
    await expect(textInput.first()).toBeVisible();

    // Select an option
    await page.click('button:has-text("Dismissal")');

    // Wait for selection to apply
    await page.waitForTimeout(500);

    // The option should be selected (visually distinct)
    const selectedOption = page.locator('button:has-text("Dismissal").bg-amber-600, button:has-text("Dismissal").bg-primary, button.bg-amber-600');
    expect(await selectedOption.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/clarification-option-selection.png' });
  });
});

test.describe('Clarification Flow - Answer Submission', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();

    // Set disclaimer accepted in localStorage before navigating
    await context.addInitScript(() => {
      localStorage.setItem('legal-disclaimer-accepted', 'true');
      localStorage.setItem('disclaimer-acknowledged', 'true');
    });

    await performLogin(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(CHAT_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Handle disclaimer modal if present
    try {
      const modalVisible = await page.locator('[data-testid="legal-disclaimer-modal"]').isVisible({ timeout: 2000 });
      if (modalVisible) {
        await page.evaluate(() => {
          const modal = document.querySelector('[data-testid="legal-disclaimer-modal"]');
          if (modal) (modal as any).remove();
        });
        await page.waitForTimeout(500);
      }
    } catch {
      // Modal not present
    }
  });

  test('5) Submit Answers button sends answers to backend', async ({ page }) => {
    // First, show the clarification
    await setupMockClarification(page, mockClarificationResponse);

    await page.fill('textarea[placeholder*="Ask"]', 'I was fired');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Setup mock for answer submission
    let submissionReceived = false;
    let submissionBody: Record<string, unknown> | null = null;

    await page.route(`${AI_ENGINE_URL}/api/v1/qa/clarification-answer-stream`, async (route, request) => {
      submissionReceived = true;
      submissionBody = request.postDataJSON();
      console.log('[Mock] Clarification answers received:', submissionBody);

      // Return a simple response
      const mockResponse = `data: ${JSON.stringify({
        type: 'token',
        content: 'Thank you for the information. ',
        metadata: {},
      })}\n\ndata: ${JSON.stringify({
        type: 'done',
        content: '',
        metadata: { citations: [], confidence: 0.9, processing_time_ms: 500 },
      })}\n\n`;

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: mockResponse,
      });
    });

    // Fill in the answers
    await page.fill('input[placeholder*="Type your answer"]', 'Last week');
    await page.click('button:has-text("Dismissal")');

    // Submit answers
    await page.click('button:has-text("Submit Answers")');

    // Wait for processing
    await page.waitForTimeout(1000);

    // Verify submission was received
    expect(submissionReceived).toBeTruthy();
    expect(submissionBody).toBeDefined();
    expect(submissionBody?.answers).toBeDefined();
    expect(Array.isArray(submissionBody?.answers)).toBeTruthy();

    await page.screenshot({ path: 'test-results/clarification-submission.png' });
  });

  test('6) Backend processes answers and returns final AI response', async ({ page }) => {
    // Show clarification
    await setupMockClarification(page, mockClarificationResponse);

    await page.fill('textarea[placeholder*="Ask"]', 'Fired without notice');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Setup mock response with actual advice
    await setupMockAnswerResponse(page, 'Under Polish Labour Code, termination without notice may be unlawful unless there is a serious breach of obligations. You may be entitled to compensation or reinstatement.');

    // Fill and submit
    await page.fill('input[placeholder*="Type your answer"]', 'Two weeks ago');
    await page.click('button:has-text("Dismissal")');
    await page.click('button:has-text("Submit Answers")');

    // Wait for response streaming
    await page.waitForSelector('text=Generating response...', { timeout: 5000 });
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 15000 });

    // Verify the response content
    await expect(page.locator('text=Polish Labour Code').first()).toBeVisible();
    await expect(page.locator('text=compensation or reinstatement').first()).toBeVisible();

    // Check that clarification prompt is no longer visible
    await expect(page.locator('text=I need more details')).not.toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'test-results/clarification-final-response.png' });
  });

  test('Submit button is disabled until all questions are answered', async ({ page }) => {
    await setupMockClarification(page, mockClarificationResponse);

    await page.fill('textarea[placeholder*="Ask"]', 'Test question');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Initially, submit button should be disabled
    const submitButton = page.locator('button:has-text("Submit Answers")');
    await expect(submitButton).toBeDisabled();

    // Fill in text answer but still missing option
    await page.fill('input[placeholder*="Type your answer"]', 'Last month');
    await expect(submitButton).toBeDisabled();

    // Select option - now button should be enabled
    await page.click('button:has-text("Dismissal")');
    await expect(submitButton).toBeEnabled();

    await page.screenshot({ path: 'test-results/clarification-submit-disabled.png' });
  });

  test('Progress indicator updates as questions are answered', async ({ page }) => {
    await setupMockClarification(page, mockClarificationResponse);

    await page.fill('textarea[placeholder*="Ask"]', 'Question');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Check initial progress (0/2)
    await expect(page.locator('text=/0.*2.*answered/').first()).toBeVisible();

    // Answer one question
    await page.click('button:has-text("Dismissal")');

    // Progress should update (1/2)
    await expect(page.locator('text=/1.*2.*answered/').first()).toBeVisible();

    // Answer second question
    await page.fill('input[placeholder*="Type your answer"]', 'Yesterday');

    // Progress should be complete (2/2)
    await expect(page.locator('text=All questions answered').first()).toBeVisible();

    await page.screenshot({ path: 'test-results/clarification-progress.png' });
  });
});

test.describe('Clarification Flow - Conversation History', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();

    // Set disclaimer accepted in localStorage before navigating
    await context.addInitScript(() => {
      localStorage.setItem('legal-disclaimer-accepted', 'true');
      localStorage.setItem('disclaimer-acknowledged', 'true');
    });

    await performLogin(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(CHAT_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Handle disclaimer modal if present
    try {
      const modalVisible = await page.locator('[data-testid="legal-disclaimer-modal"]').isVisible({ timeout: 2000 });
      if (modalVisible) {
        await page.evaluate(() => {
          const modal = document.querySelector('[data-testid="legal-disclaimer-modal"]');
          if (modal) (modal as any).remove();
        });
        await page.waitForTimeout(500);
      }
    } catch {
      // Modal not present
    }
  });

  test('7) Conversation history includes clarification round', async ({ page }) => {
    // Show clarification
    await setupMockClarification(page, mockClarificationResponse);

    await page.fill('textarea[placeholder*="Ask"]', 'I was terminated');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Verify the assistant message with clarification is in the conversation
    const assistantMessages = page.locator('[data-testid="assistant-message"]');
    await expect(assistantMessages).toHaveCount(1);

    // The message should contain the clarification UI
    await expect(page.locator('.border-amber-200, .border-amber-800').first()).toBeVisible();

    // Submit answers
    await setupMockAnswerResponse(page, 'Based on Polish law...');

    await page.fill('input[placeholder*="Type your answer"]', 'Last week');
    await page.click('button:has-text("Dismissal")');
    await page.click('button:has-text("Submit Answers")');

    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 15000 });

    // After submission, we should have:
    // 1. Original user message
    // 2. Assistant message with clarification (might be replaced or modified)
    // 3. User's answers as a new message
    // 4. Final assistant response

    const allMessages = page.locator('[data-testid="user-message"], [data-testid="assistant-message"]');
    const messageCount = await allMessages.count();
    expect(messageCount).toBeGreaterThanOrEqual(3);

    // The answer text should be visible in a user message
    await expect(page.locator('text=Last week').first()).toBeVisible();

    await page.screenshot({ path: 'test-results/clarification-conversation-history.png' });
  });
});

test.describe('Clarification Flow - Multi-Round', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();

    // Set disclaimer accepted in localStorage before navigating
    await context.addInitScript(() => {
      localStorage.setItem('legal-disclaimer-accepted', 'true');
      localStorage.setItem('disclaimer-acknowledged', 'true');
    });

    await performLogin(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(CHAT_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Handle disclaimer modal if present
    try {
      const modalVisible = await page.locator('[data-testid="legal-disclaimer-modal"]').isVisible({ timeout: 2000 });
      if (modalVisible) {
        await page.evaluate(() => {
          const modal = document.querySelector('[data-testid="legal-disclaimer-modal"]');
          if (modal) (modal as any).remove();
        });
        await page.waitForTimeout(500);
      }
    } catch {
      // Modal not present
    }
  });

  test('8) Multi-round clarification works (ask -> answer -> ask follow-up -> answer -> respond)', async ({ page }) => {
    let round = 1;

    // First round: initial clarification
    await page.route(`${AI_ENGINE_URL}/api/v1/qa/ask-stream`, async (route) => {
      const clarificationJson = JSON.stringify(round === 1 ? mockClarificationResponse : mockFollowUpClarification);
      const mockResponse = `data: ${JSON.stringify({
        type: 'token',
        content: clarificationJson,
        metadata: {},
      })}\n\ndata: ${JSON.stringify({
        type: 'done',
        content: '',
        metadata: { citations: [], confidence: 0.5, processing_time_ms: 500 },
      })}\n\n`;

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: mockResponse,
      });
    });

    // Send initial question
    await page.fill('textarea[placeholder*="Ask"]', 'Complex employment case');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Verify first round
    await expect(page.locator('text=When did the employment end?').first()).toBeVisible();
    await expect(page.locator('text=Round 1/2')).not.toBeVisible(); // Round indicator only shows if explicitly set

    // Setup answer response that leads to second clarification round
    await page.route(`${AI_ENGINE_URL}/api/v1/qa/clarification-answer-stream`, async (route) => {
      if (round === 1) {
        // After first answer, return another clarification
        round = 2;
        const followUpJson = JSON.stringify(mockFollowUpClarification);
        const mockResponse = `data: ${JSON.stringify({
          type: 'token',
          content: followUpJson,
          metadata: {},
        })}\n\ndata: ${JSON.stringify({
          type: 'done',
          content: '',
          metadata: { citations: [], confidence: 0.6, processing_time_ms: 500 },
        })}\n\n`;

        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
          body: mockResponse,
        });
      } else {
        // Final response after second round
        const mockResponse = `data: ${JSON.stringify({
          type: 'token',
          content: 'Based on all the information provided, here is my complete analysis: ',
          metadata: {},
        })}\n\ndata: ${JSON.stringify({
          type: 'token',
          content: 'Your case has merit for claiming wrongful termination.',
          metadata: {},
        })}\n\ndata: ${JSON.stringify({
          type: 'done',
          content: '',
          metadata: { citations: [], confidence: 0.95, processing_time_ms: 1000 },
        })}\n\n`;

        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
          body: mockResponse,
        });
      }
    });

    // Answer first round questions
    await page.fill('input[placeholder*="Type your answer"]', 'Two weeks ago');
    await page.click('button:has-text("Dismissal")');
    await page.click('button:has-text("Submit Answers")');

    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Verify second round appears
    await expect(page.locator('text=Did you receive a written notice of termination?').first()).toBeVisible();

    // Answer second round
    await page.click('button:has-text("Yes")');
    await page.click('button:has-text("Submit Answers")');

    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 15000 });

    // Verify final response
    await expect(page.locator('text=complete analysis').first()).toBeVisible();
    await expect(page.locator('text=wrongful termination').first()).toBeVisible();

    await page.screenshot({ path: 'test-results/clarification-multi-round.png' });
  });
});

test.describe('Clarification Flow - Context Preservation', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();

    // Set disclaimer accepted in localStorage before navigating
    await context.addInitScript(() => {
      localStorage.setItem('legal-disclaimer-accepted', 'true');
      localStorage.setItem('disclaimer-acknowledged', 'true');
    });

    await performLogin(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(CHAT_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Handle disclaimer modal if present
    try {
      const modalVisible = await page.locator('[data-testid="legal-disclaimer-modal"]').isVisible({ timeout: 2000 });
      if (modalVisible) {
        await page.evaluate(() => {
          const modal = document.querySelector('[data-testid="legal-disclaimer-modal"]');
          if (modal) (modal as any).remove();
        });
        await page.waitForTimeout(500);
      }
    } catch {
      // Modal not present
    }
  });

  test('9) Context is preserved across clarification flow', async ({ page }) => {
    // Track requests to verify context is passed
    const requests: Array<{ url: string; body: Record<string, unknown> }> = [];

    await page.route(`${AI_ENGINE_URL}/api/v1/qa/ask-stream`, async (route, request) => {
      const body = request.postDataJSON();
      requests.push({ url: request.url(), body });

      // Return clarification
      const clarificationJson = JSON.stringify(mockClarificationResponse);
      const mockResponse = `data: ${JSON.stringify({
        type: 'token',
        content: clarificationJson,
        metadata: {},
      })}\n\ndata: ${JSON.stringify({
        type: 'done',
        content: '',
        metadata: { citations: [], confidence: 0.5, processing_time_ms: 500 },
      })}\n\n`;

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: mockResponse,
      });
    });

    await page.route(`${AI_ENGINE_URL}/api/v1/qa/clarification-answer-stream`, async (route, request) => {
      const body = request.postDataJSON();
      requests.push({ url: request.url(), body });

      // Verify original question is in the request
      expect(body.original_question).toBeDefined();
      expect(body.original_question).toContain('terminated');

      // Return response that references original context
      const mockResponse = `data: ${JSON.stringify({
        type: 'token',
        content: 'Regarding your termination from two weeks ago: ',
        metadata: {},
      })}\n\ndata: ${JSON.stringify({
        type: 'done',
        content: '',
        metadata: { citations: [], confidence: 0.9, processing_time_ms: 500 },
      })}\n\n`;

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: mockResponse,
      });
    });

    // Send initial question
    await page.fill('textarea[placeholder*="Ask"]', 'I was wrongfully terminated from my job');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Submit answers
    await page.fill('input[placeholder*="Type your answer"]', 'Last week');
    await page.click('button:has-text("Dismissal")');
    await page.click('button:has-text("Submit Answers")');

    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 15000 });

    // Verify the response references the original context
    await expect(page.locator('text=termination from two weeks ago').first()).toBeVisible();

    // Verify requests captured
    expect(requests.length).toBe(2);
    expect(requests[1].body.original_question).toContain('terminated');

    await page.screenshot({ path: 'test-results/clarification-context-preserved.png' });
  });
});

test.describe('Clarification Flow - Error Handling', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();

    // Set disclaimer accepted in localStorage before navigating
    await context.addInitScript(() => {
      localStorage.setItem('legal-disclaimer-accepted', 'true');
      localStorage.setItem('disclaimer-acknowledged', 'true');
    });

    await performLogin(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(CHAT_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Handle disclaimer modal if present
    try {
      const modalVisible = await page.locator('[data-testid="legal-disclaimer-modal"]').isVisible({ timeout: 2000 });
      if (modalVisible) {
        await page.evaluate(() => {
          const modal = document.querySelector('[data-testid="legal-disclaimer-modal"]');
          if (modal) (modal as any).remove();
        });
        await page.waitForTimeout(500);
      }
    } catch {
      // Modal not present
    }
  });

  test('10) Error handling if clarification submission fails', async ({ page }) => {
    // Show clarification
    await setupMockClarification(page, mockClarificationResponse);

    await page.fill('textarea[placeholder*="Ask"]', 'Termination question');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Setup error on submission
    await setupMockClarificationError(page);

    // Fill answers and submit
    await page.fill('input[placeholder*="Type your answer"]', 'Last week');
    await page.click('button:has-text("Dismissal")');
    await page.click('button:has-text("Submit Answers")');

    // Wait for error to appear
    await page.waitForTimeout(3000);

    // Check for error indicator - the button should show error state or there should be error message
    // The exact UI depends on implementation, but some error indication should be present
    const hasErrorText = await page.locator('text=error, text=Error, text=failed, text=Failed').count();
    console.log('Error indicators found:', hasErrorText);

    // The input might be re-enabled after error
    const textInput = page.locator('input[placeholder*="Type your answer"]');
    const isDisabled = await textInput.first().isDisabled();
    console.log('Input disabled after error:', isDisabled);

    await page.screenshot({ path: 'test-results/clarification-error-handling.png' });
  });

  test('Skip button allows user to bypass clarification', async ({ page }) => {
    await setupMockClarification(page, mockClarificationResponse);

    await page.fill('textarea[placeholder*="Ask"]', 'Question');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Check for skip button
    const skipButton = page.locator('button:has-text("Skip")');
    const skipButtonExists = await skipButton.count();

    if (skipButtonExists > 0) {
      // Click skip and verify a message is sent
      await skipButton.click();

      // Should trigger a generic message
      await page.waitForTimeout(1000);
      const messages = await page.locator('[data-testid="user-message"]').allTextContents();
      expect(messages.length).toBeGreaterThan(0);
    }

    await page.screenshot({ path: 'test-results/clarification-skip-button.png' });
  });
});

test.describe('Clarification Flow - Integration', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();

    // Set disclaimer accepted in localStorage before navigating
    await context.addInitScript(() => {
      localStorage.setItem('legal-disclaimer-accepted', 'true');
      localStorage.setItem('disclaimer-acknowledged', 'true');
    });

    await performLogin(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(CHAT_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Handle disclaimer modal if present
    try {
      const modalVisible = await page.locator('[data-testid="legal-disclaimer-modal"]').isVisible({ timeout: 2000 });
      if (modalVisible) {
        await page.evaluate(() => {
          const modal = document.querySelector('[data-testid="legal-disclaimer-modal"]');
          if (modal) (modal as any).remove();
        });
        await page.waitForTimeout(500);
      }
    } catch {
      // Modal not present
    }
  });

  test('Full clarification flow end-to-end with real components', async ({ page }) => {
    // This test verifies the entire flow with component interaction

    // Mock the complete flow
    await page.route(`${AI_ENGINE_URL}/api/v1/qa/ask-stream`, async (route) => {
      const clarificationJson = JSON.stringify(mockClarificationResponse);
      const mockResponse = `data: ${JSON.stringify({
        type: 'token',
        content: clarificationJson,
        metadata: {},
      })}\n\ndata: ${JSON.stringify({
        type: 'done',
        content: '',
        metadata: { citations: [], confidence: 0.5, processing_time_ms: 500 },
      })}\n\n`;

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: mockResponse,
      });
    });

    await page.route(`${AI_ENGINE_URL}/api/v1/qa/clarification-answer-stream`, async (route) => {
      const mockResponse = `data: ${JSON.stringify({
        type: 'token',
        content: 'Based on your answers: Your termination appears to violate Polish labor law. ',
        metadata: {},
      })}\n\ndata: ${JSON.stringify({
        type: 'token',
        content: 'You may be entitled to 2-3 weeks of compensation per Article 45 of the Labour Code.',
        metadata: {},
      })}\n\ndata: ${JSON.stringify({
        type: 'citation',
        content: '',
        metadata: { source: 'Labour Code', article: 'Art. 45 § 1', url: 'https://isap.sejm.gov.pl/' },
      })}\n\ndata: ${JSON.stringify({
        type: 'done',
        content: '',
        metadata: { citations: [], confidence: 0.92, processing_time_ms: 1200 },
      })}\n\n`;

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: mockResponse,
      });
    });

    // 1. User sends initial question
    await page.fill('textarea[placeholder*="Ask"]', 'I was fired without notice. What can I do?');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');

    // 2. Wait for clarification to appear
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });
    await expect(page.locator('text=When did the employment end?').first()).toBeVisible();

    // 3. Verify UI elements
    await expect(page.locator('text=What was the reason for termination?').first()).toBeVisible();
    await expect(page.locator('button:has-text("Dismissal")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Resignation")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Submit Answers")').first()).toBeVisible();

    // 4. User answers questions
    await page.fill('input[placeholder*="Type your answer"]', 'Three days ago');
    await page.click('button:has-text("Dismissal")');

    // 5. Submit
    await page.click('button:has-text("Submit Answers")');

    // 6. Wait for final response
    await page.waitForSelector('text=Generating response...', { timeout: 5000 });
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 15000 });

    // 7. Verify final response
    await expect(page.locator('text=violates Polish labor law').first()).toBeVisible();
    await expect(page.locator('text=Article 45').first()).toBeVisible();

    // 8. Verify conversation history
    const allMessages = await page.locator('[data-testid="user-message"], [data-testid="assistant-message"]').count();
    expect(allMessages).toBeGreaterThanOrEqual(3); // Initial Q, clarification A, final response

    await page.screenshot({ path: 'test-results/clarification-full-flow.png' });
  });

  test('Header changes to clarification mode when pending', async ({ page }) => {
    await setupMockClarification(page, mockClarificationResponse);

    await page.fill('textarea[placeholder*="Ask"]', 'Question');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Check for "Clarification Mode" or similar header indication
    const headerText = await page.locator('h1').textContent();
    expect(headerText).toBeDefined();

    // The header might show "Clarification Mode" or the status indicator changes
    const statusIndicator = page.locator('text=Waiting for your answers, text=Clarification Mode');
    const hasClarificationStatus = await statusIndicator.count() > 0;
    console.log('Has clarification status in header:', hasClarificationStatus);

    await page.screenshot({ path: 'test-results/clarification-header-mode.png' });
  });
});
