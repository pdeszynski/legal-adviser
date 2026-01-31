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
 * Maximum page size allowed by the GraphQL API.
 * The paging.first parameter has a max value of 50 on the backend.
 */
const MAX_PAGE_SIZE = 50;

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
    const cappedPageSize = Math.min(pageSize, MAX_PAGE_SIZE);
    const graphqlPaging: { first: number; after?: string } = currentCursor
      ? { first: cappedPageSize, after: currentCursor }
      : { first: cappedPageSize };

    const graphqlFilter = buildGraphQLFilter(filters);
    const graphqlSorting = buildGraphQLSorting(sorters);

    try {
      // Determine the query type based on resource
      const queryToUse = query;
      let dataKey = '';

      if (resource === 'users') {
        dataKey = 'users';
      } else if (resource === 'documents') {
        dataKey = 'legalDocuments';
      } else if (resource === 'audit_logs') {
        dataKey = 'auditLogs';
      } else if (resource === 'legalRulings') {
        dataKey = 'legalRulings';
      } else if (resource === 'notifications') {
        dataKey = 'notifications';
      } else if (resource === 'demoRequests') {
        dataKey = 'demoRequests';
      } else if (resource === 'apiKeys') {
        dataKey = 'apiKeys';
      } else if (resource === 'subscription_plans') {
        dataKey = 'subscriptionPlans';
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
 * Field type categories for nestjs-query filter operator mapping
 *
 * nestjs-query uses different comparison operators for different field types:
 * - BooleanFieldComparison: is, isNot (no 'eq' operator)
 * - StringFieldComparison: eq, neq, iLike, like, in, notIn, gt, gte, lt, lte
 * - NumberFieldComparison: eq, neq, gt, gte, lt, lte, in, notIn
 * - DateFieldComparison: eq, neq, gt, gte, lt, lte, in, notIn
 * - EnumFieldComparison: eq, neq, in, notIn (no iLike/like operators)
 */

/**
 * Field type metadata for determining correct GraphQL filter operators
 */
type FieldType = 'boolean' | 'string' | 'number' | 'date' | 'enum' | 'unknown';

/**
 * Field type registry with type information for known fields
 * Maps field names to their types for proper operator selection
 */
const FIELD_TYPE_REGISTRY: Record<string, FieldType> = {
  // Boolean fields - use 'is'/'isNot' operators
  isActive: 'boolean',
  twoFactorEnabled: 'boolean',
  isPinned: 'boolean',
  read: 'boolean',
  emailNotifications: 'boolean',
  inAppNotifications: 'boolean',
  moderated: 'boolean',
  flagged: 'boolean',

  // Date fields - use date comparison operators
  createdAt: 'date',
  updatedAt: 'date',
  deletedAt: 'date',
  twoFactorVerifiedAt: 'date',
  verifiedAt: 'date',
  lastLoginAt: 'date',
  passwordChangedAt: 'date',
  submittedAt: 'date',
  contactedAt: 'date',
  expiresAt: 'date',
  lastUsedAt: 'date',
  rulingDate: 'date',
  flaggedAt: 'date',
  moderatedAt: 'date',

  // Enum fields - use eq/neq/in operators (no iLike/like)
  role: 'enum',
  status: 'enum',
  action: 'enum',
  resourceType: 'enum',
  tier: 'enum',
  billingInterval: 'enum',
  type: 'enum',
  moderationStatus: 'enum',
  courtType: 'enum',

  // Number fields - use numeric comparison operators
  price: 'number',
  yearlyDiscount: 'number',
  maxUsers: 'number',
  trialDays: 'number',
  rateLimitPerMinute: 'number',
  displayOrder: 'number',
  usageCount: 'number',
};

/**
 * Detect field type based on field name patterns and known field registry
 *
 * @param fieldName - The field name to detect type for
 * @returns The detected field type
 */
function detectFieldType(fieldName: string): FieldType {
  // Check explicit registry first
  if (FIELD_TYPE_REGISTRY[fieldName]) {
    return FIELD_TYPE_REGISTRY[fieldName];
  }

  // Pattern-based detection for unknown fields

  // Boolean patterns: starts with 'is', 'has', 'should'
  if (/^(is|has|should|can|will|must)[A-Z]/.test(fieldName)) {
    return 'boolean';
  }

  // Date patterns: ends with 'At', 'Date', 'Time', 'On'
  if (/(At|Date|Time|On)$/.test(fieldName)) {
    return 'date';
  }

  // Common enum patterns (status, type, category, etc.)
  if (
    /^(status|type|category|tier|level|state|phase|stage|action|role|scope|plan|interval|mode|method)$/.test(
      fieldName,
    )
  ) {
    return 'enum';
  }

  // Default to string for unknown fields (most common)
  return 'string';
}

/**
 * Operator mapping configuration per field type
 *
 * Defines which GraphQL operator to use for each Refine operator
 * based on the detected field type.
 */
type OperatorMapping = {
  [refineOperator: string]: (value: unknown) => Record<string, unknown>;
};

/**
 * Get operator mapping for a specific field type
 *
 * @param fieldType - The detected field type
 * @returns Object mapping Refine operators to GraphQL filter builders
 */
function getOperatorMapping(fieldType: FieldType): OperatorMapping {
  switch (fieldType) {
    case 'boolean':
      // BooleanFieldComparison: is, isNot (no 'eq')
      return {
        eq: (value) => ({ is: value }),
        ne: (value) => ({ isNot: value }),
        neq: (value) => ({ isNot: value }),
        in: (value) => ({ is: value }), // Fallback - boolean 'in' not well supported
        default: (value) => ({ is: value }),
      };

    case 'date':
      // DateFieldComparison: eq, neq, gt, gte, lt, lte, in
      return {
        eq: (value) => ({ eq: value }),
        ne: (value) => ({ neq: value }),
        neq: (value) => ({ neq: value }),
        gt: (value) => ({ gt: value }),
        gte: (value) => ({ gte: value }),
        lt: (value) => ({ lt: value }),
        lte: (value) => ({ lte: value }),
        in: (value) => ({ in: value }),
        default: (value) => ({ eq: value }),
      };

    case 'number':
      // NumberFieldComparison: eq, neq, gt, gte, lt, lte, in, notIn
      return {
        eq: (value) => ({ eq: value }),
        ne: (value) => ({ neq: value }),
        neq: (value) => ({ neq: value }),
        gt: (value) => ({ gt: value }),
        gte: (value) => ({ gte: value }),
        lt: (value) => ({ lt: value }),
        lte: (value) => ({ lte: value }),
        in: (value) => ({ in: value }),
        default: (value) => ({ eq: value }),
      };

    case 'enum':
      // EnumFieldComparison: eq, neq, in, notIn (no iLike/like)
      return {
        eq: (value) => ({ eq: value }),
        ne: (value) => ({ neq: value }),
        neq: (value) => ({ neq: value }),
        in: (value) => ({ in: value }),
        default: (value) => ({ eq: value }),
      };

    case 'string':
    default:
      // StringFieldComparison: eq, neq, iLike, like, in, gt, gte, lt, lte
      return {
        eq: (value) => ({ eq: value }),
        ne: (value) => ({ neq: value }),
        neq: (value) => ({ neq: value }),
        contains: (value) => ({ iLike: `%${value}%` }),
        startswith: (value) => ({ iLike: `${value}%` }),
        endswith: (value) => ({ iLike: `%${value}` }),
        in: (value) => ({ in: value }),
        gt: (value) => ({ gt: value }),
        gte: (value) => ({ gte: value }),
        lt: (value) => ({ lt: value }),
        lte: (value) => ({ lte: value }),
        default: (value) => ({ eq: value }),
      };
  }
}

/**
 * Convert Refine filters to nestjs-query GraphQL filter format
 *
 * This function:
 * 1. Detects the type of each field (boolean, date, string, number, enum)
 * 2. Maps Refine operators to the correct GraphQL filter operators based on type
 * 3. Handles special cases like boolean fields (use 'is' not 'eq')
 * 4. Skips empty/undefined values
 *
 * Supported operators by field type:
 * - Boolean: eq→is, ne→isNot
 * - String: eq, ne, contains, startswith, endswith, in, gt, gte, lt, lte
 * - Number: eq, ne, gt, gte, lt, lte, in
 * - Date: eq, ne, gt, gte, lt, lte, in
 * - Enum: eq, ne, in
 *
 * @param filters - Refine CrudFilters array
 * @returns GraphQL filter object or undefined if no valid filters
 */
function buildGraphQLFilter(filters?: CrudFilters): Record<string, unknown> | undefined {
  if (!filters || filters.length === 0) return undefined;

  const filterObj: Record<string, unknown> = {};

  for (const filter of filters) {
    if ('field' in filter) {
      const { field, operator, value } = filter;

      // Skip empty values
      if (value === undefined || value === null || value === '') continue;

      // Detect field type for proper operator mapping
      const fieldType = detectFieldType(field);
      const operatorMapping = getOperatorMapping(fieldType);

      // Get the operator function, falling back to default if not found
      const operatorFn = operatorMapping[operator] || operatorMapping.default;

      // Build and apply the filter
      filterObj[field] = operatorFn(value);
    }
  }

  return Object.keys(filterObj).length > 0 ? filterObj : undefined;
}

/**
 * Export field detection functions for testing and external use
 */
export { detectFieldType, getOperatorMapping, buildGraphQLFilter, FIELD_TYPE_REGISTRY };
export type { FieldType };

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
  const pageSize = Math.min(pagination?.pageSize || 10, MAX_PAGE_SIZE);
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
                twoFactorEnabled
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

      // Separate filters into server-side and client-side
      // Note: 'role' is a computed field (from user_roles table) that cannot be filtered
      // at the database level through nestjs-query. It is resolved via @ResolveField.
      // For role filtering, the frontend should apply client-side filtering after fetching.
      const clientSideFilters = filters?.filter((f) => 'field' in f && f.field === 'role') || [];
      const serverSideFilters =
        filters?.filter((f) => 'field' in f && f.field !== 'role') || undefined;

      // Only use server-side pagination if no role filter is active
      // Role filtering requires fetching all data first
      const needsClientSideFilter = clientSideFilters.length > 0;

      const effectivePageSize = needsClientSideFilter
        ? MAX_PAGE_SIZE
        : Math.min(pageSize, MAX_PAGE_SIZE);
      const effectivePage = needsClientSideFilter ? 1 : currentPage;

      let prefetchCursor: string | undefined = undefined;
      if (effectivePage > 1 && !needsClientSideFilter) {
        prefetchCursor = await ensureCursorsCached(
          resource,
          effectivePage,
          effectivePageSize,
          query,
          serverSideFilters,
          sorters,
        );
      }

      const graphqlFilter = buildGraphQLFilter(serverSideFilters);
      const graphqlSorting = buildGraphQLSorting(sorters) || [
        { field: 'createdAt', direction: 'DESC' },
      ];

      let graphqlPaging: { first: number; after?: string };
      if (effectivePage <= 1) {
        graphqlPaging = { first: effectivePageSize };
      } else if (prefetchCursor) {
        graphqlPaging = { first: effectivePageSize, after: prefetchCursor };
      } else {
        graphqlPaging = buildGraphQLPaging(pagination, resource, serverSideFilters, sorters);
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
      let items = data.users.edges.map((edge) => edge.node);

      // Apply client-side filtering for role (computed field from user_roles table)
      if (needsClientSideFilter && items.length > 0) {
        for (const filter of clientSideFilters) {
          if ('field' in filter) {
            const { field, operator, value } = filter;

            if (field === 'role' && operator === 'eq' && value !== 'all') {
              items = items.filter((item: any) => item.role === value);
            }
          }
        }
      }

      // Apply client-side pagination for filtered results
      let filteredItems = items;
      let filteredTotal = data.users.totalCount;

      if (needsClientSideFilter) {
        filteredTotal = items.length;
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        filteredItems = items.slice(startIndex, endIndex);
      }

      const cacheKey = getCacheKey(resource, filters, sorters);
      storeCursor(cacheKey, currentPage, data.users.pageInfo.endCursor, data.users.totalCount);

      return {
        data: filteredItems,
        total: filteredTotal,
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
                moderationStatus
                moderationReason
                moderatedById
                flaggedAt
                moderatedAt
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

    if (resource === 'notifications') {
      const query = `
        query GetNotifications($filter: NotificationFilter, $paging: CursorPaging, $sorting: [NotificationSort!]) {
          notifications(filter: $filter, paging: $paging, sorting: $sorting) {
            totalCount
            edges {
              node {
                id
                recipientEmail
                userId
                subject
                template
                status
                templateData
                messageId
                errorMessage
                metadata
                sentAt
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
        notifications: {
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
      const items = data.notifications.edges.map((edge) => edge.node);

      const cacheKey = getCacheKey(resource, filters, sorters);
      storeCursor(
        cacheKey,
        currentPage,
        data.notifications.pageInfo.endCursor,
        data.notifications.totalCount,
      );

      return {
        data: items,
        total: data.notifications.totalCount,
        ...(errors.length > 0 && { _errors: errors }),
      };
    }

    if (resource === 'subscription_plans') {
      // Now using nestjs-query Connection format for proper server-side pagination
      const query = `
        query GetSubscriptionPlans($filter: SubscriptionPlanFilter, $paging: CursorPaging, $sorting: [SubscriptionPlanSort!]) {
          subscriptionPlans(filter: $filter, paging: $paging, sorting: $sorting) {
            totalCount
            edges {
              node {
                id
                tier
                name
                description
                price
                billingInterval
                yearlyDiscount
                features
                maxUsers
                trialDays
                isActive
                displayOrder
                stripePriceId
                stripeYearlyPriceId
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
        { field: 'displayOrder', direction: 'ASC' },
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
        subscriptionPlans: {
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
      const items = data.subscriptionPlans.edges.map((edge) => edge.node);

      // Store cursor for this page to enable navigation
      const cacheKey = getCacheKey(resource, filters, sorters);
      storeCursor(
        cacheKey,
        currentPage,
        data.subscriptionPlans.pageInfo.endCursor,
        data.subscriptionPlans.totalCount,
      );

      return {
        data: items,
        total: data.subscriptionPlans.totalCount,
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

    if (resource === 'apiKeys') {
      const query = `
        query GetApiKeys($filter: ApiKeyFilter, $paging: CursorPaging, $sorting: [ApiKeySort!]) {
          apiKeys(filter: $filter, paging: $paging, sorting: $sorting) {
            totalCount
            edges {
              node {
                id
                userId
                name
                keyPrefix
                scopes
                rateLimitPerMinute
                status
                expiresAt
                lastUsedAt
                usageCount
                description
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
        apiKeys: {
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

      const items = data.apiKeys.edges.map((edge) => edge.node);

      // Store cursor for this page to enable navigation
      const cacheKey = getCacheKey(resource, filters, sorters);
      storeCursor(cacheKey, currentPage, data.apiKeys.pageInfo.endCursor, data.apiKeys.totalCount);

      return {
        data: items,
        total: data.apiKeys.totalCount,
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
            moderationStatus
            moderationReason
            moderatedById
            flaggedAt
            moderatedAt
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

    if (resource === 'notifications') {
      const query = `
        query GetNotification($id: ID!) {
          notification(id: $id) {
            id
            recipientEmail
            userId
            user {
              id
              email
              firstName
              lastName
            }
            subject
            template
            status
            templateData
            messageId
            errorMessage
            metadata
            sentAt
            createdAt
            updatedAt
          }
        }
      `;

      const data = await executeGraphQL<{ notification: TData }>(query, { id });
      return {
        data: data.notification,
      };
    }

    if (resource === 'subscription_plans') {
      const query = `
        query GetSubscriptionPlan($id: ID!) {
          subscriptionPlan(id: $id) {
            id
            tier
            name
            description
            price
            billingInterval
            yearlyDiscount
            features
            maxUsers
            trialDays
            isActive
            displayOrder
            stripePriceId
            stripeYearlyPriceId
            createdAt
            updatedAt
          }
        }
      `;

      const data = await executeGraphQL<{ subscriptionPlan: TData }>(query, { id });
      return {
        data: data.subscriptionPlan,
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

    if (resource === 'apiKeys') {
      const query = `
        query GetApiKey($id: ID!) {
          apiKey(id: $id) {
            id
            userId
            name
            keyPrefix
            scopes
            rateLimitPerMinute
            status
            expiresAt
            lastUsedAt
            usageCount
            description
            createdAt
            updatedAt
          }
        }
      `;

      const data = await executeGraphQL<{ apiKey: TData }>(query, { id });
      return {
        data: data.apiKey,
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
        mutation CreateOneUser($input: CreateOneUserInput!) {
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
            moderationStatus
            moderationReason
            moderatedById
            flaggedAt
            moderatedAt
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

    // Subscription plans via nestjs-query auto-generated mutation
    if (resource === 'subscription_plans') {
      const mutation = `
        mutation CreateOneSubscriptionPlan($input: CreateOneSubscriptionPlanInput!) {
          createOneSubscriptionPlan(input: $input) {
            id
            tier
            name
            description
            price
            billingInterval
            yearlyDiscount
            features
            maxUsers
            trialDays
            isActive
            displayOrder
            stripePriceId
            stripeYearlyPriceId
            createdAt
            updatedAt
          }
        }
      `;

      const data = await executeGraphQL<{ createOneSubscriptionPlan: TData }>(mutation, {
        input: variables,
      });

      return {
        data: data.createOneSubscriptionPlan,
      };
    }

    // API keys via nestjs-query auto-generated mutation
    if (resource === 'apiKeys') {
      const mutation = `
        mutation CreateOneApiKey($input: CreateOneApiKeyInput!) {
          createOneApiKey(input: $input) {
            id
            userId
            name
            keyPrefix
            scopes
            rateLimitPerMinute
            status
            expiresAt
            lastUsedAt
            usageCount
            description
            createdAt
            updatedAt
          }
        }
      `;

      const data = await executeGraphQL<{ createOneApiKey: TData }>(mutation, {
        input: variables,
      });

      return {
        data: data.createOneApiKey,
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
      // nestjs-query format: id is inside input object
      const mutation = `
        mutation UpdateOneUser($input: UpdateOneUserInput!) {
          updateOneUser(input: $input) {
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
        input: {
          id,
          ...variables,
        },
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
            moderationStatus
            moderationReason
            moderatedById
            flaggedAt
            moderatedAt
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

    // Subscription plans via nestjs-query auto-generated mutation
    if (resource === 'subscription_plans') {
      // nestjs-query format: id is inside input object
      const mutation = `
        mutation UpdateOneSubscriptionPlan($input: UpdateOneSubscriptionPlanInput!) {
          updateOneSubscriptionPlan(input: $input) {
            id
            tier
            name
            description
            price
            billingInterval
            yearlyDiscount
            features
            maxUsers
            trialDays
            isActive
            displayOrder
            stripePriceId
            stripeYearlyPriceId
            createdAt
            updatedAt
          }
        }
      `;

      const data = await executeGraphQL<{ updateOneSubscriptionPlan: TData }>(mutation, {
        input: {
          id,
          ...variables,
        },
      });

      return {
        data: data.updateOneSubscriptionPlan,
      };
    }

    // API keys via nestjs-query auto-generated mutation
    if (resource === 'apiKeys') {
      // nestjs-query format: id is inside input object
      const mutation = `
        mutation UpdateOneApiKey($input: UpdateOneApiKeyInput!) {
          updateOneApiKey(input: $input) {
            id
            userId
            name
            keyPrefix
            scopes
            rateLimitPerMinute
            status
            expiresAt
            lastUsedAt
            usageCount
            description
            createdAt
            updatedAt
          }
        }
      `;

      const data = await executeGraphQL<{ updateOneApiKey: TData }>(mutation, {
        input: {
          id,
          ...variables,
        },
      });

      return {
        data: data.updateOneApiKey,
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
      // nestjs-query format: id is inside input object
      const mutation = `
        mutation DeleteOneUser($input: DeleteOneUserInput!) {
          deleteOneUser(input: $input) {
            id
            email
          }
        }
      `;

      const result = await executeGraphQL<{ deleteOneUser: TData }>(mutation, {
        input: { id },
      });

      return {
        data: result.deleteOneUser,
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

    // Subscription plans via nestjs-query auto-generated mutation
    if (resource === 'subscription_plans') {
      // nestjs-query format: id is inside input object
      const mutation = `
        mutation DeleteOneSubscriptionPlan($input: DeleteOneSubscriptionPlanInput!) {
          deleteOneSubscriptionPlan(input: $input) {
            id
            name
          }
        }
      `;

      const result = await executeGraphQL<{ deleteOneSubscriptionPlan: TData }>(mutation, {
        input: { id },
      });

      return {
        data: result.deleteOneSubscriptionPlan,
      };
    }

    // API keys via nestjs-query auto-generated mutation
    if (resource === 'apiKeys') {
      // nestjs-query format: id is inside input object
      const mutation = `
        mutation DeleteOneApiKey($input: DeleteOneApiKeyInput!) {
          deleteOneApiKey(input: $input) {
            id
            name
          }
        }
      `;

      const result = await executeGraphQL<{ deleteOneApiKey: TData }>(mutation, {
        input: { id },
      });

      return {
        data: result.deleteOneApiKey,
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
