import { test, expect } from '@playwright/test';

/**
 * E2E test for askLegalQuestion mutation
 * This test verifies the Q&A integration between backend and AI engine
 *
 * Key features tested:
 * - Session auto-creation when sessionId is not provided
 * - AI question answering with different modes
 * - Query retrieval and session-based filtering
 */

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/graphql';

// Helper function to extract cookie value
function getCookieValue(cookies: string | null, name: string): string | undefined {
  if (!cookies) return undefined;

  const cookieArray = cookies.split(';').map((c) => c.trim());
  for (const cookie of cookieArray) {
    const [key, value] = cookie.split('=');
    if (key === name) {
      return value;
    }
  }
  return undefined;
}

test.describe('Ask Legal Question E2E Tests', () => {
  let authCookies: string;
  let csrfToken: string;
  let sessionId: string | null;
  let queryId: string;

  test.beforeAll(async ({ request }) => {
    // First, get a CSRF token
    const csrfResponse = await request.get(
      `${GRAPHQL_ENDPOINT.replace('/graphql', '')}/api/csrf-token`,
    );

    if (csrfResponse.ok()) {
      const csrfCookies = csrfResponse.headers()['set-cookie'];
      if (csrfCookies) {
        authCookies = Array.isArray(csrfCookies) ? csrfCookies.join('; ') : csrfCookies;
      }
      // Get CSRF token from response body
      const body = await csrfResponse.json();
      if (body && body.token) {
        csrfToken = body.token;
      }
    }

    // Login to get auth cookie
    const loginResponse = await request.post(
      `${GRAPHQL_ENDPOINT.replace('/graphql', '')}/auth/login`,
      {
        data: {
          username: 'admin@refine.dev',
          password: 'password',
        },
      },
    );

    if (!loginResponse.ok()) {
      console.warn('Login failed - tests may fail if auth is required');
    } else {
      const loginCookies = loginResponse.headers()['set-cookie'];
      if (loginCookies) {
        const loginCookieStr = Array.isArray(loginCookies) ? loginCookies.join('; ') : loginCookies;
        authCookies = authCookies ? `${authCookies}; ${loginCookieStr}` : loginCookieStr;
      }
    }
  });

  // Helper to get headers with CSRF token
  function getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }

    if (authCookies) {
      headers['Cookie'] = authCookies;
    }

    return headers;
  }

  test('should ask a legal question without sessionId and auto-create session', async ({
    request,
  }) => {
    const query = `
      mutation AskLegalQuestion($input: AskLegalQuestionInput!) {
        askLegalQuestion(input: $input) {
          id
          sessionId
          question
          answerMarkdown
          citations {
            source
            article
            url
          }
          createdAt
        }
      }
    `;

    // Test without providing sessionId - should auto-create
    const variables = {
      input: {
        question: 'What are the basic rights of a tenant in Poland?',
        mode: 'SIMPLE',
      },
    };

    const response = await request.post(GRAPHQL_ENDPOINT, {
      data: {
        query,
        variables,
      },
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    if (body.errors) {
      console.error('GraphQL errors:', JSON.stringify(body.errors, null, 2));
    }

    // The mutation should execute successfully
    // Note: If AI engine is not running, this may return an error
    if (body.errors) {
      console.warn('AI engine may not be running. Expected error if AI service is unavailable.');
      // This is acceptable for verification - the mutation exists and is reachable
      expect(body.errors[0].message).toContain('AI Engine');
      test.skip(true, 'AI Engine not available - this is expected in some environments');
    } else {
      expect(body.data.askLegalQuestion).toBeDefined();
      expect(body.data.askLegalQuestion.question).toBe(
        'What are the basic rights of a tenant in Poland?',
      );
      expect(body.data.askLegalQuestion.answerMarkdown).toBeTruthy();
      expect(body.data.askLegalQuestion.id).toBeDefined();
      expect(body.data.askLegalQuestion.createdAt).toBeDefined();

      // sessionId should be auto-created and not null
      expect(body.data.askLegalQuestion.sessionId).toBeTruthy();
      sessionId = body.data.askLegalQuestion.sessionId;

      // Citations may or may not be present depending on AI response
      if (body.data.askLegalQuestion.citations) {
        expect(Array.isArray(body.data.askLegalQuestion.citations)).toBe(true);
      }

      queryId = body.data.askLegalQuestion.id;
    }
  });

  test('should ask a legal question with explicit sessionId (LAWYER mode)', async ({ request }) => {
    test.skip(!sessionId, 'Session ID not available from previous test');

    const query = `
      mutation AskLegalQuestion($input: AskLegalQuestionInput!) {
        askLegalQuestion(input: $input) {
          id
          sessionId
          question
          answerMarkdown
          citations {
            source
            article
          }
        }
      }
    `;

    const variables = {
      input: {
        sessionId: sessionId,
        question: 'What is the statute of limitations for contract claims?',
        mode: 'LAWYER',
      },
    };

    const response = await request.post(GRAPHQL_ENDPOINT, {
      data: {
        query,
        variables,
      },
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    if (body.errors) {
      console.error('GraphQL errors:', JSON.stringify(body.errors, null, 2));
    }

    if (body.errors) {
      console.warn('AI engine may not be running');
      expect(body.errors[0].message).toContain('AI Engine');
      test.skip(true, 'AI Engine not available');
    } else {
      expect(body.data.askLegalQuestion).toBeDefined();
      expect(body.data.askLegalQuestion.answerMarkdown).toBeTruthy();

      // Lawyer mode should provide more detailed legal analysis
      // This is a qualitative check - the answer should be substantive
      expect(body.data.askLegalQuestion.answerMarkdown.length).toBeGreaterThan(100);
    }
  });

  test('should reject invalid mode parameter', async ({ request }) => {
    const query = `
      mutation AskLegalQuestion($input: AskLegalQuestionInput!) {
        askLegalQuestion(input: $input) {
          id
          question
        }
      }
    `;

    const variables = {
      input: {
        question: 'Test question',
        mode: 'INVALID_MODE',
      },
    };

    const response = await request.post(GRAPHQL_ENDPOINT, {
      data: {
        query,
        variables,
      },
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    // Should get validation error for invalid mode
    expect(body.errors).toBeDefined();
    expect(body.errors[0].message).toContain('mode');
  });

  test('should validate required fields', async ({ request }) => {
    const query = `
      mutation AskLegalQuestion($input: AskLegalQuestionInput!) {
        askLegalQuestion(input: $input) {
          id
        }
      }
    `;

    // Missing required fields
    const variables = {
      input: {},
    };

    const response = await request.post(GRAPHQL_ENDPOINT, {
      data: {
        query,
        variables,
      },
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    // Should get validation error
    expect(body.errors).toBeDefined();
  });

  test('should retrieve the saved query', async ({ request }) => {
    test.skip(!queryId, 'Query ID not available from previous test');

    const query = `
      query GetLegalQuery($id: ID!) {
        legalQuery(id: $id) {
          id
          sessionId
          question
          answerMarkdown
          citations {
            source
            article
            url
          }
          createdAt
          updatedAt
        }
      }
    `;

    const response = await request.post(GRAPHQL_ENDPOINT, {
      data: {
        query,
        variables: { id: queryId },
      },
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    if (body.errors) {
      console.error('GraphQL errors:', JSON.stringify(body.errors, null, 2));
    }

    expect(body.errors).toBeUndefined();
    expect(body.data.legalQuery).toBeDefined();
    expect(body.data.legalQuery.id).toBe(queryId);
    expect(body.data.legalQuery.answerMarkdown).toBeTruthy();
  });

  test('should list queries by session', async ({ request }) => {
    test.skip(!sessionId, 'Session ID not available from previous test');

    const query = `
      query QueriesBySession($sessionId: String!) {
        queriesBySession(sessionId: $sessionId) {
          id
          question
          answerMarkdown
          createdAt
        }
      }
    `;

    const response = await request.post(GRAPHQL_ENDPOINT, {
      data: {
        query,
        variables: { sessionId },
      },
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    if (body.errors) {
      console.error('GraphQL errors:', JSON.stringify(body.errors, null, 2));
    }

    expect(body.errors).toBeUndefined();
    expect(body.data.queriesBySession).toBeDefined();
    expect(Array.isArray(body.data.queriesBySession)).toBe(true);

    // If we created queries successfully, they should be in the list
    if (queryId) {
      const foundQuery = body.data.queriesBySession.find((q: any) => q.id === queryId);
      expect(foundQuery).toBeDefined();
    }
  });

  test('should handle null sessionId gracefully', async ({ request }) => {
    const query = `
      mutation AskLegalQuestion($input: AskLegalQuestionInput!) {
        askLegalQuestion(input: $input) {
          id
          sessionId
          question
          answerMarkdown
        }
      }
    `;

    // Explicitly pass null sessionId
    const variables = {
      input: {
        sessionId: null,
        question: 'Test question for null sessionId',
      },
    };

    const response = await request.post(GRAPHQL_ENDPOINT, {
      data: {
        query,
        variables,
      },
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    if (body.errors) {
      console.error('GraphQL errors:', JSON.stringify(body.errors, null, 2));

      // If AI engine is not running, that's acceptable
      if (body.errors.some((e: any) => e.message?.includes('AI Engine'))) {
        test.skip(true, 'AI Engine not available');
        return;
      }
    }

    // Should either succeed with auto-created session or fail with non-AI error
    if (!body.errors) {
      expect(body.data.askLegalQuestion).toBeDefined();
      // Session should be auto-created for authenticated user
      expect(body.data.askLegalQuestion.sessionId).toBeTruthy();
    }
  });
});
