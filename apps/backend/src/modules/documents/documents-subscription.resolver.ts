import { Resolver, Subscription, Args } from '@nestjs/graphql';
import { GraphQLPubSubService } from '../../shared/streaming';
import { DocumentStatusChangePayload } from './dto/document-status-change.dto';

/**
 * Document Subscriptions Resolver
 *
 * Provides GraphQL subscriptions for real-time document status updates.
 * Clients can subscribe to document status changes to receive notifications
 * when documents transition between states (DRAFT, GENERATING, COMPLETED, FAILED).
 *
 * Usage (GraphQL):
 * ```graphql
 * subscription {
 *   documentStatusChanged(documentId: "123") {
 *     documentId
 *     sessionId
 *     previousStatus
 *     newStatus
 *     timestamp
 *     message
 *     error
 *   }
 * }
 * ```
 *
 * Or subscribe to all status changes for a session:
 * ```graphql
 * subscription {
 *   documentStatusChanged(sessionId: "session-123") {
 *     documentId
 *     newStatus
 *   }
 * }
 * ```
 *
 * WebSocket Connection:
 * Clients connect via ws://host/graphql using the graphql-ws protocol.
 */
@Resolver()
export class DocumentSubscriptionResolver {
  constructor(private readonly pubSubService: GraphQLPubSubService) {}

  /**
   * Subscribe to document status changes
   *
   * Clients can filter by:
   * - documentId: Subscribe to changes for a specific document
   * - sessionId: Subscribe to changes for all documents in a session
   * - No filter: Subscribe to all document status changes (use with caution)
   *
   * @param documentId - Optional document ID to filter events
   * @param sessionId - Optional session ID to filter events
   * @returns AsyncIterator of DocumentStatusChangePayload events
   */
  @Subscription(() => DocumentStatusChangePayload, {
    name: 'documentStatusChanged',
    description: 'Subscribe to document status changes',
    filter: (
      payload: { documentStatusChanged: DocumentStatusChangePayload },
      variables: { documentId?: string; sessionId?: string },
    ) => {
      const event = payload.documentStatusChanged;

      // If documentId is provided, filter by it
      if (variables.documentId && event.documentId !== variables.documentId) {
        return false;
      }

      // If sessionId is provided, filter by it
      if (variables.sessionId && event.sessionId !== variables.sessionId) {
        return false;
      }

      // If no filters provided or all filters match, include the event
      return true;
    },
    resolve: (payload: {
      documentStatusChanged: DocumentStatusChangePayload;
    }) => payload.documentStatusChanged,
  })
  documentStatusChanged(
    @Args('documentId', {
      type: () => String,
      nullable: true,
      description: 'Filter by document ID',
    })
    _documentId?: string,
    @Args('sessionId', {
      type: () => String,
      nullable: true,
      description: 'Filter by session ID',
    })
    _sessionId?: string,
  ): AsyncIterator<unknown> {
    return this.pubSubService.getDocumentStatusChangeIterator();
  }
}
