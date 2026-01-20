import type { AuthProvider } from '@refinedev/core';
import { cookies } from 'next/headers';

// Cookie keys (must match client-side auth provider)
const AUTH_COOKIE = 'auth';
const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

/**
 * Server-side authentication provider for Next.js server components
 *
 * This provider only implements the `check` method for server-side auth checks.
 * It verifies the presence of authentication cookies to determine if the user
 * is authenticated.
 *
 * For full authentication functionality (login, logout, register, etc.),
 * use the client-side auth provider.
 */
export const authProviderServer: Pick<AuthProvider, 'check' | 'getIdentity'> = {
  /**
   * Check if the user is authenticated on the server side
   *
   * Checks for the presence of either:
   * - An access token (user is fully authenticated)
   * - A refresh token (user session can be restored on client)
   */
  check: async () => {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE);
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE);
    const auth = cookieStore.get(AUTH_COOKIE);

    // If we have an access token and auth data, user is authenticated
    if (accessToken?.value && auth?.value) {
      return {
        authenticated: true,
      };
    }

    // If we have a refresh token, let client handle token refresh
    // Return authenticated to allow the page to load, client will refresh
    if (refreshToken?.value && auth?.value) {
      return {
        authenticated: true,
      };
    }

    return {
      authenticated: false,
      logout: true,
      redirectTo: '/login',
    };
  },

  /**
   * Get the current user identity from server-side cookies
   *
   * Returns cached user data from the auth cookie.
   * For fresh data from the server, use the client-side provider.
   */
  getIdentity: async () => {
    const cookieStore = await cookies();
    const auth = cookieStore.get(AUTH_COOKIE);

    if (!auth?.value) {
      return null;
    }

    try {
      const parsedAuth = JSON.parse(auth.value);
      const user = parsedAuth.user;

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        name:
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.username || user.email,
        email: user.email,
        ...user,
      };
    } catch {
      return null;
    }
  },
};
