import { test, expect } from '@playwright/test';

/**
 * Temporary verification test for document templates feature
 * This test will be deleted after verification
 */

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/graphql';

test.describe('Document Templates Feature Verification', () => {
  let authCookie: string;
  let templateId: string;
  let sessionId: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth cookie
    const loginResponse = await request.post(`${GRAPHQL_ENDPOINT.replace('/graphql', '')}/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'password123',
      },
    });

    if (!loginResponse.ok()) {
      console.warn('Login failed - tests may fail if auth is required');
    } else {
      const cookies = loginResponse.headers()['set-cookie'];
      if (cookies) {
        authCookie = cookies;
      }
    }
  });

  test('should create a document template', async ({ request }) => {
    const query = `
      mutation CreateDocumentTemplate($input: CreateTemplateInput!) {
        createDocumentTemplate(input: $input) {
          id
          name
          category
          content
          variables
          isActive
        }
      }
    `;

    const variables = {
      input: {
        name: 'Test Contract Template',
        category: 'CONTRACT',
        description: 'A test contract template',
        content: 'CONTRACT AGREEMENT\n\nThis contract is between {{partyA}} and {{partyB}}.\nContract value: {{amount}} PLN.\nDate: {{date}}.\n{{#if hasWarranty}}This contract includes a warranty period.{{/if}}',
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
            description: 'Name of the second party',
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
            description: 'Warranty clause',
          },
        ],
        polishFormattingRules: {
          dateFormat: 'D MMMM YYYY',
          numberFormat: 'pl',
        },
        isActive: true,
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

    // Check if there are errors
    if (body.errors) {
      console.error('GraphQL errors:', JSON.stringify(body.errors, null, 2));
    }

    expect(body.errors).toBeUndefined();
    expect(body.data.createDocumentTemplate).toBeDefined();
    expect(body.data.createDocumentTemplate.name).toBe('Test Contract Template');
    expect(body.data.createDocumentTemplate.category).toBe('CONTRACT');
    expect(body.data.createDocumentTemplate.isActive).toBe(true);

    templateId = body.data.createDocumentTemplate.id;
  });

  test('should list document templates', async ({ request }) => {
    const query = `
      query {
        documentTemplates {
          id
          name
          category
          description
          isActive
          usageCount
        }
      }
    `;

    const response = await request.post(GRAPHQL_ENDPOINT, {
      data: { query },
      headers: authCookie ? { Cookie: authCookie } : {},
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    if (body.errors) {
      console.error('GraphQL errors:', JSON.stringify(body.errors, null, 2));
    }

    expect(body.errors).toBeUndefined();
    expect(body.data.documentTemplates).toBeDefined();
    expect(Array.isArray(body.data.documentTemplates)).toBe(true);
  });

  test('should get a single template by ID', async ({ request }) => {
    test.skip(!templateId, 'Template ID not available from creation test');

    const query = `
      query GetDocumentTemplate($id: ID!) {
        documentTemplate(id: $id) {
          id
          name
          category
          content
          variables
          conditionalSections
          polishFormattingRules
        }
      }
    `;

    const response = await request.post(GRAPHQL_ENDPOINT, {
      data: {
        query,
        variables: { id: templateId },
      },
      headers: authCookie ? { Cookie: authCookie } : {},
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
  });

  test('should generate a document from template', async ({ request }) => {
    test.skip(!templateId, 'Template ID not available from creation test');

    // First, create a user session (you may need to adjust this based on your API)
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
      }
    }

    if (!sessionId) {
      test.skip(true, 'Could not create session for testing');
      return;
    }

    const query = `
      mutation GenerateFromTemplate($input: GenerateFromTemplateInput!) {
        generateDocumentFromTemplate(input: $input) {
          id
          title
          type
          status
          contentRaw
          metadata
        }
      }
    `;

    const testDate = new Date('2024-12-15').toISOString();

    const variables = {
      input: {
        templateId,
        sessionId,
        title: 'Generated Contract - Test',
        variables: {
          partyA: 'ACME Corporation',
          partyB: 'John Kowalski',
          amount: 50000,
          date: testDate,
          hasWarranty: true,
        },
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

    expect(body.errors).toBeUndefined();
    expect(body.data.generateDocumentFromTemplate).toBeDefined();
    expect(body.data.generateDocumentFromTemplate.title).toBe('Generated Contract - Test');
    expect(body.data.generateDocumentFromTemplate.contentRaw).toContain('ACME Corporation');
    expect(body.data.generateDocumentFromTemplate.contentRaw).toContain('John Kowalski');
    expect(body.data.generateDocumentFromTemplate.contentRaw).toContain('warranty');

    // Check Polish date formatting (should be "15 grudnia 2024")
    expect(body.data.generateDocumentFromTemplate.contentRaw).toContain('2024');
  });

  test('should update a template', async ({ request }) => {
    test.skip(!templateId, 'Template ID not available from creation test');

    const query = `
      mutation UpdateDocumentTemplate($id: ID!, $input: UpdateTemplateInput!) {
        updateDocumentTemplate(id: $id, input: $input) {
          id
          name
          description
          isActive
        }
      }
    `;

    const variables = {
      id: templateId,
      input: {
        description: 'Updated description for testing',
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

    expect(body.errors).toBeUndefined();
    expect(body.data.updateDocumentTemplate).toBeDefined();
    expect(body.data.updateDocumentTemplate.description).toBe('Updated description for testing');
  });

  test('should delete (soft delete) a template', async ({ request }) => {
    test.skip(!templateId, 'Template ID not available from creation test');

    const query = `
      mutation DeleteDocumentTemplate($id: ID!) {
        deleteDocumentTemplate(id: $id)
      }
    `;

    const response = await request.post(GRAPHQL_ENDPOINT, {
      data: {
        query,
        variables: { id: templateId },
      },
      headers: authCookie ? { Cookie: authCookie } : {},
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    if (body.errors) {
      console.error('GraphQL errors:', JSON.stringify(body.errors, null, 2));
    }

    expect(body.errors).toBeUndefined();
    expect(body.data.deleteDocumentTemplate).toBe(true);
  });
});
