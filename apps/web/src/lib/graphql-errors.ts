/**
 * GraphQL Error handling utilities
 *
 * Handles GraphQL errors that come in the format:
 * { errors: [{message, locations, ...}], data: {...} }
 */

/**
 * Represents a GraphQL error from the response
 */
export interface GraphQLErrorItem {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: string[];
  extensions?: Record<string, unknown>;
}

/**
 * Enhanced GraphQL response that includes both data and errors
 */
export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLErrorItem[];
}

/**
 * Result type that includes data and any errors that occurred
 */
export interface QueryResult<T> {
  data: T | null;
  errors: GraphQLErrorItem[];
  hasErrors: boolean;
  hasPartialData: boolean;
}

/**
 * Parse a GraphQL response to extract data and errors
 */
export function parseGraphQLResponse<T>(result: GraphQLResponse<T>): QueryResult<T> {
  const hasErrors = Array.isArray(result.errors) && result.errors.length > 0;
  const hasData = result.data !== null && result.data !== undefined;

  return {
    data: result.data ?? null,
    errors: result.errors ?? [],
    hasErrors,
    hasPartialData: hasErrors && hasData,
  };
}

/**
 * Get user-friendly error messages from GraphQL errors
 * Groups similar errors and returns a summary
 */
export function formatGraphQLErrors(errors: GraphQLErrorItem[]): string {
  if (errors.length === 0) return '';

  // Group errors by message pattern
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
}

/**
 * Check if a refine query result has GraphQL errors
 * This extracts errors from the query result's error state
 */
export function hasGraphQLErrors(queryResult: { error?: unknown }): boolean {
  if (!queryResult.error) return false;

  const error = queryResult.error as { graphQLErrors?: unknown[]; networkError?: unknown };
  return (error.graphQLErrors && error.graphQLErrors.length > 0) || Boolean(error.networkError);
}

/**
 * Extract GraphQL errors from a refine query result
 */
export function getGraphQLErrors(queryResult: { error?: unknown }): GraphQLErrorItem[] {
  if (!queryResult.error) return [];

  const error = queryResult.error as {
    graphQLErrors?: GraphQLErrorItem[];
    networkError?: { message?: string };
    message?: string;
  };

  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    return error.graphQLErrors;
  }

  // Network error or other error
  if (error.networkError || error.message) {
    return [
      {
        message: error.networkError?.message ?? error.message ?? 'Unknown error',
      },
    ];
  }

  return [];
}
