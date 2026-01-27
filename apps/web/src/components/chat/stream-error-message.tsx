'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  XCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@legal/ui';
import type { StreamErrorResponse, ReconnectionState } from '@/hooks/streaming/streaming-error-handler';
import { formatTimeUntil } from '@/hooks/streaming/streaming-error-handler';

interface StreamErrorMessageProps {
  /** The error response from the streaming hook */
  errorResponse: StreamErrorResponse;
  /** Reconnection state if reconnecting */
  reconnectionState: ReconnectionState | null;
  /** Whether the response has partial content */
  hasPartialContent: boolean;
  /** Callback to retry the request */
  onRetry: () => void;
  /** Callback to dismiss the error */
  onDismiss?: () => void;
  /** Whether to show the error details */
  showDetails?: boolean;
  /** Custom error message override */
  customMessage?: string;
}

/**
 * StreamErrorMessage Component
 *
 * Displays user-friendly error messages for streaming failures with:
 * - Error type-specific icons and messages
 * - Retry button with countdown
 * - Reconnection status
 * - Partial content indicator
 * - Expandable details section
 * - Actionable suggestions
 *
 * @example
 * ```tsx
 * <StreamErrorMessage
 *   errorResponse={errorResponse}
 *   reconnectionState={reconnectionState}
 *   hasPartialContent={partialContent.length > 0}
 *   onRetry={() => retryLastRequest()}
 *   onDismiss={() => setError(null)}
 * />
 * ```
 */
export function StreamErrorMessage({
  errorResponse,
  reconnectionState,
  hasPartialContent,
  onRetry,
  onDismiss,
  showDetails: externalShowDetails,
  customMessage,
}: StreamErrorMessageProps) {
  const [showDetails, setShowDetails] = useState(externalShowDetails ?? false);
  const [timeUntilRetry, setTimeUntilRetry] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);

  // Update countdown timer
  useEffect(() => {
    if (!reconnectionState?.nextAttemptTime) {
      setTimeUntilRetry('');
      return;
    }

    const updateTimer = () => {
      setTimeUntilRetry(formatTimeUntil(reconnectionState.nextAttemptTime));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [reconnectionState]);

  // Handle retry with loading state
  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry]);

  // Get error icon and color based on severity
  const getErrorDisplay = () => {
    switch (errorResponse.type) {
      case 'CONNECTION_LOST':
        return {
          icon: WifiOff,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50 dark:bg-orange-950/30',
          borderColor: 'border-orange-200 dark:border-orange-900',
        };
      case 'SERVICE_UNAVAILABLE':
        return {
          icon: AlertCircle,
          color: 'text-amber-500',
          bgColor: 'bg-amber-50 dark:bg-amber-950/30',
          borderColor: 'border-amber-200 dark:border-amber-900',
        };
      case 'TIMEOUT':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
          borderColor: 'border-yellow-200 dark:border-yellow-900',
        };
      case 'AUTH_ERROR':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-950/30',
          borderColor: 'border-red-200 dark:border-red-900',
        };
      case 'RATE_LIMIT':
        return {
          icon: Clock,
          color: 'text-purple-500',
          bgColor: 'bg-purple-50 dark:bg-purple-950/30',
          borderColor: 'border-purple-200 dark:border-purple-900',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-950/30',
          borderColor: 'border-gray-200 dark:border-gray-800',
        };
    }
  };

  // Get suggestion based on error type
  const getSuggestion = (): string | null => {
    switch (errorResponse.type) {
      case 'CONNECTION_LOST':
        return 'Check your internet connection and try again.';
      case 'SERVICE_UNAVAILABLE':
        return 'The AI service is temporarily down. Please try again in a moment.';
      case 'TIMEOUT':
        return 'The request took too long. Try with a shorter question.';
      case 'AUTH_ERROR':
        return 'Please refresh the page to re-authenticate.';
      case 'RATE_LIMIT':
        return 'You\'ve sent too many requests. Please wait a moment before trying again.';
      case 'PARSE_ERROR':
        return 'The server sent an invalid response. This should be temporary.';
      default:
        return null;
    }
  };

  const errorDisplay = getErrorDisplay();
  const ErrorIcon = errorDisplay.icon;
  const suggestion = getSuggestion();
  const message = customMessage || errorResponse.userMessage;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all animate-in fade-in slide-in-from-bottom-2',
        errorDisplay.bgColor,
        errorDisplay.borderColor,
      )}
    >
      {/* Main Error Content */}
      <div className="flex items-start gap-3">
        {/* Error Icon */}
        <div className={cn('flex-shrink-0', errorDisplay.color)}>
          <ErrorIcon className="h-5 w-5" />
        </div>

        {/* Error Message and Actions */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm text-foreground">{message}</p>

            {/* Dismiss Button */}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
                aria-label="Dismiss error"
              >
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Partial Content Indicator */}
          {hasPartialContent && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wifi className="h-3.5 w-3.5" />
              <span>Partial response received before error</span>
            </div>
          )}

          {/* Suggestion */}
          {suggestion && (
            <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
              <Lightbulb className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{suggestion}</span>
            </div>
          )}

          {/* Reconnection Status */}
          {reconnectionState?.isReconnecting && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span className="font-medium">
                  Reconnecting... {timeUntilRetry && `(${timeUntilRetry})`}
                </span>
              </div>
              <span className="text-muted-foreground">
                Attempt {reconnectionState.attempt} of 3
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Retry Button */}
            {errorResponse.retryable && !reconnectionState?.isReconnecting && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  'bg-primary text-primary-foreground hover:bg-primary/90',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isRetrying && 'animate-spin')} />
                {isRetrying ? 'Retrying...' : 'Retry'}
              </button>
            )}

            {/* Fallback Indicator */}
            {errorResponse.fallbackAvailable && !errorResponse.retryable && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5" />
                Switched to non-streaming mode
              </span>
            )}

            {/* Details Toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  Show details
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-muted-foreground">Error Type</dt>
              <dd className="font-mono mt-0.5">{errorResponse.type}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Can Recover</dt>
              <dd className="mt-0.5">{errorResponse.canRecover ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Retryable</dt>
              <dd className="mt-0.5">{errorResponse.retryable ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Fallback Available</dt>
              <dd className="mt-0.5">{errorResponse.fallbackAvailable ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Severity</dt>
              <dd className="mt-0.5 capitalize">{errorResponse.severity}</dd>
            </div>
            {hasPartialContent && (
              <div>
                <dt className="text-muted-foreground">Partial Content</dt>
                <dd className="mt-0.5">Preserved</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline error message for use in message list
 */
export function InlineStreamError({
  error,
  onRetry,
  isRetrying = false,
}: {
  error: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded-lg text-sm">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{error}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="flex-shrink-0 text-xs font-medium hover:underline disabled:opacity-50"
        >
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
      )}
    </div>
  );
}
