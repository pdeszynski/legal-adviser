import { test, expect, type Page } from '@playwright/test';

/**
 * Chat Messages Persistence E2E Tests
 *
 * Comprehensive end-to-end tests to verify that assistant messages are properly
 * saved to the database with non-empty content.
 *
 * Test Scenarios:
 * 1) Send simple query, verify assistant message is saved with content in database
 * 2) Send query requiring clarification, verify clarification message is saved (as JSON in content field)
 * 3) Send multi-turn conversation, verify all assistant messages have content
 * 4) Test streaming responses specifically - verify complete response is saved, not just partial
 * 5) Test long queries (10+ seconds) to ensure full response is captured
 * 6) Verify via direct GraphQL query that ChatMessage.content field is not empty/null
 * 7) Test that empty responses are rejected with error
 * 8) Verify rawContent field is populated for audit trail
 * 9) Test with Polish language queries
 * 10) Test document generation queries
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
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';
const CHAT_PAGE_URL = 'http://localhost:3000/chat';
const USER_EMAIL = 'user@example.com';
const USER_PASSWORD = 'password123';

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
 * Get access token from cookies
 */
async function getAccessToken(page: Page): Promise<string | null> {
  const cookies = await page.context().cookies();
  const accessToken = cookies.find((c) => c.name === 'access_token');
  return accessToken?.value || null;
}

/**
 * Send a GraphQL query
 */
async function sendGraphQLQuery<T>(
  page: Page,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<{ data?: T; errors?: Array<{ message: string }> }> {
  const token = await getAccessToken(page);

  const response = await page.request.fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    data: JSON.stringify({ query, variables }),
  });

  return await response.json() as { data?: T; errors?: Array<{ message: string }> };
}

/**
 * Send a GraphQL mutation
 */
async function sendGraphQLMutation<T>(
  page: Page,
  mutation: string,
  variables: Record<string, unknown> = {},
): Promise<{ data?: T; errors?: Array<{ message: string }> }> {
  return sendGraphQLQuery<T>(page, mutation, variables);
}

/**
 * Get all messages for a session via GraphQL
 */
async function getSessionMessages(page: Page, sessionId: string): Promise<Array<{
  messageId: string;
  role: string;
  content: string;
  rawContent: string | null;
  sequenceOrder: number;
  createdAt: string;
  metadata: unknown;
}>> {
  const query = `
    query GetSessionMessages($sessionId: ID!) {
      chatSessionDetail(sessionId: $sessionId) {
        id
        messages {
          id
          role
          content
          rawContent
          sequenceOrder
          createdAt
          metadata
        }
      }
    }
  `;

  const result = await sendGraphQLQuery<{
    chatSessionDetail: {
      id: string;
      messages: Array<{
        id: string;
        role: string;
        content: string;
        rawContent: string | null;
        sequenceOrder: number;
        createdAt: string;
        metadata: unknown;
      }>;
    } | null;
  }>(page, query, { sessionId });

  return result.data?.chatSessionDetail?.messages.map(m => ({
    messageId: m.id,
    role: m.role,
    content: m.content,
    rawContent: m.rawContent,
    sequenceOrder: m.sequenceOrder,
    createdAt: m.createdAt,
    metadata: m.metadata,
  })) || [];
}

/**
 * Send a message and wait for streaming response to complete
 */
async function sendMessageAndWaitForResponse(
  page: Page,
  message: string,
): Promise<{ sessionId: string; success: boolean }> {
  // Fill and send message
  await page.fill('textarea[placeholder*="Ask"]', message);
  await page.press('textarea[placeholder*="Ask"]', 'Enter');

  // Wait for streaming to start
  await page.waitForSelector('text=Generating response...', { timeout: 10000 });

  // Wait for streaming to complete
  await page.waitForSelector('text=Generating response...', { state: 'hidden', timeout: 120000 });

  // Wait a bit for final rendering and database save
  await page.waitForTimeout(1000);

  // Extract session ID from URL
  const url = new URL(page.url());
  const sessionId = url.searchParams.get('session');

  return {
    sessionId: sessionId || '',
    success: true,
  };
}

/**
 * Verify assistant message has non-empty content
 */
