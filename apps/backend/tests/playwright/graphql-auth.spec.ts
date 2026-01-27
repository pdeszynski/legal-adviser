import { test, expect, APIRequestContext } from '@playwright/test';

/**
 * Temporary verification test for GraphQL authentication mutations
 * This test file should be deleted after verification
 */

const GRAPHQL_ENDPOINT =
  process.env.GRAPHQL_URL || 'http://localhost:3333/graphql';

// Helper function to execute GraphQL mutations
async function graphqlRequest(
  request: APIRequestContext,
  query: string,
  variables: Record<string, unknown> = {},
  headers: Record<string, string> = {},
) {
  const response = await request.post(GRAPHQL_ENDPOINT, {
    data: {
      query,
      variables,
    },
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
  return response;
}

test.describe('GraphQL Authentication Mutations', () => {
  // Generate unique email for each test run
  const timestamp = Date.now();
  const testEmail = `test-${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';
  const testUsername = `testuser${timestamp}`;

  test('should register a new user successfully', async ({ request }) => {
    const registerMutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          accessToken
          refreshToken
          user {
            id
            email
            username
            isActive
          }
        }
      }
    `;

    const response = await graphqlRequest(request, registerMutation, {
      input: {
        email: testEmail,
        password: testPassword,
        username: testUsername,
        firstName: 'Test',
        lastName: 'User',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    // Check for GraphQL errors
    expect(body.errors).toBeUndefined();

    // Verify response structure
    expect(body.data.register).toBeDefined();
    expect(body.data.register.accessToken).toBeTruthy();
    expect(body.data.register.refreshToken).toBeTruthy();
    expect(body.data.register.user.email).toBe(testEmail);
    expect(body.data.register.user.username).toBe(testUsername);
    expect(body.data.register.user.isActive).toBe(true);
  });

  test('should fail to register with existing email', async ({ request }) => {
    // First registration
    const registerMutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          accessToken
          user {
            email
          }
        }
      }
    `;

    const email = `duplicate-${Date.now()}@example.com`;

    // First registration should succeed
    await graphqlRequest(request, registerMutation, {
      input: {
        email,
        password: testPassword,
      },
    });

    // Second registration with same email should fail
    const response = await graphqlRequest(request, registerMutation, {
      input: {
        email,
        password: testPassword,
      },
    });

    const body = await response.json();
    expect(body.errors).toBeDefined();
    expect(body.errors[0].message).toContain('already exists');
  });

  test('should login with valid credentials', async ({ request }) => {
    // First register a user
    const email = `login-test-${Date.now()}@example.com`;
    const registerMutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          accessToken
          user {
            id
          }
        }
      }
    `;

    await graphqlRequest(request, registerMutation, {
      input: {
        email,
        password: testPassword,
      },
    });

    // Then login
    const loginMutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          accessToken
          refreshToken
          user {
            id
            email
            isActive
          }
        }
      }
    `;

    const response = await graphqlRequest(request, loginMutation, {
      input: {
        username: email, // Can use email as username
        password: testPassword,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.errors).toBeUndefined();
    expect(body.data.login).toBeDefined();
    expect(body.data.login.accessToken).toBeTruthy();
    expect(body.data.login.refreshToken).toBeTruthy();
    expect(body.data.login.user.email).toBe(email);
    expect(body.data.login.user.isActive).toBe(true);
  });

  test('should fail login with invalid credentials', async ({ request }) => {
    const loginMutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          accessToken
        }
      }
    `;

    const response = await graphqlRequest(request, loginMutation, {
      input: {
        username: 'nonexistent@example.com',
        password: 'wrongpassword123',
      },
    });

    const body = await response.json();
    expect(body.errors).toBeDefined();
    expect(body.errors[0].message).toContain('Invalid credentials');
  });

  test('should refresh tokens with valid refresh token', async ({
    request,
  }) => {
    // First register and get tokens
    const email = `refresh-test-${Date.now()}@example.com`;
    const registerMutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          accessToken
          refreshToken
        }
      }
    `;

    const registerResponse = await graphqlRequest(request, registerMutation, {
      input: {
        email,
        password: testPassword,
      },
    });

    const registerBody = await registerResponse.json();
    const { refreshToken } = registerBody.data.register;

    // Use refresh token to get new tokens
    const refreshMutation = `
      mutation RefreshToken($input: RefreshTokenInput!) {
        refreshToken(input: $input) {
          accessToken
          refreshToken
        }
      }
    `;

    const response = await graphqlRequest(request, refreshMutation, {
      input: {
        refreshToken,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.errors).toBeUndefined();
    expect(body.data.refreshToken).toBeDefined();
    expect(body.data.refreshToken.accessToken).toBeTruthy();
    expect(body.data.refreshToken.refreshToken).toBeTruthy();
    // New tokens should be different from old ones
    expect(body.data.refreshToken.accessToken).not.toBe(
      registerBody.data.register.accessToken,
    );
  });

  test('should fail refresh with invalid token', async ({ request }) => {
    const refreshMutation = `
      mutation RefreshToken($input: RefreshTokenInput!) {
        refreshToken(input: $input) {
          accessToken
        }
      }
    `;

    const response = await graphqlRequest(request, refreshMutation, {
      input: {
        refreshToken: 'invalid.token.here',
      },
    });

    const body = await response.json();
    expect(body.errors).toBeDefined();
    expect(body.errors[0].message).toContain('Invalid or expired');
  });

  test('should get current user with valid access token', async ({
    request,
  }) => {
    // First register and get access token
    const email = `me-test-${Date.now()}@example.com`;
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

    const registerResponse = await graphqlRequest(request, registerMutation, {
      input: {
        email,
        password: testPassword,
        firstName: 'Test',
        lastName: 'User',
      },
    });

    const registerBody = await registerResponse.json();
    const { accessToken } = registerBody.data.register;

    // Query current user with access token
    const meQuery = `
      query Me {
        me {
          id
          email
          firstName
          lastName
          isActive
        }
      }
    `;

    const response = await graphqlRequest(
      request,
      meQuery,
      {},
      {
        Authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.errors).toBeUndefined();
    expect(body.data.me).toBeDefined();
    expect(body.data.me.email).toBe(email);
    expect(body.data.me.firstName).toBe('Test');
    expect(body.data.me.lastName).toBe('User');
    expect(body.data.me.isActive).toBe(true);
  });

  test('should return error for me query without auth token', async ({
    request,
  }) => {
    const meQuery = `
      query Me {
        me {
          id
          email
        }
      }
    `;

    const response = await graphqlRequest(request, meQuery);

    const body = await response.json();
    // Should return an error because of @UseGuards(GqlAuthGuard)
    expect(body.errors).toBeDefined();
  });
});
