'use client';

import type {
  DataProvider,
  BaseRecord,
  CrudFilters,
  CrudSorting,
  Pagination,
} from '@refinedev/core';
import { getAccessToken, tryRefreshToken } from '../auth-provider/auth-provider.client';
import { getCsrfHeaders } from '@/lib/csrf';

/**
 * GraphQL Data Provider
 *
 * Per constitution: GraphQL is the primary API for data operations.
 * This provider connects to the NestJS GraphQL endpoint.
 */
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

/**
 * Session expiry handler callback
 * Set by initializeSessionHandler to enable logout on 401/403
 */
let sessionExpiryHandler: (() => void) | null = null;

/**
 * Initialize the session expiry handler
 * Call this from a component that has access to logout and router
 */
export function initializeSessionHandler(handler: () => void): void {
  sessionExpiryHandler = handler;
}

/**
 * GraphQL Custom Mutation Config
 *
 * Type definition for custom mutations using the data provider's custom method.
 * This is used for executing GraphQL mutations with specific operations, fields, and input data.
 */
export type GraphQLMutationConfig<TInput = Record<string, unknown>> = {
  url: string;
  method: 'post';
  config: {
    mutation: {
      operation: string;
      fields: string[];
      variables: {
        input: TInput;
      };
    };
  };
};

/**
 * Cursor cache for pagination
 * Maps resource + filter/sort combination to page cursors
 */
type CursorCacheEntry = {
  cursors: string[]; // endCursor for each page (index = page number - 1)
  totalCount: number;
};

const cursorCache = new Map<string, CursorCacheEntry>();

/**
 * Generate cache key from resource, filters, and sorters
 */
function getCacheKey(resource: string, filters?: CrudFilters, sorters?: CrudSorting): string {
  const filterStr = filters ? JSON.stringify(filters) : 'none';
  const sorterStr = sorters ? JSON.stringify(sorters) : 'none';
  return `${resource}:${filterStr}:${sorterStr}`;
}

/**
 * Get cached cursor for a specific page.
 *
 * For page N, we need the endCursor of page N-1 to use as the "after" cursor.
 * The cursor is stored at index (N-1) - 1 = N-2 in the cursors array.
 *
 * Example:
 * - Page 1 cursors stored at index 0
 * - To fetch page 2, we need cursor at index 0 (end of page 1)
 * - To fetch page 3, we need cursor at index 1 (end of page 2)
 */
function getCachedCursor(key: string, pageNumber: number): string | undefined {
  const entry = cursorCache.get(key);
  // Return the endCursor of the previous page to use as "after" cursor
  // For page N, we need the cursor from page N-1, which is stored at index N-2
  return entry?.cursors[pageNumber - 2];
}

/**
 * Store cursor from a page response
 */
function storeCursor(key: string, pageNumber: number, endCursor: string, totalCount: number): void {
  let entry = cursorCache.get(key);
  if (!entry) {
    entry = { cursors: [], totalCount };
    cursorCache.set(key, entry);
  }
  entry.totalCount = totalCount;
  entry.cursors[pageNumber - 1] = endCursor;

  // Invalidate cache for pages after the current one when not in sequential order
  // This ensures stale cursors aren't used
  if (entry.cursors.length > pageNumber) {
    entry.cursors = entry.cursors.slice(0, pageNumber);
  }
}

/**
 * GraphQL error item from response
 */
export interface GraphQLErrorItem {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: string[];
  extensions?: Record<string, unknown>;
}

/**
 * GraphQL response with optional errors
 */
export interface GraphQLResult<T> {
  data?: T;
  errors?: GraphQLErrorItem[];
}

/**
 * Enhanced result type that includes errors with data
 */
export type ProviderResult<T> = T & { _errors?: GraphQLErrorItem[] };

/**
 * Execute a GraphQL query or mutation
 * Automatically includes authentication token if available
 * Intercepts 401/403 responses to trigger session expiry handling
 *
 * Returns the full response including errors for partial data handling.
 * When errors are present, they are attached to the result object as _errors.
 */
async function executeGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<ProviderResult<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getCsrfHeaders(), // Include CSRF token for mutations
  };

  // Include access token if available
  const accessToken = getAccessToken();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    credentials: 'include', // Required for CORS to send/receive cookies
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  // Handle session expiry (401/403)
  if (!response.ok) {
    // Check for 401 Unauthorized or 403 Forbidden
    if (response.status === 401 || response.status === 403) {
      // Try to refresh token first on 401
      if (response.status === 401) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          // Retry the request with new token
          const newAccessToken = getAccessToken();
          if (newAccessToken) {
            headers['Authorization'] = `Bearer ${newAccessToken}`;
          }
          const retryResponse = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({
              query,
              variables,
            }),
          });
          if (retryResponse.ok) {
            const result = (await retryResponse.json()) as GraphQLResult<T>;
            if (result.data && result.errors && result.errors.length > 0) {
              return {
                ...result.data,
                _errors: result.errors,
              } as ProviderResult<T> & T;
            }
            if (result.errors && result.errors.length > 0) {
              const errorMessages = result.errors.map((e) => e.message).join('; ');
              throw new Error(errorMessages || 'GraphQL error');
            }
            return result.data as ProviderResult<T> & T;
          }
        }
      }

      // Trigger session expiry handling
      if (sessionExpiryHandler) {
        sessionExpiryHandler();
      }
    }
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  const result = (await response.json()) as GraphQLResult<T>;

  // If we have both data and errors, return data with errors attached
  if (result.data && result.errors && result.errors.length > 0) {
    return {
      ...result.data,
      _errors: result.errors,
    } as ProviderResult<T> & T;
  }

  // If we only have errors (no data), throw with all error messages
  if (result.errors && result.errors.length > 0) {
    const errorMessages = result.errors.map((e) => e.message).join('; ');
    throw new Error(errorMessages || 'GraphQL error');
  }

  // No errors, return data normally
  return result.data as ProviderResult<T> & T;
}