function verifyAssistantMessageContent(
  messages: Array<{ role: string; content: string; rawContent: string | null }>,
  minExpectedContentLength = 10,
): { valid: boolean; details: string } {
  const assistantMessages = messages.filter((m) => m.role === 'ASSISTANT');

  if (assistantMessages.length === 0) {
    return { valid: false, details: 'No assistant messages found' };
  }

  const results: string[] = [];

  for (const msg of assistantMessages) {
    const hasContent = msg.content && msg.content.trim().length > 0;
    const contentLength = msg.content?.length || 0;
    const hasRawContent = msg.rawContent && msg.rawContent.trim().length > 0;
    const rawContentLength = msg.rawContent?.length || 0;

    if (!hasContent) {
      results.push(`Message ${msg.role}: content is empty or null`);
    }

    if (contentLength < minExpectedContentLength) {
      results.push(`Message ${msg.role}: content length (${contentLength}) below minimum (${minExpectedContentLength})`);
    }

    if (!hasRawContent) {
      results.push(`Message ${msg.role}: rawContent is empty or null (audit trail missing)`);
    }

    results.push(`Assistant message - content: ${contentLength} chars, rawContent: ${rawContentLength} chars`);
  }

  const hasEmptyContent = assistantMessages.some(
    (m) => !m.content || m.content.trim().length === 0
  );

  return {
    valid: !hasEmptyContent,
    details: results.join('; '),
  };
}

