'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useIsAuthenticated, useLogout } from '@refinedev/core';
import { getAccessToken, getRefreshToken } from '@providers/auth-provider/auth-provider.client';
import { useAuthContext } from '@/contexts/auth-context';

/**
 * JWT token validation utilities
 */
const JWTUtils = {
  /**
   * Decode JWT payload without verification (for expiry check only)
   */
  decodeJWT(token: string): { exp?: number } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = parts[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  },

  /**
   * Check if JWT token is expired or will expire within buffer seconds
   */
  isTokenExpired(token: string, bufferSeconds: number = 60): boolean {
    const decoded = this.decodeJWT(token);
    if (!decoded?.exp) return true; // No expiry info, consider expired

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp - bufferSeconds < now;
  },

  /**
   * Get time until token expires in seconds
   */
  getTimeUntilExpiry(token: string): number | null {
    const decoded = this.decodeJWT(token);
    if (!decoded?.exp) return null;

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.exp - now);
  },
};

/**
 * Protected route patterns that require authentication
 * These routes should trigger auth validation checks
 */
const PROTECTED_ROUTE_PATTERNS = [
  /^\/dashboard/,
  /^\/settings/,
  /^\/documents/,
  /^\/chat/,
  /^\/rulings/,
  /^\/templates/,
  /^\/notifications/,
  /^\/billing/,
  /^\/usage/,
  /^\/audit-logs/,
  /^\/analyze-case/,
  /^\/advanced-search/,
];

/**
 * Public routes that should not trigger auth checks
 */
const PUBLIC_ROUTE_PATTERNS = [
  /^\/login/,
  /^\/register/,
  /^\/forgot-password/,
  /^\/update-password/,
  /^\/demo/,
  /^\/waitlist/,
  /^\/$/,
];

/**
 * Check if a route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  // Check if it's a public route first
  if (PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return false;
  }
  // Check if it matches protected patterns
  return PROTECTED_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

/**
 * Check if tokens are valid (both present and not expired)
 */
function areTokensValid(): { valid: boolean; reason?: string } {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  if (!accessToken && !refreshToken) {
    return { valid: false, reason: 'no_tokens' };
  }

  if (accessToken && JWTUtils.isTokenExpired(accessToken, 0)) {
    // Access token is expired, but we might be able to refresh
    if (!refreshToken) {
      return { valid: false, reason: 'access_expired_no_refresh' };
    }
    if (JWTUtils.isTokenExpired(refreshToken, 0)) {
      return { valid: false, reason: 'refresh_expired' };
    }
  }

  return { valid: true };
}

/**
 * Auth Guard Hook Options
 */
interface AuthGuardOptions {
  /**
   * Enable window focus refresh
   * @default true
   */
  enableFocusRefresh?: boolean;
  /**
   * Buffer time in seconds before token expiry to consider it expired
   * @default 60 (1 minute)
   */
  expiryBufferSeconds?: number;
  /**
   * Custom callback when auth check fails
   */
  onAuthFailed?: (reason: string) => void;
}

/**
 * Auth Guard Hook
 *
 * Provides client-side route protection by:
 * 1. Checking authentication state on route change
 * 2. Validating stored token validity (checking expiry and format)
 * 3. Automatically redirecting to /login if invalid or missing token
 * 4. Preserving intended destination (redirect after login)
 * 5. Refreshing auth state on window focus
 * 6. Handling browser back button to expired sessions
 *
 * This works client-side without full server round-trip.
 *
 * @example
 * ```tsx
 * function App() {
 *   useAuthGuard();
 *   return <div>{children}</div>;
 * }
 * ```
 */
