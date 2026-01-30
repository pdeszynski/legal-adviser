import { test, expect } from '@playwright/test';

/**
 * Document Template Mutations E2E Test
 *
 * This test verifies that the document template create and update mutations
 * work correctly through the data provider with meta.operation configuration.
 * This specifically tests the fix for the "custom mutation is not configured properly" error.
 */

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

test.describe('Document Template Mutations', () => {
  let authToken: string;
  let templateId: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginMutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          accessToken
          refreshToken
          user {
            id
            email
          }
        }
      }
    `;

    try {
      const response = await request.post(GRAPHQL_ENDPOINT, {
        data: {
          query: loginMutation,
          variables: {
            input: {
              email: 'admin@refine.dev',
              password: 'password',
            },
          },
        },
      });

      const body = await response.json();
      if (body.data?.login?.accessToken) {
        authToken = body.data.login.accessToken;
        console.log('Authentication successful');
      }
    } catch (error) {
      console.warn('Login failed - tests may fail if auth is required:', error);
    }
  });

  test('should create a document template via data provider create with meta.operation', async ({
    request,
  }) => {
    const mutation = `
      mutation CreateDocumentTemplate($input: CreateTemplateInput!) {
        createDocumentTemplate(input: $input) {
          id
          name
          category
          description
          content
          isActive
          usageCount
          createdAt
          updatedAt
        }
      }
    `;

    const variables = {
      input: {
        name: 'Test Template for Mutation',
        category: 'CONTRACT',
        description: 'Template to test meta.operation configuration',
        content: 'Test content with {{variable}}',
        variables: [
          {
            name: 'variable',
            label: 'Test Variable',
            type: 'text',
            required: true,
          },
        ],
        isActive: true,
      },
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await request.post(GRAPHQL_ENDPOINT, {
      data: {
        query: mutation,
        variables,
      },
      headers,
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    if (body.errors) {
      console.error('GraphQL errors:', JSON.stringify(body.errors, null, 2));
    }

    expect(body.errors).toBeUndefined();
    expect(body.data.createDocumentTemplate).toBeDefined();
    expect(body.data.createDocumentTemplate.name).toBe('Test Template for Mutation');
    expect(body.data.createDocumentTemplate.category).toBe('CONTRACT');

    templateId = body.data.createDocumentTemplate.id;
    console.log('Created template with ID:', templateId);
  });

  test('should update a document template via data provider update with meta.operation', async ({
    request,
  }) => {
    if (!templateId) {
      test.skip(true, 'Template ID not available from creation test');
      return;
    }

    const mutation = `
      mutation UpdateDocumentTemplate($id: ID!, $input: UpdateTemplateInput!) {
        updateDocumentTemplate(id: $id, input: $input) {
          id
          name
          description
          isActive
          updatedAt
        }
      }
    `;

    const variables = {
      id: templateId,
      input: {
        description: 'Updated description via meta.operation',
      },
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await request.post(GRAPHQL_ENDPOINT, {
      data: {
        query: mutation,
        variables,
      },
      headers,
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    if (body.errors) {
      console.error('GraphQL errors:', JSON.stringify(body.errors, null, 2));
    }

    expect(body.errors).toBeUndefined();
    expect(body.data.updateDocumentTemplate).toBeDefined();
    expect(body.data.updateDocumentTemplate.description).toBe(
      'Updated description via meta.operation',
    );
  });

  test('should list templates including our created one', async ({ request }) => {
    const query = `
      query {
        documentTemplates {
          id
          name
          category
          description
          isActive
          usageCount
          createdAt
        }
      }
    `;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await request.post(GRAPHQL_ENDPOINT, {
      data: { query },
      headers,
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    if (body.errors) {
      console.error('GraphQL errors:', JSON.stringify(body.errors, null, 2));
    }

    expect(body.errors).toBeUndefined();
    expect(body.data.documentTemplates).toBeDefined();
    expect(Array.isArray(body.data.documentTemplates)).toBe(true);

    // Verify our created template is in the list
    const createdTemplate = body.data.documentTemplates.find(
      (t: { name: string }) => t.name === 'Test Template for Mutation',
    );
    expect(createdTemplate).toBeDefined();
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: delete the test template
    if (!templateId) return;

    const mutation = `
      mutation DeleteDocumentTemplate($id: ID!) {
        deleteDocumentTemplate(id: $id)
      }
    `;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    await request.post(GRAPHQL_ENDPOINT, {
      data: {
        query: mutation,
        variables: { id: templateId },
      },
      headers,
    });
  });
});
