'use client';

import { useEffect, type PropsWithChildren } from 'react';
import { useRouter } from 'next/navigation';
import { useLogout } from '@refinedev/core';
import { initializeSessionHandler, resetSessionExpiryFlag } from '@/providers/data-provider';
import {
  createSessionExpiryHandler,
  resetSessionExpiryFlag as resetInterceptorFlag,
} from '@/lib/http-interceptor';

/**
 * Session Interceptor Provider
 *
 * Initializes the session expiry handling by connecting the data provider's
 * session handler to the Refine logout function and Next.js router.
 *
 * This provider:
 * 1. Sets up the session expiry callback in the data provider
 * 2. Resets the session expiry flag when mounted (useful after login)
 * 3. Handles 401/403 responses by showing a toast and logging out
 *
 * Place this provider near the top of your component tree, inside the Refine provider.
 */
export const SessionInterceptorProvider = ({ children }: PropsWithChildren) => {
  const router = useRouter();
  const { mutate: logout } = useLogout();

  useEffect(() => {
    // Define the session expiry handler
    const handleSessionExpiry = () => {
      // Show toast is handled by the interceptor
      // Perform logout
      logout();
      // Redirect to login
      router.push('/login');
    };

    // Initialize the session handler in the data provider
    initializeSessionHandler(handleSessionExpiry);

    // Also initialize the interceptor's handler (for direct use)
    const interceptorHandler = createSessionExpiryHandler({
      onSessionExpiry: handleSessionExpiry,
    });

    // Reset flags on mount (in case user just logged in)
    resetSessionExpiryFlag();
    resetInterceptorFlag();

    // Cleanup on unmount
    return () => {
      // Reset handler on unmount
      initializeSessionHandler(() => {});
    };
  }, [logout, router]);

  return <>{children}</>;
};
