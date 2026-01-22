import { Resolver, Subscription, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import {
  CursorEventPayload,
  DocumentEditEventPayload,
  UserJoinedEventPayload,
  UserLeftEventPayload,
} from './dto';
import { GraphQLPubSubService } from '../../shared/streaming/graphql-pubsub.service';
import { GqlAuthGuard } from '../auth/guards';

/**
 * Collaboration Subscription Resolver
 *
 * Provides GraphQL subscriptions for real-time collaboration events.
 * Clients can subscribe to:
 * - Cursor position updates
 * - Document edits
 * - User joined/left events
 *
 * Usage (GraphQL):
 * ```graphql
 * subscription {
 *   cursorUpdated(documentId: "123") {
 *     documentId
 *     userId
 *     userName
 *     position
 *     selectionLength
 *   }
 * }
 * ```
 */
@Resolver()
@UseGuards(GqlAuthGuard)
export class CollaborationSubscriptionResolver {
  constructor(private readonly pubSubService: GraphQLPubSubService) {}

  /**
   * Subscribe to cursor position updates
   *
   * Clients receive updates when other users move their cursors.
   * Filtered by documentId to only receive updates for the current document.
   */
  @Subscription(() => CursorEventPayload, {
    name: 'cursorUpdated',
    description: 'Subscribe to cursor position updates for a document',
    filter: (
      payload: { cursorUpdated: CursorEventPayload },
      variables: { documentId: string },
    ) => {
      return payload.cursorUpdated.documentId === variables.documentId;
    },
    resolve: (payload: { cursorUpdated: CursorEventPayload }) =>
      payload.cursorUpdated,
  })
  cursorUpdated(
    @Args('documentId', {
      type: () => String,
      description: 'Document ID to receive cursor updates for',
    })
    _documentId: string,
    @Context() _context: any,
  ): AsyncIterator<CursorEventPayload> {
    return this.pubSubService
      .getPubSub()
      .asyncIterableIterator('cursorUpdated');
  }

  /**
   * Subscribe to document edits
   *
   * Clients receive updates when other users edit the document.
   * Includes the operation and new document version.
   */
  @Subscription(() => DocumentEditEventPayload, {
    name: 'documentEdited',
    description: 'Subscribe to document edits for real-time collaboration',
    filter: (
      payload: { documentEdited: DocumentEditEventPayload },
      variables: { documentId: string },
    ) => {
      return payload.documentEdited.documentId === variables.documentId;
    },
    resolve: (payload: { documentEdited: DocumentEditEventPayload }) =>
      payload.documentEdited,
  })
  documentEdited(
    @Args('documentId', {
      type: () => String,
      description: 'Document ID to receive edit updates for',
    })
    _documentId: string,
    @Context() _context: any,
  ): AsyncIterator<DocumentEditEventPayload> {
    return this.pubSubService
      .getPubSub()
      .asyncIterableIterator('documentEdited');
  }

  /**
   * Subscribe to user joined events
   *
   * Clients receive notifications when new users join the document.
   */
  @Subscription(() => UserJoinedEventPayload, {
    name: 'userJoinedDocument',
    description: 'Subscribe to user joined events for a document',
    filter: (
      payload: { userJoinedDocument: UserJoinedEventPayload },
      variables: { documentId: string },
    ) => {
      return payload.userJoinedDocument.documentId === variables.documentId;
    },
    resolve: (payload: { userJoinedDocument: UserJoinedEventPayload }) =>
      payload.userJoinedDocument,
  })
  userJoinedDocument(
    @Args('documentId', {
      type: () => String,
      description: 'Document ID to receive user joined events for',
    })
    _documentId: string,
    @Context() _context: any,
  ): AsyncIterator<UserJoinedEventPayload> {
    return this.pubSubService
      .getPubSub()
      .asyncIterableIterator('userJoinedDocument');
  }

  /**
   * Subscribe to user left events
   *
   * Clients receive notifications when users leave the document.
   */
  @Subscription(() => UserLeftEventPayload, {
    name: 'userLeftDocument',
    description: 'Subscribe to user left events for a document',
    filter: (
      payload: { userLeftDocument: UserLeftEventPayload },
      variables: { documentId: string },
    ) => {
      return payload.userLeftDocument.documentId === variables.documentId;
    },
    resolve: (payload: { userLeftDocument: UserLeftEventPayload }) =>
      payload.userLeftDocument,
  })
  userLeftDocument(
    @Args('documentId', {
      type: () => String,
      description: 'Document ID to receive user left events for',
    })
    _documentId: string,
    @Context() _context: any,
  ): AsyncIterator<UserLeftEventPayload> {
    return this.pubSubService
      .getPubSub()
      .asyncIterableIterator('userLeftDocument');
  }
}
