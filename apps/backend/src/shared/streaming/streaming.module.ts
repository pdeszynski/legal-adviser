import { Module, Global } from '@nestjs/common';
import { DocumentProgressPubSubService } from './document-progress-pubsub.service';
import { GraphQLPubSubService } from './graphql-pubsub.service';

/**
 * Streaming Module
 *
 * Global module providing real-time streaming infrastructure.
 * Exports services for Server-Sent Events (SSE), PubSub communication,
 * and GraphQL subscriptions.
 *
 * Made global so any module can emit progress events without explicit imports.
 * This follows the event-driven architecture pattern where publishers
 * don't need to know about subscribers.
 *
 * Provides:
 * - DocumentProgressPubSubService: RxJS-based pub/sub for SSE streaming
 * - GraphQLPubSubService: graphql-subscriptions based pub/sub for GraphQL subscriptions
 */
@Global()
@Module({
  providers: [DocumentProgressPubSubService, GraphQLPubSubService],
  exports: [DocumentProgressPubSubService, GraphQLPubSubService],
})
export class StreamingModule {}
