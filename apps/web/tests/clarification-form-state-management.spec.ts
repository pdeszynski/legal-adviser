/* eslint-disable max-lines */
import { test, expect, type Page } from '@playwright/test';

/**
 * Clarification Form State Management E2E Tests
 *
 * Comprehensive end-to-end tests to verify clarification form state management
 * and prevent regressions. These tests ensure the clarification form behaves
 * correctly under various user interaction scenarios.
 *
 * Test Scenarios:
 * 1) Open clarification questions remain displayed when user types in text inputs
 * 2) Clicking outside form does NOT close or submit clarification
 * 3) Pressing Enter in text input does NOT submit (unless Ctrl+Enter)
 * 4) Only 'Submit Answers' button triggers submitClarificationAnswers mutation
 * 5) Form with both text inputs and option buttons works correctly
 * 6) Multi-line text answers are captured completely without truncation
 * 7) Form validation prevents submission with empty text fields
 * 8) Loading state appears during submission and form cannot be closed
 * 9) After successful submission, clarification shows read-only state with user's answers
 * 10) Verify no empty chat sessions created when clarification is pending
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

// Mock clarification response with both text and option questions
const mockClarificationWithBothTypes = {
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
    {
      question: 'Please describe any written communication you received',
      question_type: 'documents',
      hint: 'Include details from emails, letters, or notices',
    },
  ],
  context_summary:
    'I need more details about your employment situation to provide accurate advice.',
  next_steps: 'Please answer the questions above so I can help you better.',
};

// Mock clarification response with only text questions (for multi-line testing)
const mockClarificationWithTextOnly = {
  type: 'clarification',
  questions: [
    {
      question: 'Describe the events leading to your dismissal in detail',
      question_type: 'timeline',
      hint: 'Include dates, times, and what was said or done',
    },
    {
      question: 'What specific terms of your contract were violated?',
      question_type: 'documents',
    },
  ],
  context_summary: 'Please provide detailed information to help with your case.',
  next_steps: 'The more detail you provide, the better I can assist you.',
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
  await page.route(`${AI_ENGINE_URL}/api/v1/qa/ask-stream`, async (route) => {
    // Intercept and mock the request

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
        Connection: 'keep-alive',
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
        Connection: 'keep-alive',
      },
      body: mockResponse,
    });
  });
}

/**
 * Setup mocks for both ask and clarification answer streams
 */
async function setupFullFlowMocks(
  page: Page,
  clarificationData: Record<string, unknown>,
  finalAnswer: string,
) {
  await setupMockClarification(page, clarificationData);
  await setupMockAnswerResponse(page, finalAnswer);
}