export function useAuthGuard(options: AuthGuardOptions = {}) {
  const {
    enableFocusRefresh = true,
    expiryBufferSeconds = 60,
    onAuthFailed,
  } = options;

  const pathname = usePathname();
  const router = useRouter();
  const { data: authData, isLoading: isAuthLoading } = useIsAuthenticated();
  const { mutate: logout } = useLogout();
  const { handleSessionExpiry } = useAuthContext();

  // Track previous path to detect back navigation
  const previousPathRef = useRef(pathname);
  const isCheckingRef = useRef(false);
  const lastCheckTimeRef = useRef(0);
  const CHECK_THROTTLE_MS = 1000; // Don't check more than once per second

  /**
   * Redirect to login with return URL
   */
  const redirectToLogin = useCallback(
    (returnUrl?: string) => {
      const redirectParam = returnUrl || pathname;
      const loginUrl = `/login?redirect=${encodeURIComponent(redirectParam)}`;
      router.push(loginUrl);
    },
    [pathname, router],
  );

  /**
   * Perform authentication check
   */
  const performAuthCheck = useCallback(async () => {
    // Throttle checks
    const now = Date.now();
    if (isCheckingRef.current || now - lastCheckTimeRef.current < CHECK_THROTTLE_MS) {
      return;
    }

    isCheckingRef.current = true;
    lastCheckTimeRef.current = now;

    try {
      // Wait for Refine auth check to complete
      if (isAuthLoading) {
        return;
      }

      // Check token validity
      const tokenValidation = areTokensValid();

      if (!tokenValidation.valid) {
        console.log('[AuthGuard] Token validation failed:', tokenValidation.reason);
        onAuthFailed?.(tokenValidation.reason || 'unknown');

        // Clear auth and redirect
        handleSessionExpiry({
          showNotification: true,
          notificationMessage: 'Your session has expired. Please log in again.',
        });

        return;
      }

      // If Refine says not authenticated but tokens exist, tokens might be invalid
      if (!authData?.authenticated) {
        console.log('[AuthGuard] Refine auth check failed');
        handleSessionExpiry({
          showNotification: true,
          notificationMessage: 'Please log in to continue.',
        });
        return;
      }

      // Check if access token is expiring soon (within buffer)
      const accessToken = getAccessToken();
      if (accessToken) {
        const timeUntilExpiry = JWTUtils.getTimeUntilExpiry(accessToken);
        if (timeUntilExpiry !== null && timeUntilExpiry < expiryBufferSeconds) {
          console.log('[AuthGuard] Token expiring soon, attempting refresh');
          // The auth provider will handle refresh on next API call
          // We could proactively trigger it here if needed
        }
      }
    } finally {
      isCheckingRef.current = false;
    }
  }, [
    authData,
    isAuthLoading,
    expiryBufferSeconds,
    onAuthFailed,
    handleSessionExpiry,
  ]);

  /**
   * Handle route changes
   */
  useEffect(() => {
    // Skip if not a protected route
    if (!isProtectedRoute(pathname)) {
      return;
    }

    // Perform auth check
    performAuthCheck();
  }, [pathname, performAuthCheck]);

  /**
   * Handle browser back button
   * Detect when user navigates back to a protected route
   */
  useEffect(() => {
    if (previousPathRef.current !== pathname) {
      // Path changed, check if it's a back navigation to protected route
      if (isProtectedRoute(pathname) && !isProtectedRoute(previousPathRef.current)) {
        console.log('[AuthGuard] Back navigation to protected route, checking auth');
        performAuthCheck();
      }
      previousPathRef.current = pathname;
    }
  }, [pathname, performAuthCheck]);

  /**
   * Window focus refresh
   * Check auth when user returns to the tab
   */
  useEffect(() => {
    if (!enableFocusRefresh) return;

    const handleFocus = () => {
      // Only check if currently on a protected route
      if (isProtectedRoute(pathname)) {
        console.log('[AuthGuard] Window focused, checking auth');
        performAuthCheck();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [pathname, enableFocusRefresh, performAuthCheck]);

  /**
   * Visibility change handler
   * Also check when tab becomes visible again
   */
  useEffect(() => {
    if (!enableFocusRefresh) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isProtectedRoute(pathname)) {
        console.log('[AuthGuard] Tab became visible, checking auth');
        performAuthCheck();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pathname, enableFocusRefresh, performAuthCheck]);
}

/**
 * Hook to get the stored redirect URL from login page
 */
export function useStoredRedirect() {
  const getRedirectUrl = useCallback(() => {
    if (typeof window === 'undefined') return '/dashboard';

    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');

    // Validate redirect URL to prevent open redirects
    if (redirect) {
      // Only allow relative URLs starting with /
      if (redirect.startsWith('/') && !redirect.startsWith('//')) {
        return redirect;
      }
    }

    return '/dashboard';
  }, []);

  return { getRedirectUrl };
}