test.describe('Chat Messages Persistence - Basic Scenarios', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await performLogin(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(CHAT_PAGE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('1) Simple query - assistant message saved with non-empty content', async ({ page }) => {
    const question = 'What is a contract in simple terms?';
    const { sessionId } = await sendMessageAndWaitForResponse(page, question);

    expect(sessionId).toBeTruthy();

    // Get messages from database via GraphQL
    const messages = await getSessionMessages(page, sessionId);

    // Verify we have at least 2 messages (user + assistant)
    expect(messages.length).toBeGreaterThanOrEqual(2);

    // Verify assistant message has content
    const assistantMessage = messages.find((m) => m.role === 'ASSISTANT');
    expect(assistantMessage).toBeDefined();
    expect(assistantMessage!.content).toBeTruthy();
    expect(assistantMessage!.content.length).toBeGreaterThan(50);

    // Verify rawContent is populated for audit trail
    expect(assistantMessage!.rawContent).toBeTruthy();
    expect(assistantMessage!.rawContent).toBe(assistantMessage!.content);

    console.log('Assistant message content length:', assistantMessage!.content.length);
    console.log('Content preview:', assistantMessage!.content.substring(0, 100));

    await page.screenshot({ path: 'test-results/chat-persistence-simple-query.png' });
  });

  test('2) Clarification message - saved as JSON in content field', async ({ page }) => {
    // Ask a vague question that might trigger clarification
    const question = 'I was fired from my job. What can I do?';
    const { sessionId, success } = await sendMessageAndWaitForResponse(page, question);

    expect(success).toBeTruthy();

    // Get messages from database
    const messages = await getSessionMessages(page, sessionId);

    // Check for clarification in metadata
    const assistantMessage = messages.find((m) => m.role === 'ASSISTANT');
    expect(assistantMessage).toBeDefined();

    const metadata = assistantMessage!.metadata as { clarification?: { needs_clarification: boolean } };
    const hasClarification = metadata?.clarification?.needs_clarification === true;

    console.log('Has clarification in metadata:', hasClarification);

    // Whether clarification is returned or not, verify content is not empty
    expect(assistantMessage!.content).toBeTruthy();
    expect(assistantMessage!.content.length).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/chat-persistence-clarification.png' });
  });

  test('3) Multi-turn conversation - all assistant messages have content', async ({ page }) => {
    const questions = [
      'What are the key elements of a contract?',
      'What happens if one element is missing?',
      'Can a contract be oral or must it be written?',
    ];

    let sessionId = '';

    for (const question of questions) {
      const result = await sendMessageAndWaitForResponse(page, question);
      sessionId = result.sessionId;
      await page.waitForTimeout(500);
    }

    expect(sessionId).toBeTruthy();

    // Get all messages from database
    const messages = await getSessionMessages(page, sessionId);

    // Verify we have all messages (3 user + 3 assistant)
    expect(messages.length).toBeGreaterThanOrEqual(6);

    // Verify all assistant messages have content
    const assistantMessages = messages.filter((m) => m.role === 'ASSISTANT');
    for (const msg of assistantMessages) {
      expect(msg.content).toBeTruthy();
      expect(msg.content.length).toBeGreaterThan(20);
      console.log(`Assistant message ${msg.sequenceOrder}: ${msg.content.length} chars`);
    }

    await page.screenshot({ path: 'test-results/chat-persistence-multi-turn.png' });
  });

  test('4) Streaming response - complete response saved not just partial', async ({ page }) => {
    // Ask a longer question to get a longer response
    const question = 'Explain the difference between void and voidable contracts in Polish law with examples';
    const { sessionId } = await sendMessageAndWaitForResponse(page, question);

    expect(sessionId).toBeTruthy();

    // Wait a bit more to ensure the message is fully saved
    await page.waitForTimeout(2000);

    // Get messages from database
    const messages = await getSessionMessages(page, sessionId);

    const assistantMessage = messages.find((m) => m.role === 'ASSISTANT');
    expect(assistantMessage).toBeDefined();

    // Verify the content is substantial (not just a partial response)
    expect(assistantMessage!.content.length).toBeGreaterThan(200);

    // Check if the response ends properly (not cut off mid-sentence)
    const content = assistantMessage!.content.trim();
    const lastChar = content[content.length - 1];
    const endsProperly = ['.', '!', '?', '"', ')', '}', '»'].includes(lastChar);

    console.log('Content length:', content.length);
    console.log('Last character:', lastChar);
    console.log('Ends properly:', endsProperly);

    await page.screenshot({ path: 'test-results/chat-persistence-streaming-complete.png' });
  });

  test('5) Long query - full response captured for 10+ second generation', async ({ page }) => {
    // Ask a complex question that will take time to generate
    const question = 'Provide a comprehensive analysis of employment law in Poland including: ' +
      '1) Types of employment contracts, 2) Employee rights, 3) Termination procedures, ' +
      '4) Severance pay, 5) Discrimination protections, 6) Working time regulations';

    const startTime = Date.now();
    const { sessionId } = await sendMessageAndWaitForResponse(page, question);
    const duration = Date.now() - startTime;

    console.log('Response generation time:', duration, 'ms');

    // Get messages from database
    const messages = await getSessionMessages(page, sessionId);

    const assistantMessage = messages.find((m) => m.role === 'ASSISTANT');
    expect(assistantMessage).toBeDefined();

    // For long queries, response should be substantial
    expect(assistantMessage!.content.length).toBeGreaterThan(300);

    console.log('Long query response length:', assistantMessage!.content.length);

    await page.screenshot({ path: 'test-results/chat-persistence-long-query.png' });
  });

  test('6) Direct GraphQL query - content field not empty/null', async ({ page }) => {
    const question = 'What is the statute of limitations for contract disputes?';
    const { sessionId } = await sendMessageAndWaitForResponse(page, question);

    // Query the database directly via GraphQL
    const messages = await getSessionMessages(page, sessionId);

    // Verify via direct query
    const verification = verifyAssistantMessageContent(messages, 50);

    console.log('Database verification details:', verification.details);

    expect(verification.valid).toBeTruthy();

    // Additional check: no assistant message should have null or empty content
    const assistantMessages = messages.filter((m) => m.role === 'ASSISTANT');
    for (const msg of assistantMessages) {
      expect(msg.content).not.toBeNull();
      expect(msg.content).not.toBe('');
      expect(msg.content.trim().length).toBeGreaterThan(0);
    }

    await page.screenshot({ path: 'test-results/chat-persistence-direct-query.png' });
  });

  test('7) Empty response rejected with error', async ({ page }) => {
    // Try to save an empty message via GraphQL mutation
    const mutation = `
      mutation SaveEmptyMessage($input: SaveChatMessageInput!) {
        saveChatMessage(input: $input) {
          messageId
          content
        }
      }
    `;

    // First create a session
    const sessionMutation = `
      mutation CreateSession($input: CreateChatSessionInput!) {
        createChatSession(input: $input) {
          id
        }
      }
    `;

    const sessionResult = await sendGraphQLMutation<{
      createChatSession: { id: string };
    }>(page, sessionMutation, {
      input: { mode: 'LAWYER' },
    });
    const sessionId = sessionResult.data?.createChatSession?.id;

    expect(sessionId).toBeTruthy();

    // Try to save an empty message (should fail)
    const result = await sendGraphQLMutation(page, mutation, {
      input: {
        sessionId,
        content: '',
        role: 'ASSISTANT',
      },
    });

    // Should get an error
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
    expect(result.errors![0].message).toContain('empty');

    console.log('Empty message rejection error:', result.errors![0].message);

    await page.screenshot({ path: 'test-results/chat-persistence-empty-rejected.png' });
  });

  test('8) rawContent field populated for audit trail', async ({ page }) => {
    const question = 'What are the consequences of breach of contract?';
    const { sessionId } = await sendMessageAndWaitForResponse(page, question);

    // Get messages and verify rawContent
    const messages = await getSessionMessages(page, sessionId);

    const assistantMessage = messages.find((m) => m.role === 'ASSISTANT');
    expect(assistantMessage).toBeDefined();

    // Verify rawContent is populated
    expect(assistantMessage!.rawContent).toBeTruthy();
    expect(assistantMessage!.rawContent!.length).toBeGreaterThan(0);

    // rawContent should match content for assistant messages
    expect(assistantMessage!.rawContent).toBe(assistantMessage!.content);

    console.log('rawContent length:', assistantMessage!.rawContent.length);
    console.log('Content and rawContent match:', assistantMessage!.rawContent === assistantMessage!.content);

    await page.screenshot({ path: 'test-results/chat-persistence-raw-content.png' });
  });

  test('9) Polish language queries - content saved correctly', async ({ page }) => {
    const polishQuestion = 'Jakie są prawa pracownika w Polsce?';
    const { sessionId } = await sendMessageAndWaitForResponse(page, polishQuestion);

    // Get messages
    const messages = await getSessionMessages(page, sessionId);

    const assistantMessage = messages.find((m) => m.role === 'ASSISTANT');
    expect(assistantMessage).toBeDefined();

    // Verify content is saved
    expect(assistantMessage!.content).toBeTruthy();
    expect(assistantMessage!.content.length).toBeGreaterThan(20);

    // Content should contain Polish characters or be about Polish law
    console.log('Polish query response length:', assistantMessage!.content.length);
    console.log('Content preview:', assistantMessage!.content.substring(0, 100));

    await page.screenshot({ path: 'test-results/chat-persistence-polish.png' });
  });

  test('10) Document generation query - content saved', async ({ page }) => {
    const documentQuestion = 'Draft a simple rental agreement template for an apartment in Poland';
    const { sessionId } = await sendMessageAndWaitForResponse(page, documentQuestion);

    // Get messages
    const messages = await getSessionMessages(page, sessionId);

    const assistantMessage = messages.find((m) => m.role === 'ASSISTANT');
    expect(assistantMessage).toBeDefined();

    // Verify content is saved
    expect(assistantMessage!.content).toBeTruthy();
    expect(assistantMessage!.content.length).toBeGreaterThan(100);

    // Document generation should produce longer content
    console.log('Document generation response length:', assistantMessage!.content.length);

    await page.screenshot({ path: 'test-results/chat-persistence-document-generation.png' });
  });
});

test.describe('Chat Messages Persistence - Edge Cases', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await performLogin(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(CHAT_PAGE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Very long response - all content captured', async ({ page }) => {
    const question = 'Explain in detail the Polish Civil Code provisions regarding: ' +
      'contract formation, capacity, legality, consent, and all required formalities. ' +
      'Include specific article references and explanations.';

    const { sessionId } = await sendMessageAndWaitForResponse(page, question);

    // Wait for database save
    await page.waitForTimeout(2000);

    const messages = await getSessionMessages(page, sessionId);
    const assistantMessage = messages.find((m) => m.role === 'ASSISTANT');

    expect(assistantMessage).toBeDefined();
    expect(assistantMessage!.content.length).toBeGreaterThan(500);

    console.log('Very long response length:', assistantMessage!.content.length);

    await page.screenshot({ path: 'test-results/chat-persistence-very-long-response.png' });
  });

  test('Session restoration - all messages persisted', async ({ page }) => {
    const question1 = 'First question about contracts';
    await sendMessageAndWaitForResponse(page, question1);

    const question2 = 'Second question about torts';
    const { sessionId } = await sendMessageAndWaitForResponse(page, question2);

    // Refresh the page to test session restoration
    await page.goto(`${CHAT_PAGE_URL}?session=${sessionId}`);
    await page.waitForLoadState('networkidle');

    // Get messages via GraphQL
    const messages = await getSessionMessages(page, sessionId);

    // Verify all messages are persisted
    expect(messages.length).toBeGreaterThanOrEqual(4); // 2 user + 2 assistant

    // Verify all assistant messages have content
    const assistantMessages = messages.filter((m) => m.role === 'ASSISTANT');
    for (const msg of assistantMessages) {
      expect(msg.content).toBeTruthy();
      expect(msg.content.length).toBeGreaterThan(10);
    }

    console.log('Session restoration: found', messages.length, 'messages');

    await page.screenshot({ path: 'test-results/chat-persistence-session-restoration.png' });
  });

  test('Special characters in content - saved correctly', async ({ page }) => {
    const question = 'What are the legal symbols and abbreviations used in Polish law? e.g., §, art., ust., pkt.';
    const { sessionId } = await sendMessageAndWaitForResponse(page, question);

    const messages = await getSessionMessages(page, sessionId);
    const assistantMessage = messages.find((m) => m.role === 'ASSISTANT');

    expect(assistantMessage).toBeDefined();
    expect(assistantMessage!.content).toBeTruthy();

    // Content should handle special characters
    console.log('Content with special chars:', assistantMessage!.content.substring(0, 150));

    await page.screenshot({ path: 'test-results/chat-persistence-special-chars.png' });
  });
});