/**
 * Extract GraphQL errors from a provider result
 */
export function getProviderErrors<T>(result: ProviderResult<T>): GraphQLErrorItem[] {
  return (result as unknown as { _errors?: GraphQLErrorItem[] })._errors ?? [];
}

/**
 * Check if a provider result has GraphQL errors
 */
export function hasProviderErrors<T>(result: ProviderResult<T>): boolean {
  const errors = getProviderErrors(result);
  return errors.length > 0;
}

/**
 * Sequentially fetch and cache cursors for pages up to the target page.
 * This is necessary when jumping to a page directly (e.g., clicking page 5)
 * because cursor-based pagination requires the cursor from the previous page.
 *
 * @param resource - The resource name (e.g., 'documents')
 * @param targetPage - The page number we want to reach
 * @param pageSize - Number of items per page
 * @param query - The GraphQL query string
 * @param filters - Current filters
 * @param sorters - Current sorters
 * @returns The cursor to use for the target page, or undefined if unable to fetch
 */
async function ensureCursorsCached(
  resource: string,
  targetPage: number,
  pageSize: number,
  query: string,
  filters?: CrudFilters,
  sorters?: CrudSorting,
): Promise<string | undefined> {
  const key = getCacheKey(resource, filters, sorters);
  const entry = cursorCache.get(key);

  // Check if we already have the cursor for the page before target
  // For page N, we need cursor N-2 (stored after fetching page N-1)
  if (entry && entry.cursors[targetPage - 2] !== undefined) {
    return entry.cursors[targetPage - 2];
  }

  // Find the last page we have a complete cursor for
  const lastCachedPageNumber = entry ? entry.cursors.filter((c) => c !== undefined).length : 0;

  if (lastCachedPageNumber === 0) {
    // No cursors at all, need to start from page 1
    return undefined;
  }

  // Sequentially fetch pages from lastCachedPageNumber to targetPage - 1
  let currentCursor =
    lastCachedPageNumber > 1 ? entry!.cursors[lastCachedPageNumber - 2] : undefined;

  for (let pageNum = lastCachedPageNumber + 1; pageNum < targetPage; pageNum++) {
    const graphqlPaging: { first: number; after?: string } = currentCursor
      ? { first: pageSize, after: currentCursor }
      : { first: pageSize };

    const graphqlFilter = buildGraphQLFilter(filters);
    const graphqlSorting = buildGraphQLSorting(sorters);

    try {
      // Determine the query type based on resource
      const queryToUse = query;
      let dataKey = '';

      if (resource === 'documents') {
        dataKey = 'legalDocuments';
      } else if (resource === 'audit_logs') {
        dataKey = 'auditLogs';
      } else if (resource === 'legalRulings') {
        dataKey = 'legalRulings';
      } else {
        break; // Unknown resource
      }

      const data = await executeGraphQL<
        Record<
          string,
          {
            totalCount: number;
            pageInfo: { endCursor: string };
          }
        >
      >(queryToUse, {
        filter: graphqlFilter || {},
        paging: graphqlPaging,
        sorting: graphqlSorting || [],
      });

      const result = data[dataKey];
      if (result?.pageInfo?.endCursor) {
        storeCursor(key, pageNum, result.pageInfo.endCursor, result.totalCount);
        currentCursor = result.pageInfo.endCursor;
      } else {
        break; // No more data
      }
    } catch {
      // Silently fail on prefetch errors - the main query will still work
      break;
    }
  }

  // Return the cursor for the target page
  const updatedEntry = cursorCache.get(key);
  return updatedEntry?.cursors[targetPage - 2];
}

/**
 * Convert Refine filters to nestjs-query GraphQL filter format
 */
function buildGraphQLFilter(filters?: CrudFilters): Record<string, unknown> | undefined {
  if (!filters || filters.length === 0) return undefined;

  const filterObj: Record<string, unknown> = {};

  for (const filter of filters) {
    if ('field' in filter) {
      const { field, operator, value } = filter;

      // Skip empty values
      if (value === undefined || value === null || value === '') continue;

      switch (operator) {
        case 'eq':
          filterObj[field] = { eq: value };
          break;
        case 'ne':
          filterObj[field] = { neq: value };
          break;
        case 'contains':
          filterObj[field] = { iLike: `%${value}%` };
          break;
        case 'startswith':
          filterObj[field] = { iLike: `${value}%` };
          break;
        case 'endswith':
          filterObj[field] = { iLike: `%${value}` };
          break;
        case 'in':
          filterObj[field] = { in: value };
          break;
        case 'gt':
          filterObj[field] = { gt: value };
          break;
        case 'gte':
          filterObj[field] = { gte: value };
          break;
        case 'lt':
          filterObj[field] = { lt: value };
          break;
        case 'lte':
          filterObj[field] = { lte: value };
          break;
        default:
          filterObj[field] = { eq: value };
      }
    }
  }

  return Object.keys(filterObj).length > 0 ? filterObj : undefined;
}

