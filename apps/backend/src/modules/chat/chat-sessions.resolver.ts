import {
  Resolver,
  Query,
  Mutation,
  Subscription,
  Args,
  Context,
  ID,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { GqlAuthGuard } from '../auth/guards';
import { ChatSessionOwnershipGuard } from './guards';
import { ChatSessionsService } from './services/chat-sessions.service';
import { ChatExportService } from './services/chat-export.service';
import { ChatSearchService } from './services/chat-search.service';
import { ChatAuditService } from './services/chat-audit.service';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import {
  CreateChatSessionInput,
  UpdateChatSessionTitleInput,
  PinChatSessionInput,
  DeleteChatSessionInput,
  ChatSessionsArgs,
  ChatSessionDetailArgs,
  DeleteChatSessionResult,
} from './dto/chat-session.dto';
import {
  ExportChatSessionInput,
  ChatExportResult,
  ChatExportPdfResult,
} from './dto/chat-export.dto';
import {
  ChatContentSearchArgs,
  ChatContentSearchResponse,
} from './dto/chat-search.dto';
import { ChatSessionDebugInfo } from './dto/chat-message.dto';
import { ChatMessagesService } from './services/chat-messages.service';

/**
 * PubSub instance for real-time updates
 * In production, use Redis-based PubSub for scalability
 */
const pubSub = new PubSub();

/**
 * Event types for subscriptions
 */
export enum ChatSessionEventType {
  SESSION_UPDATED = 'chatSessionUpdated',
  MESSAGE_ADDED = 'chatMessageAdded',
  SESSION_DELETED = 'chatSessionDeleted',
}

/**
 * Payload type for chat session updates
 */
interface ChatSessionUpdatedPayload {
  sessionId: string;
  session: ChatSession;
}

/**
 * Payload type for chat message additions
 */
interface ChatMessageAddedPayload {
  sessionId: string;
  message: ChatMessage;
}

/**
 * Custom GraphQL Resolver for Chat Sessions
 *
 * Provides custom business logic mutations and queries that complement the
 * auto-generated CRUD resolvers from nestjs-query.
 *
 * Auto-generated operations (via nestjs-query):
 * - chatSessions: Query all sessions with filtering, sorting, paging
 * - chatSession: Query single session by ID
 * - createOneChatSession: Create a new session (full control)
 * - updateOneChatSession: Update a session
 * - deleteOneChatSession: Delete a session
 *
 * Custom operations (this resolver):
 * - chatSessions(userId, paging, filters): Query user's chat history with sorting by lastMessageAt
 * - chatSessionDetail(sessionId): Fetch session with all messages
 * - createChatSession(title, mode): Create new session
 * - updateChatSessionTitle(sessionId, title): Rename session
 * - deleteChatSession(sessionId): Soft delete session
 * - hardDeleteChatSession(sessionId): Permanently delete session and all messages
 * - pinChatSession(sessionId, isPinned): Toggle pin status
 * - exportChatSession(sessionId, format): Export session to PDF/Markdown/JSON
 * - chatSessionUpdated: Subscription for real-time updates when messages are added
 *
 * Authentication: All operations require valid JWT token via GqlAuthGuard
 */
@Resolver(() => ChatSession)
@UseGuards(GqlAuthGuard)
export class ChatSessionsResolver {
  constructor(
    private readonly chatSessionsService: ChatSessionsService,
    private readonly chatExportService: ChatExportService,
    private readonly chatSearchService: ChatSearchService,
    private readonly auditService: ChatAuditService,
    private readonly chatMessagesService: ChatMessagesService,
  ) {}

  /**
   * Extract client IP address from request context
   */
  private extractIpAddress(context: {
    req: { ip?: string; headers?: Record<string, unknown> };
  }): string | undefined {
    return (
      context.req?.ip ||
      (context.req?.headers?.['x-forwarded-for'] as string) ||
      undefined
    );
  }

  /**
   * Query: Get chat sessions for a user with filtering and sorting
   *
   * Returns paginated list of chat sessions for the authenticated user.
   * Sessions are sorted by lastMessageAt by default (most recent first).
   *
   * Filters:
   * - mode: Filter by AI mode (LAWYER/SIMPLE)
   * - search: Search in session titles
   * - isPinned: Filter by pinned status
   * - includeDeleted: Include soft deleted sessions
   *
   * @param args - Query parameters including userId, pagination, filters
   * @param context - GraphQL context with authenticated user
   * @returns Paginated list of chat sessions
   *
   * @example
   * ```graphql
   * query {
   *   chatSessions(
   *     userId: "user-uuid"
   *     mode: LAWYER
   *     search: "contract"
   *     limit: 20
   *     offset: 0
   *     sortBy: "lastMessageAt"
   *     sortOrder: "DESC"
   *   ) {
   *     id
   *     title
   *     mode
   *     messageCount
   *     isPinned
   *     lastMessageAt
   *     createdAt
   *   }
   * }
   * ```
   */
  @Query(() => [ChatSession], {
    name: 'chatSessions',
    description: 'Get chat sessions for a user with filtering and sorting',
  })
  async getChatSessions(
    @Args() args: ChatSessionsArgs,
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<ChatSession[]> {
    const authenticatedUserId = context.req?.user?.id;
    if (!authenticatedUserId) {
      throw new Error('User not authenticated');
    }
    const userId = args.userId ?? authenticatedUserId;

    // Ensure users can only query their own sessions
    if (userId !== authenticatedUserId) {
      throw new Error('You can only query your own chat sessions');
    }

    const { sessions } = await this.chatSessionsService.findByUserId(
      userId,
      args,
    );

    return sessions;
  }

  /**
   * Query: Get chat session detail with all messages
   *
   * Returns a single chat session with all its messages in order.
   *
   * @param args - Query parameters with sessionId
   * @param context - GraphQL context with authenticated user
   * @returns Session with all messages
   *
   * @example
   * ```graphql
   * query {
   *   chatSessionDetail(sessionId: "session-uuid") {
   *     id
   *     title
   *     mode
   *     messageCount
   *     isPinned
   *     createdAt
   *     updatedAt
   *     messages {
   *       id
   *       role
   *       content
   *       citations { source article url }
   *       timestamp
   *       sequenceOrder
   *     }
   *   }
   * }
   * ```
   */
  @Query(() => ChatSession, {
    name: 'chatSessionDetail',
    description: 'Get a chat session with all its messages',
    nullable: true,
  })
  @UseGuards(ChatSessionOwnershipGuard)
  async getChatSessionDetail(
    @Args() args: ChatSessionDetailArgs,
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<ChatSession | null> {
    const userId = context.req?.user?.id;
    if (!userId) {
      return null;
    }

    const { session } = await this.chatSessionsService.getSessionDetail(
      args.sessionId,
      userId,
    );

    return session;
  }

  /**
   * Query: Get messages for a chat session
   *
   * Returns all messages for a session in sequence order.
   *
   * @param sessionId - The session ID
   * @param context - GraphQL context with authenticated user
   * @returns Array of messages in sequence order
   *
   * @example
   * ```graphql
   * query {
   *   chatMessages(sessionId: "session-uuid") {
   *     id
   *     role
   *     content
   *     timestamp
   *     sequenceOrder
   *   }
   * }
   * ```
   */
  @Query(() => [ChatMessage], {
    name: 'chatMessages',
    description: 'Get all messages for a chat session in sequence order',
  })
  @UseGuards(ChatSessionOwnershipGuard)
  async getChatMessages(
    @Args('sessionId', { type: () => ID }) sessionId: string,
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<ChatMessage[]> {
    const userId = context.req?.user?.id;
    if (!userId) {
      return [];
    }

    const { messages } = await this.chatSessionsService.getSessionDetail(
      sessionId,
      userId,
    );

    return messages;
  }

  /**
   * Query: Full-text search across chat messages
   *
   * Searches for messages containing the specified query across all user's sessions.
   * Uses PostgreSQL full-text search for efficient querying with relevance ranking.
   *
   * Filters:
   * - mode: Filter by AI mode (LAWYER/SIMPLE)
   * - role: Filter by message role (USER/ASSISTANT/SYSTEM)
   * - sessionTitle: Filter by session title
   * - dateFrom/dateTo: Filter by date range
   *
   * Results are ranked by relevance and include highlighted matching text.
   *
   * @param args - Search parameters including query, filters, and pagination
   * @param context - GraphQL context with authenticated user
   * @returns Paginated search results with highlighted content
   *
   * @example
   * ```graphql
   * query {
   *   searchChatContent(
   *     query: "employment contract"
   *     mode: LAWYER
   *     limit: 10
   *     dateFrom: "2024-01-01T00:00:00Z"
   *   ) {
   *     results {
   *       messageId
   *       sessionId
   *       sessionTitle
   *       sessionMode
   *       role
   *       highlightedContent
   *       contextPreview
   *       rank
   *       matchedTerms
   *       createdAt
   *     }
   *     totalCount
   *     hasMore
   *   }
   * }
   * ```
   */
  @Query(() => ChatContentSearchResponse, {
    name: 'searchChatContent',
    description:
      'Full-text search across chat messages with relevance ranking and highlighting',
  })
  async searchChatContent(
    @Args() args: ChatContentSearchArgs,
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<ChatContentSearchResponse> {
    const authenticatedUserId = context.req?.user?.id;
    if (!authenticatedUserId) {
      throw new Error('User not authenticated');
    }

    const userId = args.userId ?? authenticatedUserId;

    // Ensure users can only search their own messages
    if (userId !== authenticatedUserId) {
      throw new Error('You can only search your own chat content');
    }

    const result = await this.chatSearchService.searchContent(userId, args);

    // Log search operation for audit
    this.auditService.logSearch(
      userId,
      args.query,
      result.totalCount,
      this.extractIpAddress(
        context as { req: { ip?: string; headers?: Record<string, unknown> } },
      ),
    );

    return result;
  }

  /**
   * Query: Debug conversation history for a session
   *
   * This debug endpoint provides detailed information about the conversation
   * history stored in the database for a specific session. Useful for
   * troubleshooting conversation history flow issues.
   *
   * Returns detailed metrics and verification information including:
   * - Message count and role distribution
   * - Message order verification
   * - Total characters in conversation
   * - Individual message previews
   * - Format verification for AI Engine
   *
   * @param sessionId - The session ID to inspect
   * @param context - GraphQL context with authenticated user
   * @returns Detailed conversation history debug information
   *
   * @example
   * ```graphql
   * query {
   *   debugConversationHistory(sessionId: "session-uuid") {
   *     sessionId
   *     messageCount
   *     totalCharacters
   *     roleDistribution { user assistant }
   *     messages { role content sequenceOrder createdAt }
   *     aiEngineFormat { role content }[]
   *     verification { orderValid hasEmptyContent firstRole lastRole }
   *   }
   * }
   * ```
   */
  @Query(() => ChatSessionDebugInfo, {
    name: 'debugConversationHistory',
    description: 'Debug endpoint to inspect conversation history for a session',
  })
  @UseGuards(ChatSessionOwnershipGuard)
  async debugConversationHistory(
    @Args('sessionId', { type: () => ID }) sessionId: string,
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<ChatSessionDebugInfo> {
    const userId = context.req?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Get conversation history in the format sent to AI Engine
    const conversationHistory =
      await this.chatMessagesService.getConversationHistory(sessionId, userId);

    // Get full messages for detailed inspection
    const { messages } = await this.chatSessionsService.getSessionDetail(
      sessionId,
      userId,
    );

    // Calculate metrics
    const messageCount = conversationHistory.length;
    const totalCharacters = conversationHistory.reduce(
      (sum, msg) => sum + (msg.content?.length || 0),
      0,
    );
    const userCount = conversationHistory.filter(
      (m) => m.role === 'user',
    ).length;
    const assistantCount = conversationHistory.filter(
      (m) => m.role === 'assistant',
    ).length;

    // Verify message order
    const roles = conversationHistory.map((m) => m.role);
    const firstRole = roles[0] || null;
    const lastRole = roles[roles.length - 1] || null;
    const hasEmptyContent = conversationHistory.some(
      (m) => !m.content || m.content.trim().length === 0,
    );

    // Check for alternating pattern (user -> assistant -> user -> ...)
    let orderValid = true;
    for (let i = 0; i < roles.length; i++) {
      if (roles[i] !== 'user' && roles[i] !== 'assistant') {
        orderValid = false;
        break;
      }
    }

    // Build AI Engine format preview
    const aiEngineFormat = conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Build message preview
    const messagePreviews = messages.map((msg) => ({
      messageId: msg.messageId,
      role: msg.role,
      content: msg.content,
      contentPreview:
        msg.content?.substring(0, 100) +
        (msg.content?.length > 100 ? '...' : ''),
      sequenceOrder: msg.sequenceOrder,
      createdAt: msg.createdAt.toISOString(),
    }));

    return {
      sessionId,
      messageCount,
      totalCharacters,
      roleDistribution: {
        user: userCount,
        assistant: assistantCount,
      },
      messages: messagePreviews,
      aiEngineFormat,
      verification: {
        orderValid,
        hasEmptyContent,
        firstRole,
        lastRole,
        messageCountMatches: messageCount === messages.length,
      },
    };
  }

  /**
   * Mutation: Create a new chat session
   *
   * Creates a new chat session for the authenticated user.
   *
   * Security notes:
   * - Session ID is ALWAYS generated server-side (UUID v4)
   * - Frontend MUST NOT send a sessionId - it will be ignored
   * - Title is ALWAYS null initially (auto-generated from first message)
   *
   * @param input - Session creation input (mode only)
   * @param context - GraphQL context with authenticated user
   * @returns The created session with server-generated ID
   *
   * @example
   * ```graphql
   * mutation {
   *   createChatSession(input: {
   *     mode: LAWYER
   *   }) {
   *     id          # Server-generated UUID v4
   *     title       # Always null initially
   *     mode
   *     createdAt
   *   }
   * }
   * ```
   */
  @Mutation(() => ChatSession, {
    name: 'createChatSession',
    description:
      'Create a new chat session. Session ID is generated server-side.',
  })
  async createChatSession(
    @Args('input') input: CreateChatSessionInput,
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<ChatSession> {
    const userId = context.req?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const session = await this.chatSessionsService.create(userId, input);

    // Log session creation for audit
    this.auditService.logSessionModification(
      userId,
      'CREATE',
      session.id,
      this.extractIpAddress(
        context as { req: { ip?: string; headers?: Record<string, unknown> } },
      ),
      { mode: input.mode },
    );

    return session;
  }

  /**
   * Mutation: Update chat session title
   *
   * Updates the title of an existing chat session.
   *
   * @param input - Update input with sessionId and new title
   * @param context - GraphQL context with authenticated user
   * @returns The updated session
   *
   * @example
   * ```graphql
   * mutation {
   *   updateChatSessionTitle(input: {
   *     sessionId: "session-uuid"
   *     title: "New Title"
   *   }) {
   *     id
   *     title
   *     updatedAt
   *   }
   * }
   * ```
   */
  @Mutation(() => ChatSession, {
    name: 'updateChatSessionTitle',
    description: 'Update the title of a chat session',
  })
  @UseGuards(ChatSessionOwnershipGuard)
  async updateChatSessionTitle(
    @Args('input') input: UpdateChatSessionTitleInput,
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<ChatSession> {
    const userId = context.req?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const session = await this.chatSessionsService.updateTitle(
      input.sessionId,
      userId,
      input.title,
    );

    // Publish update event
    await pubSub.publish(ChatSessionEventType.SESSION_UPDATED, {
      sessionId: session.id,
      session,
    } as ChatSessionUpdatedPayload);

    return session;
  }

  /**
   * Mutation: Delete a chat session (soft delete)
   *
   * Soft deletes a chat session, preserving conversation history.
   * The session is marked as deleted but can be restored.
   *
   * @param input - Delete input with sessionId
   * @param context - GraphQL context with authenticated user
   * @returns The soft deleted session
   *
   * @example
   * ```graphql
   * mutation {
   *   deleteChatSession(input: {
   *     sessionId: "session-uuid"
   *   }) {
   *     id
   *     title
   *     deletedAt
   *   }
   * }
   * ```
   */
  @Mutation(() => ChatSession, {
    name: 'deleteChatSession',
    description: 'Soft delete a chat session',
  })
  @UseGuards(ChatSessionOwnershipGuard)
  async deleteChatSession(
    @Args('input') input: DeleteChatSessionInput,
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<ChatSession> {
    const userId = context.req?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const ipAddress = this.extractIpAddress(
      context as { req: { ip?: string; headers?: Record<string, unknown> } },
    );

    const session = await this.chatSessionsService.softDelete(
      input.sessionId,
      userId,
      ipAddress,
    );

    // Publish deletion event
    await pubSub.publish(ChatSessionEventType.SESSION_DELETED, {
      sessionId: session.id,
      session,
    });

    return session;
  }

  /**
   * Mutation: Permanently delete a chat session
   *
   * Permanently deletes a chat session and all associated messages.
   * This action cannot be undone - all data will be removed from the database.
   *
   * The deletion is performed within a database transaction to ensure atomicity.
   * All associated ChatMessage records are deleted along with the ChatSession.
   *
   * @param input - Delete input with sessionId
   * @param context - GraphQL context with authenticated user
   * @returns Deletion result with sessionId and message count
   *
   * @example
   * ```graphql
   * mutation {
   *   hardDeleteChatSession(input: {
   *     sessionId: "session-uuid"
   *   }) {
   *     sessionId
   *     messageCount
   *     deletionType
   *     success
   *   }
   * }
   * ```
   */
  @Mutation(() => DeleteChatSessionResult, {
    name: 'hardDeleteChatSession',
    description:
      'Permanently delete a chat session and all messages (cannot be undone)',
  })
  @UseGuards(ChatSessionOwnershipGuard)
  async hardDeleteChatSession(
    @Args('input') input: DeleteChatSessionInput,
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<DeleteChatSessionResult> {
    const userId = context.req?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const ipAddress = this.extractIpAddress(
      context as { req: { ip?: string; headers?: Record<string, unknown> } },
    );

    const result = await this.chatSessionsService.hardDelete(
      input.sessionId,
      userId,
      ipAddress,
    );

    // Publish deletion event
    await pubSub.publish(ChatSessionEventType.SESSION_DELETED, {
      sessionId: result.sessionId,
      session: null, // Session no longer exists
    });

    return {
      sessionId: result.sessionId,
      messageCount: result.messageCount,
      deletionType: 'hard',
      success: true,
    };
  }

  /**
   * Mutation: Pin or unpin a chat session
   *
   * Toggles the pin status of a chat session.
   * Pinned sessions appear first in the list.
   *
   * @param input - Pin input with sessionId and isPinned flag
   * @param context - GraphQL context with authenticated user
   * @returns The updated session
   *
   * @example
   * ```graphql
   * mutation {
   *   pinChatSession(input: {
   *     sessionId: "session-uuid"
   *     isPinned: true
   *   }) {
   *     id
   *     title
   *     isPinned
   *   }
   * }
   * ```
   */
  @Mutation(() => ChatSession, {
    name: 'pinChatSession',
    description: 'Pin or unpin a chat session',
  })
  @UseGuards(ChatSessionOwnershipGuard)
  async pinChatSession(
    @Args('input') input: PinChatSessionInput,
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<ChatSession> {
    const userId = context.req?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const session = await this.chatSessionsService.setPin(
      input.sessionId,
      userId,
      input.isPinned,
    );

    // Log pin/unpin action for audit
    this.auditService.logSessionModification(
      userId,
      input.isPinned ? 'PIN' : 'UNPIN',
      session.id,
      this.extractIpAddress(
        context as { req: { ip?: string; headers?: Record<string, unknown> } },
      ),
      { previousState: !input.isPinned, newState: input.isPinned },
    );

    // Publish update event
    await pubSub.publish(ChatSessionEventType.SESSION_UPDATED, {
      sessionId: session.id,
      session,
    } as ChatSessionUpdatedPayload);

    return session;
  }

  /**
   * Mutation: Export a chat session
   *
   * Exports a chat session to the specified format (PDF, MARKDOWN, or JSON).
   * Returns the exported content as base64-encoded data.
   *
   * @param input - Export input with sessionId and format
   * @param context - GraphQL context with authenticated user
   * @returns Export result with base64-encoded content
   *
   * @example
   * ```graphql
   * mutation {
   *   exportChatSession(input: {
   *     sessionId: "session-uuid"
   *     format: PDF
   *   }) {
   *     sessionId
   *     format
   *     filename
   *     mimeType
   *     fileSizeBytes
   *     contentBase64
   *     exportedAt
   *     ... on ChatExportPdfResult {
   *       pageCount
   *     }
   *   }
   * }
   * ```
   */
  @Mutation(() => ChatExportResult, {
    name: 'exportChatSession',
    description: 'Export a chat session to PDF, Markdown, or JSON format',
  })
  @UseGuards(ChatSessionOwnershipGuard)
  async exportChatSession(
    @Args('input') input: ExportChatSessionInput,
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<ChatExportResult | ChatExportPdfResult> {
    const userId = context.req?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Log export operation for audit
    this.auditService.logExport(
      userId,
      input.sessionId,
      input.format,
      this.extractIpAddress(
        context as { req: { ip?: string; headers?: Record<string, unknown> } },
      ),
    );

    return this.chatExportService.exportSession(
      input.sessionId,
      input.format,
      userId,
      input.filename,
    );
  }

  /**
   * Subscription: Real-time updates for chat sessions
   *
   * Subscribes to updates for a specific chat session.
   * Triggered when:
   * - A new message is added to the session
   * - The session title is updated
   * - The session is pinned/unpinned
   *
   * @param sessionId - The session ID to watch
   * @returns Stream of session updates
   *
   * @example
   * ```graphql
   * subscription {
   *   chatSessionUpdated(sessionId: "session-uuid") {
   *     sessionId
   *     session {
   *       id
   *       title
   *       messageCount
   *       lastMessageAt
   *       isPinned
   *     }
   *   }
   * }
   * ```
   */
  @Subscription(() => ChatSession, {
    name: 'chatSessionUpdated',
    description: 'Real-time updates when a chat session is modified',
    filter: (
      payload: ChatSessionUpdatedPayload,
      variables: { sessionId: string },
    ) => payload.sessionId === variables.sessionId,
    resolve: (payload: ChatSessionUpdatedPayload) => payload.session,
  })
  /* eslint-disable @typescript-eslint/no-unused-vars */
  chatSessionUpdated(
    @Args('sessionId', { type: () => ID })
    _sessionId: string,
  ): AsyncIterator<ChatSession> {
    /* eslint-enable @typescript-eslint/no-unused-vars */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (pubSub as any).asyncIterator(ChatSessionEventType.SESSION_UPDATED);
  }

  /**
   * Subscription: Real-time notifications for new messages
   *
   * Subscribes to new messages added to a specific chat session.
   *
   * @param sessionId - The session ID to watch
   * @returns Stream of new messages
   *
   * @example
   * ```graphql
   * subscription {
   *   chatMessageAdded(sessionId: "session-uuid") {
   *     sessionId
   *     message {
   *       id
   *       role
   *       content
   *       citations { source article url }
   *       timestamp
   *       sequenceOrder
   *     }
   *   }
   * }
   * ```
   */
  @Subscription(() => ChatMessage, {
    name: 'chatMessageAdded',
    description: 'Real-time notifications when a new message is added',
    filter: (
      payload: ChatMessageAddedPayload,
      variables: { sessionId: string },
    ) => payload.sessionId === variables.sessionId,
    resolve: (payload: ChatMessageAddedPayload) => payload.message,
  })
  /* eslint-disable @typescript-eslint/no-unused-vars */
  chatMessageAdded(
    @Args('sessionId', { type: () => ID })
    _sessionId: string,
  ): AsyncIterator<ChatMessage> {
    /* eslint-enable @typescript-eslint/no-unused-vars */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (pubSub as any).asyncIterator(ChatSessionEventType.MESSAGE_ADDED);
  }

  /**
   * Helper method to publish message added events
   * Called by the chat messages service when a new message is created
   */
  static async publishMessageAdded(
    sessionId: string,
    message: ChatMessage,
  ): Promise<void> {
    await pubSub.publish(ChatSessionEventType.MESSAGE_ADDED, {
      sessionId,
      message,
    } as ChatMessageAddedPayload);
  }
}
