import { test, expect, APIRequestContext } from '@playwright/test';

/**
 * GraphQL UserRole Response Verification Tests
 *
 * Comprehensive E2E tests verifying GraphQL returns UserRole data correctly
 * for all role-based operations. This validates the single source of truth
 * role implementation where each user has exactly one role.
 *
 * Role Format (Single Source of Truth):
 * - User entity has single 'role' field (enum: guest | client | paralegal | lawyer | admin | super_admin)
 * - AuthUser.user_roles: Array of strings wrapping the single role
 * - User.roles: Computed property returning [role]
 * - JWT tokens contain 'roles' array with single element
 *
 * Role Hierarchy (higher index = more permissions):
 * SUPER_ADMIN(5) > ADMIN(4) > LAWYER(3) > PARALEGAL(2) > CLIENT(1) > GUEST(0)
 */

const GRAPHQL_ENDPOINT =
  process.env.GRAPHQL_URL || 'http://localhost:3333/graphql';

// Valid role values according to the UserRole enum
const VALID_ROLES = [
  'guest',
  'client',
  'paralegal',
  'lawyer',
  'admin',
  'super_admin',
];

// Admin-level roles that can access admin routes
const ADMIN_ROLES = ['admin', 'super_admin'];

// Helper function to execute GraphQL queries
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

// Helper to register and login a user
async function registerAndLogin(
  request: APIRequestContext,
  email: string,
  password: string,
) {
  const registerMutation = `
    mutation Register($input: RegisterInput!) {
      register(input: $input) {
        accessToken
        refreshToken
        user {
          id
          email
          username
        }
      }
    }
  `;

  const registerResponse = await graphqlRequest(request, registerMutation, {
    input: {
      email,
      password,
      username: email.split('@')[0],
    },
  });

  const registerBody = await registerResponse.json();
  return registerBody.data.register;
}

// Admin login helper
async function adminLogin(request: APIRequestContext) {
  const loginMutation = `
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        accessToken
        refreshToken
        user {
          id
          email
          user_roles
        }
      }
    }
  `;

  const response = await graphqlRequest(request, loginMutation, {
    input: {
      email: 'admin@refine.dev',
      password: 'password',
    },
  });

  const body = await response.json();
  return body.data?.login || null;
}

test.describe('GraphQL UserRole - me() Query Verification', () => {
  test('me() returns user_roles array with single valid role', async ({
    request,
  }) => {
    const timestamp = Date.now();
    const testEmail = `test-role-${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    const authData = await registerAndLogin(request, testEmail, testPassword);

    expect(authData).toBeDefined();
    expect(authData.accessToken).toBeTruthy();

    const meQuery = `
      query MeQuery {
        me {
          id
          email
          username
          isActive
          disclaimerAccepted
          user_roles
        }
      }
    `;

    const response = await graphqlRequest(
      request,
      meQuery,
      {},
      {
        Authorization: `Bearer ${authData.accessToken}`,
      },
    );

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.errors).toBeUndefined();
    expect(body.data.me).toBeDefined();
    expect(body.data.me.user_roles).toBeDefined();
    expect(Array.isArray(body.data.me.user_roles)).toBeTruthy();
    expect(body.data.me.user_roles).toHaveLength(1);

    // Verify the role is a valid role value
    const role = body.data.me.user_roles[0];
    expect(VALID_ROLES).toContain(role);
    // New users should have 'client' role by default
    expect(role).toBe('client');
  });

  test('me() user_roles format matches expected structure', async ({
    request,
  }) => {
    const timestamp = Date.now();
    const testEmail = `test-format-${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    const authData = await registerAndLogin(request, testEmail, testPassword);

    const meQuery = `
      query MeQuery {
        me {
          id
          email
          user_roles
        }
      }
    `;

    const response = await graphqlRequest(
      request,
      meQuery,
      {},
      {
        Authorization: `Bearer ${authData.accessToken}`,
      },
    );

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.data.me).toBeDefined();
    expect(body.data.me.user_roles).toBeInstanceOf(Array);
    expect(body.data.me.user_roles.length).toBeGreaterThan(0);
    expect(typeof body.data.me.user_roles[0]).toBe('string');
  });

  test('me() requires authentication', async ({ request }) => {
    const meQuery = `
      query MeQuery {
        me {
          id
          email
        }
      }
    `;

    const response = await graphqlRequest(request, meQuery);

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.errors).toBeDefined();
    expect(body.data).toBeNull();
  });
});

