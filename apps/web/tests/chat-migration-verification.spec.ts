import { test, expect } from '@playwright/test';

/**
 * Chat Migration Verification Tests
 *
 * Verifies the localStorage to database migration functionality:
 * 1) Backend GraphQL mutations work correctly
 * 2) Migration creates ChatSession and ChatMessage records
 * 3) Duplicate session IDs are rejected
 * 4) Invalid UUID v4 format is rejected
 * 5) Bulk migration handles multiple sessions
 * 6) Migrated sessions appear in chat sessions query
 *
 * This is a temporary verification test. Delete after confirming the feature works.
 *
 * Prerequisites:
 * - Backend running at http://localhost:3001
 * - Frontend running at http://localhost:3000
 *
 * Test credentials:
 * - user@example.com / password123
 */

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';
const USER_EMAIL = 'user@example.com';
const USER_PASSWORD = 'password123';

/**
 * Test helper to perform login and get access token
 */
async function getAuthToken(request: any): Promise<string> {
  const response = await request.post(GRAPHQL_URL, {
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({
      query: `
        mutation Login($email: String!, $password: String!) {
          login(input: { email: $email, password: $password }) {
            accessToken
            user {
              id
              email
            }
          }
        }
      `,
      variables: {
        email: USER_EMAIL,
        password: USER_PASSWORD,
      },
    }),
  });

  const result = await response.json();
  if (result.errors) {
    throw new Error(`Login failed: ${result.errors[0].message}`);
  }

  return result.data.login.accessToken;
}

/**
 * Test helper to reset migration flag
 */
async function resetMigrationFlag(request: any, token: string): Promise<void> {
  await request.post(GRAPHQL_URL, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    data: JSON.stringify({
      query: `
        mutation {
          resetLocalStorageMigration {
            hasMigrated
            lastMigrationAt
            sessionsMigrated
          }
        }
      `,
    }),
  });
}

/**
 * Test helper to check migration status
 */
async function getMigrationStatus(request: any, token: string): Promise<{
  hasMigrated: boolean;
  lastMigrationAt: string | null;
  sessionsMigrated: number;
}> {
  const response = await request.post(GRAPHQL_URL, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    data: JSON.stringify({
      query: `
        query {
          localStorageMigrationStatus {
            hasMigrated
            lastMigrationAt
            sessionsMigrated
          }
        }
      `,
    }),
  });

  const result = await response.json();
  if (result.errors) {
    throw new Error(`Failed to get migration status: ${result.errors[0].message}`);
  }

  return result.data.localStorageMigrationStatus;
}

/**
 * Test helper to migrate a single session
 */
async function migrateSession(
  request: any,
  token: string,
  sessionId: string,
  messages: Array<{ role: string; content: string }>,
  mode: string = 'SIMPLE',
): Promise<{ success: boolean; error: string | null; messageCount: number }> {
  const response = await request.post(GRAPHQL_URL, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    data: JSON.stringify({
      query: `
        mutation MigrateChatSession($input: MigrateChatSessionInput!) {
          migrateChatSession(input: $input) {
            sessionId
            success
            error
            messageCount
          }
        }
      `,
      variables: {
        input: {
          sessionId,
          messages: messages.map((msg) => ({
            role: msg.role.toUpperCase(),
            content: msg.content,
            rawContent: null,
            citations: [],
          })),
          title: null,
          mode,
        },
      },
    }),
  });

  const result = await response.json();
  if (result.errors) {
    throw new Error(`Migration failed: ${result.errors[0].message}`);
  }

  return result.data.migrateChatSession;
}

/**
 * Test helper to migrate multiple sessions in bulk
 */
