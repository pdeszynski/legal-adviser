'use client';

import type { AuthProvider } from '@refinedev/core';
import Cookies from 'js-cookie';
import { parseGraphQLError, parseExceptionError } from '@/lib/auth-errors';
import { getCsrfHeaders } from '@/lib/csrf';
import {
  LoginDocument,
  RegisterDocument,
  RefreshTokenDocument,
  MeDocument,
  AcceptDisclaimerDocument,
  type LoginMutation,
  type RegisterMutation,
  type RefreshTokenMutation,
  type MeQuery,
  type AcceptDisclaimerMutation,
} from '@/generated/graphql';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

// Cookie keys
const AUTH_COOKIE = 'auth';
const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

// Token expiration times (in days)
const ACCESS_TOKEN_EXPIRY = 1 / 24; // 1 hour (60 minutes)
const REFRESH_TOKEN_EXPIRY = 7; // 7 days

// Cookie security options
// Use Secure flag in production (HTTPS) for additional security
const isProduction = process.env.NODE_ENV === 'production';
const COOKIE_SECURE = isProduction;

/**
 * GraphQL response wrapper type
 */
interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
}

/**
 * Execute a GraphQL mutation or query using generated document nodes
 */
async function executeGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
  accessToken?: string,
): Promise<GraphQLResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getCsrfHeaders(), // Include CSRF token for mutations
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    credentials: 'include', // Required for CORS to send/receive cookies
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const body = await response.json();

  if (!response.ok) {
    // If we have a formatted GraphQL error body even on non-200, return it
    if (body.errors || body.data) {
      return body;
    }
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  return body;
}

/**
 * Store authentication tokens and user data in cookies
 */
function storeAuthData(payload: LoginMutation['login'] | RegisterMutation['register']): void {
  // Store tokens separately for easier management
  if (payload.accessToken) {
    Cookies.set(ACCESS_TOKEN_COOKIE, payload.accessToken, {
      expires: ACCESS_TOKEN_EXPIRY,
      path: '/',
      sameSite: 'lax',
      secure: COOKIE_SECURE,
    });
  }

  if (payload.refreshToken) {
    Cookies.set(REFRESH_TOKEN_COOKIE, payload.refreshToken, {
      expires: REFRESH_TOKEN_EXPIRY,
      path: '/',
      sameSite: 'lax',
      secure: COOKIE_SECURE,
    });
  }

  // Store user data and metadata
  if (payload.user) {
    Cookies.set(
      AUTH_COOKIE,
      JSON.stringify({
        user: payload.user,
        roles: [payload.user.role || 'user'], // Use role from backend
      }),
      {
        expires: REFRESH_TOKEN_EXPIRY,
        path: '/',
        sameSite: 'lax',
        secure: COOKIE_SECURE,
      },
    );
  }
}

/**
 * Update tokens after refresh
 */
function updateTokens(payload: RefreshTokenMutation['refreshToken']): void {
  Cookies.set(ACCESS_TOKEN_COOKIE, payload.accessToken, {
    expires: ACCESS_TOKEN_EXPIRY,
    path: '/',
    sameSite: 'lax',
    secure: COOKIE_SECURE,
  });

  Cookies.set(REFRESH_TOKEN_COOKIE, payload.refreshToken, {
    expires: REFRESH_TOKEN_EXPIRY,
    path: '/',
    sameSite: 'lax',
    secure: COOKIE_SECURE,
  });
}

/**
 * Clear all authentication cookies
 */
function clearAuthData(): void {
  Cookies.remove(AUTH_COOKIE, { path: '/' });
  Cookies.remove(ACCESS_TOKEN_COOKIE, { path: '/' });
  Cookies.remove(REFRESH_TOKEN_COOKIE, { path: '/' });
}

/**
 * Get access token from cookies
 */
function getAccessToken(): string | undefined {
  return Cookies.get(ACCESS_TOKEN_COOKIE);
}

/**
 * Get refresh token from cookies
 */
function getRefreshToken(): string | undefined {
  return Cookies.get(REFRESH_TOKEN_COOKIE);
}

/**
 * Try to refresh the access token using the refresh token
 */
