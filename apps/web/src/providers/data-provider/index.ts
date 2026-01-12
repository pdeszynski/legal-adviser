"use client";

import type { DataProvider, BaseRecord } from "@refinedev/core";

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
 * GraphQL Data Provider for Refine
 *
 * Implements the DataProvider interface using GraphQL queries and mutations.
 */
export const dataProvider: DataProvider = {
  /**
   * Get a list of resources
   */
  getList: async <TData extends BaseRecord = BaseRecord>({ resource }: { resource: string }) => {
    // Map resource names to GraphQL queries
    const queryMap: Record<string, string> = {
      documents: `
        query GetDocuments {
          documents {
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
      `,
    };

    const query = queryMap[resource];
    if (!query) {
      throw new Error(`Unknown resource: ${resource}`);
    }

    const data = await executeGraphQL<Record<string, TData[]>>(query);
    const items = data[resource] || [];

    return {
      data: items,
      total: items.length,
    };
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
    const queryMap: Record<string, string> = {
      documents: `
        query GetDocument($id: ID!) {
          document(id: $id) {
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
      `,
    };

    const query = queryMap[resource];
    if (!query) {
      throw new Error(`Unknown resource: ${resource}`);
    }

    const data = await executeGraphQL<Record<string, TData>>(query, { id });
    const singularResource = resource.replace(/s$/, ""); // documents -> document
    return {
      data: data[singularResource],
    };
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
