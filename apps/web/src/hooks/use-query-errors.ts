'use client';

import { useMemo } from 'react';
import { getGraphQLErrors, hasGraphQLErrors, type GraphQLErrorItem } from '@/lib/graphql-errors';

/**
 * Hook result with error information
 */
export interface QueryErrorsResult {
  /** Whether there are GraphQL errors */
  hasErrors: boolean;
  /** Array of GraphQL errors */
  errors: GraphQLErrorItem[];
  /** Formatted error message */
  errorMessage: string;
  /** Number of errors */
  errorCount: number;
}

/**
 * Extract errors from a data provider result object (attached via _errors property)
 */
function extractResultErrors(result: unknown): GraphQLErrorItem[] {
  if (typeof result !== 'object' || result === null) {
    return [];
  }

  const resultObj = result as Record<string, unknown>;
  if ('_errors' in resultObj && Array.isArray(resultObj._errors)) {
    return resultObj._errors as GraphQLErrorItem[];
  }

  return [];
}

/**
 * Hook to extract GraphQL errors from refine query results
 *
 * This hook checks two sources of errors:
 * 1. From the query.error property (when the query fails completely)
 * 2. From the result._errors property (when data is returned but has GraphQL errors)
 *
 * @example
 * const { result, query } = useList({ resource: "documents" });
 * const { hasErrors, errors } = useQueryErrors(query, result);
 */
export function useQueryErrors(
  queryResult: { error?: unknown },
  dataResult?: unknown,
): QueryErrorsResult {
  const errors = useMemo(() => {
    // First check query-level errors
    const queryErrors = getGraphQLErrors(queryResult);
    if (queryErrors.length > 0) {
      return queryErrors;
    }

    // Then check result-level errors (partial data with errors)
    return extractResultErrors(dataResult);
  }, [queryResult, dataResult]);

  const errorMessage = useMemo(() => {
    if (errors.length === 0) return '';

    // Group similar errors
    const grouped = new Map<string, number>();
    for (const error of errors) {
      // Extract base error message (remove specific values for grouping)
      const baseMessage = error.message
        .replace(/\{[^}]+\}/g, '{value}')
        .replace(/"[^"]+"/g, '"value"');

      const count = grouped.get(baseMessage) ?? 0;
      grouped.set(baseMessage, count + 1);
    }

    // Build formatted message
    const parts: string[] = [];
    Array.from(grouped.entries()).forEach(([message, count]) => {
      if (count > 1) {
        parts.push(`${message} (${count}×)`);
      } else {
        parts.push(message);
      }
    });

    // If too many errors, summarize
    if (parts.length > 3) {
      return `${parts.slice(0, 3).join(', ')} and ${parts.length - 3} more error(s)`;
    }

    return parts.join(', ');
  }, [errors]);

  return {
    hasErrors: errors.length > 0,
    errors,
    errorMessage,
    errorCount: errors.length,
  };
}

/**
 * Check if a data provider result has GraphQL errors attached
 * These are attached via the _errors property when data is returned alongside errors
 */
export function hasDataProviderErrors(result: unknown): result is { _errors: GraphQLErrorItem[] } {
  return (
    typeof result === 'object' &&
    result !== null &&
    '_errors' in result &&
    Array.isArray((result as { _errors: unknown })._errors) &&
    (result as { _errors: unknown[] })._errors.length > 0
  );
}

/**
 * Extract errors from a data provider result
 */
export function getDataProviderErrors(result: unknown): GraphQLErrorItem[] {
  if (hasDataProviderErrors(result)) {
    return result._errors;
  }
  return [];
}