async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const result = await executeGraphQL<RefreshTokenMutation>(RefreshTokenDocument, {
      input: { refreshToken },
    });

    if (result.errors || !result.data?.refreshToken) {
      return false;
    }

    updateTokens(result.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract error message from GraphQL response
 * @deprecated Use parseGraphQLError from @/lib/auth-errors instead
 */
function extractErrorMessage(
  errors: Array<{ message: string; extensions?: Record<string, unknown> }>,
): string {
  const authError = parseGraphQLError(
    errors as Array<{ message: string; extensions?: Record<string, unknown> }>,
  );
  return authError?.userMessage || 'An error occurred';
}

/**
 * GraphQL-based Authentication Provider for Refine
 *
 * Implements login, logout, register, and session management
 * using GraphQL mutations and queries.
 */
export const authProviderClient: AuthProvider = {
  /**
   * Login with email/username and password
   */
  login: async ({ email, password }) => {
    try {
      const result = await executeGraphQL<LoginMutation>(LoginDocument, {
        input: {
          username: email, // Backend accepts email as username
          password,
        },
      });

      if (result.errors) {
        const authError = parseGraphQLError(result.errors);
        return {
          success: false,
          error: {
            message: authError?.userMessage || 'Login failed',
            name: authError?.code || 'LoginError',
          },
        };
      }

      if (result.data?.login) {
        storeAuthData(result.data.login);

        return {
          success: true,
          redirectTo: '/chat',
        };
      }

      return {
        success: false,
        error: {
          name: 'LoginError',
          message: 'No response received from server',
        },
      };
    } catch (error) {
      const authError = parseExceptionError(error);
      return {
        success: false,
        error: {
          name: authError.code,
          message: authError.userMessage,
        },
      };
    }
  },

  /**
   * Register a new user account
   */
  register: async ({ email, password, firstName, lastName, username }) => {
    try {
      const result = await executeGraphQL<RegisterMutation>(RegisterDocument, {
        input: {
          email,
          password,
          username: username || undefined,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        },
      });

      if (result.errors) {
        return {
          success: false,
          error: {
            message: extractErrorMessage(result.errors),
            name: 'RegistrationError',
          },
        };
      }

      if (result.data?.register) {
        storeAuthData(result.data.register);

        return {
          success: true,
          redirectTo: '/chat',
        };
      }

      return {
        success: false,
        error: {
          name: 'RegistrationError',
          message: 'No response received from server',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          name: 'NetworkError',
          message: error instanceof Error ? error.message : 'Failed to connect to server',
        },
      };
    }
  },

  /**
   * Forgot password placeholder (not implemented)
   */
  forgotPassword: async () => {
    return {
      success: false,
      error: {
        message: 'Forgot password not implemented yet',
        name: 'NotImplemented',
      },
    };
  },

  /**
   * Update password placeholder (not implemented)
   */
  updatePassword: async () => {
    return {
      success: false,
      error: {
        message: 'Update password not implemented yet',
        name: 'NotImplemented',
      },
    };
  },

  /**
   * Logout - clear all authentication data
   */
  logout: async () => {
    clearAuthData();
    return {
      success: true,
      redirectTo: '/login',
    };
  },

  /**
   * Check if user is authenticated
   * Attempts to refresh token if access token is expired
   */
  check: async () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    const auth = Cookies.get(AUTH_COOKIE);

    // If we have an access token and auth data, we're authenticated
    if (accessToken && auth) {
      return {
        authenticated: true,
      };
    }

    // If we have a refresh token but no access token, try to refresh
    if (!accessToken && refreshToken) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        return {
          authenticated: true,
        };
      }
    }

    // Not authenticated
    clearAuthData();
    return {
      authenticated: false,
      logout: true,
      redirectTo: '/login',
    };
  },

  /**
   * Get user permissions/roles
   */
  getPermissions: async () => {
    const auth = Cookies.get(AUTH_COOKIE);
    if (auth) {
      try {
        const parsedAuth = JSON.parse(auth);
        return parsedAuth.roles || null;
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Get current user identity
   * Uses cached data from cookies, with optional refresh from server
   */
  getIdentity: async () => {
    const auth = Cookies.get(AUTH_COOKIE);
    const accessToken = getAccessToken();

    if (!auth) {
      return null;
    }

    try {
      const parsedAuth = JSON.parse(auth);
      const cachedUser = parsedAuth.user as MeQuery['me'];

      // If we have an access token, try to get fresh user data
      if (accessToken) {
        try {
          const result = await executeGraphQL<MeQuery>(MeDocument, undefined, accessToken);

          if (result.data?.me) {
            // Update cached user data
            const updatedAuth = {
              ...parsedAuth,
              user: result.data.me,
            };
            Cookies.set(AUTH_COOKIE, JSON.stringify(updatedAuth), {
              expires: REFRESH_TOKEN_EXPIRY,
              path: '/',
              sameSite: 'lax',
            });

            const userData = result.data.me;
            return {
              ...userData,
              name:
                userData.firstName && userData.lastName
                  ? `${userData.firstName} ${userData.lastName}`
                  : userData.username || userData.email,
            };
          }
        } catch {
          // If fetch fails, use cached data
        }
      }

      // Return cached user data
      if (!cachedUser) return null;
      return {
        ...cachedUser,
        name:
          cachedUser.firstName && cachedUser.lastName
            ? `${cachedUser.firstName} ${cachedUser.lastName}`
            : cachedUser.username || cachedUser.email,
      };
    } catch {
      return null;
    }
  },

  /**
   * Handle authentication errors
   */
  onError: async (error) => {
    const status = error.response?.status || error.statusCode;

    if (status === 401) {
      // Try to refresh the token
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        return { error };
      }

      // If refresh failed, logout
      return {
        logout: true,
        redirectTo: '/login',
      };
    }

    return { error };
  },
};

/**
 * Accept the legal disclaimer for the current user
 * Updates the user data in cookies after successful acceptance
 */
async function acceptDisclaimer(): Promise<{ success: boolean; error?: string }> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const result = await executeGraphQL<AcceptDisclaimerMutation>(
      AcceptDisclaimerDocument,
      undefined,
      accessToken,
    );

    if (result.errors) {
      return { success: false, error: extractErrorMessage(result.errors) };
    }

    if (result.data?.acceptDisclaimer) {
      // Update cached user data
      const auth = Cookies.get(AUTH_COOKIE);
      if (auth) {
        try {
          const parsedAuth = JSON.parse(auth);
          const updatedAuth = {
            ...parsedAuth,
            user: result.data.acceptDisclaimer,
          };
          Cookies.set(AUTH_COOKIE, JSON.stringify(updatedAuth), {
            expires: REFRESH_TOKEN_EXPIRY,
            path: '/',
            sameSite: 'lax',
          });
        } catch {
          // Ignore parse errors
        }
      }

      return { success: true };
    }

    return { success: false, error: 'No response received from server' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to accept disclaimer',
    };
  }
}

/**
 * Export helper function to get access token for other providers
 * (e.g., data provider for authenticated GraphQL requests)
 */
export { getAccessToken, getRefreshToken, tryRefreshToken, acceptDisclaimer };