/**
 * Convert Refine sorting to nestjs-query GraphQL sorting format
 */
function buildGraphQLSorting(
  sorters?: CrudSorting,
): Array<{ field: string; direction: string }> | undefined {
  if (!sorters || sorters.length === 0) return undefined;

  return sorters.map((sorter) => ({
    field: sorter.field,
    direction: sorter.order === 'asc' ? 'ASC' : 'DESC',
  }));
}

/**
 * Build cursor-based paging for nestjs-query
 *
 * Converts offset-based pagination (page numbers) to cursor-based pagination.
 * Uses cached cursors to navigate between pages efficiently.
 */
function buildGraphQLPaging(
  pagination?: Pagination,
  resource?: string,
  filters?: CrudFilters,
  sorters?: CrudSorting,
): { first: number; after?: string } {
  const pageSize = pagination?.pageSize || 10;
  const current = pagination?.currentPage || 1;

  // First page - no cursor needed
  if (current <= 1) {
    return { first: pageSize };
  }

  // Subsequent pages - use cached cursor from previous page
  if (resource) {
    const key = getCacheKey(resource, filters, sorters);
    const previousPageCursor = getCachedCursor(key, current);

    if (previousPageCursor) {
      return { first: pageSize, after: previousPageCursor };
    }
  }

  // Fallback: no cursor available, return first page
  return { first: pageSize };
}

/**
 * GraphQL Data Provider for Refine
 *
 * Implements the DataProvider interface using GraphQL queries and mutations.
 * Automatically includes authentication tokens for protected endpoints.
 */
