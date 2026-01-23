'use client';

import Cookies from 'js-cookie';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_CACHE_KEY = 'csrf_token_cache';
const CSRF_TOKEN_TIMESTAMP_KEY = 'csrf_token_timestamp';
const CSRF_CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Note: NEXT_PUBLIC_API_URL already includes /api prefix
// e.g., http://localhost:3001/api
// We use it without the /api suffix for direct API calls
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const BASE_URL = API_URL.replace(/\/api$/, ''); // Remove /api suffix for constructing paths

/**
 * Get the raw CSRF token from the signed cookie
 *
 * The cookie contains the signed token (token.signature),
 * but we need to extract just the raw token portion to send in the header.
 */
function getRawTokenFromCookie(signedToken: string): string | undefined {
  if (!signedToken) return undefined;
  // The signed token format is: "token.signature"
  // We need to extract just the token part (before the last dot)
  const parts = signedToken.split('.');
  if (parts.length >= 2) {
    // Return the raw token (everything before the last dot which is the signature)
    // The format is: {64-char-hex}.{64-char-hex}
    // So we split by '.' and take all but the last part, then join
    parts.pop(); // Remove signature (last element)
    return parts.join('.');
  }
  return signedToken;
}

/**
 * Get the CSRF token from cookie (primary) or cache (fallback)
 *
 * IMPORTANT: We must read from the cookie first, not cache,
 * because the server may issue a new token at any time.
 * Using a stale cached token will cause CSRF validation to fail.
 */
export function getCsrfToken(): string | undefined {
  // First, always try to read from the current cookie
  // This ensures we use the latest token issued by the server
  const signedToken = Cookies.get(CSRF_COOKIE_NAME);
  if (signedToken) {
    const rawToken = getRawTokenFromCookie(signedToken);
    if (rawToken) {
      // Update cache with the current token from cookie
      const cachedToken = localStorage.getItem(CSRF_TOKEN_CACHE_KEY);

      // Only update cache if token changed or cache is expired
      if (cachedToken !== rawToken) {
        localStorage.setItem(CSRF_TOKEN_CACHE_KEY, rawToken);
        localStorage.setItem(CSRF_TOKEN_TIMESTAMP_KEY, Date.now().toString());
      }
      return rawToken;
    }
  }

  // Fallback: try to get from cache (in case cookie is not accessible)
  const cachedToken = localStorage.getItem(CSRF_TOKEN_CACHE_KEY);
  const cachedTimestamp = localStorage.getItem(CSRF_TOKEN_TIMESTAMP_KEY);

  if (cachedToken && cachedTimestamp) {
    const timestamp = parseInt(cachedTimestamp, 10);
    const now = Date.now();

    // Check if cache is still valid (within 1 hour)
    if (now - timestamp < CSRF_CACHE_DURATION) {
      return cachedToken;
    }
    // Cache expired, clear it
    localStorage.removeItem(CSRF_TOKEN_CACHE_KEY);
    localStorage.removeItem(CSRF_TOKEN_TIMESTAMP_KEY);
  }

  return undefined;
}

/**
 * Fetch a new CSRF token from the server
 *
 * This should be called on app initialization to ensure
 * a valid CSRF token is available for mutations.
 *
 * After fetching, we read the token from the cookie (not response body)
 * to ensure we have the properly signed token that matches what the server expects.
 */
export async function fetchCsrfToken(): Promise<string | undefined> {
  try {
    const response = await fetch(`${BASE_URL}/api/csrf-token`, {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      // After fetching, read the token from the cookie
      // The response body contains the raw token, but the cookie has the signed token
      // We need to extract the raw token from the signed cookie
      const signedToken = Cookies.get(CSRF_COOKIE_NAME);
      if (signedToken) {
        const rawToken = getRawTokenFromCookie(signedToken);
        if (rawToken) {
          // Cache the raw token
          localStorage.setItem(CSRF_TOKEN_CACHE_KEY, rawToken);
          localStorage.setItem(CSRF_TOKEN_TIMESTAMP_KEY, Date.now().toString());
          return rawToken;
        }
      }
    }
  } catch {
    // Silently fail - the token might already exist in cookies
  }

  return undefined;
}

/**
 * Ensure a CSRF token is available, fetching one if needed
 *
 * This is a convenience function that checks for an existing token
 * and fetches a new one if none exists.
 */
export async function ensureCsrfToken(): Promise<string | undefined> {
  const existingToken = getCsrfToken();
  if (existingToken) {
    return existingToken;
  }

  return fetchCsrfToken();
}

/**
 * Get the CSRF headers for a request
 *
 * Returns an object with the X-CSRF-Token header if a token is available.
 * This can be spread into request headers: { ...headers, ...getCsrfHeaders() }
 */
export function getCsrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  if (token) {
    return { [CSRF_HEADER_NAME]: token };
  }
  return {};
}

/**
 * Clear the cached CSRF token
 *
 * This should be called on logout to prevent stale tokens.
 */
export function clearCsrfToken(): void {
  localStorage.removeItem(CSRF_TOKEN_CACHE_KEY);
  localStorage.removeItem(CSRF_TOKEN_TIMESTAMP_KEY);
}

/**
 * Export constants for use in other modules
 */
export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
