import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

/**
 * Document Status Change Event
 *
 * Represents a document status change event for GraphQL subscriptions.
 * Emitted when a document transitions between states (DRAFT, GENERATING, COMPLETED, FAILED).
 */
export interface DocumentStatusChangeEvent {
  documentId: string;
  sessionId: string;
  previousStatus: string;
  newStatus: string;
  timestamp: Date;
  message?: string;
  error?: string;
}

/**
 * GraphQL PubSub Topics
 *
 * Constants for subscription topics to ensure consistency
 * across publishers and subscribers.
 */
export const SUBSCRIPTION_TOPICS = {
  /** Topic for document status changes */
  DOCUMENT_STATUS_CHANGED: 'documentStatusChanged',
  /** Topic for document generation progress */
  DOCUMENT_PROGRESS: 'documentProgress',
} as const;

/**
 * GraphQL PubSub Service
 *
 * Provides publish/subscribe functionality for GraphQL subscriptions.
 * Uses graphql-subscriptions PubSub for in-memory pub/sub.
 *
 * Architecture Notes:
 * - In-memory implementation suitable for single-server deployments
 * - For horizontal scaling, extend with Redis-based PubSub adapter
 * - This service wraps the graphql-subscriptions PubSub to provide
 *   typed methods and better integration with NestJS
 *
 * Usage:
 * - Publishers call publishDocumentStatusChange() when status changes
 * - Subscribers use asyncIterator() in GraphQL resolvers
 */
@Injectable()
export class GraphQLPubSubService implements OnModuleDestroy {
  private readonly pubSub = new PubSub();

  /**
   * Get the underlying PubSub instance
   * Used by GraphQL resolvers for subscriptions
   */
  getPubSub(): PubSub {
    return this.pubSub;
  }

  /**
   * Publish a document status change event
   *
   * Called when a document transitions between states.
   * All subscribers listening to this document will receive the event.
   *
   * @param event - Document status change event
   */
  async publishDocumentStatusChange(
    event: DocumentStatusChangeEvent,
  ): Promise<void> {
    await this.pubSub.publish(SUBSCRIPTION_TOPICS.DOCUMENT_STATUS_CHANGED, {
      documentStatusChanged: {
        ...event,
        timestamp: event.timestamp.toISOString(),
      },
    });
  }

  /**
   * Get async iterator for document status changes
   *
   * Used by GraphQL subscription resolvers.
   *
   * @returns AsyncIterator for document status change events
   */
  getDocumentStatusChangeIterator(): AsyncIterator<unknown> {
    return this.pubSub.asyncIterableIterator(
      SUBSCRIPTION_TOPICS.DOCUMENT_STATUS_CHANGED,
    );
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy(): void {
    // PubSub doesn't have a close method, but we can clear any references
    // In production with Redis, this would close the Redis connection
  }
}
