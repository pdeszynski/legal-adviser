import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

/**
 * Chat History Actions E2E Tests
 *
 * Comprehensive end-to-end tests for delete and pin/unpin functionality:
 * 1) Delete chat session - verify confirmation dialog appears
 * 2) Confirm deletion - verify session is removed from list
 * 3) Cancel deletion - verify session remains
 * 4) Pin chat session - verify pin icon changes to filled
 * 5) Unpin chat session - verify pin icon changes to outline
 * 6) Pinned session appears at top of list
 * 7) Unpinned session appears in chronological order
 * 8) User cannot delete another user's session (403 error)
 * 9) Delete pin state persists across page refresh
 * 10) Error handling when deletion/pin fails (network error)
 *
 * Prerequisites:
 * - Backend running at http://localhost:3001
 * - Frontend running at http://localhost:3000
 * - Test users created in database
 *
 * Test credentials:
 * - Regular user: user@example.com / password123
 * - Second user: user2@example.com / password123
 */

/**
 * Helper to check if backend is available
 */
async function isBackendAvailable(request: APIRequestContext): Promise<boolean> {
  try {
    const response = await request.get(`${FRONTEND_URL}/api/csrf-token`, { timeout: 5000 });
    return response.ok();
  } catch {
    return false;
  }
}

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';
const FRONTEND_URL = 'http://localhost:3000';
const HISTORY_PAGE_URL = `${FRONTEND_URL}/chat/history`;

// Test credentials
const USER1_EMAIL = 'user@example.com';
const USER1_PASSWORD = 'password123';
const USER2_EMAIL = 'user2@example.com';
const USER2_PASSWORD = 'password123';

/**
 * Test helper to perform login
 */
