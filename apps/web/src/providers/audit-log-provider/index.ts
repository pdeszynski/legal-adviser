import type { AuditLogProvider } from '@refinedev/core';
import type {
  AuditLogsQuery,
  AuditLogsQueryVariables,
  AuditLogFragmentFragment,
} from '@/generated/graphql';
import { AuditLogsDocument } from '@/generated/graphql';
import { fetcher } from '@/generated/graphql-fetcher';
import { getAccessToken } from '../auth-provider/auth-provider.client';

/**
 * Audit Log Provider
 *
 * Uses GraphQL Code Generator generated types and query documents.
 * This provides type safety and avoids inline query strings.
 *
 * Note: changeDetails is excluded from AuditLogFragment to avoid JSON
 * serialization issues in sub-selections. It can be added separately if needed.
 */

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

/**
 * Get the access token from cookies
 */
const getAuthToken = (): string | undefined => {
  const token = getAccessToken();
  if (token) {
    return token;
  }

  // Fallback to cookie parsing for SSR
  if (typeof document === 'undefined') {
    return undefined;
  }
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find((c) => c.trim().startsWith('access_token='));
  return authCookie?.split('=')[1];
};

/**
 * Execute the AuditLogs query with proper typing
 */
async function fetchAuditLogs(variables: AuditLogsQueryVariables): Promise<AuditLogsQuery | null> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        query: AuditLogsDocument,
        variables,
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL error');
    }

    return result.data as AuditLogsQuery;
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return null;
  }
}

/**
 * Transform an AuditLogFragment to Refine's LogParams format
 */
function transformAuditLogToLogParams(log: AuditLogFragmentFragment) {
  const userName = log.user
    ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.user.email
    : 'System';

  return {
    id: log.id,
    action: log.action.toLowerCase(),
    resource: log.resourceType.toLowerCase(),
    meta: {
      id: log.resourceId,
      userId: log.userId,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      statusCode: log.statusCode,
      errorMessage: log.errorMessage,
    },
    author: log.user
      ? {
          id: log.user.id,
          name: userName,
        }
      : undefined,
    date: new Date(log.createdAt),
  };
}

/**
 * Audit Log Provider for Refine
 *
 * Provides audit log functionality using the GraphQL API.
 * Uses generated types for type safety.
 */
export const auditLogProvider: AuditLogProvider = {
  get: async ({ resource, action, meta, author }) => {
    // Build filter based on parameters
    const filter: Record<string, unknown> = {};

    if (resource) {
      filter.resourceType = { eq: resource.toUpperCase() };
    }

    if (action) {
      filter.action = { eq: action.toUpperCase() };
    }

    if (meta?.id) {
      filter.resourceId = { eq: meta.id };
    }

    if (author?.id) {
      filter.userId = { eq: author.id };
    }

    // Build GraphQL variables with proper typing
    const variables: AuditLogsQueryVariables = {
      paging: { first: 50 },
      sorting: [{ field: 'createdAt', direction: 'DESC' }],
      ...(Object.keys(filter).length > 0 && {
        filter: filter as AuditLogsQueryVariables['filter'],
      }),
    };

    const result = await fetchAuditLogs(variables);

    if (!result?.auditLogs) {
      return [];
    }

    // Transform to Refine's LogParams format
    return result.auditLogs.edges.map((edge) => transformAuditLogToLogParams(edge.node));
  },

  create: async (params) => {
    // Audit logs are created automatically by the backend interceptor
    // This method is not needed for this implementation
    // Return the params as-is to satisfy the interface
    return params;
  },

  update: async (params) => {
    // Audit logs are immutable - updates are not allowed
    // Return the params as-is to satisfy the interface
    return params;
  },
};

// Re-export types for use in components
export type { AuditLogFragmentFragment, AuditLogsQuery, AuditLogsQueryVariables };
