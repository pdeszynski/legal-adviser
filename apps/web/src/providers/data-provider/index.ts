'use client';

import type {
  DataProvider,
  BaseRecord,
  CrudFilters,
  CrudSorting,
  Pagination,
} from '@refinedev/core';
import { getAccessToken } from '../auth-provider/auth-provider.client';

/**
 * GraphQL Data Provider
 *
 * Per constitution: GraphQL is the primary API for data operations.
 * This provider connects to the NestJS GraphQL endpoint.
 */
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

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
 * Get cached cursor for a specific page
 */
function getCachedCursor(key: string, pageNumber: number): string | undefined {
  const entry = cursorCache.get(key);
  // Return the endCursor of the previous page to use as "after" cursor
  return entry?.cursors[pageNumber - 1];
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
 * Execute a GraphQL query or mutation
 * Automatically includes authentication token if available
 */
async function executeGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  const result = await response.json();

  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors[0].message || 'GraphQL error');
  }

  return result.data;
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
                changeDetails {
                  before
                  after
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

      const graphqlFilter = buildGraphQLFilter(filters);
      const graphqlSorting = buildGraphQLSorting(sorters) || [
        { field: 'createdAt', direction: 'DESC' },
      ];
      const graphqlPaging = buildGraphQLPaging(pagination, resource, filters, sorters);

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

      const items = data.auditLogs.edges.map((edge) => edge.node);

      // Store cursor for this page to enable navigation
      const currentPage = pagination?.currentPage || 1;
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

      const graphqlFilter = buildGraphQLFilter(filters);
      const graphqlSorting = buildGraphQLSorting(sorters);
      const graphqlPaging = buildGraphQLPaging(pagination, resource, filters, sorters);

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

      const items = data.legalDocuments.edges.map((edge) => edge.node);

      // Store cursor for this page to enable navigation
      const currentPage = pagination?.currentPage || 1;
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

      const graphqlFilter = buildGraphQLFilter(filters);
      const graphqlSorting = buildGraphQLSorting(sorters);
      const graphqlPaging = buildGraphQLPaging(pagination, resource, filters, sorters);

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

      const items = data.legalRulings.edges.map((edge) => edge.node);

      // Store cursor for this page to enable navigation
      const currentPage = pagination?.currentPage || 1;
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
            changeDetails {
              before
              after
            }
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

    throw new Error(`Unknown resource: ${resource}`);
  },

  /**
   * Create a new resource
   */
  create: async <TData extends BaseRecord = BaseRecord, TVariables = Record<string, unknown>>({
    resource,
    variables,
  }: {
    resource: string;
    variables: TVariables;
  }) => {
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

    throw new Error(`Create not implemented for resource: ${resource}`);
  },

  /**
   * Update an existing resource
   */
  update: async <TData extends BaseRecord = BaseRecord, TVariables = Record<string, unknown>>({
    resource,
    id,
    variables,
  }: {
    resource: string;
    id: string | number;
    variables: TVariables;
  }) => {
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
   */
  custom: async <TData extends BaseRecord = BaseRecord>({
    method,
    config,
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
  }) => {
    const queryConfig = config?.query;
    const mutationConfig = config?.mutation;

    if (mutationConfig && method === 'post') {
      // Execute mutation
      const { operation, fields = [], values, variables } = mutationConfig;
      const mutationVars = { ...(values || {}), ...(variables || {}) };

      // Build mutation string
      const fieldsStr = fields.join(' ');

      // Build variable definitions and input arguments
      const varDefs = Object.entries(mutationVars)
        .map(([key, value]) => {
          // Infer type from value
          const type = typeof value === 'number' ? 'Float' : 'String';
          return `$${key}: ${type}!`;
        })
        .join(', ');

      const inputArgs = Object.keys(mutationVars)
        .map((key) => `${key}: $${key}`)
        .join(', ');

      const mutation = `
        mutation ${operation}(${varDefs ? varDefs : ''}) {
          ${operation}(${inputArgs ? inputArgs : ''}) {
            ${fieldsStr}
          }
        }
      `;

      const data = await executeGraphQL<Record<string, TData>>(mutation, mutationVars);

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