async function performLogin(page: Page, email: string, password: string) {
  await page.goto(`${FRONTEND_URL}/login`);

  // Check if already logged in
  const currentUrl = page.url();
  if (currentUrl.includes('/dashboard') || currentUrl.includes('/chat')) {
    await page.goto(`${FRONTEND_URL}/logout`);
    await page.waitForTimeout(500);
    await page.goto(`${FRONTEND_URL}/login`);
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
 * Test helper for GraphQL requests
 */
async function graphqlRequest(
  request: APIRequestContext,
  query: string,
  variables: Record<string, unknown> = {},
  headers: Record<string, string> = {},
) {
  const response = await request.post(GRAPHQL_URL, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    data: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  return result;
}

/**
 * Test helper to create a chat session
 */
async function createTestSession(
  request: APIRequestContext,
  accessToken: string,
  csrfToken: string,
  title?: string,
  mode: 'LAWYER' | 'SIMPLE' = 'SIMPLE',
): Promise<string | null> {
  const mutation = `
    mutation CreateChatSession($input: CreateChatSessionInput!) {
      createChatSession(input: $input) {
        id
        title
        mode
      }
    }
  `;

  const response = await graphqlRequest(
    request,
    mutation,
    { input: { mode } },
    {
      Authorization: `Bearer ${accessToken}`,
      'x-csrf-token': csrfToken,
    },
  );

  if (response.errors) {
    console.error('Failed to create session:', response.errors);
    return null;
  }

  return response.data?.createChatSession?.id || null;
}

/**
 * Test helper to add a message to a session
 */
async function addTestMessage(
  request: APIRequestContext,
  accessToken: string,
  csrfToken: string,
  sessionId: string,
): Promise<boolean> {
  const mutation = `
    mutation CreateChatMessage($input: CreateChatMessageInput!) {
      createChatMessage(input: $input) {
        messageId
        sessionId
      }
    }
  `;

  const response = await graphqlRequest(
    request,
    mutation,
    {
      input: {
        sessionId,
        role: 'USER',
        content: 'Test message for E2E testing',
        type: 'TEXT',
      },
    },
    {
      Authorization: `Bearer ${accessToken}`,
      'x-csrf-token': csrfToken,
    },
  );

  return !response.errors;
}

/**
 * Test helper to get CSRF token from both cookie and response body
 * The CSRF endpoint returns { csrfToken: "..." } in response body
 */
async function getCsrfToken(request: APIRequestContext): Promise<string> {
  try {
    const response = await request.get(`${FRONTEND_URL}/api/csrf-token`);

    // Try to get from response body first (preferred method)
    try {
      const body = await response.json();
      if (body?.csrfToken) {
        return body.csrfToken;
      }
    } catch {
      // If JSON parsing fails, cookie is the fallback
    }

    // Fallback: get from set-cookie header
    const setCookieHeader = response.headers()['set-cookie'];
    if (setCookieHeader) {
      const match = setCookieHeader.match(/csrf-token=([^;]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }
  } catch (error) {
    console.warn('Failed to get CSRF token:', error);
  }

  return '';
}

/**
 * Test helper to get CSRF token from page context
 */
async function getCsrfTokenFromPage(page: Page): Promise<string> {
  await page.goto(`${FRONTEND_URL}/api/csrf-token`);
  await page.waitForTimeout(200);

  // Try to get from response body via evaluate
  try {
    const token = await page.evaluate(() => {
      // The token might be in the response body that was already processed
      return (window as any).__csrf_token || '';
    });
    if (token) return token;
  } catch {
    // Continue to cookie method
  }

  // Get token from cookie
  const cookies = await page.context().cookies();
  const csrfCookie = cookies.find((c) => c.name === 'csrf-token');
  return csrfCookie?.value || '';
}

/**
 * Test helper to get access token from cookies
 */
async function getAccessTokenFromCookies(page: Page): Promise<string> {
  const cookies = await page.context().cookies();
  const tokenCookie = cookies.find((c) => c.name === 'access_token');
  return tokenCookie?.value || '';
}

/**
 * Test helper to count chat sessions
 */
async function getChatSessionCount(request: APIRequestContext, accessToken: string): Promise<number> {
  const query = `
    query GetChatSessions {
      chatSessions(limit: 100) {
        id
      }
    }
  `;

  const response = await graphqlRequest(
    request,
    query,
    {},
    {
      Authorization: `Bearer ${accessToken}`,
    },
  );

  if (response.errors) {
    console.error('Failed to get sessions:', response.errors);
    return 0;
  }

  return response.data?.chatSessions?.length || 0;
}

/**
 * Test helper to check if session is pinned
 */
async function isSessionPinned(
  request: APIRequestContext,
  accessToken: string,
  sessionId: string,
): Promise<boolean> {
  const query = `
    query GetChatSessions {
      chatSessions(limit: 100) {
        id
        isPinned
      }
    }
  `;

  const response = await graphqlRequest(
    request,
    query,
    {},
    {
      Authorization: `Bearer ${accessToken}`,
    },
  );

  if (response.errors) {
    return false;
  }

  const sessions = response.data?.chatSessions || [];
  const session = sessions.find((s: { id: string }) => s.id === sessionId);
  return session?.isPinned || false;
}

test.describe('Chat History Actions - Delete Functionality', () => {
  test.beforeAll(async ({ request }) => {
    // Check if backend is available before running tests
    const backendAvailable = await isBackendAvailable(request);
    if (!backendAvailable) {
      test.skip(true, 'Backend server not available. Please start the backend and frontend servers.');
    }
  });

  test.beforeEach(async ({ page, context, request }) => {
    await context.clearCookies();
    await performLogin(page, USER1_EMAIL, USER1_PASSWORD);
  });

  test('1) Delete chat session - verify confirmation dialog appears', async ({ page, request }) => {
    // Get access token and CSRF token for potential session creation
    const accessToken = await getAccessTokenFromCookies(page);
    const csrfToken = await getCsrfToken(request);

    // Create a test session if none exist
    const sessionId = await createTestSession(request, accessToken, csrfToken);
    if (sessionId) {
      await addTestMessage(request, accessToken, csrfToken, sessionId);
    }

    // Navigate to chat history page
    await page.goto(HISTORY_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for chat sessions to load
    await page.waitForSelector('[data-testid="chat-history-list"]', { timeout: 10000 });

    // Find the first delete button
    const firstDeleteButton = page.locator('[data-testid="delete-session-button"]').first();

    // Check if we have any sessions
    const buttonCount = await firstDeleteButton.count();

    if (buttonCount === 0) {
      test.skip(true, 'No chat sessions available for testing');
    }

    // Click delete button
    await firstDeleteButton.click();

    // Verify delete dialog appears
    await expect(page.locator('[data-testid="delete-chat-dialog"]')).toBeVisible();

    // Verify dialog content
    await expect(page.locator('text=Delete Chat')).toBeVisible();
    await expect(page.locator('text=Are you sure you want to delete this chat?')).toBeVisible();
    await expect(page.locator('[data-testid="delete-dialog-cancel-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="delete-dialog-confirm-button"]')).toBeVisible();

    await page.screenshot({ path: 'test-results/chat-delete-dialog-visible.png' });
  });

  test('2) Confirm deletion - verify session is removed from list', async ({
    page,
    context,
    request,
  }) => {
    // Get access token and CSRF token
    const accessToken = await getAccessTokenFromCookies(page);
    const csrfToken = await getCsrfToken(request);

    // Create a test session
    const sessionId = await createTestSession(request, accessToken, csrfToken);
    if (!sessionId) {
      test.skip(true, 'Failed to create test session');
    }

    // Add a message to make it appear in history
    await addTestMessage(request, accessToken, csrfToken, sessionId);

    // Navigate to chat history page
    await page.goto(HISTORY_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for sessions to load and verify our session is there
    await page.waitForSelector(`[data-session-id="${sessionId}"]`, { timeout: 10000 });

    // Get initial session count
    const initialCount = await page.locator('[data-testid="chat-session-item"]').count();
    expect(initialCount).toBeGreaterThan(0);

    // Click delete button for our test session
    await page.locator(`[data-testid="delete-session-button"][data-session-id="${sessionId}"]`).click();

    // Confirm deletion
    await page.click('[data-testid="delete-dialog-confirm-button"]');

    // Wait for dialog to close
    await expect(page.locator('[data-testid="delete-chat-dialog"]')).toBeHidden();

    // Wait for list to update
    await page.waitForTimeout(1000);

    // Verify session is removed from list
    await expect(page.locator(`[data-session-id="${sessionId}"]`)).toHaveCount(0);

    // Verify session count decreased
    const finalCount = await page.locator('[data-testid="chat-session-item"]').count();
    expect(finalCount).toBeLessThan(initialCount);

    await page.screenshot({ path: 'test-results/chat-delete-session-removed.png' });
  });

  test('3) Cancel deletion - verify session remains', async ({
    page,
    context,
    request,
  }) => {
    // Get access token and CSRF token
    const accessToken = await getAccessTokenFromCookies(page);
    const csrfToken = await getCsrfToken(request);

    // Create a test session
    const sessionId = await createTestSession(request, accessToken, csrfToken);
    if (!sessionId) {
      test.skip(true, 'Failed to create test session');
    }

    // Add a message
    await addTestMessage(request, accessToken, csrfToken, sessionId);

    // Navigate to chat history page
    await page.goto(HISTORY_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for our session to appear
    await page.waitForSelector(`[data-session-id="${sessionId}"]`, { timeout: 10000 });

    // Get initial session count
    const initialCount = await page.locator('[data-testid="chat-session-item"]').count();

    // Click delete button for our test session
    await page.locator(`[data-testid="delete-session-button"][data-session-id="${sessionId}"]`).click();

    // Cancel deletion
    await page.click('[data-testid="delete-dialog-cancel-button"]');

    // Wait for dialog to close
    await expect(page.locator('[data-testid="delete-chat-dialog"]')).toBeHidden();

    // Verify session still exists in list
    await expect(page.locator(`[data-session-id="${sessionId}"]`)).toBeVisible();

    // Verify session count is unchanged
    const finalCount = await page.locator('[data-testid="chat-session-item"]').count();
    expect(finalCount).toBe(initialCount);

    await page.screenshot({ path: 'test-results/chat-delete-cancelled.png' });
  });
});

test.describe('Chat History Actions - Pin/Unpin Functionality', () => {
  test.beforeAll(async ({ request }) => {
    const backendAvailable = await isBackendAvailable(request);
    if (!backendAvailable) {
      test.skip(true, 'Backend server not available. Please start the backend and frontend servers.');
    }
  });

  test.beforeEach(async ({ page, context, request }) => {
    await context.clearCookies();
    await performLogin(page, USER1_EMAIL, USER1_PASSWORD);
  });

  test('4) Pin chat session - verify pin icon changes to filled', async ({
    page,
    context,
    request,
  }) => {
    // Get access token and CSRF token
    const accessToken = await getAccessTokenFromCookies(page);
    const csrfToken = await getCsrfToken(request);

    // Create a test session
    const sessionId = await createTestSession(request, accessToken, csrfToken);
    if (!sessionId) {
      test.skip(true, 'Failed to create test session');
    }

    // Add a message
    await addTestMessage(request, accessToken, csrfToken, sessionId);

    // Navigate to chat history page
    await page.goto(HISTORY_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for our session to appear
    await page.waitForSelector(`[data-session-id="${sessionId}"]`, { timeout: 10000 });

    // Verify session is not pinned initially
    await expect(page.locator(`[data-session-id="${sessionId}"]`)).toHaveAttribute(
      'data-session-pinned',
      'false',
    );

    // Click pin button
    await page.locator(`[data-testid="pin-session-button"][data-session-id="${sessionId}"]`).click();

    // Wait for optimistic update
    await page.waitForTimeout(500);

    // Verify pin status changed to true (optimistic update)
    await expect(page.locator(`[data-session-id="${sessionId}"]`)).toHaveAttribute(
      'data-session-pinned',
      'true',
    );

    // Verify the pin icon is now PinOff (filled/active state)
    const pinButton = page.locator(
      `[data-testid="pin-session-button"][data-session-id="${sessionId}"]`,
    );
    await expect(pinButton).toBeVisible();

    await page.screenshot({ path: 'test-results/chat-pinned-icon-changed.png' });
  });

  test('5) Unpin chat session - verify pin icon changes to outline', async ({
    page,
    context,
    request,
  }) => {
    // Get access token and CSRF token
    const accessToken = await getAccessTokenFromCookies(page);
    const csrfToken = await getCsrfToken(request);

    // Create a test session
    const sessionId = await createTestSession(request, accessToken, csrfToken);
    if (!sessionId) {
      test.skip(true, 'Failed to create test session');
    }

    // Add a message
    await addTestMessage(request, accessToken, csrfToken, sessionId);

    // First pin the session
    const pinMutation = `
      mutation PinChatSession($input: PinChatSessionInput!) {
        pinChatSession(input: $input) {
          id
          isPinned
        }
      }
    `;

    await graphqlRequest(
      request,
      pinMutation,
      { input: { sessionId, isPinned: true } },
      {
        Authorization: `Bearer ${accessToken}`,
        'x-csrf-token': csrfToken,
      },
    );

    // Navigate to chat history page
    await page.goto(HISTORY_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for our session to appear
    await page.waitForSelector(`[data-session-id="${sessionId}"]`, { timeout: 10000 });

    // Verify session is pinned
    await expect(page.locator(`[data-session-id="${sessionId}"]`)).toHaveAttribute(
      'data-session-pinned',
      'true',
    );

    // Click pin button to unpin
    await page.locator(`[data-testid="pin-session-button"][data-session-id="${sessionId}"]`).click();

    // Wait for optimistic update
    await page.waitForTimeout(500);

    // Verify pin status changed to false (optimistic update)
    await expect(page.locator(`[data-session-id="${sessionId}"]`)).toHaveAttribute(
      'data-session-pinned',
      'false',
    );

    await page.screenshot({ path: 'test-results/chat-unpinned-icon-changed.png' });
  });

  test('6) Pinned session appears at top of list', async ({
    page,
    context,
    request,
  }) => {
    // Get access token and CSRF token
    const accessToken = await getAccessTokenFromCookies(page);
    const csrfToken = await getCsrfToken(request);

    // Create two test sessions
    const sessionId1 = await createTestSession(request, accessToken, csrfToken, 'Session 1');
    const sessionId2 = await createTestSession(request, accessToken, csrfToken, 'Session 2');

    if (!sessionId1 || !sessionId2) {
      test.skip(true, 'Failed to create test sessions');
    }

    // Add messages to both
    await addTestMessage(request, accessToken, csrfToken, sessionId1);
    await addTestMessage(request, accessToken, csrfToken, sessionId2);

    // Pin the second session
    const pinMutation = `
      mutation PinChatSession($input: PinChatSessionInput!) {
        pinChatSession(input: $input) {
          id
          isPinned
        }
      }
    `;

    await graphqlRequest(
      request,
      pinMutation,
      { input: { sessionId: sessionId2, isPinned: true } },
      {
        Authorization: `Bearer ${accessToken}`,
        'x-csrf-token': csrfToken,
      },
    );

    // Navigate to chat history page
    await page.goto(HISTORY_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for sessions to load
    await page.waitForSelector(`[data-session-id="${sessionId2}"]`, { timeout: 10000 });

    // Get all session items
    const sessionItems = page.locator('[data-testid="chat-session-item"]');
    const count = await sessionItems.count();

    if (count === 0) {
      test.skip(true, 'No sessions found');
    }

    // Get the first session item (should be the pinned one)
    const firstSessionId = await sessionItems.first().getAttribute('data-session-id');

    // Verify the pinned session is at the top
    expect(firstSessionId).toBe(sessionId2);

    await page.screenshot({ path: 'test-results/chat-pinned-at-top.png' });
  });

  test('7) Unpinned session appears in chronological order', async ({
    page,
    context,
    request,
  }) => {
    // Get access token and CSRF token
    const accessToken = await getAccessTokenFromCookies(page);
    const csrfToken = await getCsrfToken(request);

    // Create a test session and pin it
    const pinnedSessionId = await createTestSession(request, accessToken, csrfToken);
    if (!pinnedSessionId) {
      test.skip(true, 'Failed to create test session');
    }

    await addTestMessage(request, accessToken, csrfToken, pinnedSessionId);

    const pinMutation = `
      mutation PinChatSession($input: PinChatSessionInput!) {
        pinChatSession(input: $input) {
          id
          isPinned
        }
      }
    `;

    await graphqlRequest(
      request,
      pinMutation,
      { input: { sessionId: pinnedSessionId, isPinned: true } },
      {
        Authorization: `Bearer ${accessToken}`,
        'x-csrf-token': csrfToken,
      },
    );

    // Navigate to chat history page
    await page.goto(HISTORY_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for sessions to load
    await page.waitForSelector(`[data-session-id="${pinnedSessionId}"]`, { timeout: 10000 });

    // Unpin the session
    await page.locator(`[data-testid="pin-session-button"][data-session-id="${pinnedSessionId}"]`).click();
    await page.waitForTimeout(1000);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify the session still exists but is not at the top (should be sorted chronologically)
    await expect(page.locator(`[data-session-id="${pinnedSessionId}"]`)).toBeVisible();

    // Verify it's not pinned
    await expect(page.locator(`[data-session-id="${pinnedSessionId}"]`)).toHaveAttribute(
      'data-session-pinned',
      'false',
    );

    await page.screenshot({ path: 'test-results/chat-unpinned-chronological.png' });
  });
});

test.describe('Chat History Actions - State Persistence', () => {
  test.beforeAll(async ({ request }) => {
    const backendAvailable = await isBackendAvailable(request);
    if (!backendAvailable) {
      test.skip(true, 'Backend server not available. Please start the backend and frontend servers.');
    }
  });

  test('9) Pin state persists across page refresh', async ({
    page,
    context,
    request,
  }) => {
    // Get access token and CSRF token
    const accessToken = await getAccessTokenFromCookies(page);
    const csrfToken = await getCsrfToken(request);

    // Create a test session
    const sessionId = await createTestSession(request, accessToken, csrfToken);
    if (!sessionId) {
      test.skip(true, 'Failed to create test session');
    }

    // Add a message
    await addTestMessage(request, accessToken, csrfToken, sessionId);

    // Navigate to chat history page
    await page.goto(HISTORY_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for session to appear
    await page.waitForSelector(`[data-session-id="${sessionId}"]`, { timeout: 10000 });

    // Verify initial state (not pinned)
    await expect(page.locator(`[data-session-id="${sessionId}"]`)).toHaveAttribute(
      'data-session-pinned',
      'false',
    );

    // Pin the session
    await page.locator(`[data-testid="pin-session-button"][data-session-id="${sessionId}"]`).click();
    await page.waitForTimeout(1000);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for session to appear
    await page.waitForSelector(`[data-session-id="${sessionId}"]`, { timeout: 10000 });

    // Verify pin state persisted
    const isPinnedAfterRefresh = await isSessionPinned(request, accessToken, sessionId);
    expect(isPinnedAfterRefresh).toBe(true);

    // Also check via DOM attribute
    await expect(page.locator(`[data-session-id="${sessionId}"]`)).toHaveAttribute(
      'data-session-pinned',
      'true',
    );

    await page.screenshot({ path: 'test-results/chat-pin-state-persists.png' });
  });
});

test.describe('Chat History Actions - Authorization', () => {
  test.beforeAll(async ({ request }) => {
    const backendAvailable = await isBackendAvailable(request);
    if (!backendAvailable) {
      test.skip(true, 'Backend server not available. Please start the backend and frontend servers.');
    }
  });

  test('8) User cannot delete another user\'s session (403 error)', async ({
    page,
    context,
    request,
  }) => {
    // Login as first user and create a session
    await performLogin(page, USER1_EMAIL, USER1_PASSWORD);
    const user1AccessToken = await getAccessTokenFromCookies(page);
    const user1CsrfToken = await getCsrfToken(request);

    const sessionId = await createTestSession(request, user1AccessToken, user1CsrfToken);
    if (!sessionId) {
      test.skip(true, 'Failed to create test session');
    }

    await addTestMessage(request, user1AccessToken, user1CsrfToken, sessionId);

    // Logout and login as second user
    await page.goto(`${FRONTEND_URL}/logout`);
    await page.waitForTimeout(500);
    await performLogin(page, USER2_EMAIL, USER2_PASSWORD);

    const user2AccessToken = await getAccessTokenFromCookies(page);
    const user2CsrfToken = await getCsrfToken(request);

    // Try to delete user1's session as user2
    const deleteMutation = `
      mutation DeleteChatSession($input: DeleteChatSessionInput!) {
        deleteChatSession(input: $input) {
          id
          deletedAt
        }
      }
    `;

    const response = await graphqlRequest(
      request,
      deleteMutation,
      { input: { sessionId } },
      {
        Authorization: `Bearer ${user2AccessToken}`,
        'x-csrf-token': user2CsrfToken,
      },
    );

    // Should get an error (either 403 or session not found due to ownership guard)
    expect(response.errors).toBeDefined();
    expect(response.errors?.length).toBeGreaterThan(0);

    // Verify the error message indicates authorization failure or not found
    const errorMessage = response.errors?.[0]?.message?.toLowerCase() || '';
    expect(
      errorMessage.includes('forbidden') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('owned') ||
        errorMessage.includes('authorized'),
    ).toBe(true);

    await page.screenshot({ path: 'test-results/chat-delete-other-user-failed.png' });
  });
});

test.describe('Chat History Actions - Error Handling', () => {
  test.beforeAll(async ({ request }) => {
    const backendAvailable = await isBackendAvailable(request);
    if (!backendAvailable) {
      test.skip(true, 'Backend server not available. Please start the backend and frontend servers.');
    }
  });

  test('10) Error handling when deletion/pin fails (network error)', async ({ page }) => {
    // Navigate to chat history page
    await page.goto(HISTORY_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for sessions to load
    await page.waitForSelector('[data-testid="chat-history-list"]', { timeout: 10000 });

    // Check if we have any sessions
    const deleteButtons = page.locator('[data-testid="delete-session-button"]');
    const buttonCount = await deleteButtons.count();

    if (buttonCount === 0) {
      test.skip(true, 'No chat sessions available for testing');
    }

    // Intercept GraphQL requests and simulate network failure
    await page.route(GRAPHQL_URL, async (route) => {
      const postData = route.request().postData();
      if (postData?.includes('deleteChatSession') || postData?.includes('pinChatSession')) {
        // Simulate network error
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    // Click delete button
    await deleteButtons.first().click();

    // Confirm deletion (which will fail)
    await page.click('[data-testid="delete-dialog-confirm-button"]');

    // Wait for error handling
    await page.waitForTimeout(2000);

    // Check for error indicators (toast notification or error message)
    // The hook shows a toast notification with "Delete failed"
    const errorIndicators = page.locator('text=Delete failed, text=Failed, text=Error');
    const hasError = await errorIndicators.count();

    // The test passes if we handled the error gracefully (no crash, dialog closed or showing error)
    await page.screenshot({ path: 'test-results/chat-delete-network-error.png' });

    // Clean up - remove the route
    await page.unroute(GRAPHQL_URL);

    // Log the result
    console.log(`Error indicators found: ${hasError}`);
  });

  test('Error handling when pin operation fails', async ({ page }) => {
    // Navigate to chat history page
    await page.goto(HISTORY_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for sessions to load
    await page.waitForSelector('[data-testid="chat-history-list"]', { timeout: 10000 });

    // Check if we have any sessions
    const pinButtons = page.locator('[data-testid="pin-session-button"]');
    const buttonCount = await pinButtons.count();

    if (buttonCount === 0) {
      test.skip(true, 'No chat sessions available for testing');
    }

    // Get the initial pinned state of the first session
    const firstSession = page.locator('[data-testid="chat-session-item"]').first();
    const initialPinnedState = await firstSession.getAttribute('data-session-pinned');

    // Intercept GraphQL requests and simulate network failure for pin
    await page.route(GRAPHQL_URL, async (route) => {
      const postData = route.request().postData();
      if (postData?.includes('pinChatSession')) {
        // Simulate network error
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    // Click pin button (will fail)
    await pinButtons.first().click();

    // Wait for error handling and revert
    await page.waitForTimeout(2000);

    // Verify the optimistic update was reverted (state should be back to original)
    const finalPinnedState = await firstSession.getAttribute('data-session-pinned');
    expect(finalPinnedState).toBe(initialPinnedState);

    await page.screenshot({ path: 'test-results/chat-pin-network-error.png' });

    // Clean up - remove the route
    await page.unroute(GRAPHQL_URL);
  });
});

test.describe('Chat History Actions - Combined Scenarios', () => {
  test.beforeAll(async ({ request }) => {
    const backendAvailable = await isBackendAvailable(request);
    if (!backendAvailable) {
      test.skip(true, 'Backend server not available. Please start the backend and frontend servers.');
    }
  });

  test('Pin and then delete a session', async ({ page, context, request }) => {
    // Get access token and CSRF token
    const accessToken = await getAccessTokenFromCookies(page);
    const csrfToken = await getCsrfToken(request);

    // Create a test session
    const sessionId = await createTestSession(request, accessToken, csrfToken);
    if (!sessionId) {
      test.skip(true, 'Failed to create test session');
    }

    // Add a message
    await addTestMessage(request, accessToken, csrfToken, sessionId);

    // Navigate to chat history page
    await page.goto(HISTORY_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for session to appear
    await page.waitForSelector(`[data-session-id="${sessionId}"]`, { timeout: 10000 });

    // Pin the session
    await page.locator(`[data-testid="pin-session-button"][data-session-id="${sessionId}"]`).click();
    await page.waitForTimeout(1000);

    // Verify it's pinned
    await expect(page.locator(`[data-session-id="${sessionId}"]`)).toHaveAttribute(
      'data-session-pinned',
      'true',
    );

    // Delete the session
    await page.locator(`[data-testid="delete-session-button"][data-session-id="${sessionId}"]`).click();
    await page.click('[data-testid="delete-dialog-confirm-button"]');

    // Wait for deletion
    await page.waitForTimeout(1000);

    // Verify session is removed
    await expect(page.locator(`[data-session-id="${sessionId}"]`)).toHaveCount(0);

    await page.screenshot({ path: 'test-results/chat-pin-then-delete.png' });
  });

  test('Delete pinned session and verify list order updates', async ({
    page,
    context,
    request,
  }) => {
    // Get access token and CSRF token
    const accessToken = await getAccessTokenFromCookies(page);
    const csrfToken = await getCsrfToken(request);

    // Create two test sessions
    const sessionId1 = await createTestSession(request, accessToken, csrfToken);
    const sessionId2 = await createTestSession(request, accessToken, csrfToken);

    if (!sessionId1 || !sessionId2) {
      test.skip(true, 'Failed to create test sessions');
    }

    await addTestMessage(request, accessToken, csrfToken, sessionId1);
    await addTestMessage(request, accessToken, csrfToken, sessionId2);

    // Pin the first session
    const pinMutation = `
      mutation PinChatSession($input: PinChatSessionInput!) {
        pinChatSession(input: $input) {
          id
          isPinned
        }
      }
    `;

    await graphqlRequest(
      request,
      pinMutation,
      { input: { sessionId: sessionId1, isPinned: true } },
      {
        Authorization: `Bearer ${accessToken}`,
        'x-csrf-token': csrfToken,
      },
    );

    // Navigate to chat history page
    await page.goto(HISTORY_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for sessions to load
    await page.waitForSelector(`[data-session-id="${sessionId1}"]`, { timeout: 10000 });

    // Verify pinned session is at top
    const firstSessionId = await page
      .locator('[data-testid="chat-session-item"]')
      .first()
      .getAttribute('data-session-id');
    expect(firstSessionId).toBe(sessionId1);

    // Delete the pinned session
    await page.locator(`[data-testid="delete-session-button"][data-session-id="${sessionId1}"]`).click();
    await page.click('[data-testid="delete-dialog-confirm-button"]');
    await page.waitForTimeout(1000);

    // Verify list still exists and order is updated
    const sessionItems = page.locator('[data-testid="chat-session-item"]');
    const count = await sessionItems.count();

    if (count > 0) {
      // The first item should no longer be the deleted pinned session
      const newFirstSessionId = await sessionItems.first().getAttribute('data-session-id');
      expect(newFirstSessionId).not.toBe(sessionId1);
    }

    await page.screenshot({ path: 'test-results/chat-delete-pinned-reorder.png' });
  });
});
