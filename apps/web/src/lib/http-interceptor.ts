'use client';

import { toast } from '@/hooks/use-toast';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

/**
 * Session expiry interceptor options
 */
interface InterceptorOptions {
  /**
   * Callback to execute when session expiry is detected
   * Typically triggers logout and redirect
   */
  onSessionExpiry?: () => void;
  /**
   * Whether to show toast notification on session expiry
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
 * Default options for the interceptor
 */
const defaultOptions: InterceptorOptions = {
  showNotification: true,
  notificationMessage: 'Your session has expired. Please log in again.',
};

/**
 * Status codes that indicate session expiry
 */
const SESSION_EXPIRY_STATUSES = [401, 403];

/**
 * Flag to prevent multiple simultaneous logout/toast calls
 * This prevents cascading 401/403 responses from triggering multiple logout flows
 */
let isHandlingSessionExpiry = false;

/**
 * Reset the session expiry handling flag
 * Call this after a successful login to reset the state
 */
export function resetSessionExpiryFlag(): void {
  isHandlingSessionExpiry = false;
}

/**
 * Check if a response status indicates session expiry
 */
function isSessionExpiryStatus(status: number): boolean {
  return SESSION_EXPIRY_STATUSES.includes(status);
}

/**
 * Show session expiry toast notification
 */
function showSessionExpiryToast(message: string): void {
  toast({
    variant: 'destructive',
    title: 'Session Expired',
    description: message,
  });
}

/**
 * Execute the session expiry callback with toast notification
 */
async function handleSessionExpiry(options: InterceptorOptions): Promise<void> {
  // Prevent multiple simultaneous handling
  if (isHandlingSessionExpiry) {
    return;
  }

  isHandlingSessionExpiry = true;

  const opts = { ...defaultOptions, ...options };

  // Show toast notification
  if (opts.showNotification) {
    showSessionExpiryToast(opts.notificationMessage || defaultOptions.notificationMessage!);
  }

  // Execute callback (typically logout + redirect)
  if (opts.onSessionExpiry) {
    // Small delay to ensure toast is visible before redirect
    await new Promise((resolve) => setTimeout(resolve, 100));
    opts.onSessionExpiry();
  }
}

/**
 * Intercept a fetch Response and handle session expiry
 *
 * @param response - The fetch Response to check
 * @param options - Interceptor options
 * @returns Promise that resolves when handling is complete
 *
 * @example
 * ```ts
 * const response = await fetch(url, options);
 * await interceptResponse(response, {
 *   onSessionExpiry: () => {
 *     logout();
 *     router.push('/login');
 *   }
 * });
 * ```
 */
export async function interceptResponse(
  response: Response,
  options: InterceptorOptions = {},
): Promise<void> {
  if (isSessionExpiryStatus(response.status)) {
    await handleSessionExpiry(options);
  }
}

/**
 * Intercept an error from a failed fetch and handle session expiry
 *
 * @param error - The error from fetch
 * @param options - Interceptor options
 * @returns Promise that resolves when handling is complete
 *
 * @example
 * ```ts
 * try {
 *   const response = await fetch(url, options);
 * } catch (error) {
 *   await interceptError(error, {
 *     onSessionExpiry: () => {
 *       logout();
 *       router.push('/login');
 *     }
 *   });
 * }
 * ```
 */
export async function interceptError(
  error: unknown,
  options: InterceptorOptions = {},
): Promise<void> {
  // Check if error has a response with session expiry status
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as { response?: { status?: number } };
    if (err.response?.status && isSessionExpiryStatus(err.response.status)) {
      await handleSessionExpiry(options);
    }
  }
}

/**
 * Create a wrapped fetch function that automatically handles session expiry
 *
 * @param options - Interceptor options
 * @returns A fetch function that intercepts 401/403 responses
 *
 * @example
 * ```ts
 * const fetchWithInterceptor = createFetchInterceptor({
 *   onSessionExpiry: () => {
 *     logout();
 *     router.push('/login');
 *   }
 * });
 *
 * const response = await fetchWithInterceptor(url, fetchOptions);
 * ```
 */
export function createFetchInterceptor(options: InterceptorOptions = {}) {
  return async (url: string, fetchOptions?: RequestInit): Promise<Response> => {
    try {
      const response = await fetch(url, fetchOptions);

      // Handle session expiry
      await interceptResponse(response, options);

      return response;
    } catch (error) {
      // Handle session expiry in error
      await interceptError(error, options);

      throw error;
    }
  };
}

/**
 * Execute a GraphQL request with session expiry interception
 *
 * @param query - GraphQL query string
 * @param variables - Query variables
 * @param options - Interceptor options
 * @returns Promise resolving to the GraphQL response
 *
 * @example
 * ```ts
 * const result = await executeGraphQLWithInterceptor(
 *   query,
 *   variables,
 *   {
 *     onSessionExpiry: () => {
 *       logout();
 *       router.push('/login');
 *     }
 *   }
 * );
 * ```
 */
export async function executeGraphQLWithInterceptor<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
  options?: InterceptorOptions & {
    headers?: Record<string, string>;
    signal?: AbortSignal;
  },
): Promise<{ data?: T; errors?: Array<{ message: string }> }> {
  const { headers = {}, signal, ...interceptorOptions } = options || {};

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const mergedHeaders = { ...defaultHeaders, ...headers };

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: mergedHeaders,
      credentials: 'include',
      signal,
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    // Handle session expiry before parsing response
    await interceptResponse(response, interceptorOptions);

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // Handle session expiry in error
    await interceptError(error, interceptorOptions);

    throw error;
  }
}

/**
 * Create a session expiry handler function
 * Useful for passing to auth providers or other systems
 *
 * @param options - Interceptor options
 * @returns A function that handles session expiry
 *
 * @example
 * ```ts
 * const handleSessionExpiry = createSessionExpiryHandler({
 *   onSessionExpiry: () => {
 *     logout();
 *     router.push('/login');
 *   }
 * });
 *
 * // Use in auth provider onError
 * onError: async (error) => {
 *   if (error.status === 401) {
 *     await handleSessionExpiry();
 *   }
 * }
 * ```
 */
export function createSessionExpiryHandler(options: InterceptorOptions = {}) {
  return () => handleSessionExpiry(options);
}