async function migrateBulk(
  request: any,
  token: string,
  sessions: Array<{
    sessionId: string;
    messages: Array<{ role: string; content: string }>;
    mode: string;
  }>,
): Promise<{
  results: Array<{ sessionId: string; success: boolean; error: string | null }>;
  successfulCount: number;
  failedCount: number;
}> {
  const response = await request.post(GRAPHQL_URL, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    data: JSON.stringify({
      query: `
        mutation MigrateChatSessionsBulk($input: MigrateChatBulkInput!) {
          migrateChatSessionsBulk(input: $input) {
            results {
              sessionId
              success
              error
              messageCount
            }
            totalProcessed
            successfulCount
            failedCount
            totalMessagesMigrated
          }
        }
      `,
      variables: {
        input: {
          sessions: sessions.map((s) => ({
            sessionId: s.sessionId,
            messages: s.messages.map((msg) => ({
              role: msg.role.toUpperCase(),
              content: msg.content,
              rawContent: null,
              citations: [],
            })),
            title: null,
            mode: s.mode,
          })),
          skipDuplicates: true,
        },
      },
    }),
  });

  const result = await response.json();
  if (result.errors) {
    throw new Error(`Bulk migration failed: ${result.errors[0].message}`);
  }

  return result.data.migrateChatSessionsBulk;
}

test.describe('Chat Migration - Backend API', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Get auth token for API tests
    authToken = await getAuthToken(request);
  });

  test('should return migration status as not migrated initially', async ({ request }) => {
    // First reset the flag
    await resetMigrationFlag(request, authToken);

    // Then check status
    const status = await getMigrationStatus(request, authToken);

    expect(status.hasMigrated).toBe(false);
    expect(status.lastMigrationAt).toBeNull();
    expect(status.sessionsMigrated).toBe(0);
  });

  test('should migrate a single chat session successfully', async ({ request }) => {
    // Reset migration flag first
    await resetMigrationFlag(request, authToken);

    // Generate a unique session ID
    const sessionId = crypto.randomUUID();

    // Migrate a session with 2 messages
    const result = await migrateSession(request, authToken, sessionId, [
      { role: 'user', content: 'What are my rights as an employee?' },
      {
        role: 'assistant',
        content: 'As an employee in Poland, you have several rights including...',
      },
    ]);

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(result.messageCount).toBe(2);

    // Check migration status was updated
    const status = await getMigrationStatus(request, authToken);
    expect(status.hasMigrated).toBe(true);
    expect(status.sessionsMigrated).toBeGreaterThanOrEqual(1);
  });

  test('should reject duplicate session migration', async ({ request }) => {
    // Use a fixed session ID for this test
    const sessionId = '00000000-0000-4000-8000-000000000002';

    // First migration should succeed
    const result1 = await migrateSession(request, authToken, sessionId, [
      { role: 'user', content: 'Test message' },
      { role: 'assistant', content: 'Test response' },
    ]);

    expect(result1.success).toBe(true);

    // Second migration with same ID should fail
    const result2 = await migrateSession(request, authToken, sessionId, [
      { role: 'user', content: 'Test message' },
      { role: 'assistant', content: 'Test response' },
    ]);

    expect(result2.success).toBe(false);
    expect(result2.error).toContain('already exists');
  });

  test('should reject invalid UUID v4 format', async ({ request }) => {
    const result = await migrateSession(request, authToken, 'not-a-uuid', [
      { role: 'user', content: 'Test' },
    ]);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid session ID format');
  });

  test('should migrate multiple sessions in bulk', async ({ request }) => {
    // Reset migration flag
    await resetMigrationFlag(request, authToken);

    const sessions = [
      {
        sessionId: crypto.randomUUID(),
        messages: [
          { role: 'user', content: 'Question 1' },
          { role: 'assistant', content: 'Answer 1' },
        ],
        mode: 'SIMPLE',
      },
      {
        sessionId: crypto.randomUUID(),
        messages: [
          { role: 'user', content: 'Question 2' },
          { role: 'assistant', content: 'Answer 2' },
        ],
        mode: 'LAWYER',
      },
      {
        sessionId: crypto.randomUUID(),
        messages: [
          { role: 'user', content: 'Question 3' },
          { role: 'assistant', content: 'Answer 3' },
        ],
        mode: 'SIMPLE',
      },
    ];

    const result = await migrateBulk(request, authToken, sessions);

    expect(result.successfulCount).toBe(3);
    expect(result.failedCount).toBe(0);
    expect(result.results).toHaveLength(3);

    // All sessions should succeed
    for (const r of result.results) {
      expect(r.success).toBe(true);
      expect(r.error).toBeNull();
    }

    // Check migration status
    const status = await getMigrationStatus(request, authToken);
    expect(status.hasMigrated).toBe(true);
    expect(status.sessionsMigrated).toBeGreaterThanOrEqual(3);
  });

  test('should mark migration as complete', async ({ request }) => {
    // Reset and then mark as migrated
    await resetMigrationFlag(request, authToken);

    const response = await request.post(GRAPHQL_URL, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      data: JSON.stringify({
        query: `
          mutation {
            markLocalStorageMigrated {
              hasMigrated
              lastMigrationAt
              sessionsMigrated
            }
          }
        `,
      }),
    });

    const result = await response.json();
    if (result.errors) {
      throw new Error(`Mark migrated failed: ${result.errors[0].message}`);
    }

    const status = result.data.markLocalStorageMigrated;
    expect(status.hasMigrated).toBe(true);
    expect(status.lastMigrationAt).not.toBeNull();
  });
});

