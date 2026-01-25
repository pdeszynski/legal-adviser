'use client';

import { useEffect, type PropsWithChildren } from 'react';
import { useAuthContext } from '@/contexts/auth-context';
import { initializeSessionHandler } from '@/providers/data-provider';
import {
  resetSessionExpiryFlag as resetInterceptorFlag,
} from '@/lib/http-interceptor';

/**
 * Session Interceptor Provider
 *
 * Connects the data provider's session handler to the AuthContext.
 * This ensures that 401/403 responses trigger proper toast notifications
 * and redirects during SPA navigation.
 *
 * This provider:
 * 1. Sets up the session expiry callback in the data provider
 * 2. Resets the session expiry flag when mounted (useful after login)
 * 3. Handles 401/403 responses by showing a toast and logging out
 *
 * Place this provider near the top of your component tree, inside the Refine provider
 * and AuthProvider.
 */
export const SessionInterceptorProvider = ({ children }: PropsWithChildren) => {
  const { handleSessionExpiry, resetSessionFlag } = useAuthContext();

  useEffect(() => {
    // Initialize the session handler in the data provider
    // This will be called when a 401/403 is detected in GraphQL requests
    initializeSessionHandler(handleSessionExpiry);

    // Reset flags on mount (in case user just logged in)
    resetInterceptorFlag();
    resetSessionFlag();

    // Cleanup on unmount
    return () => {
      // Reset handler on unmount
      initializeSessionHandler(() => {});
    };
  }, [handleSessionExpiry, resetSessionFlag]);

  return <>{children}</>;
};
