'use client';

import { AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { formatGraphQLErrors, type GraphQLErrorItem } from '@/lib/graphql-errors';

/**
 * Props for GraphQLErrorAlert component
 */
export interface GraphQLErrorAlertProps {
  /** Array of GraphQL errors */
  errors: GraphQLErrorItem[];
  /** Optional title for the error alert */
  title?: string;
  /** Optional onDismiss callback */
  onDismiss?: () => void;
  /** Optional onRetry callback */
  onRetry?: () => void;
  /** Whether to show the error details */
  showDetails?: boolean;
}

/**
 * Display GraphQL errors in a user-friendly alert component
 *
 * @example
 * <GraphQLErrorAlert errors={queryResult.error?.graphQLErrors || []} />
 */
export function GraphQLErrorAlert({
  errors,
  title,
  onDismiss,
  onRetry,
  showDetails = true,
}: GraphQLErrorAlertProps) {
  if (!errors || errors.length === 0) {
    return null;
  }

  const formattedMessage = formatGraphQLErrors(errors);

  return (
    <div className="rounded-md border-l-4 border-red-500 bg-red-50 p-4" role="alert">
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-800">
                {title ||
                  (errors.length === 1 ? 'Error loading data' : `${errors.length} errors occurred`)}
              </h3>
              {showDetails && (
                <div className="mt-2 text-sm text-red-700">
                  <p>{formattedMessage}</p>
                </div>
              )}
            </div>
            <div className="ml-4 flex flex-shrink-0 gap-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex rounded-md bg-red-50 p-1.5 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                  title="Retry"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="inline-flex rounded-md bg-red-50 p-1.5 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                  title="Dismiss"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Props for GraphQLInlineError component
 */
export interface GraphQLInlineErrorProps {
  /** Array of GraphQL errors */
  errors: GraphQLErrorItem[];
  /** Optional custom message */
  message?: string;
}

/**
 * Compact inline error display for smaller spaces
 *
 * @example
 * <GraphQLInlineError errors={queryResult.error?.graphQLErrors || []} />
 */
export function GraphQLInlineError({ errors, message }: GraphQLInlineErrorProps) {
  if (!errors || errors.length === 0) {
    return null;
  }

  const formattedMessage = message || formatGraphQLErrors(errors);

  return (
    <div className="flex items-center gap-2 text-sm text-red-600" role="alert">
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{formattedMessage}</span>
    </div>
  );
}

/**
 * Props for GraphQLDataErrorBanner component
 * Shows a banner when data was loaded but contains errors
 */
export interface GraphQLDataErrorBannerProps {
  errorCount: number;
  onDismiss?: () => void;
}

/**
 * Banner to show when data loaded but had errors
 * Less intrusive than the full alert
 */
export function GraphQLDataErrorBanner({ errorCount, onDismiss }: GraphQLDataErrorBannerProps) {
  return (
    <div className="mb-4 rounded-md bg-amber-50 px-4 py-3 border border-amber-200">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-amber-700">
              <span className="font-medium">Warning:</span> Some data could not be loaded correctly.
              {errorCount > 1 && ` (${errorCount} errors)`}
            </p>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="ml-4 text-amber-700 hover:text-amber-900"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
