/**
 * Streaming Error Handler
 *
 * Comprehensive error handling for streaming responses.
 * Provides error detection, retry logic, fallback mechanisms, and user-friendly messages.
 */

import * as Sentry from '@sentry/nextjs';

// =============================================================================
// Error Types
// =============================================================================

export type StreamErrorType =
  | 'CONNECTION_LOST'
  | 'SERVICE_UNAVAILABLE'
  | 'TIMEOUT'
  | 'PARSE_ERROR'
  | 'AUTH_ERROR'
  | 'RATE_LIMIT'
  | 'UNKNOWN';

export type StreamErrorSeverity = 'low' | 'medium' | 'high';

export interface StreamErrorContext {
  sessionId?: string;
  userId?: string;
  question?: string;
  timestamp: Date;
  retryAttempt: number;
  partialContent?: string;
  errorType: StreamErrorType;
}

export interface StreamErrorResponse {
  type: StreamErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
  fallbackAvailable: boolean;
  canRecover: boolean;
  severity: StreamErrorSeverity;
}

// =============================================================================
// Error Detection
// =============================================================================

/**
 * Detect error type from fetch error or event
 */
export function detectStreamErrorType(
  error: Error | unknown,
  event?: MessageEvent | ErrorEvent,
): StreamErrorType {
  // Check if it's an AbortError (user cancelled)
  if (error instanceof Error && error.name === 'AbortError') {
    return 'UNKNOWN'; // User abort is not really an error
  }

  // Check error message for patterns
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
  const eventData = event instanceof ErrorEvent ? event.message : '';

  const combined = `${errorMessage} ${eventData}`.toLowerCase();

  if (combined.includes('network') || combined.includes('fetch') || combined.includes('connection')) {
    return 'CONNECTION_LOST';
  }

  if (combined.includes('timeout') || combined.includes('timed out')) {
    return 'TIMEOUT';
  }

  if (combined.includes('unauthorized') || combined.includes('401') || combined.includes('403')) {
    return 'AUTH_ERROR';
  }

  if (combined.includes('429') || combined.includes('rate limit') || combined.includes('too many requests')) {
    return 'RATE_LIMIT';
  }

  if (combined.includes('503') || combined.includes('service unavailable') || combined.includes('502')) {
    return 'SERVICE_UNAVAILABLE';
  }

  if (combined.includes('parse') || combined.includes('json') || combined.includes('invalid')) {
    return 'PARSE_ERROR';
  }

  return 'UNKNOWN';
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserErrorMessage(errorType: StreamErrorType): string {
  const messages: Record<StreamErrorType, string> = {
    CONNECTION_LOST: 'Connection lost. Please check your internet connection.',
    SERVICE_UNAVAILABLE: 'AI service is temporarily unavailable. Please try again.',
    TIMEOUT: 'Request timed out. The AI took too long to respond.',
    PARSE_ERROR: 'Received invalid response from server.',
    AUTH_ERROR: 'Authentication failed. Please refresh the page.',
    RATE_LIMIT: 'Too many requests. Please wait a moment before trying again.',
    UNKNOWN: 'Something went wrong. Please try again.',
  };

  return messages[errorType] || messages.UNKNOWN;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(errorType: StreamErrorType): boolean {
  const retryableErrors: StreamErrorType[] = [
    'CONNECTION_LOST',
    'SERVICE_UNAVAILABLE',
    'TIMEOUT',
    'RATE_LIMIT',
  ];

  return retryableErrors.includes(errorType);
}

// =============================================================================
// Retry Logic with Exponential Backoff
// =============================================================================

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): number {
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  // Add jitter (±25% random variance) to prevent thundering herd
  const jitter = 0.5 + Math.random(); // 0.5 to 1.5
  return Math.floor(cappedDelay * jitter);
}

/**
 * Wait for a specified delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// Stream State Management
// =============================================================================

export interface StreamState {
  isActive: boolean;
  lastActivityTime: Date | null;
  partialContent: string;
  errorCount: number;
  consecutiveErrors: number;
}

const STREAM_TIMEOUT_MS = 30000; // 30 seconds of inactivity

/**
 * Check if stream has timed out
 */
export function hasStreamTimedOut(state: StreamState): boolean {
  if (!state.lastActivityTime) return false;

  const now = new Date();
  const elapsed = now.getTime() - state.lastActivityTime.getTime();

  return elapsed > STREAM_TIMEOUT_MS;
}

/**
 * Update stream activity timestamp
 */
export function updateActivity(state: StreamState): void {
  state.lastActivityTime = new Date();
}

// =============================================================================
// Error Logging to Sentry
// =============================================================================

/**
 * Log streaming error to Sentry with full context
 */
export function logStreamError(
  error: Error | unknown,
  context: StreamErrorContext,
  severity: StreamErrorSeverity = 'medium',
): void {
  const errorObj = error instanceof Error ? error : new Error(String(error));

  // Don't log user aborts
  if (errorObj.name === 'AbortError') {
    return;
  }

  Sentry.captureException(errorObj, {
    level: severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'info',
    tags: {
      errorType: context.errorType,
      sessionId: context.sessionId || 'unknown',
      userId: context.userId || 'unknown',
      retryAttempt: String(context.retryAttempt),
    },
    extra: {
      question: context.question,
      partialContentLength: context.partialContent?.length || 0,
      partialContentPreview: context.partialContent?.slice(0, 200),
      timestamp: context.timestamp.toISOString(),
    },
    user: context.userId ? { id: context.userId } : undefined,
  });
}

/**
 * Log stream completion for monitoring
 */
export function logStreamCompletion(
  sessionId: string,
  userId: string | undefined,
  success: boolean,
  durationMs: number,
  contentLength: number,
): void {
  Sentry.addBreadcrumb({
    category: 'streaming',
    message: success ? 'Stream completed successfully' : 'Stream failed',
    level: success ? 'info' : 'warning',
    data: {
      sessionId,
      userId,
      durationMs,
      contentLength,
      success,
    },
  });
}

// =============================================================================
// Fallback Strategy
// =============================================================================

export interface FallbackStrategy {
  shouldFallback: boolean;
  fallbackMethod: 'graphql' | 'none';
  reason: string;
}

/**
 * Determine if we should fallback to non-streaming
 */
export function shouldUseFallback(
  errorType: StreamErrorType,
  retryAttempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): FallbackStrategy {
  // If we've exhausted retries, fallback to GraphQL
  if (retryAttempt >= config.maxRetries) {
    return {
      shouldFallback: true,
      fallbackMethod: 'graphql',
      reason: 'Max retries exceeded',
    };
  }

  // For non-retryable errors, fallback immediately
  if (!isRetryableError(errorType)) {
    return {
      shouldFallback: true,
      fallbackMethod: 'graphql',
      reason: `Non-retryable error: ${errorType}`,
    };
  }

  // Otherwise, don't fallback yet - retry
  return {
    shouldFallback: false,
    fallbackMethod: 'none',
    reason: 'Retry possible',
  };
}

// =============================================================================
// Error Response Builder
// =============================================================================

/**
 * Build a complete error response for UI
 */
export function buildErrorResponse(
  errorType: StreamErrorType,
  retryAttempt: number,
  partialContent: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): StreamErrorResponse {
  const retryable = isRetryableError(errorType);
  const fallback = shouldUseFallback(errorType, retryAttempt, config);

  let severity: StreamErrorSeverity = 'medium';
  if (errorType === 'AUTH_ERROR' || errorType === 'PARSE_ERROR') {
    severity = 'high';
  } else if (errorType === 'TIMEOUT' || errorType === 'CONNECTION_LOST') {
    severity = 'low';
  }

  return {
    type: errorType,
    message: getUserErrorMessage(errorType),
    userMessage: getUserErrorMessage(errorType),
    retryable: retryable && retryAttempt < config.maxRetries,
    fallbackAvailable: fallback.fallbackMethod === 'graphql',
    canRecover: retryable || fallback.fallbackMethod === 'graphql',
    severity,
  };
}

// =============================================================================
// Reconnection State
// =============================================================================

export interface ReconnectionState {
  isReconnecting: boolean;
  attempt: number;
  lastAttemptTime: Date | null;
  nextAttemptTime: Date | null;
}

/**
 * Calculate next reconnection attempt time
 */
export function calculateNextReconnection(
  state: ReconnectionState,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Date {
  const delayMs = calculateBackoffDelay(state.attempt, config);
  return new Date(Date.now() + delayMs);
}

/**
 * Format time until next reconnection attempt
 */
export function formatTimeUntil(nextAttemptTime: Date | null): string {
  if (!nextAttemptTime) return 'now';

  const now = Date.now();
  const diff = nextAttemptTime.getTime() - now;

  if (diff <= 0) return 'now';

  const seconds = Math.ceil(diff / 1000);

  if (seconds < 60) {
    return `in ${seconds}s`;
  }

  const minutes = Math.ceil(seconds / 60);
  return `in ${minutes}m`;
}
