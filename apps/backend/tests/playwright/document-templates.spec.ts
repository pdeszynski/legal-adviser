import { test, expect } from '@playwright/test';

/**
 * Temporary verification test for document templates feature
 * This test verifies that the DocumentTemplate entity and GraphQL API work correctly
 */

const GRAPHQL_ENDPOINT =
  process.env.GRAPHQL_URL || 'http://localhost:3333/graphql';

test.describe('Document Templates Feature Verification', () => {
  let authToken: string;
  let templateId: string;
  let sessionId: string;

  test.beforeAll(async ({ request }) => {
    // Try to login to get auth token
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
              email: 'test@example.com',
              password: 'password123',
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

  test('should create a document template', async ({ request }) => {
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
        name: 'Test Contract Template',
        category: 'CONTRACT',
        description: 'A test contract template for verification',
        content:
          'CONTRACT AGREEMENT\n\nThis contract is between {{partyA}} and {{partyB}}.\nContract value: {{amount}} PLN.\nDate: {{date}}.\n{{#if hasWarranty}}This contract includes a warranty period.{{/if}}',
        variables: [
          {
            name: 'partyA',
            label: 'Party A Name',
            type: 'text',
            required: true,
            description: 'Name of the first party',
          },
          {
            name: 'partyB',
            label: 'Party B Name',
            type: 'text',
            required: true,
          },
          {
            name: 'amount',
            label: 'Contract Amount',
            type: 'number',
            required: true,
            validation: {
              min: 0,
            },
          },
          {
            name: 'date',
            label: 'Contract Date',
            type: 'date',
            required: true,
          },
          {
            name: 'hasWarranty',
            label: 'Includes Warranty',
            type: 'boolean',
            required: false,
          },
        ],
        conditionalSections: [
          {
            id: 'warranty',
            condition: 'hasWarranty',
            description: 'Warranty clause section',
          },
        ],
        polishFormattingRules: {
          dateFormat: 'D MMMM YYYY',
          numberFormat: 'pl',
        },
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
      'Test Contract Template',
    );
    expect(body.data.createDocumentTemplate.category).toBe('CONTRACT');
    expect(body.data.createDocumentTemplate.isActive).toBe(true);
    expect(body.data.createDocumentTemplate.usageCount).toBe(0);
    expect(Array.isArray(body.data.createDocumentTemplate.variables)).toBe(
      true,
    );
    expect(body.data.createDocumentTemplate.variables).toHaveLength(5);

    templateId = body.data.createDocumentTemplate.id;
    console.log('Created template with ID:', templateId);
  });

  test('should list all document templates', async ({ request }) => {
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
      (t: { name: string }) => t.name === 'Test Contract Template',
    );
    expect(createdTemplate).toBeDefined();
  });

  test('should get a single template by ID', async ({ request }) => {
    if (!templateId) {
      test.skip(true, 'Template ID not available from creation test');
      return;
    }

    const query = `
      query GetDocumentTemplate($id: ID!) {
        documentTemplate(id: $id) {
          id
          name
          category
          description
          content
          variables {
            name
            label
            type
            required
          }
          conditionalSections {
            id
            condition
          }
          polishFormattingRules {
            dateFormat
            numberFormat
          }
          isActive
          usageCount
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
      data: {
        query,
        variables: { id: templateId },
      },
      headers,
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    if (body.errors) {
      console.error('GraphQL errors:', JSON.stringify(body.errors, null, 2));
    }

    expect(body.errors).toBeUndefined();
    expect(body.data.documentTemplate).toBeDefined();
    expect(body.data.documentTemplate.id).toBe(templateId);
    expect(body.data.documentTemplate.name).toBe('Test Contract Template');
    expect(body.data.documentTemplate.category).toBe('CONTRACT');
    expect(Array.isArray(body.data.documentTemplate.variables)).toBe(true);
    expect(body.data.documentTemplate.variables).toHaveLength(5);
  });

  test('should update a document template', async ({ request }) => {
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
        description: 'Updated description for verification testing',
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
      'Updated description for verification testing',
    );
  });

  test('should soft delete a document template', async ({ request }) => {
    if (!templateId) {
      test.skip(true, 'Template ID not available from creation test');
      return;
    }

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

    const response = await request.post(GRAPHQL_ENDPOINT, {
      data: {
        query: mutation,
        variables: { id: templateId },
      },
      headers,
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    if (body.errors) {
      console.error('GraphQL errors:', JSON.stringify(body.errors, null, 2));
    }

    expect(body.errors).toBeUndefined();
    expect(body.data.deleteDocumentTemplate).toBe(true);

    // Verify template is now inactive
    const query = `
      query GetDocumentTemplate($id: ID!) {
        documentTemplate(id: $id) {
          id
          isActive
        }
      }
    `;

    const verifyResponse = await request.post(GRAPHQL_ENDPOINT, {
      data: {
        query,
        variables: { id: templateId },
      },
      headers,
    });

    const verifyBody = await verifyResponse.json();
    expect(verifyBody.data.documentTemplate.isActive).toBe(false);
  });
});
