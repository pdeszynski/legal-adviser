import { test, expect } from '@playwright/test';

/**
 * Temporary Verification Test for Template Mutation Fix
 *
 * This test verifies that the custom page mutations configuration error has been fixed.
 * After successful verification, this test can be removed or kept as a regression test.
 */

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

test.describe('Template Mutation Fix Verification', () => {
  let authToken: string;
  let templateId: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
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
      }
    } catch (error) {
      console.warn('Login failed:', error);
    }
  });

  test('should create template using correct mutation name (createDocumentTemplate)', async ({
    request,
  }) => {
    const mutation = `
      mutation CreateDocumentTemplate($input: CreateTemplateInput!) {
        createDocumentTemplate(input: $input) {
          id
          name
          category
          description
          isActive
          createdAt
        }
      }
    `;

    const variables = {
      input: {
        name: 'Verification Test Template',
        category: 'CONTRACT',
        description: 'Verifying mutation fix',
        content: 'Test {{content}}',
        variables: [
          {
            name: 'content',
            label: 'Content',
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

    expect(body.errors).toBeUndefined();
    expect(body.data?.createDocumentTemplate).toBeDefined();
    expect(body.data.createDocumentTemplate.name).toBe('Verification Test Template');

    templateId = body.data.createDocumentTemplate.id;
    console.log('Created template:', templateId);
  });

  test('should update template using correct mutation name (updateDocumentTemplate)', async ({
    request,
  }) => {
    if (!templateId) {
      test.skip(true, 'No template ID available');
      return;
    }

    const mutation = `
      mutation UpdateDocumentTemplate($id: ID!, $input: UpdateTemplateInput!) {
        updateDocumentTemplate(id: $id, input: $input) {
          id
          name
          description
          updatedAt
        }
      }
    `;

    const variables = {
      id: templateId,
      input: {
        description: 'Updated via mutation verification test',
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

    expect(body.errors).toBeUndefined();
    expect(body.data?.updateDocumentTemplate).toBeDefined();
    expect(body.data.updateDocumentTemplate.description).toBe(
      'Updated via mutation verification test',
    );
  });

  test('should verify old operation names do not work', async ({ request }) => {
    // This confirms that the old incorrect operation names (createOneDocumentTemplate)
    // were indeed the problem and our fix uses the correct names

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
    console.log('Confirmed: Old operation name fails as expected');
  });

  test.afterAll(async ({ request }) => {
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
