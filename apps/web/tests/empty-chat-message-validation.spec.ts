import { test, expect } from '@playwright/test';
import { GraphQLClient } from 'graphql-request';

/**
 * Empty Chat Message Validation Verification Test
 *
 * This test verifies that the backend properly validates and rejects
 * chat messages with empty content.
 *
 * Test scenarios:
 * 1. Sending a message with empty string content should fail
 * 2. Sending a message with only whitespace should fail
 * 3. Sending a valid message should succeed
 */

const GRAPHQL_URL = process.env.GRAPHQL_URL || 'http://localhost:3001/graphql';

// Helper to create a test user and get token
async function getAuthToken(): Promise<string> {
  const loginMutation = `
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        accessToken
        user {
          id
          email
        }
      }
    }
  `;

  const client = new GraphQLClient(GRAPHQL_URL);

  try {
    const response = await client.request<any, any>(loginMutation, {
      input: {
        email: 'user@example.com',
        password: 'password123',
      },
    });

    return response.login.accessToken;
  } catch (error) {
    // If test user doesn't exist, try registering first
    const registerMutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          accessToken
          user {
            id
            email
          }
        }
      }
    `;

    const registerResponse = await client.request<any, any>(registerMutation, {
      input: {
        email: 'user@example.com',
        password: 'password123',
        username: 'testuser',
      },
    });

    return registerResponse.register.accessToken;
  }
}

test.describe('Empty Chat Message Validation', () => {
  let authToken: string;

  test.beforeAll(async () => {
    authToken = await getAuthToken();
  });

  test('should reject message with empty content', async () => {
    const client = new GraphQLClient(GRAPHQL_URL, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const mutation = `
      mutation SendChatMessageWithAI($input: SendChatMessageWithAIInput!) {
        sendChatMessageWithAI(input: $input) {
          sessionId
          userMessage {
            messageId
            content
          }
        }
      }
    `;

    await expect(
      client.request(mutation, {
        input: {
          question: '',
          mode: 'SIMPLE',
        },
      })
    ).rejects.toThrow();
  });

  test('should reject message with only whitespace', async () => {
    const client = new GraphQLClient(GRAPHQL_URL, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const mutation = `
      mutation SendChatMessageWithAI($input: SendChatMessageWithAIInput!) {
        sendChatMessageWithAI(input: $input) {
          sessionId
          userMessage {
            messageId
            content
          }
        }
      }
    `;

    await expect(
      client.request(mutation, {
        input: {
          question: '   \t\n   ',
          mode: 'SIMPLE',
        },
      })
    ).rejects.toThrow();
  });

  test('should accept valid message', async () => {
    const client = new GraphQLClient(GRAPHQL_URL, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const mutation = `
      mutation SendChatMessageWithAI($input: SendChatMessageWithAIInput!) {
        sendChatMessageWithAI(input: $input) {
          sessionId
          userMessage {
            messageId
            content
            role
          }
        }
      }
    `;

    const response = await client.request(mutation, {
      input: {
        question: 'What are my rights as a tenant?',
        mode: 'SIMPLE',
      },
    });

    expect(response.sendChatMessageWithAI).toBeDefined();
    expect(response.sendChatMessageWithAI.userMessage).toBeDefined();
    expect(response.sendChatMessageWithAI.userMessage.content).toBe('What are my rights as a tenant?');
  });

  test('should reject saveChatMessage with empty content', async () => {
    const client = new GraphQLClient(GRAPHQL_URL, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    // First create a session
    const createSessionMutation = `
      mutation {
        sendChatMessageWithAI(input: { question: "test", mode: "SIMPLE" }) {
          sessionId
        }
      }
    `;

    const sessionResponse = await client.request(createSessionMutation);
    const sessionId = sessionResponse.sendChatMessageWithAI.sessionId;

    // Try to save empty message
    const saveMutation = `
      mutation SaveChatMessage($input: SaveChatMessageInput!) {
        saveChatMessage(input: $input) {
          messageId
          content
        }
      }
    `;

    await expect(
      client.request(saveMutation, {
        input: {
          sessionId,
          content: '',
          role: 'ASSISTANT',
        },
      })
    ).rejects.toThrow();
  });
});
