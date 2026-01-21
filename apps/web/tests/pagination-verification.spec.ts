import { test, expect } from '@playwright/test';

/**
 * Temporary verification test for cursor-based pagination feature
 * This test will be deleted after verification
 */

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/graphql';

test.describe('Cursor-Based Pagination Verification', () => {
  let authCookie: string;

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
  });

  test.describe('Audit Logs Pagination', () => {
    test('should query audit logs with cursor-based pagination - first page', async ({
      request,
    }) => {
      // Add delay to avoid throttling
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const query = `
        query GetAuditLogsWithPaging($paging: CursorPaging) {
          auditLogs(paging: $paging) {
            totalCount
            edges {
              node {
                id
                action
                resourceType
                createdAt
              }
              cursor
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      `;

      const response = await request.post(GRAPHQL_ENDPOINT, {
        data: {
          query,
          variables: {
            paging: {
              first: 5,
            },
          },
        },
        headers: authCookie ? { Cookie: authCookie } : {},
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();

      if (body.errors) {
        console.error('GraphQL errors:', JSON.stringify(body.errors, null, 2));
      }

      expect(body.errors).toBeUndefined();
      expect(body.data.auditLogs).toBeDefined();
      expect(body.data.auditLogs.pageInfo).toBeDefined();
      expect(body.data.auditLogs.edges).toBeInstanceOf(Array);

      // Check cursor-based response structure
      expect(body.data.auditLogs.pageInfo).toHaveProperty('hasNextPage');
      expect(body.data.auditLogs.pageInfo).toHaveProperty('hasPreviousPage');
      expect(body.data.auditLogs.pageInfo).toHaveProperty('startCursor');
      expect(body.data.auditLogs.pageInfo).toHaveProperty('endCursor');

      // First page should not have previous page
      expect(body.data.auditLogs.pageInfo.hasPreviousPage).toBe(false);
    });

    test('should query audit logs with cursor-based pagination - second page (using after cursor)', async ({
      request,
    }) => {
      // First, get the first page to obtain the endCursor
      const firstPageQuery = `
        query GetAuditLogsWithPaging($paging: CursorPaging) {
          auditLogs(paging: $paging) {
            totalCount
            edges {
              cursor
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      `;

      const firstPageResponse = await request.post(GRAPHQL_ENDPOINT, {
        data: {
          query: firstPageQuery,
          variables: {
            paging: {
              first: 5,
            },
          },
        },
        headers: authCookie ? { Cookie: authCookie } : {},
      });

      expect(firstPageResponse.ok()).toBeTruthy();
      const firstPageBody = await firstPageResponse.json();

      if (firstPageBody.errors) {
        console.error(
          'GraphQL errors on first page:',
          JSON.stringify(firstPageBody.errors, null, 2),
        );
      }

      expect(firstPageBody.errors).toBeUndefined();

      const endCursor = firstPageBody.data.auditLogs.pageInfo.endCursor;
      const hasNextPage = firstPageBody.data.auditLogs.pageInfo.hasNextPage;

      // Only test second page if there are more results
      test.skip(!hasNextPage, 'Not enough audit logs to test pagination');

      if (hasNextPage && endCursor) {
        // Now query the second page using the endCursor from the first page
        const secondPageQuery = `
          query GetAuditLogsWithPaging($paging: CursorPaging) {
            auditLogs(paging: $paging) {
              totalCount
              edges {
                node {
                  id
                  action
                  createdAt
                }
                cursor
              }
              pageInfo {
                hasNextPage
                hasPreviousPage
                startCursor
                endCursor
              }
            }
          }
        `;

        const secondPageResponse = await request.post(GRAPHQL_ENDPOINT, {
          data: {
            query: secondPageQuery,
            variables: {
              paging: {
                first: 5,
                after: endCursor,
              },
            },
          },
          headers: authCookie ? { Cookie: authCookie } : {},
        });

        expect(secondPageResponse.ok()).toBeTruthy();
        const secondPageBody = await secondPageResponse.json();

        if (secondPageBody.errors) {
          console.error(
            'GraphQL errors on second page:',
            JSON.stringify(secondPageBody.errors, null, 2),
          );
        }

        expect(secondPageBody.errors).toBeUndefined();
        expect(secondPageBody.data.auditLogs).toBeDefined();

        // Second page should have a previous page
        expect(secondPageBody.data.auditLogs.pageInfo.hasPreviousPage).toBe(true);

        // Cursors should be different between pages
        const firstPageCursor = firstPageBody.data.auditLogs.pageInfo.endCursor;
        const secondPageCursor = secondPageBody.data.auditLogs.pageInfo.endCursor;
        expect(secondPageCursor).not.toBe(firstPageCursor);
      }
    });
  });

  test.describe('Legal Documents Pagination', () => {
    test('should query legal documents with cursor-based pagination - first page', async ({
      request,
    }) => {
      const query = `
        query GetLegalDocumentsWithPaging($paging: CursorPaging) {
          legalDocuments(paging: $paging) {
            totalCount
            edges {
              node {
                id
                title
                type
                status
                createdAt
              }
              cursor
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      `;

      const response = await request.post(GRAPHQL_ENDPOINT, {
        data: {
          query,
          variables: {
            paging: {
              first: 10,
            },
          },
        },
        headers: authCookie ? { Cookie: authCookie } : {},
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();

      if (body.errors) {
        console.error('GraphQL errors:', JSON.stringify(body.errors, null, 2));
      }

      expect(body.errors).toBeUndefined();
      expect(body.data.legalDocuments).toBeDefined();
      expect(body.data.legalDocuments.pageInfo).toBeDefined();
      expect(body.data.legalDocuments.edges).toBeInstanceOf(Array);

      // Check cursor-based response structure
      expect(body.data.legalDocuments.pageInfo).toHaveProperty('hasNextPage');
      expect(body.data.legalDocuments.pageInfo).toHaveProperty('hasPreviousPage');
      expect(body.data.legalDocuments.pageInfo).toHaveProperty('startCursor');
      expect(body.data.legalDocuments.pageInfo).toHaveProperty('endCursor');

      // First page should not have previous page
      expect(body.data.legalDocuments.pageInfo.hasPreviousPage).toBe(false);
    });

    test('should query legal documents with cursor-based pagination - second page (using after cursor)', async ({
      request,
    }) => {
      // First, get the first page to obtain the endCursor
      const firstPageQuery = `
        query GetLegalDocumentsWithPaging($paging: CursorPaging) {
          legalDocuments(paging: $paging) {
            totalCount
            edges {
              cursor
              node {
                id
              }
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      `;

      const firstPageResponse = await request.post(GRAPHQL_ENDPOINT, {
        data: {
          query: firstPageQuery,
          variables: {
            paging: {
              first: 5,
            },
          },
        },
        headers: authCookie ? { Cookie: authCookie } : {},
      });

      expect(firstPageResponse.ok()).toBeTruthy();
      const firstPageBody = await firstPageResponse.json();

      if (firstPageBody.errors) {
        console.error(
          'GraphQL errors on first page:',
          JSON.stringify(firstPageBody.errors, null, 2),
        );
      }

      expect(firstPageBody.errors).toBeUndefined();

      const endCursor = firstPageBody.data.legalDocuments.pageInfo.endCursor;
      const hasNextPage = firstPageBody.data.legalDocuments.pageInfo.hasNextPage;
      const firstPageIds = new Set(
        firstPageBody.data.legalDocuments.edges.map((e: { node: { id: string } }) => e.node.id),
      );

      // Only test second page if there are more results
      test.skip(!hasNextPage, 'Not enough legal documents to test pagination');

      if (hasNextPage && endCursor) {
        // Now query the second page using the endCursor from the first page
        const secondPageQuery = `
          query GetLegalDocumentsWithPaging($paging: CursorPaging) {
            legalDocuments(paging: $paging) {
              totalCount
              edges {
                node {
                  id
                  title
                }
                cursor
              }
              pageInfo {
                hasNextPage
                hasPreviousPage
                startCursor
                endCursor
              }
            }
          }
        `;

        const secondPageResponse = await request.post(GRAPHQL_ENDPOINT, {
          data: {
            query: secondPageQuery,
            variables: {
              paging: {
                first: 5,
                after: endCursor,
              },
            },
          },
          headers: authCookie ? { Cookie: authCookie } : {},
        });

        expect(secondPageResponse.ok()).toBeTruthy();
        const secondPageBody = await secondPageResponse.json();

        if (secondPageBody.errors) {
          console.error(
            'GraphQL errors on second page:',
            JSON.stringify(secondPageBody.errors, null, 2),
          );
        }

        expect(secondPageBody.errors).toBeUndefined();
        expect(secondPageBody.data.legalDocuments).toBeDefined();

        // Second page should have a previous page
        expect(secondPageBody.data.legalDocuments.pageInfo.hasPreviousPage).toBe(true);

        // Verify we got different items on the second page
        const secondPageIds = secondPageBody.data.legalDocuments.edges.map(
          (e: { node: { id: string } }) => e.node.id,
        );

        // Check that IDs are different between pages
        for (const id of secondPageIds) {
          expect(firstPageIds.has(id)).toBe(false);
        }
      }
    });
  });

  test.describe('Legal Queries Pagination', () => {
    test('should query legal queries with cursor-based pagination', async ({ request }) => {
      const query = `
        query GetLegalQueriesWithPaging($paging: CursorPaging) {
          legalQueries(paging: $paging) {
            totalCount
            edges {
              node {
                id
                question
                answerMarkdown
                createdAt
              }
              cursor
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      `;

      const response = await request.post(GRAPHQL_ENDPOINT, {
        data: {
          query,
          variables: {
            paging: {
              first: 10,
            },
          },
        },
        headers: authCookie ? { Cookie: authCookie } : {},
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();

      if (body.errors) {
        console.error('GraphQL errors:', JSON.stringify(body.errors, null, 2));
      }

      expect(body.errors).toBeUndefined();
      expect(body.data.legalQueries).toBeDefined();
      expect(body.data.legalQueries.pageInfo).toBeDefined();
      expect(body.data.legalQueries.edges).toBeInstanceOf(Array);

      // Check cursor-based response structure
      expect(body.data.legalQueries.pageInfo).toHaveProperty('hasNextPage');
      expect(body.data.legalQueries.pageInfo).toHaveProperty('hasPreviousPage');
      expect(body.data.legalQueries.pageInfo).toHaveProperty('startCursor');
      expect(body.data.legalQueries.pageInfo).toHaveProperty('endCursor');
    });
  });
});