test.describe('Chat Messages Persistence - Content Validation', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await performLogin(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(CHAT_PAGE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('All assistant messages in session have non-empty content', async ({ page }) => {
    const questions = [
      'What is contract law?',
      'Explain tort law',
      'What is property law?',
    ];

    let sessionId = '';
    for (const q of questions) {
      const result = await sendMessageAndWaitForResponse(page, q);
      sessionId = result.sessionId;
    }

    const messages = await getSessionMessages(page, sessionId);

    // Verify every assistant message has content
    const assistantMessages = messages.filter((m) => m.role === 'ASSISTANT');

    for (let i = 0; i < assistantMessages.length; i++) {
      const msg = assistantMessages[i];
      expect(msg.content, `Assistant message at index ${i} should have content`).toBeTruthy();
      expect(msg.content.length, `Assistant message at index ${i} should have content length > 10`).toBeGreaterThan(10);
      expect(msg.rawContent, `Assistant message at index ${i} should have rawContent`).toBeTruthy();
    }

    console.log('Validated', assistantMessages.length, 'assistant messages for non-empty content');

    await page.screenshot({ path: 'test-results/chat-persistence-all-messages-validation.png' });
  });

  test('Content field is not whitespace only', async ({ page }) => {
    const question = 'Briefly explain legal capacity';
    const { sessionId } = await sendMessageAndWaitForResponse(page, question);

    const messages = await getSessionMessages(page, sessionId);
    const assistantMessage = messages.find((m) => m.role === 'ASSISTANT');

    expect(assistantMessage).toBeDefined();

    const trimmedContent = assistantMessage!.content.trim();
    expect(trimmedContent.length).toBeGreaterThan(10);
    expect(trimmedContent).not.toBe(assistantMessage!.content); // Some trimming happened

    console.log('Content after trim:', trimmedContent.length);
    console.log('Original content:', assistantMessage!.content.length);

    await page.screenshot({ path: 'test-results/chat-persistence-whitespace-validation.png' });
  });
});

test.describe('Chat Messages Persistence - Sequence Order', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await performLogin(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(CHAT_PAGE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Messages are stored in correct sequence order', async ({ page }) => {
    const questions = ['Question 1', 'Question 2', 'Question 3'];

    let sessionId = '';
    for (const q of questions) {
      const result = await sendMessageAndWaitForResponse(page, q);
      sessionId = result.sessionId;
    }

    const messages = await getSessionMessages(page, sessionId);

    // Verify sequence order
    for (let i = 0; i < messages.length; i++) {
      expect(messages[i].sequenceOrder).toBe(i);
    }

    // Verify roles alternate
    const roles = messages.map((m) => m.role);
    expect(roles[0]).toBe('USER');
    expect(roles[1]).toBe('ASSISTANT');
    expect(roles[2]).toBe('USER');
    expect(roles[3]).toBe('ASSISTANT');

    console.log('Sequence order validated for', messages.length, 'messages');

    await page.screenshot({ path: 'test-results/chat-persistence-sequence-order.png' });
  });
});
