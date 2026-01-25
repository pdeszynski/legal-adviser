'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useLogout } from '@refinedev/core';
import { toast } from '@/hooks/use-toast';
import {
  resetSessionExpiryFlag,
  type InterceptorOptions,
} from '@/lib/http-interceptor';

/**
 * Session expiry handler options
 */
interface SessionExpiryOptions extends InterceptorOptions {
  /**
   * Whether to show a toast notification
   * @default true
   */
  showNotification?: boolean;
  /**
   * Custom notification message
   * @default 'Your session has expired. Please log in again.'
   */
  notificationMessage?: string;
}

/**
 * Auth context interface
 */
interface AuthContextValue {
  /**
   * Handle session expiry with toast notification and logout
   */
  handleSessionExpiry: (options?: SessionExpiryOptions) => void;
  /**
   * Reset the session expiry handling flag (call after successful login)
   */
  resetSessionFlag: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Auth Provider options
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Default options for session expiry handling
 */
const DEFAULT_OPTIONS: SessionExpiryOptions = {
  showNotification: true,
  notificationMessage: 'Your session has expired. Please log in again.',
};

/**
 * Flag to prevent multiple simultaneous session expiry handlers
 */
let isHandlingSessionExpiry = false;

/**
 * Auth Provider Component
 *
 * Provides session expiry handling that works within the React context.
 * This ensures that toast notifications and redirects work correctly
 * during SPA navigation, not just on full page reload.
 *
 * Place this provider inside the Refine provider to have access to logout.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const { mutate: logout } = useLogout();

  const handleSessionExpiry = useCallback(
    (options: SessionExpiryOptions = {}) => {
      // Prevent multiple simultaneous handling
      if (isHandlingSessionExpiry) {
        return;
      }

      isHandlingSessionExpiry = true;

      const opts = { ...DEFAULT_OPTIONS, ...options };

      // Show toast notification (within React context)
      if (opts.showNotification) {
        toast({
          variant: 'destructive',
          title: 'Session Expired',
          description: opts.notificationMessage || DEFAULT_OPTIONS.notificationMessage!,
        });
      }

      // Small delay to ensure toast is visible before redirect
      setTimeout(() => {
        // Perform logout using Refine's logout
        logout();

        // Redirect to login
        router.push('/login');

        // Reset flag after a short delay (for next login)
        setTimeout(() => {
          isHandlingSessionExpiry = false;
        }, 1000);
      }, 100);
    },
    [logout, router],
  );

  const resetSessionFlag = useCallback(() => {
    resetSessionExpiryFlag();
    isHandlingSessionExpiry = false;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        handleSessionExpiry,
        resetSessionFlag,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 *
 * Provides session expiry handling that works in React context.
 *
 * @example
 * ```tsx
 * const { handleSessionExpiry, resetSessionFlag } = useAuthContext();
 *
 * // Call when 401/403 is detected
 * handleSessionExpiry();
 *
 * // Call after successful login to reset state
 * resetSessionFlag();
 * ```
 */
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