test.describe('Chat Migration - Edge Cases', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    authToken = await getAuthToken(request);
  });

  test('should handle empty messages array', async ({ request }) => {
    const sessionId = crypto.randomUUID();

    const result = await migrateSession(request, authToken, sessionId, []);

    expect(result.success).toBe(false);
    expect(result.error).toContain('must contain at least one message');
  });

  test('should handle session with only user messages', async ({ request }) => {
    const sessionId = crypto.randomUUID();

    const result = await migrateSession(request, authToken, sessionId, [
      { role: 'user', content: 'Hello?' },
      { role: 'user', content: 'Is anyone there?' },
    ]);

    // This should succeed - the backend doesn't validate conversation flow
    expect(result.success).toBe(true);
    expect(result.messageCount).toBe(2);
  });

  test('should handle very long message content', async ({ request }) => {
    const sessionId = crypto.randomUUID();
    const longContent = 'A'.repeat(10000); // 10k characters

    const result = await migrateSession(request, authToken, sessionId, [
      { role: 'user', content: longContent },
      { role: 'assistant', content: 'Response' },
    ]);

    expect(result.success).toBe(true);
    expect(result.messageCount).toBe(2);
  });
});

test.describe('Chat Migration - Integration with Chat Session', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    authToken = await getAuthToken(request);
  });

  test.afterAll(async ({ request }) => {
    // Clean up: reset migration flag
    await resetMigrationFlag(request, authToken);
  });

  test('migrated session should appear in chat sessions query', async ({ request }) => {
    // Reset migration flag
    await resetMigrationFlag(request, authToken);

    const sessionId = crypto.randomUUID();

    // Migrate a session
    await migrateSession(request, authToken, sessionId, [
      { role: 'user', content: 'Test question for query' },
      { role: 'assistant', content: 'Test answer for query' },
    ]);

    // Query for chat sessions
    const response = await request.post(GRAPHQL_URL, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      data: JSON.stringify({
        query: `
          query {
            chatSessions(limit: 100) {
              id
              title
              mode
              messageCount
              createdAt
            }
          }
        `,
      }),
    });

    const result = await response.json();
    if (result.errors) {
      throw new Error(`Chat sessions query failed: ${result.errors[0].message}`);
    }

    const sessions = result.data.chatSessions;
    expect(sessions.length).toBeGreaterThan(0);

    // Find our migrated session
    const migratedSession = sessions.find((s: { id: string }) => s.id === sessionId);
    expect(migratedSession).toBeDefined();
    expect(migratedSession.messageCount).toBe(2);
  });

  test('migrated session messages should be retrievable', async ({ request }) => {
    const sessionId = crypto.randomUUID();

    // Migrate a session
    await migrateSession(request, authToken, sessionId, [
      { role: 'user', content: 'Another test question' },
      { role: 'assistant', content: 'Another test answer' },
    ]);

    // Query for messages
    const response = await request.post(GRAPHQL_URL, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      data: JSON.stringify({
        query: `
          query GetMessages($sessionId: ID!) {
            chatMessages(sessionId: $sessionId) {
              messageId
              role
              content
              sequenceOrder
            }
          }
        `,
        variables: { sessionId },
      }),
    });

    const result = await response.json();
    if (result.errors) {
      throw new Error(`Chat messages query failed: ${result.errors[0].message}`);
    }

    const messages = result.data.chatMessages;
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('USER');
    expect(messages[0].sequenceOrder).toBe(0);
    expect(messages[1].role).toBe('ASSISTANT');
    expect(messages[1].sequenceOrder).toBe(1);
  });
});
