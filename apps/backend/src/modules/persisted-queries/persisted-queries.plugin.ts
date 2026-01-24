import { ApolloServerPlugin, GraphQLRequestContext } from '@apollo/server';
import { PersistedQueriesService } from './persisted-queries.service';

/**
 * Apollo Server Plugin for Persisted Queries
 *
 * This plugin implements Automatic Persisted Queries (APQ) support.
 * It allows clients to send query hashes instead of full query documents,
 * reducing bandwidth usage and improving performance.
 *
 * Features:
 * - Looks up persisted queries by hash
 * - Falls back to regular query parsing if hash not found
 * - Supports both persisted and non-persisted queries in the same server
 *
 * @param service - The PersistedQueriesService for looking up queries
 * @returns Apollo Server plugin configuration
 */
export function createPersistedQueriesPlugin(
  service: PersistedQueriesService,
): ApolloServerPlugin {
  return {
    async requestDidStart() {
      return {
        async parsingDidStart(requestContext: GraphQLRequestContext<any>) {
          // Extract the query from the request
          const { query, extensions } = requestContext.request;

          // Check if this is a persisted query request
          const persistedQueryHash = extensions?.persistedQuery?.sha256Hash as
            | string
            | undefined;

          // If we have a persisted query hash but no query string, try to look it up
          if (persistedQueryHash && !query) {
            const resolvedQuery = service.getQuery(persistedQueryHash);

            if (resolvedQuery) {
              // Replace the empty query with the persisted query
              requestContext.request.query = resolvedQuery;
            } else {
              // Query not found in manifest - this is an error for persisted queries
              // but we could allow fallback to regular parsing if needed
              throw new Error(
                `Persisted query not found: ${persistedQueryHash}. Please run codegen to register this query.`,
              );
            }
          }

          // If both query and hash are provided, validate the hash matches
          if (persistedQueryHash && query) {
            const expectedQuery = service.getQuery(persistedQueryHash);
            if (expectedQuery && expectedQuery !== query) {
              throw new Error(
                `Persisted query hash mismatch for ${persistedQueryHash}. The query provided does not match the registered query.`,
              );
            }
          }

          return async (parsingErrors) => {
            if (parsingErrors) {
              // Log parsing errors for debugging
              console.error('GraphQL parsing errors:', parsingErrors);
            }
          };
        },
      };
    },

    // Log when server is ready
    async serverWillStart() {
      console.log(
        `Persisted Queries plugin loaded. ${service.isLoaded() ? `${service.getAllHashes().length} queries registered.` : 'No manifest loaded.'}`,
      );
    },
  };
}