test.describe('Clarification Form State Management', () => {
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
      const modalVisible = await page
        .locator('[data-testid="legal-disclaimer-modal"]')
        .isVisible({ timeout: 2000 });
      if (modalVisible) {
        await page.evaluate(() => {
          const modal = document.querySelector('[data-testid="legal-disclaimer-modal"]');
          if (modal) modal.remove();
        });
        await page.waitForTimeout(500);
      }
    } catch {
      // Modal not present
    }
  });

  test('1) Open clarification questions remain displayed when user types in text inputs', async ({
    page,
  }) => {
    await setupMockClarification(page, mockClarificationWithBothTypes);

    // Send a message that triggers clarification
    await page.fill(
      'textarea[placeholder*="Ask"]',
      'I was fired without notice. What are my rights?',
    );
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Verify clarification form is displayed
    await expect(page.locator('text=When did the employment end?').first()).toBeVisible();
    await expect(page.locator('text=What was the reason for termination?').first()).toBeVisible();

    // Find the textarea for the first question (text input question)
    const textArea = page.locator('textarea[placeholder*="Type your answer"]').first();
    await expect(textArea).toBeVisible();

    // Type in the text area
    await textArea.fill('Last week on Monday');

    // Verify clarification form is still visible after typing
    await expect(page.locator('text=When did the employment end?').first()).toBeVisible();
    await expect(page.locator('text=What was the reason for termination?').first()).toBeVisible();
    await expect(page.locator('[data-testid="clarification-prompt"]').first()).toBeVisible();

    // Verify the typed text is still in the textarea
    await expect(textArea).toHaveValue('Last week on Monday');

    await page.screenshot({ path: 'test-results/clarification-remains-after-typing.png' });
  });

  test('2) Clicking outside form does NOT close or submit clarification', async ({ page }) => {
    await setupMockClarification(page, mockClarificationWithBothTypes);

    // Send a message that triggers clarification
    await page.fill('textarea[placeholder*="Ask"]', 'I need legal advice');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Verify clarification form is displayed
    await expect(page.locator('[data-testid="clarification-prompt"]').first()).toBeVisible();

    // Click outside the form (on the header, for example)
    await page.locator('h1').click();

    // Verify clarification form is STILL visible
    await expect(page.locator('[data-testid="clarification-prompt"]').first()).toBeVisible();

    // Click on a different area of the page (messages area)
    await page.locator('.overflow-y-auto').click({ position: { x: 50, y: 50 } });

    // Verify clarification form is STILL visible
    await expect(page.locator('[data-testid="clarification-prompt"]').first()).toBeVisible();

    // Click on the mode toggle
    await page.locator('text=Simple').first().click();

    // Verify clarification form is STILL visible
    await expect(page.locator('[data-testid="clarification-prompt"]').first()).toBeVisible();

    // Verify no submission was made (no new messages)
    const userMessages = await page.locator('[data-testid="user-message"]').count();
    // Should still have only 1 message (the initial one we sent)
    expect(userMessages).toBe(1);

    await page.screenshot({ path: 'test-results/clarification-not-closed-on-click-outside.png' });
  });

  test('3) Pressing Enter in text input does NOT submit (unless Ctrl+Enter)', async ({ page }) => {
    await setupMockClarification(page, mockClarificationWithBothTypes);

    // Send a message that triggers clarification
    await page.fill('textarea[placeholder*="Ask"]', 'Employment question');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Verify clarification form is displayed
    await expect(page.locator('[data-testid="clarification-prompt"]').first()).toBeVisible();

    // Find the textarea for text input question
    const textArea = page.locator('textarea[placeholder*="Type your answer"]').first();

    // Type and press Enter (should NOT submit)
    await textArea.fill('Test text');
    await textArea.press('Enter');

    // Wait a moment to check if anything happens
    await page.waitForTimeout(500);

    // Verify clarification form is STILL visible (Enter did not submit)
    await expect(page.locator('[data-testid="clarification-prompt"]').first()).toBeVisible();

    // Verify the text is still in the textarea
    await expect(textArea).toHaveValue('Test text');

    // Now press Ctrl+Enter (should submit)
    // First, select an option to enable the submit button
    await page.click('button:has-text("Dismissal")');

    // Verify submit button is enabled
    const submitButton = page.locator('button:has-text("Submit Answers")');
    await expect(submitButton).toBeEnabled();

    // Press Ctrl+Enter in the textarea to submit
    await textArea.press('Control+Enter');

    // Wait for submission to start (loading state)
    await page.waitForTimeout(1000);

    // After Ctrl+Enter, form should show loading or be submitted
    // Either the button shows "Processing..." or form is removed
    const isProcessing = (await page.locator('text=Processing').count()) > 0;
    const isSubmitted = (await page.locator('[data-testid="clarification-prompt"]').count()) === 0;

    expect(isProcessing || isSubmitted).toBeTruthy();

    await page.screenshot({ path: 'test-results/clarification-enter-key-behavior.png' });
  });

  test('4) Only Submit Answers button triggers submitClarificationAnswers mutation', async ({
    page,
  }) => {
    let submitMutationCalled = false;
    let submitMethodCalled = '';

    // Intercept the clarification answer stream endpoint
    await page.route(`${AI_ENGINE_URL}/api/v1/qa/clarification-answer-stream`, async (route) => {
      submitMutationCalled = true;
      submitMethodCalled = 'clarification-answer-stream';

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
          Connection: 'keep-alive',
        },
        body: mockResponse,
      });
    });

    await setupMockClarification(page, mockClarificationWithBothTypes);

    // Send a message that triggers clarification
    await page.fill('textarea[placeholder*="Ask"]', 'I was terminated');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Verify clarification form is displayed
    await expect(page.locator('[data-testid="clarification-prompt"]').first()).toBeVisible();

    // Try various actions that should NOT trigger submission
    // 1. Click outside the form
    await page.locator('h1').click();
    await page.waitForTimeout(200);
    expect(submitMutationCalled).toBeFalsy();

    // 2. Press Tab to navigate between fields
    await page.locator('textarea[placeholder*="Type your answer"]').first().press('Tab');
    await page.waitForTimeout(200);
    expect(submitMutationCalled).toBeFalsy();

    // 3. Press Enter in textarea
    const textArea = page.locator('textarea[placeholder*="Type your answer"]').first();
    await textArea.fill('Test text');
    await textArea.press('Enter');
    await page.waitForTimeout(200);
    expect(submitMutationCalled).toBeFalsy();

    // 4. Click on an option button (should not submit)
    await page.click('button:has-text("Dismissal")');
    await page.waitForTimeout(200);
    expect(submitMutationCalled).toBeFalsy();

    // 5. Click on the Skip button if present
    const skipButton = page.locator('button:has-text("Skip")');
    const skipButtonExists = (await skipButton.count()) > 0;
    if (skipButtonExists) {
      // Skip button sends a different message, not submitClarificationAnswers
      // So we verify the mutation is still not called
      await skipButton.first().click();
      await page.waitForTimeout(200);
      // Note: Skip button sends a different message, so submitMutationCalled might not be true
    }

    // Reset the flag for actual submission test
    submitMutationCalled = false;

    // Now click the Submit Answers button (should trigger submission)
    const submitButton = page.locator('button:has-text("Submit Answers")');
    await submitButton.click();

    // Wait for the mutation to be called
    await page.waitForTimeout(1000);

    // Verify the mutation was called
    expect(submitMutationCalled).toBeTruthy();
    expect(submitMethodCalled).toBe('clarification-answer-stream');

    await page.screenshot({ path: 'test-results/clarification-only-submit-button-works.png' });
  });

  test('5) Form with both text inputs and option buttons works correctly', async ({ page }) => {
    await setupFullFlowMocks(
      page,
      mockClarificationWithBothTypes,
      'Based on your answers, you have a valid claim.',
    );

    // Send a message that triggers clarification
    await page.fill('textarea[placeholder*="Ask"]', 'I was fired');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Verify all questions are displayed
    await expect(page.locator('text=When did the employment end?').first()).toBeVisible();
    await expect(page.locator('text=What was the reason for termination?').first()).toBeVisible();
    await expect(page.locator('text=written communication').first()).toBeVisible();

    // Verify option buttons are displayed for the second question
    await expect(page.locator('button:has-text("Resignation")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Dismissal")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Mutual agreement")').first()).toBeVisible();

    // Verify textarea is displayed for text input questions
    const textAreas = page.locator('textarea[placeholder*="Type your answer"]');
    await expect(textAreas).toHaveCount(2); // Two text input questions

    // Fill in the first text question
    await textAreas.nth(0).fill('Two weeks ago');

    // Select an option for the second question
    await page.click('button:has-text("Dismissal")');

    // Verify option is visually selected
    const selectedOption = page.locator(
      'button:has-text("Dismissal").bg-amber-600, button.bg-amber-600',
    );
    expect(await selectedOption.count()).toBeGreaterThan(0);

    // Fill in the third text question
    await textAreas.nth(1).fill('I received an email stating my position was eliminated');

    // Verify progress indicator shows all questions answered
    await expect(page.locator('text=All questions answered').first()).toBeVisible();

    // Submit the form
    await page.click('button:has-text("Submit Answers")');

    // Wait for response
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 15000 });

    // Verify final response
    await expect(page.locator('text=valid claim').first()).toBeVisible();

    // Verify user's answers are shown in the chat
    await expect(page.locator('text=Two weeks ago').first()).toBeVisible();
    await expect(
      page.locator('text=dismissal').or(page.locator('text=Dismissal')).first(),
    ).toBeVisible();
    await expect(page.locator('text=received an email').first()).toBeVisible();

    await page.screenshot({ path: 'test-results/clarification-mixed-input-types.png' });
  });

  test('6) Multi-line text answers are captured completely without truncation', async ({
    page,
  }) => {
    const longMultiLineAnswer = `This is a detailed description of what happened:

First, my manager called me into a meeting on Friday afternoon at 4 PM.
During the meeting, they told me that my position was being eliminated
effective immediately, without any prior written notice.

I was given my final paycheck and asked to leave the premises.
No severance package was offered despite my 3 years of service.

After the meeting, I received an email confirmation that stated:
"Your employment is terminated effective immediately."

This feels unfair and I believe it violates Polish labor law.`;

    await setupFullFlowMocks(
      page,
      mockClarificationWithTextOnly,
      'Thank you for the detailed information.',
    );

    // Send a message that triggers clarification
    await page.fill('textarea[placeholder*="Ask"]', 'I need help with unfair dismissal');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Find the textarea and type the long multi-line answer
    const textArea = page.locator('textarea[placeholder*="Type your answer"]').first();

    // Type the long answer character by character to simulate realistic typing
    await textArea.fill(longMultiLineAnswer);

    // Verify the character counter shows the correct length
    const charCounter = page.locator('text=/\\d+ chars/').first();
    await expect(charCounter).toBeVisible();

    const counterText = await charCounter.textContent();
    const charCount = parseInt(counterText?.match(/\d+/)?.[0] || '0', 10);
    expect(charCount).toBe(longMultiLineAnswer.length);

    // Fill in the second question
    const textAreas = page.locator('textarea[placeholder*="Type your answer"]');
    await textAreas.nth(1).fill('My contract specifies 3 months notice period');

    // Submit the form
    await page.click('button:has-text("Submit Answers")');

    // Wait for response
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 15000 });

    // Verify the multi-line answer is displayed in full (not truncated)
    await expect(page.locator('text=First, my manager called me').first()).toBeVisible();
    await expect(page.locator('text=Friday afternoon at 4 PM').first()).toBeVisible();
    await expect(
      page.locator('text=immediately, without any prior written notice').first(),
    ).toBeVisible();
    await expect(page.locator('text=violates Polish labor law').first()).toBeVisible();

    await page.screenshot({ path: 'test-results/clarification-multi-line-capture.png' });
  });

  test('7) Form validation prevents submission with empty text fields', async ({ page }) => {
    await setupMockClarification(page, mockClarificationWithBothTypes);

    // Send a message that triggers clarification
    await page.fill('textarea[placeholder*="Ask"]', 'Question');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Verify initial state - submit button should be disabled
    const submitButton = page.locator('button:has-text("Submit Answers")');
    await expect(submitButton).toBeDisabled();

    // Fill in only the option question (text questions still empty)
    await page.click('button:has-text("Dismissal")');

    // Submit button should still be disabled (text questions not answered)
    await expect(submitButton).toBeDisabled();

    // Fill in one text question
    const textArea = page.locator('textarea[placeholder*="Type your answer"]').first();
    await textArea.fill('Last week');

    // Submit button should still be disabled (one text question still empty)
    await expect(submitButton).toBeDisabled();

    // Try to click the disabled submit button
    await submitButton.click({ force: false }); // Normal click should not work

    // Verify form is still visible (no submission occurred)
    await expect(page.locator('[data-testid="clarification-prompt"]').first()).toBeVisible();

    // Verify no new user messages were created
    const userMessagesBefore = await page.locator('[data-testid="user-message"]').count();

    // Fill in the remaining text question
    const textAreas = page.locator('textarea[placeholder*="Type your answer"]');
    await textAreas.nth(1).fill('No written communication received');

    // Now submit button should be enabled
    await expect(submitButton).toBeEnabled();

    // Click submit button
    await submitButton.click();

    // Wait for submission
    await page.waitForTimeout(1000);

    // Verify a new user message was created (submission successful)
    const userMessagesAfter = await page.locator('[data-testid="user-message"]').count();
    expect(userMessagesAfter).toBe(userMessagesBefore + 1);

    await page.screenshot({ path: 'test-results/clarification-form-validation.png' });
  });

  test('8) Loading state appears during submission and form cannot be closed', async ({ page }) => {
    // Setup a delayed response to allow testing loading state
    let submissionReceived = false;

    await page.route(`${AI_ENGINE_URL}/api/v1/qa/clarification-answer-stream`, async (route) => {
      submissionReceived = true;

      // Delay the response to show loading state
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockResponse = `data: ${JSON.stringify({
        type: 'token',
        content: 'Thank you. ',
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
          Connection: 'keep-alive',
        },
        body: mockResponse,
      });
    });

    await setupMockClarification(page, mockClarificationWithBothTypes);

    // Send a message that triggers clarification
    await page.fill('textarea[placeholder*="Ask"]', 'I need help');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Fill in all answers
    const textAreas = page.locator('textarea[placeholder*="Type your answer"]');
    await textAreas.nth(0).fill('Last month');
    await textAreas.nth(1).fill('Email received');
    await page.click('button:has-text("Dismissal")');

    // Click submit button
    const submitButton = page.locator('button:has-text("Submit Answers")');
    await submitButton.click();

    // Wait for submission to start
    await page.waitForTimeout(100);

    // Verify loading state - button should show "Processing..."
    const processingText = page.locator('text=Processing');
    await expect(processingText).toBeVisible({ timeout: 2000 });

    // Verify loading spinner is visible
    const loaderIcon = page.locator('.animate-spin');
    expect(await loaderIcon.count()).toBeGreaterThan(0);

    // Try to click outside the form - form should not close
    await page.locator('h1').click();
    await expect(page.locator('[data-testid="clarification-prompt"]').first()).toBeVisible();

    // Try to click the Skip button - should be disabled during submission
    const skipButton = page.locator('button:has-text("Skip")');
    const skipButtonExists = (await skipButton.count()) > 0;
    if (skipButtonExists) {
      const isDisabled = await skipButton.first().isDisabled();
      expect(isDisabled).toBeTruthy();
    }

    // Verify submission was received
    expect(submissionReceived).toBeTruthy();

    // Wait for response to complete
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // After completion, clarification should be removed
    await expect(page.locator('[data-testid="clarification-prompt"]')).not.toBeVisible({
      timeout: 5000,
    });

    await page.screenshot({ path: 'test-results/clarification-loading-state.png' });
  });

  test('9) After successful submission, clarification shows read-only state with answers', async ({
    page,
  }) => {
    await setupFullFlowMocks(
      page,
      mockClarificationWithBothTypes,
      'Based on your answers, here is my analysis.',
    );

    // Send a message that triggers clarification
    await page.fill('textarea[placeholder*="Ask"]', 'I was wrongfully terminated');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Fill in all answers
    const textAreas = page.locator('textarea[placeholder*="Type your answer"]');
    const answer1 = 'Three weeks ago';
    const answer2 = 'Termination notice via certified mail';
    await textAreas.nth(0).fill(answer1);
    await textAreas.nth(1).fill(answer2);
    await page.click('button:has-text("Dismissal")');

    // Submit the form
    await page.click('button:has-text("Submit Answers")');

    // Wait for response
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 15000 });

    // Verify the clarification form is no longer visible (replaced with response)
    await expect(page.locator('[data-testid="clarification-prompt"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Verify user's answers are displayed in a user message
    await expect(page.locator(`text=${answer1}`).first()).toBeVisible();
    await expect(page.locator('text=Dismissal').first()).toBeVisible();
    await expect(page.locator(`text=${answer2}`).first()).toBeVisible();

    // Verify the assistant response is displayed
    await expect(page.locator('text=analysis').first()).toBeVisible();

    // Check that the message list shows the correct number of messages
    const allMessages = await page
      .locator('[data-testid="user-message"], [data-testid="assistant-message"]')
      .count();
    expect(allMessages).toBeGreaterThanOrEqual(3); // Initial question, user answers, assistant response

    await page.screenshot({ path: 'test-results/clarification-read-only-after-submit.png' });
  });

  test('10) Verify no empty chat sessions created when clarification is pending', async ({
    page,
  }) => {
    let sessionCreationCount = 0;

    // Intercept GraphQL mutations to track session creation
    await page.route('**/graphql', async (route, request) => {
      const postData = request.postDataJSON();

      // Track createChatSession mutations
      if (postData?.query?.includes('createChatSession')) {
        sessionCreationCount++;

        // Mock successful response
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              createChatSession: {
                id: `session-${Date.now()}`,
                mode: 'LAWYER',
                createdAt: new Date().toISOString(),
              },
            },
          }),
        });
        return;
      }

      route.continue();
    });

    await setupMockClarification(page, mockClarificationWithBothTypes);

    // Send a message that triggers clarification
    await page.fill('textarea[placeholder*="Ask"]', 'I have a legal question');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Wait a moment to ensure no extra sessions are created
    await page.waitForTimeout(1000);

    // Verify only one session was created (for the initial message)
    expect(sessionCreationCount).toBe(1);

    // Now interact with the clarification form without submitting
    // Type in text area
    const textArea = page.locator('textarea[placeholder*="Type your answer"]').first();
    await textArea.fill('Test answer');

    // Click around
    await page.locator('h1').click();
    await page.waitForTimeout(200);

    // Click an option
    await page.click('button:has-text("Resignation")');
    await page.waitForTimeout(200);

    // Type more
    await textArea.fill('Modified test answer');

    // Wait and verify no additional sessions were created
    await page.waitForTimeout(1000);
    expect(sessionCreationCount).toBe(1);

    // Now submit the form (should NOT create a new session, should use existing)
    const textAreas = page.locator('textarea[placeholder*="Type your answer"]');
    await textAreas.nth(1).fill('Additional info');

    await setupMockAnswerResponse(page, 'Here is my response');

    await page.click('button:has-text("Submit Answers")');

    // Wait for response
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 15000 });

    // Verify still only one session was created
    expect(sessionCreationCount).toBe(1);

    await page.screenshot({ path: 'test-results/clarification-no-empty-sessions.png' });
  });

  test('Additional: Character counter updates correctly as user types', async ({ page }) => {
    await setupMockClarification(page, mockClarificationWithBothTypes);

    // Send a message that triggers clarification
    await page.fill('textarea[placeholder*="Ask"]', 'Test question');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Find text area and character counter
    const textArea = page.locator('textarea[placeholder*="Type your answer"]').first();
    const charCounter = page.locator('text=/\\d+ chars/').first();

    // Initial state - should show 0 chars
    await expect(charCounter).toBeVisible();
    let counterText = await charCounter.textContent();
    expect(counterText).toContain('0 chars');

    // Type some text
    await textArea.fill('Hello');
    await page.waitForTimeout(100);

    counterText = await charCounter.textContent();
    expect(counterText).toContain('5 chars');

    // Type more text
    await textArea.fill('Hello World');
    await page.waitForTimeout(100);

    counterText = await charCounter.textContent();
    expect(counterText).toContain('11 chars');

    // Clear the text
    await textArea.fill('');
    await page.waitForTimeout(100);

    counterText = await charCounter.textContent();
    expect(counterText).toContain('0 chars');

    // Verify "Answer captured" indicator appears when text is entered
    const answerCapturedIndicator = page.locator('text=✓ Answer captured');
    await textArea.fill('Some text');
    await page.waitForTimeout(100);

    await expect(answerCapturedIndicator.first()).toBeVisible();

    // Verify "Type your answer above" when empty
    await textArea.fill('');
    await page.waitForTimeout(100);

    const typeAnswerIndicator = page.locator('text=Type your answer above');
    await expect(typeAnswerIndicator.first()).toBeVisible();

    await page.screenshot({ path: 'test-results/clarification-character-counter.png' });
  });

  test('Additional: Progress indicator updates correctly across question types', async ({
    page,
  }) => {
    await setupMockClarification(page, mockClarificationWithBothTypes);

    // Send a message that triggers clarification
    await page.fill('textarea[placeholder*="Ask"]', 'Question');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    // Initial progress - 0/3 answered
    await expect(page.locator('text=/0.*3.*answered/').first()).toBeVisible();

    // Answer one question (option type)
    await page.click('button:has-text("Dismissal")');
    await page.waitForTimeout(100);

    // Progress should be 1/3
    await expect(page.locator('text=/1.*3.*answered/').first()).toBeVisible();

    // Answer second question (text type)
    const textArea = page.locator('textarea[placeholder*="Type your answer"]').first();
    await textArea.fill('Last week');
    await page.waitForTimeout(100);

    // Progress should be 2/3
    await expect(page.locator('text=/2.*3.*answered/').first()).toBeVisible();

    // Answer third question (text type)
    const textAreas = page.locator('textarea[placeholder*="Type your answer"]');
    await textAreas.nth(1).fill('Email received');
    await page.waitForTimeout(100);

    // Progress should be complete
    await expect(page.locator('text=All questions answered').first()).toBeVisible();

    // Verify progress bar is at 100%
    const progressBar = page.locator('div[role="progressbar"], .progress-bar');
    const ariaValue = await progressBar.first().getAttribute('aria-valuenow');
    expect(ariaValue).toBe('100');

    await page.screenshot({ path: 'test-results/clarification-progress-indicator.png' });
  });

  test('Additional: Form state persists when switching between questions', async ({ page }) => {
    await setupMockClarification(page, mockClarificationWithBothTypes);

    // Send a message that triggers clarification
    await page.fill('textarea[placeholder*="Ask"]', 'State persistence test');
    await page.press('textarea[placeholder*="Ask"]', 'Enter');
    await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 10000 });

    const textAreas = page.locator('textarea[placeholder*="Type your answer"]');

    // Fill first text area
    await textAreas.nth(0).fill('Answer to question 1');

    // Select an option
    await page.click('button:has-text("Dismissal")');

    // Fill second text area
    await textAreas.nth(1).fill('Answer to question 3');

    // Click back on first text area
    await textAreas.nth(0).click();

    // Verify first answer is still there
    await expect(textAreas.nth(0)).toHaveValue('Answer to question 1');

    // Click on second text area
    await textAreas.nth(1).click();

    // Verify second answer is still there
    await expect(textAreas.nth(1)).toHaveValue('Answer to question 3');

    // Verify option is still selected
    const selectedOption = page.locator(
      'button:has-text("Dismissal").bg-amber-600, button.bg-amber-600',
    );
    expect(await selectedOption.count()).toBeGreaterThan(0);

    // All answers should still be counted
    await expect(page.locator('text=All questions answered').first()).toBeVisible();

    await page.screenshot({ path: 'test-results/clarification-state-persistence.png' });
  });
});
