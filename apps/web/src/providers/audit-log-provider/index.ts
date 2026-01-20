import type { AuditLogProvider } from "@refinedev/core";

const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:3001/graphql";

const AUDIT_LOGS_QUERY = `
  query AuditLogs($filter: AuditLogFilter, $paging: CursorPaging, $sorting: [AuditLogSort!]) {
    auditLogs(filter: $filter, paging: $paging, sorting: $sorting) {
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
      totalCount
    }
  }
`;

interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  userId?: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  ipAddress?: string;
  userAgent?: string;
  statusCode?: number;
  errorMessage?: string;
  changeDetails?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  createdAt: string;
  updatedAt: string;
}

interface GraphQLResponse {
  data?: {
    auditLogs?: {
      edges: Array<{ node: AuditLog }>;
      pageInfo: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor?: string;
        endCursor?: string;
      };
      totalCount: number;
    };
  };
  errors?: Array<{ message: string }>;
}

const getAccessToken = (): string | undefined => {
  if (typeof document === "undefined") {
    return undefined;
  }
  const cookies = document.cookie.split(";");
  const authCookie = cookies.find((c) => c.trim().startsWith("access_token="));
  return authCookie?.split("=")[1];
};

export const auditLogProvider: AuditLogProvider = {
  get: async ({ resource, action, meta, author }) => {
    const token = getAccessToken();

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

    // Build GraphQL variables
    const variables: Record<string, unknown> = {
      paging: { first: 50 },
      sorting: [{ field: "createdAt", direction: "DESC" }],
    };

    if (Object.keys(filter).length > 0) {
      variables.filter = filter;
    }

    try {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
        body: JSON.stringify({
          query: AUDIT_LOGS_QUERY,
          variables,
        }),
      });

      const result: GraphQLResponse = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || "GraphQL error");
      }

      const auditLogs = result.data?.auditLogs?.edges.map((edge) => edge.node) || [];

      // Transform to Refine's LogParams format
      return auditLogs.map((log) => {
        const userName = log.user
          ? `${log.user.firstName || ""} ${log.user.lastName || ""}`.trim() ||
            log.user.email
          : "System";

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
            changeDetails: log.changeDetails,
          },
          author: log.user
            ? {
                id: log.user.id,
                name: userName,
              }
            : undefined,
          date: new Date(log.createdAt),
          previousData: log.changeDetails?.before,
          data: log.changeDetails?.after,
        };
      });
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      return [];
    }
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
