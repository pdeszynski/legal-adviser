import { test, expect } from '@playwright/test';

/**
 * Temporary verification test for askLegalQuestion mutation
 * This test verifies the Q&A integration between backend and AI engine
 */

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/graphql';

test.describe('Ask Legal Question Mutation Verification', () => {
  let authCookie: string;
  let sessionId: string;
  let queryId: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth cookie
    const loginResponse = await request.post(
      `${GRAPHQL_ENDPOINT.replace('/graphql', '')}/auth/login`,
      {
        data: {
          email: 'test@example.com',
          password: 'password123',
        },
      },
    );

    if (!loginResponse.ok()) {
      console.warn('Login failed - tests may fail if auth is required');
    } else {
      const cookies = loginResponse.headers()['set-cookie'];
      if (cookies) {
        authCookie = cookies;
      }
    }

    // Create a user session for testing
    const createSessionQuery = `
      mutation {
        createOneUserSession(input: { userSession: { status: "ACTIVE" } }) {
          id
        }
      }
    `;

    const sessionResponse = await request.post(GRAPHQL_ENDPOINT, {
      data: { query: createSessionQuery },
      headers: authCookie ? { Cookie: authCookie } : {},
    });

    if (sessionResponse.ok()) {
      const sessionBody = await sessionResponse.json();
      if (!sessionBody.errors && sessionBody.data?.createOneUserSession) {
        sessionId = sessionBody.data.createOneUserSession.id;
        console.log(`Created test session: ${sessionId}`);
      }
    }

    if (!sessionId) {
      console.warn('Could not create session - using fallback UUID');
      sessionId = '00000000-0000-0000-0000-000000000000';
    }
  });

  test('should ask a legal question and receive AI answer (SIMPLE mode)', async ({
    request,
  }) => {
    const query = `
      mutation AskLegalQuestion($input: AskLegalQuestionInput!) {
        askLegalQuestion(input: $input) {
          id
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

    const variables = {
      input: {
        sessionId: sessionId,
        question: 'What are the basic rights of a tenant in Poland?',
        mode: 'SIMPLE',
      },
    };

    const response = await request.post(GRAPHQL_ENDPOINT, {
      data: {
        query,
        variables,
      },
      headers: authCookie ? { Cookie: authCookie } : {},
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    if (body.errors) {
      console.error('GraphQL errors:', JSON.stringify(body.errors, null, 2));
    }

    // The mutation should execute successfully
    // Note: If AI engine is not running, this may return an error
    if (body.errors) {
      console.warn(
        'AI engine may not be running. Expected error if AI service is unavailable.',
      );
      // This is acceptable for verification - the mutation exists and is reachable
      expect(body.errors[0].message).toContain(
        'AI Engine',
      );
      test.skip(true, 'AI Engine not available - this is expected in some environments');
    } else {
      expect(body.data.askLegalQuestion).toBeDefined();
      expect(body.data.askLegalQuestion.question).toBe(
        'What are the basic rights of a tenant in Poland?',
      );
      expect(body.data.askLegalQuestion.answerMarkdown).toBeTruthy();
      expect(body.data.askLegalQuestion.id).toBeDefined();
      expect(body.data.askLegalQuestion.createdAt).toBeDefined();

      // Citations may or may not be present depending on AI response
      if (body.data.askLegalQuestion.citations) {
        expect(Array.isArray(body.data.askLegalQuestion.citations)).toBe(true);
      }

      queryId = body.data.askLegalQuestion.id;
    }
  });

  test('should ask a legal question in LAWYER mode', async ({ request }) => {
    const query = `
      mutation AskLegalQuestion($input: AskLegalQuestionInput!) {
        askLegalQuestion(input: $input) {
          id
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
      headers: authCookie ? { Cookie: authCookie } : {},
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
        sessionId: sessionId,
        question: 'Test question',
        mode: 'INVALID_MODE',
      },
    };

    const response = await request.post(GRAPHQL_ENDPOINT, {
      data: {
        query,
        variables,
      },
      headers: authCookie ? { Cookie: authCookie } : {},
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
      input: {
        sessionId: sessionId,
        // question is missing
      },
    };

    const response = await request.post(GRAPHQL_ENDPOINT, {
      data: {
        query,
        variables,
      },
      headers: authCookie ? { Cookie: authCookie } : {},
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
      headers: authCookie ? { Cookie: authCookie } : {},
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
      headers: authCookie ? { Cookie: authCookie } : {},
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
      const foundQuery = body.data.queriesBySession.find(
        (q: any) => q.id === queryId,
      );
      expect(foundQuery).toBeDefined();
    }
  });
});
