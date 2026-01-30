import { test, expect } from '@playwright/test';

/**
 * Template Data Provider E2E Test
 *
 * This test verifies that the data provider correctly handles custom mutations
 * with meta.operation for document templates.
 * This specifically tests the fix for the "custom mutation is not configured properly" error.
 */

const GRAPHQL_ENDPOINT =
  process.env.GRAPHQL_URL || 'http://localhost:3333/graphql';

test.describe('Template Data Provider Meta Operation', () => {
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
            role
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
        console.log('Authentication successful for admin user');
      }
    } catch (error) {
      console.warn('Login failed - tests may fail if auth is required:', error);
    }
  });

  test('should verify createDocumentTemplate mutation exists and works', async ({
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
          variables
          conditionalSections
          polishFormattingRules
          isActive
          usageCount
          createdAt
          updatedAt
        }
      }
    `;

    const variables = {
      input: {
        name: 'Data Provider Test Template',
        category: 'OTHER',
        description: 'Testing data provider meta.operation configuration',
        content: 'Test content {{testVar}}',
        variables: [
          {
            name: 'testVar',
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
    expect(body.data.createDocumentTemplate.name).toBe(
      'Data Provider Test Template',
    );
    expect(body.data.createDocumentTemplate.category).toBe('OTHER');

    templateId = body.data.createDocumentTemplate.id;
    console.log('Created test template with ID:', templateId);
  });

  test('should verify updateDocumentTemplate mutation exists and works', async ({
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
          content
          isActive
          updatedAt
        }
      }
    `;

    const variables = {
      id: templateId,
      input: {
        name: 'Updated Data Provider Test Template',
        description: 'Updated via updateDocumentTemplate mutation',
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
    expect(body.data.updateDocumentTemplate.name).toBe(
      'Updated Data Provider Test Template',
    );
    expect(body.data.updateDocumentTemplate.description).toBe(
      'Updated via updateDocumentTemplate mutation',
    );
  });

  test('should verify incorrect operation names would fail (validation)', async ({
    request,
  }) => {
    // This test verifies that using wrong mutation names (like createOneDocumentTemplate)
    // would fail, confirming that our fix uses the correct operation names

    const mutation = `
      mutation CreateOneDocumentTemplate($input: CreateTemplateInput!) {
        createOneDocumentTemplate(input: $input) {
          id
          name
        }
      }
    `;

    const variables = {
      input: {
        name: 'Should Not Work',
        category: 'OTHER',
        content: 'Test',
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

    const body = await response.json();

    // This should fail because createOneDocumentTemplate doesn't exist
    expect(body.errors).toBeDefined();
    expect(body.errors?.[0]?.message).toContain('Cannot query field');
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
