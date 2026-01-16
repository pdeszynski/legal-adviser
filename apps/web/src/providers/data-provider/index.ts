"use client";

import type { DataProvider, BaseRecord, CrudFilters, CrudSorting, Pagination } from "@refinedev/core";

/**
 * GraphQL Data Provider
 *
 * Per constitution: GraphQL is the primary API for data operations.
 * This provider connects to the NestJS GraphQL endpoint.
 */
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql";

/**
 * Execute a GraphQL query or mutation
 */
async function executeGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
    throw new Error(result.errors[0].message || "GraphQL error");
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
    if ("field" in filter) {
      const { field, operator, value } = filter;

      // Skip empty values
      if (value === undefined || value === null || value === "") continue;

      switch (operator) {
        case "eq":
          filterObj[field] = { eq: value };
          break;
        case "ne":
          filterObj[field] = { neq: value };
          break;
        case "contains":
          filterObj[field] = { iLike: `%${value}%` };
          break;
        case "startswith":
          filterObj[field] = { iLike: `${value}%` };
          break;
        case "endswith":
          filterObj[field] = { iLike: `%${value}` };
          break;
        case "in":
          filterObj[field] = { in: value };
          break;
        case "gt":
          filterObj[field] = { gt: value };
          break;
        case "gte":
          filterObj[field] = { gte: value };
          break;
        case "lt":
          filterObj[field] = { lt: value };
          break;
        case "lte":
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
function buildGraphQLSorting(sorters?: CrudSorting): Array<{ field: string; direction: string }> | undefined {
  if (!sorters || sorters.length === 0) return undefined;

  return sorters.map((sorter) => ({
    field: sorter.field,
    direction: sorter.order === "asc" ? "ASC" : "DESC",
  }));
}

/**
 * Build cursor-based paging for nestjs-query
 */
function buildGraphQLPaging(pagination?: Pagination): { first: number } {
  const pageSize = pagination?.pageSize || 10;
  return { first: pageSize };
}

/**
 * GraphQL Data Provider for Refine
 *
 * Implements the DataProvider interface using GraphQL queries and mutations.
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
    if (resource === "documents") {
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
      const graphqlPaging = buildGraphQLPaging(pagination);

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

      return {
        data: items,
        total: data.legalDocuments.totalCount,
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
    if (resource === "documents") {
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
    if (resource === "documents") {
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
    if (resource === "documents") {
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
    if (resource === "documents") {
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
   * Get API URL (for compatibility)
   */
  getApiUrl: () => GRAPHQL_URL,
};