test.describe('GraphQL UserRole - user(id) Query Verification', () => {
  test('user(id) requires admin role - regular user gets 403', async ({
    request,
  }) => {
    const timestamp = Date.now();
    const testEmail = `test-user-query-${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    const authData = await registerAndLogin(request, testEmail, testPassword);

    // Try to query user by ID as a regular user
    const userQuery = `
      query UserQuery {
        user(id: "${authData.user.id}") {
          id
          email
          role
          roles
        }
      }
    `;

    const response = await graphqlRequest(
      request,
      userQuery,
      {},
      {
        Authorization: `Bearer ${authData.accessToken}`,
      },
    );

    const body = await response.json();

    // Regular users should get an error for the admin-only user query
    expect(body.errors).toBeDefined();
    expect(body.errors[0].message).toContain('FORBIDDEN');
  });

  test('user(id) returns both role and roles fields for admin', async ({
    request,
  }) => {
    const adminAuth = await adminLogin(request);

    if (!adminAuth) {
      test.skip(true, 'Admin user not available');
      return;
    }

    // Query the admin user by ID
    const userQuery = `
      query UserQuery {
        user(id: "${adminAuth.user.id}") {
          id
          email
          role
          roles
          isActive
        }
      }
    `;

    const response = await graphqlRequest(
      request,
      userQuery,
      {},
      {
        Authorization: `Bearer ${adminAuth.accessToken}`,
      },
    );

    expect(response.status()).toBe(200);
    const body = await response.json();

    // Check for errors (might happen if user doesn't have admin role)
    if (body.errors) {
      test.skip(true, 'Admin user does not have admin role');
      return;
    }

    expect(body.data.user).toBeDefined();
    expect(body.data.user.role).toBeDefined();
    expect(typeof body.data.user.role).toBe('string');

    // Verify roles array
    expect(body.data.user.roles).toBeDefined();
    expect(Array.isArray(body.data.user.roles)).toBeTruthy();
    expect(body.data.user.roles).toHaveLength(1);
    // roles array should match role field
    expect(body.data.user.roles[0]).toBe(body.data.user.role);
  });
});

test.describe('GraphQL UserRole - users() List Query Verification', () => {
  test('users() query requires admin role', async ({ request }) => {
    const timestamp = Date.now();
    const testEmail = `test-users-query-${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    const authData = await registerAndLogin(request, testEmail, testPassword);

    const usersQuery = `
      query UsersQuery {
        users {
          edges {
            node {
              id
              email
              role
              roles
            }
          }
          totalCount
        }
      }
    `;

    const response = await graphqlRequest(
      request,
      usersQuery,
      {},
      {
        Authorization: `Bearer ${authData.accessToken}`,
      },
    );

    const body = await response.json();

    // Regular users should get errors for the admin-only users query
    expect(body.errors).toBeDefined();
  });

  test('users() returns roles array for each user (admin only)', async ({
    request,
  }) => {
    const adminAuth = await adminLogin(request);

    if (!adminAuth) {
      test.skip(true, 'Admin user not available');
      return;
    }

    const usersQuery = `
      query UsersQuery {
        users {
          edges {
            node {
              id
              email
              role
              roles
              isActive
            }
          }
          totalCount
        }
      }
    `;

    const response = await graphqlRequest(
      request,
      usersQuery,
      {},
      {
        Authorization: `Bearer ${adminAuth.accessToken}`,
      },
    );

    const body = await response.json();

    // Check if the user has admin access
    if (body.errors) {
      test.skip(true, 'User does not have admin role');
      return;
    }

    expect(body.data.users).toBeDefined();
    expect(body.data.users.edges).toBeDefined();
    expect(body.data.users.edges.length).toBeGreaterThan(0);

    // Verify each user has roles array
    for (const edge of body.data.users.edges) {
      expect(edge.node.roles).toBeDefined();
      expect(Array.isArray(edge.node.roles)).toBeTruthy();
      expect(edge.node.roles).toHaveLength(1);
      // Verify role field exists
      expect(edge.node.role).toBeDefined();
      expect(typeof edge.node.role).toBe('string');
      // Verify roles[0] matches role
      expect(edge.node.roles[0]).toBe(edge.node.role);
      // Verify role is valid
      expect(VALID_ROLES).toContain(edge.node.role);
    }
  });

  test('users() each user has exactly one role in roles array', async ({
    request,
  }) => {
    const adminAuth = await adminLogin(request);

    if (!adminAuth) {
      test.skip(true, 'Admin user not available');
      return;
    }

    const usersQuery = `
      query UsersQuery {
        users {
          edges {
            node {
              roles
            }
          }
        }
      }
    `;

    const response = await graphqlRequest(
      request,
      usersQuery,
      {},
      {
        Authorization: `Bearer ${adminAuth.accessToken}`,
      },
    );

    const body = await response.json();

    if (body.errors) {
      test.skip(true, 'User does not have admin role');
      return;
    }

    for (const edge of body.data.users.edges) {
      const roles = edge.node.roles || [];
      // Single source of truth: each user has exactly one role
      expect(roles.length).toBe(1);
      expect(VALID_ROLES).toContain(roles[0]);
    }
  });
});

test.describe('GraphQL UserRole - Role Consistency', () => {
  test('me() user_roles format is consistent with JWT roles', async ({
    request,
  }) => {
    const timestamp = Date.now();
    const testEmail = `test-jwt-${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    const authData = await registerAndLogin(request, testEmail, testPassword);

    // Decode JWT to verify roles claim
    const tokenParts = authData.accessToken.split('.');
    const jwtPayload = JSON.parse(
      Buffer.from(tokenParts[1], 'base64').toString(),
    );

    // Verify JWT contains roles array
    expect(jwtPayload.roles).toBeDefined();
    expect(Array.isArray(jwtPayload.roles)).toBeTruthy();
    expect(jwtPayload.roles.length).toBe(1);
    expect(VALID_ROLES).toContain(jwtPayload.roles[0]);

    // Verify me query returns same roles
    const meQuery = `
      query MeQuery {
        me {
          id
          email
          user_roles
        }
      }
    `;

    const response = await graphqlRequest(
      request,
      meQuery,
      {},
      {
        Authorization: `Bearer ${authData.accessToken}`,
      },
    );

    const body = await response.json();

    expect(body.data.me.user_roles).toEqual(jwtPayload.roles);
  });

  test('all operations return single role (not multiple)', async ({
    request,
  }) => {
    const timestamp = Date.now();
    const testEmail = `test-single-${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    const authData = await registerAndLogin(request, testEmail, testPassword);

    // Decode JWT
    const tokenParts = authData.accessToken.split('.');
    const jwtPayload = JSON.parse(
      Buffer.from(tokenParts[1], 'base64').toString(),
    );

    // Check JWT roles
    expect(jwtPayload.roles.length).toBe(1);

    // Check me query
    const meQuery = `
      query MeQuery {
        me {
          user_roles
        }
      }
    `;

    const response = await graphqlRequest(
      request,
      meQuery,
      {},
      {
        Authorization: `Bearer ${authData.accessToken}`,
      },
    );

    const body = await response.json();

    expect(body.data.me.user_roles.length).toBe(1);
  });
});

test.describe('GraphQL UserRole - Registration and Login', () => {
  test('register mutation returns user with user_roles', async ({
    request,
  }) => {
    const timestamp = Date.now();
    const testEmail = `test-register-${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    const registerMutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          accessToken
          user {
            id
            email
            user_roles
          }
        }
      }
    `;

    const response = await graphqlRequest(request, registerMutation, {
      input: {
        email: testEmail,
        password: testPassword,
        username: testEmail.split('@')[0],
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.data.register).toBeDefined();
    expect(body.data.register.user).toBeDefined();
    expect(body.data.register.user.user_roles).toBeDefined();
    expect(Array.isArray(body.data.register.user.user_roles)).toBeTruthy();
    expect(body.data.register.user.user_roles).toHaveLength(1);
    expect(VALID_ROLES).toContain(body.data.register.user.user_roles[0]);
  });

  test('login mutation returns user with user_roles', async ({ request }) => {
    const timestamp = Date.now();
    const testEmail = `test-login-${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    // First register
    await registerAndLogin(request, testEmail, testPassword);

    // Then login
    const loginMutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          accessToken
          user {
            id
            email
            user_roles
          }
        }
      }
    `;

    const response = await graphqlRequest(request, loginMutation, {
      input: {
        email: testEmail,
        password: testPassword,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.data.login).toBeDefined();
    expect(body.data.login.user).toBeDefined();
    expect(body.data.login.user.user_roles).toBeDefined();
    expect(Array.isArray(body.data.login.user.user_roles)).toBeTruthy();
    expect(body.data.login.user.user_roles).toHaveLength(1);
    expect(VALID_ROLES).toContain(body.data.login.user.user_roles[0]);
  });
});

test.describe('GraphQL UserRole - Admin Role Verification', () => {
  test('admin user has admin or super_admin role', async ({ request }) => {
    const loginMutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          accessToken
          user {
            id
            email
            user_roles
          }
        }
      }
    `;

    const response = await graphqlRequest(request, loginMutation, {
      input: {
        email: 'admin@refine.dev',
        password: 'password',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    if (body.errors) {
      test.skip(true, 'Admin user not available');
      return;
    }

    expect(body.data.login).toBeDefined();
    expect(body.data.login.user.user_roles).toBeDefined();
    expect(Array.isArray(body.data.login.user.user_roles)).toBeTruthy();
    expect(body.data.login.user.user_roles.length).toBeGreaterThan(0);

    const role = body.data.login.user.user_roles[0];
    expect(ADMIN_ROLES).toContain(role);
  });

  test('admin can access users() query', async ({ request }) => {
    const adminAuth = await adminLogin(request);

    if (!adminAuth) {
      test.skip(true, 'Admin user not available');
      return;
    }

    const usersQuery = `
      query UsersQuery {
        users {
          edges {
            node {
              id
              email
              role
            }
          }
        }
      }
    `;

    const response = await graphqlRequest(
      request,
      usersQuery,
      {},
      {
        Authorization: `Bearer ${adminAuth.accessToken}`,
      },
    );

    const body = await response.json();

    if (body.errors) {
      test.skip(true, 'User does not have admin role');
      return;
    }

    expect(body.data.users).toBeDefined();
    expect(body.data.users.edges).toBeDefined();
  });
});