export const dataProvider: DataProvider = {
  /**
   * Get a list of resources with filtering, sorting, and pagination
   */
  getList: async <TData extends BaseRecord = BaseRecord>({
    resource,
    pagination,
    filters,
    sorters,
  }: {
    resource: string;
    pagination?: Pagination;
    filters?: CrudFilters;
    sorters?: CrudSorting;
  }) => {
    if (resource === 'users') {
      const query = `
        query GetUsers($filter: UserFilter, $paging: CursorPaging, $sorting: [UserSort!]) {
          users(filter: $filter, paging: $paging, sorting: $sorting) {
            totalCount
            edges {
              node {
                id
                email
                username
                firstName
                lastName
                isActive
                role
                disclaimerAccepted
                stripeCustomerId
                createdAt
                updatedAt
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      `;

      const currentPage = pagination?.currentPage || 1;
      const pageSize = pagination?.pageSize || 10;

      let prefetchCursor: string | undefined = undefined;
      if (currentPage > 1) {
        prefetchCursor = await ensureCursorsCached(
          resource,
          currentPage,
          pageSize,
          query,
          filters,
          sorters,
        );
      }

      const graphqlFilter = buildGraphQLFilter(filters);
      const graphqlSorting = buildGraphQLSorting(sorters) || [
        { field: 'createdAt', direction: 'DESC' },
      ];

      let graphqlPaging: { first: number; after?: string };
      if (currentPage <= 1) {
        graphqlPaging = { first: pageSize };
      } else if (prefetchCursor) {
        graphqlPaging = { first: pageSize, after: prefetchCursor };
      } else {
        graphqlPaging = buildGraphQLPaging(pagination, resource, filters, sorters);
      }

      const data = await executeGraphQL<{
        users: {
          totalCount: number;
          edges: Array<{ node: TData }>;
          pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
          };
        };
      }>(query, {
        filter: graphqlFilter || {},
        paging: graphqlPaging,
        sorting: graphqlSorting,
      });

      const errors = getProviderErrors(data);
      const items = data.users.edges.map((edge) => edge.node);

      const cacheKey = getCacheKey(resource, filters, sorters);
      storeCursor(cacheKey, currentPage, data.users.pageInfo.endCursor, data.users.totalCount);

      return {
        data: items,
        total: data.users.totalCount,
        ...(errors.length > 0 && { _errors: errors }),
      };
    }

    if (resource === 'audit_logs') {
      const query = `
        query GetAuditLogs($filter: AuditLogFilter, $paging: CursorPaging, $sorting: [AuditLogSort!]) {
          auditLogs(filter: $filter, paging: $paging, sorting: $sorting) {
            totalCount
            edges {
              node {
                id
                action
                resourceType
                resourceId
                userId
                user {
                  id
                  email
                  firstName
                  lastName
                }
                ipAddress
                userAgent
                statusCode
                errorMessage
                changeDetails
                createdAt
                updatedAt
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      `;

      const currentPage = pagination?.currentPage || 1;
      const pageSize = pagination?.pageSize || 10;

      // For pages beyond the first, ensure we have the required cursor
      let prefetchCursor: string | undefined = undefined;
      if (currentPage > 1) {
        prefetchCursor = await ensureCursorsCached(
          resource,
          currentPage,
          pageSize,
          query,
          filters,
          sorters,
        );
      }

      const graphqlFilter = buildGraphQLFilter(filters);
      const graphqlSorting = buildGraphQLSorting(sorters) || [
        { field: 'createdAt', direction: 'DESC' },
      ];

      // Build paging with the potentially prefetched cursor
      let graphqlPaging: { first: number; after?: string };
      if (currentPage <= 1) {
        graphqlPaging = { first: pageSize };
      } else if (prefetchCursor) {
        graphqlPaging = { first: pageSize, after: prefetchCursor };
      } else {
        graphqlPaging = buildGraphQLPaging(pagination, resource, filters, sorters);
      }

      const data = await executeGraphQL<{
        auditLogs: {
          totalCount: number;
          edges: Array<{ node: TData }>;
          pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
          };
        };
      }>(query, {
        filter: graphqlFilter || {},
        paging: graphqlPaging,
        sorting: graphqlSorting,
      });

      // Extract any GraphQL errors from the response
      const errors = getProviderErrors(data);

      const items = data.auditLogs.edges.map((edge) => edge.node);

      // Store cursor for this page to enable navigation
      const cacheKey = getCacheKey(resource, filters, sorters);
      storeCursor(
        cacheKey,
        currentPage,
        data.auditLogs.pageInfo.endCursor,
        data.auditLogs.totalCount,
      );

      return {
        data: items,
        total: data.auditLogs.totalCount,
        // Attach errors to the result for components to handle
        ...(errors.length > 0 && { _errors: errors }),
      };
    }

    if (resource === 'documents') {
      const query = `
        query GetLegalDocuments($filter: LegalDocumentFilter, $paging: CursorPaging, $sorting: [LegalDocumentSort!]) {
          legalDocuments(filter: $filter, paging: $paging, sorting: $sorting) {
            totalCount
            edges {
              node {
                id
                sessionId
                title
                type
                status
                contentRaw
                metadata {
                  plaintiffName
                  defendantName
                  claimAmount
                  claimCurrency
                }
                createdAt
                updatedAt
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      `;

      const currentPage = pagination?.currentPage || 1;
      const pageSize = pagination?.pageSize || 10;

      // For pages beyond the first, ensure we have the required cursor
      // This handles direct page jumps (e.g., clicking page 5 from page 1)
      let prefetchCursor: string | undefined = undefined;
      if (currentPage > 1) {
        prefetchCursor = await ensureCursorsCached(
          resource,
          currentPage,
          pageSize,
          query,
          filters,
          sorters,
        );
      }

      const graphqlFilter = buildGraphQLFilter(filters);
      const graphqlSorting = buildGraphQLSorting(sorters);

      // Build paging with the potentially prefetched cursor
      let graphqlPaging: { first: number; after?: string };
      if (currentPage <= 1) {
        graphqlPaging = { first: pageSize };
      } else if (prefetchCursor) {
        graphqlPaging = { first: pageSize, after: prefetchCursor };
      } else {
        // Fallback to buildGraphQLPaging
        graphqlPaging = buildGraphQLPaging(pagination, resource, filters, sorters);
      }

      const data = await executeGraphQL<{
        legalDocuments: {
          totalCount: number;
          edges: Array<{ node: TData }>;
          pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
          };
        };
      }>(query, {
        filter: graphqlFilter || {},
        paging: graphqlPaging,
        sorting: graphqlSorting || [],
      });

      // Extract any GraphQL errors from the response
      const errors = getProviderErrors(data);

      const items = data.legalDocuments.edges.map((edge) => edge.node);

      // Store cursor for this page to enable navigation
      const cacheKey = getCacheKey(resource, filters, sorters);
      storeCursor(
        cacheKey,
        currentPage,
        data.legalDocuments.pageInfo.endCursor,
        data.legalDocuments.totalCount,
      );

      return {
        data: items,
        total: data.legalDocuments.totalCount,
        // Attach errors to the result for components to handle
        ...(errors.length > 0 && { _errors: errors }),
      };
    }

    if (resource === 'legalRulings') {
      const query = `
        query GetLegalRulings($filter: LegalRulingFilter, $paging: CursorPaging, $sorting: [LegalRulingSort!]) {
          legalRulings(filter: $filter, paging: $paging, sorting: $sorting) {
            totalCount
            edges {
              node {
                id
                signature
                courtName
                courtType
                rulingDate
                summary
                caseNumber
                keywords
                createdAt
                updatedAt
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      `;

      const currentPage = pagination?.currentPage || 1;
      const pageSize = pagination?.pageSize || 10;

      // For pages beyond the first, ensure we have the required cursor
      let prefetchCursor: string | undefined = undefined;
      if (currentPage > 1) {
        prefetchCursor = await ensureCursorsCached(
          resource,
          currentPage,
          pageSize,
          query,
          filters,
          sorters,
        );
      }

      const graphqlFilter = buildGraphQLFilter(filters);
      const graphqlSorting = buildGraphQLSorting(sorters);

      // Build paging with the potentially prefetched cursor
      let graphqlPaging: { first: number; after?: string };
      if (currentPage <= 1) {
        graphqlPaging = { first: pageSize };
      } else if (prefetchCursor) {
        graphqlPaging = { first: pageSize, after: prefetchCursor };
      } else {
        graphqlPaging = buildGraphQLPaging(pagination, resource, filters, sorters);
      }

      const data = await executeGraphQL<{
        legalRulings: {
          totalCount: number;
          edges: Array<{ node: TData }>;
          pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
          };
        };
      }>(query, {
        filter: graphqlFilter || {},
        paging: graphqlPaging,
        sorting: graphqlSorting || [],
      });

      // Extract any GraphQL errors from the response
      const errors = getProviderErrors(data);

      const items = data.legalRulings.edges.map((edge) => edge.node);

      // Store cursor for this page to enable navigation
      const cacheKey = getCacheKey(resource, filters, sorters);
      storeCursor(
        cacheKey,
        currentPage,
        data.legalRulings.pageInfo.endCursor,
        data.legalRulings.totalCount,
      );

      return {
        data: items,
        total: data.legalRulings.totalCount,
        // Attach errors to the result for components to handle
        ...(errors.length > 0 && { _errors: errors }),
      };
    }

    if (resource === 'demoRequests') {
      const query = `
        query GetDemoRequests($filter: DemoRequestFilter, $paging: CursorPaging, $sorting: [DemoRequestSort!]) {
          demoRequests(filter: $filter, paging: $paging, sorting: $sorting) {
            totalCount
            edges {
              node {
                id
                fullName
                email
                company
                companySize
                industry
                useCase
                timeline
                budget
                preferredDemoTime
                status
                hubspotContactId
                submittedAt
                contactedAt
                createdAt
                updatedAt
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      `;

      const currentPage = pagination?.currentPage || 1;
      const pageSize = pagination?.pageSize || 10;

      // For pages beyond the first, ensure we have the required cursor
      let prefetchCursor: string | undefined = undefined;
      if (currentPage > 1) {
        prefetchCursor = await ensureCursorsCached(
          resource,
          currentPage,
          pageSize,
          query,
          filters,
          sorters,
        );
      }

      const graphqlFilter = buildGraphQLFilter(filters);
      const graphqlSorting = buildGraphQLSorting(sorters) || [
        { field: 'submittedAt', direction: 'DESC' },
      ];

      // Build paging with the potentially prefetched cursor
      let graphqlPaging: { first: number; after?: string };
      if (currentPage <= 1) {
        graphqlPaging = { first: pageSize };
      } else if (prefetchCursor) {
        graphqlPaging = { first: pageSize, after: prefetchCursor };
      } else {
        graphqlPaging = buildGraphQLPaging(pagination, resource, filters, sorters);
      }

      const data = await executeGraphQL<{
        demoRequests: {
          totalCount: number;
          edges: Array<{ node: TData }>;
          pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
          };
        };
      }>(query, {
        filter: graphqlFilter || {},
        paging: graphqlPaging,
        sorting: graphqlSorting,
      });

      // Extract any GraphQL errors from the response
      const errors = getProviderErrors(data);

      const items = data.demoRequests.edges.map((edge) => edge.node);

      // Store cursor for this page to enable navigation
      const cacheKey = getCacheKey(resource, filters, sorters);
      storeCursor(
        cacheKey,
        currentPage,
        data.demoRequests.pageInfo.endCursor,
        data.demoRequests.totalCount,
      );

      return {
        data: items,
        total: data.demoRequests.totalCount,
        // Attach errors to the result for components to handle
        ...(errors.length > 0 && { _errors: errors }),
      };
    }

    throw new Error(`Unknown resource: ${resource}`);
  },

  /**
   * Get a single resource by ID
   */
  getOne: async <TData extends BaseRecord = BaseRecord>({
    resource,
    id,
  }: {
    resource: string;
    id: string | number;
  }) => {
    if (resource === 'users') {
      const query = `
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            email
            username
            firstName
            lastName
            isActive
            role
            disclaimerAccepted
            disclaimerAcceptedAt
            stripeCustomerId
            createdAt
            updatedAt
          }
        }
      `;

      const data = await executeGraphQL<{ user: TData }>(query, { id });
      return {
        data: data.user,
      };
    }

    if (resource === 'audit_logs') {
      const query = `
        query GetAuditLog($id: ID!) {
          auditLog(id: $id) {
            id
            action
            resourceType
            resourceId
            userId
            user {
              id
              email
              firstName
              lastName
            }
            ipAddress
            userAgent
            statusCode
            errorMessage
            changeDetails
            createdAt
            updatedAt
          }
        }
      `;

      const data = await executeGraphQL<{ auditLog: TData }>(query, { id });
      return {
        data: data.auditLog,
      };
    }

    if (resource === 'documents') {
      const query = `
        query GetLegalDocument($id: ID!) {
          legalDocument(id: $id) {
            id
            sessionId
            title
            type
            status
            contentRaw
            metadata {
              plaintiffName
              defendantName
              claimAmount
              claimCurrency
            }
            createdAt
            updatedAt
          }
        }
      `;

      const data = await executeGraphQL<{ legalDocument: TData }>(query, { id });
      return {
        data: data.legalDocument,
      };
    }

    if (resource === 'legalRulings') {
      const query = `
        query GetLegalRuling($id: ID!) {
          legalRuling(id: $id) {
            id
            signature
            courtName
            courtType
            rulingDate
            summary
            fullText
            metadata {
              legalArea
              keywords
              relatedCases
              sourceReference
            }
            createdAt
            updatedAt
          }
        }
      `;

      const data = await executeGraphQL<{ legalRuling: TData }>(query, { id });
      return {
        data: data.legalRuling,
      };
    }

    if (resource === 'demoRequests') {
      const query = `
        query GetDemoRequest($id: ID!) {
          demoRequest(id: $id) {
            id
            fullName
            email
            company
            companySize
            industry
            useCase
            timeline
            budget
            preferredDemoTime
            status
            hubspotContactId
            submittedAt
            contactedAt
            createdAt
            updatedAt
          }
        }
      `;

      const data = await executeGraphQL<{ demoRequest: TData }>(query, { id });
      return {
        data: data.demoRequest,
      };
    }

    throw new Error(`Unknown resource: ${resource}`);
  },

  /**
   * Create a new resource
   */
  create: async <TData extends BaseRecord = BaseRecord, TVariables = Record<string, unknown>>({
    resource,
    variables,
    meta,
  }: {
    resource: string;
    variables: TVariables;
    meta?: { operation?: string; [key: string]: unknown };
  }) => {
    // User creation via nestjs-query auto-generated mutation
    if (resource === 'users') {
      const mutation = `
        mutation CreateOneUser($input: CreateUserInput!) {
          createOneUser(input: $input) {
            id
            email
            username
            firstName
            lastName
            isActive
            role
            disclaimerAccepted
            createdAt
            updatedAt
          }
        }
      `;

      const data = await executeGraphQL<{ createOneUser: TData }>(mutation, {
        input: variables,
      });

      return {
        data: data.createOneUser,
      };
    }

    // Document generation via GraphQL mutation
    if (resource === 'documents') {
      const mutation = `
        mutation GenerateDocument($input: GenerateDocumentInput!) {
          generateDocument(input: $input) {
            id
            sessionId
            title
            type
            status
            contentRaw
            metadata {
              plaintiffName
              defendantName
              claimAmount
              claimCurrency
            }
            createdAt
            updatedAt
          }
        }
      `;

      const data = await executeGraphQL<{ generateDocument: TData }>(mutation, {
        input: variables,
      });

      return {
        data: data.generateDocument,
      };
    }

    // Document templates via GraphQL mutation
    if (resource === 'documentTemplates') {
      const operation = meta?.operation || 'createDocumentTemplate';

      const mutation = `
        mutation ${operation}($input: CreateTemplateInput!) {
          ${operation}(input: $input) {
            id
            name
            category
            description
            content
            variables
            conditionalSections
            polishFormattingRules
            isActive
            usageCount
            createdAt
            updatedAt
          }
        }
      `;

      const data = await executeGraphQL<{ [key: string]: TData }>(mutation, {
        input: variables,
      });

      return {
        data: data[operation],
      };
    }

    throw new Error(`Create not implemented for resource: ${resource}`);
  },

  /**
   * Update an existing resource
   */
  update: async <TData extends BaseRecord = BaseRecord, TVariables = Record<string, unknown>>({
    resource,
    id,
    variables,
    meta,
  }: {
    resource: string;
    id: string | number;
    variables: TVariables;
    meta?: { operation?: string; [key: string]: unknown };
  }) => {
    if (resource === 'users') {
      const mutation = `
        mutation UpdateOneUser($id: ID!, $input: UpdateUserInput!) {
          updateOneUser(id: $id, input: $input) {
            id
            email
            username
            firstName
            lastName
            isActive
            role
            disclaimerAccepted
            createdAt
            updatedAt
          }
        }
      `;

      const data = await executeGraphQL<{ updateOneUser: TData }>(mutation, {
        id,
        input: variables,
      });

      return {
        data: data.updateOneUser,
      };
    }

    if (resource === 'documents') {
      const mutation = `
        mutation UpdateDocument($id: ID!, $input: UpdateDocumentInput!) {
          updateDocument(id: $id, input: $input) {
            id
            sessionId
            title
            type
            status
            contentRaw
            metadata {
              plaintiffName
              defendantName
              claimAmount
              claimCurrency
            }
            createdAt
            updatedAt
          }
        }
      `;

      const data = await executeGraphQL<{ updateDocument: TData }>(mutation, {
        id,
        input: variables,
      });

      return {
        data: data.updateDocument,
      };
    }

    // Document templates via GraphQL mutation
    if (resource === 'documentTemplates') {
      const operation = meta?.operation || 'updateDocumentTemplate';

      const mutation = `
        mutation ${operation}($id: ID!, $input: UpdateTemplateInput!) {
          ${operation}(id: $id, input: $input) {
            id
            name
            category
            description
            content
            variables
            conditionalSections
            polishFormattingRules
            isActive
            usageCount
            createdAt
            updatedAt
          }
        }
      `;

      const data = await executeGraphQL<{ [key: string]: TData }>(mutation, {
        id,
        input: variables,
      });

      return {
        data: data[operation],
      };
    }

    throw new Error(`Update not implemented for resource: ${resource}`);
  },

  /**
   * Delete a resource
   */
  deleteOne: async <TData extends BaseRecord = BaseRecord>({
    resource,
    id,
  }: {
    resource: string;
    id: string | number;
  }) => {
    if (resource === 'users') {
      const mutation = `
        mutation DeleteOneUser($id: ID!) {
          deleteOneUser(id: $id) {
            id
            email
          }
        }
      `;

      await executeGraphQL<{ deleteOneUser: TData }>(mutation, { id });

      return {
        data: { id } as TData,
      };
    }

    if (resource === 'documents') {
      const mutation = `
        mutation DeleteDocument($id: ID!) {
          deleteDocument(id: $id)
        }
      `;

      await executeGraphQL<{ deleteDocument: boolean }>(mutation, { id });

      return {
        data: { id } as TData,
      };
    }

    throw new Error(`Delete not implemented for resource: ${resource}`);
  },

  /**
   * Custom GraphQL queries and mutations
   *
   * Executes arbitrary GraphQL queries/mutations based on config.
   * Used by useCustom and useCustomMutation hooks.
   *
   * Config format for queries:
   *   config.query.operation - GraphQL operation name
   *   config.query.fields - Array of field names to fetch
   *   config.query.args - Arguments to pass to the operation
   *
   * Config format for mutations:
   *   config.mutation.operation - GraphQL operation name
   *   config.mutation.fields - Array of field names to fetch
   *   config.mutation.values - Values to pass as mutation input
   *
   * For useCustomMutation, the mutation config can be passed in the 'values' param:
   *   values.operation - GraphQL operation name
   *   values.variables - Mutation variables (e.g., { input: {...} })
   *   values.fields - Array of field names to fetch
   *
   * URL-based format:
   *   When url is provided (e.g., '/updateProfile'), the operation name is derived from the URL path.
   *   The operation name is the URL path without the leading slash, in camelCase.
   *   The values should contain the mutation input (e.g., { input: {...} }).
   */
  custom: async <TData extends BaseRecord = BaseRecord, TVariables = Record<string, unknown>>({
    method,
    config,
    values,
    url,
  }: {
    method?: string;
    config?: {
      query?: {
        operation: string;
        fields?: string[];
        args?: Record<string, unknown>;
        variables?: Record<string, unknown>;
      };
      mutation?: {
        operation: string;
        fields?: string[];
        values?: Record<string, unknown>;
        variables?: Record<string, unknown>;
      };
    };
    values?: TVariables;
    url?: string;
  }) => {
    let queryConfig = config?.query;
    let mutationConfig = config?.mutation;

    // Normalize method to lowercase for consistent comparison
    const normalizedMethod = method?.toLowerCase();

    // Handle useCustomMutation format where mutation config is in 'values'
    if (normalizedMethod === 'post' && !mutationConfig && values && typeof values === 'object') {
      const valuesObj = values as Record<string, unknown>;

      // Check if operation is explicitly provided in values
      if ('operation' in valuesObj && typeof valuesObj.operation === 'string') {
        // Extract the operation config from values
        // When using this format, values contains: { operation, variables, fields }
        mutationConfig = {
          operation: valuesObj.operation as string,
          fields: Array.isArray(valuesObj.fields) ? (valuesObj.fields as string[]) : undefined,
          variables:
            'variables' in valuesObj ? (valuesObj.variables as Record<string, unknown>) : undefined,
          // Don't set 'values' property - the actual mutation data is in 'variables'
        };
      }
      // If no explicit operation but url is provided, derive operation from url
      // Check both top-level url and url in values (refine may pass it differently)
      else if (
        (url && url.startsWith('/')) ||
        ('url' in valuesObj &&
          typeof valuesObj.url === 'string' &&
          (valuesObj.url as string).startsWith('/'))
      ) {
        const urlValue = url || (valuesObj.url as string);
        const operation = urlValue.substring(1).replace(/^\//, '');
        mutationConfig = {
          operation,
          fields: ['id'], // Default fields - will be overridden if returned
          variables: valuesObj as Record<string, unknown>,
        };
      }
      // Fallback: treat values with 'input' as a mutation
      else if ('input' in valuesObj && typeof valuesObj.input === 'object') {
        // Try to infer operation from the structure or use a default pattern
        // This case is handled by the explicit operation or url patterns above
        mutationConfig = {
          operation: 'unknown',
          fields: ['id'],
          variables: valuesObj as Record<string, unknown>,
        };
      }
    }

    // Handle URL-based queries (useCustom with method: 'get')
    if (!queryConfig && normalizedMethod === 'get' && values && typeof values === 'object') {
      const valuesObj = values as Record<string, unknown>;
      // Check both top-level url and url in values (refine may pass it differently)
      if (
        (url && url.startsWith('/')) ||
        ('url' in valuesObj &&
          typeof valuesObj.url === 'string' &&
          (valuesObj.url as string).startsWith('/'))
      ) {
        const urlValue = url || (valuesObj.url as string);
        const operation = urlValue.substring(1).replace(/^\//, '');
        queryConfig = {
          operation,
          fields: [], // Will be populated by caller if needed
          args: undefined,
        };
      }
    }

    if (mutationConfig && normalizedMethod === 'post') {
      // Execute mutation
      const { operation, fields = [], values: mutationValues, variables } = mutationConfig;
      const mutationVars = { ...(mutationValues || {}), ...(variables || {}) };

      // Build mutation string
      const fieldsStr = fields.join(' ');

      // Build mutation - handle input objects specially
      let mutation = '';
      let varsToPass: Record<string, unknown> = {};

      // Check if there's an 'input' variable with a complex object value
      const hasInputObject =
        'input' in mutationVars &&
        typeof mutationVars.input === 'object' &&
        mutationVars.input !== null &&
        !Array.isArray(mutationVars.input);

      if (hasInputObject) {
        // For input objects, inline the values directly to avoid type inference issues
        const inputObj = mutationVars.input as Record<string, unknown>;

        // Fields that should be treated as enum values (not quoted in GraphQL)
        const enumFields = ['theme', 'aiModel', 'role'];

        const inputFields = Object.entries(inputObj)
          .filter(([_, value]) => value !== '')
          .map(([key, value]) => {
            // Enum values should not be quoted in GraphQL
            if (enumFields.includes(key) && typeof value === 'string') {
              return `${key}: ${value}`;
            } else if (typeof value === 'string') {
              return `${key}: "${value}"`;
            } else if (typeof value === 'boolean') {
              return `${key}: ${value}`;
            } else if (typeof value === 'number') {
              return `${key}: ${value}`;
            } else if (value === null || value === undefined) {
              return `${key}: null`;
            } else if (Array.isArray(value)) {
              // Handle arrays (e.g., scopes in createApiKey, channels in notificationPreferences)
              if (value.length === 0) {
                return `${key}: []`;
              }
              const arrayStr = value
                .map((v) => {
                  if (typeof v === 'string') return `"${v}"`;
                  if (typeof v === 'boolean') return v;
                  if (typeof v === 'number') return v;
                  return JSON.stringify(v);
                })
                .join(', ');
              return `${key}: [${arrayStr}]`;
            } else if (typeof value === 'object') {
              // Handle nested objects (e.g., notificationPreferences.channels)
              // Build nested object literal for GraphQL
              const nestedFields = Object.entries(value as Record<string, unknown>)
                .filter(([_, nestedValue]) => nestedValue !== '')
                .map(([nestedKey, nestedValue]) => {
                  if (typeof nestedValue === 'string') {
                    return `${nestedKey}: "${nestedValue}"`;
                  } else if (typeof nestedValue === 'boolean') {
                    return `${nestedKey}: ${nestedValue}`;
                  } else if (nestedValue === null || nestedValue === undefined) {
                    return `${nestedKey}: null`;
                  } else if (Array.isArray(nestedValue)) {
                    if (nestedValue.length === 0) {
                      return `${nestedKey}: []`;
                    }
                    const nestedArrayStr = nestedValue
                      .map((v) => {
                        if (typeof v === 'string') return `"${v}"`;
                        if (typeof v === 'boolean') return v;
                        if (typeof v === 'number') return v;
                        return JSON.stringify(v);
                      })
                      .join(', ');
                    return `${nestedKey}: [${nestedArrayStr}]`;
                  }
                  return `${nestedKey}: "${nestedValue}"`;
                })
                .join(', ');
              return `${key}: { ${nestedFields} }`;
            }
            return `${key}: "${value}"`;
          })
          .join(', ');

        // For scalar returns (Boolean, String, etc.) with no fields, don't use selection set
        if (fieldsStr) {
          mutation = `
            mutation ${operation} {
              ${operation}(input: { ${inputFields} }) {
                ${fieldsStr}
              }
            }
          `;
        } else {
          mutation = `
            mutation ${operation} {
              ${operation}(input: { ${inputFields} })
            }
          `;
        }
        varsToPass = {};
      } else {
        // Build variable definitions and input arguments for simple types
        const varDefs = Object.entries(mutationVars)
          .map(([key, value]) => {
            // Infer type from value
            const type =
              typeof value === 'number'
                ? 'Float'
                : typeof value === 'boolean'
                  ? 'Boolean'
                  : 'String';
            return `$${key}: ${type}!`;
          })
          .join(', ');

        const inputArgs = Object.keys(mutationVars)
          .map((key) => `${key}: $${key}`)
          .join(', ');

        // For scalar returns (Boolean, String, etc.) with no fields, don't use selection set
        if (fieldsStr) {
          mutation = `
            mutation ${operation}(${varDefs ? varDefs : ''}) {
              ${operation}(${inputArgs ? inputArgs : ''}) {
                ${fieldsStr}
              }
            }
          `;
        } else {
          mutation = `
            mutation ${operation}(${varDefs ? varDefs : ''}) {
              ${operation}(${inputArgs ? inputArgs : ''})
            }
          `;
        }
        varsToPass = mutationVars;
      }

      const data = await executeGraphQL<Record<string, TData>>(mutation, varsToPass);

      // Return first key's value as result
      const resultKey = Object.keys(data)[0];
      return {
        data: data[resultKey] as TData,
      };
    }

    if (queryConfig) {
      // Execute query
      const { operation, fields = [], args, variables } = queryConfig;
      const queryVars = { ...(args || {}), ...(variables || {}) };

      // Build query string
      const fieldsStr = fields.join(' ');

      // Build variable definitions and arguments
      let queryStr = '';
      if (Object.keys(queryVars).length > 0) {
        const varDefs = Object.entries(queryVars)
          .map(([key, value]) => {
            // Infer type from value
            const type =
              typeof value === 'number'
                ? 'Float'
                : typeof value === 'boolean'
                  ? 'Boolean'
                  : value instanceof Date
                    ? 'DateTime'
                    : 'String';
            return `$${key}: ${type}`;
          })
          .join(', ');

        const argsStr = Object.keys(queryVars)
          .map((key) => `${key}: $${key}`)
          .join(', ');

        queryStr = `
          query ${operation}(${varDefs}) {
            ${operation}(${argsStr}) {
              ${fieldsStr}
            }
          }
        `;
      } else {
        // No arguments
        queryStr = `
          query ${operation} {
            ${operation} {
              ${fieldsStr}
            }
          }
        `;
      }

      const data = await executeGraphQL<Record<string, TData>>(queryStr, queryVars);

      // Return first key's value as result
      const resultKey = Object.keys(data)[0];
      return {
        data: data[resultKey] as TData,
      };
    }

    throw new Error('Custom query/mutation not configured properly');
  },

  /**
   * Get API URL (for compatibility)
   */
  getApiUrl: () => GRAPHQL_URL,
};
