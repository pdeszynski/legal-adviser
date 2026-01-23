'use client';

import { useEffect, useState } from 'react';
import { ensureCsrfToken } from '@/lib/csrf';

/**
 * CSRF Token Provider
 *
 * This provider ensures that a valid CSRF token is available
 * when the app initializes. It fetches a token from the server
 * if one doesn't already exist in cookies or local storage.
 *
 * This should be placed near the root of the app to ensure all
 * GraphQL mutations have access to a CSRF token.
 */
export function CsrfProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure we have a CSRF token on mount
    ensureCsrfToken()
      .then(() => {
        setIsReady(true);
      })
      .catch((error) => {
        // If fetching fails, we still mark as ready - the token might exist in cookies
        console.warn('Failed to ensure CSRF token:', error);
        setIsReady(true);
      });
  }, []);

  // Don't render children until CSRF token is ensured
  // This prevents mutations from executing before the token is available
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
