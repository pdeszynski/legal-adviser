import { test, expect, APIRequestContext } from '@playwright/test';

/**
 * Temporary verification test for updateProfile mutation authentication
 * This test verifies that the fix for JWT context property name works correctly
 * The issue was: JwtStrategy returns { id } but AuthResolver was using { userId }
 */

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL || 'http://localhost:3333/graphql';

// Helper function to execute GraphQL requests
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

test.describe('updateProfile Mutation Authentication', () => {
  test('should update profile for authenticated user', async ({ request }) => {
    // First register a user
    const timestamp = Date.now();
    const email = `update-profile-${timestamp}@example.com`;
    const password = 'TestPassword123!';

    const registerMutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          accessToken
          user {
            id
            email
            firstName
            lastName
          }
        }
      }
    `;

    const registerResponse = await graphqlRequest(request, registerMutation, {
      input: {
        email,
        password,
        username: `updateuser${timestamp}`,
        firstName: 'Original',
        lastName: 'Name',
      },
    });

    expect(registerResponse.status()).toBe(200);
    const registerBody = await registerResponse.json();
    expect(registerBody.errors).toBeUndefined();

    const { accessToken } = registerBody.data.register;

    // Now update profile with authentication
    const updateProfileMutation = `
      mutation UpdateProfile($input: UpdateProfileInput!) {
        updateProfile(input: $input) {
          id
          email
          firstName
          lastName
        }
      }
    `;

    const updateResponse = await graphqlRequest(
      request,
      updateProfileMutation,
      {
        input: {
          firstName: 'Updated',
          lastName: 'Surname',
        },
      },
      {
        Authorization: `Bearer ${accessToken}`,
      },
    );

    expect(updateResponse.status()).toBe(200);
    const updateBody = await updateResponse.json();

    // Verify the mutation succeeded (no errors)
    expect(updateBody.errors).toBeUndefined();
    expect(updateBody.data.updateProfile).toBeDefined();
    expect(updateBody.data.updateProfile.firstName).toBe('Updated');
    expect(updateBody.data.updateProfile.lastName).toBe('Surname');
    expect(updateBody.data.updateProfile.email).toBe(email);
  });

  test('should return error for updateProfile without auth token', async ({ request }) => {
    const updateProfileMutation = `
      mutation UpdateProfile($input: UpdateProfileInput!) {
        updateProfile(input: $input) {
          id
          email
        }
      }
    `;

    const response = await graphqlRequest(request, updateProfileMutation, {
      input: {
        firstName: 'No',
        lastName: 'Auth',
      },
    });

    const body = await response.json();
    // Should return an error because @UseGuards(GqlAuthGuard) requires auth
    expect(body.errors).toBeDefined();
  });

  test('should get me query with valid access token', async ({ request }) => {
    // Register a user
    const timestamp = Date.now();
    const email = `me-query-${timestamp}@example.com`;

    const registerMutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          accessToken
          user {
            id
            email
            firstName
            lastName
          }
        }
      }
    `;

    const registerResponse = await graphqlRequest(request, registerMutation, {
      input: {
        email,
        password: 'TestPassword123!',
        username: `meuser${timestamp}`,
        firstName: 'Me',
        lastName: 'Query',
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

    const response = await graphqlRequest(request, meQuery, {}, {
      Authorization: `Bearer ${accessToken}`,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.errors).toBeUndefined();
    expect(body.data.me).toBeDefined();
    expect(body.data.me.email).toBe(email);
    expect(body.data.me.firstName).toBe('Me');
    expect(body.data.me.lastName).toBe('Query');
    expect(body.data.me.isActive).toBe(true);
  });

  test('should accept disclaimer for authenticated user', async ({ request }) => {
    // Register a user
    const timestamp = Date.now();
    const email = `disclaimer-${timestamp}@example.com`;

    const registerMutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          accessToken
          user {
            id
            disclaimerAccepted
          }
        }
      }
    `;

    const registerResponse = await graphqlRequest(request, registerMutation, {
      input: {
        email,
        password: 'TestPassword123!',
        username: `disclaimeruser${timestamp}`,
      },
    });

    const registerBody = await registerResponse.json();
    const { accessToken, user } = registerBody.data.register;

    // User should not have disclaimer accepted initially
    expect(user.disclaimerAccepted).toBe(false);

    // Accept disclaimer
    const acceptDisclaimerMutation = `
      mutation AcceptDisclaimer {
        acceptDisclaimer {
          id
          disclaimerAccepted
          disclaimerAcceptedAt
        }
      }
    `;

    const response = await graphqlRequest(
      request,
      acceptDisclaimerMutation,
      {},
      {
        Authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.errors).toBeUndefined();
    expect(body.data.acceptDisclaimer).toBeDefined();
    expect(body.data.acceptDisclaimer.disclaimerAccepted).toBe(true);
    expect(body.data.acceptDisclaimer.disclaimerAcceptedAt).toBeTruthy();
  });
});
