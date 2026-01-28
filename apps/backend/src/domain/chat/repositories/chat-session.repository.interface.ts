import { IRepository } from '../../shared/base';
import { ChatSessionAggregate } from '../aggregates';
import { ChatMode } from '../../../modules/chat/entities/chat-session.entity';

/**
 * Data for creating a new chat session
 */
export interface CreateChatSessionData {
  userId: string;
  title?: string | null;
  mode: ChatMode;
}

/**
 * Sort options for session queries
 */
export enum SessionSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  LAST_MESSAGE_AT = 'lastMessageAt',
  MESSAGE_COUNT = 'messageCount',
  TITLE = 'title',
}

/**
 * Sort order
 */
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * Query options for finding sessions
 */
export interface ChatSessionQueryOptions {
  /** Sort by field */
  sortBy?: SessionSortBy;
  /** Sort order */
  sortOrder?: SortOrder;
  /** Limit results */
  limit?: number;
  /** Offset results */
  offset?: number;
  /** Include deleted sessions */
  includeDeleted?: boolean;
  /** Filter by pinned status */
  pinnedOnly?: boolean;
  /** Filter by mode */
  mode?: ChatMode;
}

/**
 * Repository interface for Chat Session aggregate
 *
 * Provides methods for accessing and managing chat sessions.
 * Sessions represent conversation contexts between users and the AI.
 */
export interface IChatSessionRepository extends IRepository<
  ChatSessionAggregate,
  string
> {
  /**
   * Find all sessions for a specific user
   *
   * @param userId - The user ID to find sessions for
   * @param options - Query options for sorting and filtering
   * @returns Array of sessions
   */
  findByUserId(
    userId: string,
    options?: ChatSessionQueryOptions,
  ): Promise<ChatSessionAggregate[]>;

  /**
   * Find a single session by ID
   *
   * @param sessionId - The session ID
   * @param includeDeleted - Whether to include soft deleted sessions
   * @returns The session or null if not found
   */
  findBySessionId(
    sessionId: string,
    includeDeleted?: boolean,
  ): Promise<ChatSessionAggregate | null>;

  /**
   * Find active (non-deleted) sessions for a user
   *
   * @param userId - The user ID
   * @param options - Query options
   * @returns Array of active sessions
   */
  findActiveByUserId(
    userId: string,
    options?: ChatSessionQueryOptions,
  ): Promise<ChatSessionAggregate[]>;

  /**
   * Find pinned sessions for a user
   *
   * @param userId - The user ID
   * @param options - Query options
   * @returns Array of pinned sessions
   */
  findPinnedByUserId(
    userId: string,
    options?: ChatSessionQueryOptions,
  ): Promise<ChatSessionAggregate[]>;

  /**
   * Find sessions by mode
   *
   * @param userId - The user ID
   * @param mode - The chat mode
   * @param options - Query options
   * @returns Array of sessions with the specified mode
   */
  findByMode(
    userId: string,
    mode: ChatMode,
    options?: ChatSessionQueryOptions,
  ): Promise<ChatSessionAggregate[]>;

  /**
   * Find recently active sessions
   * Sessions are ordered by lastMessageAt or createdAt
   *
   * @param userId - The user ID
   * @param limit - Maximum number of sessions to return
   * @returns Array of recently active sessions
   */
  findRecentlyActive(userId: string, limit?: number): Promise<ChatSessionAggregate[]>;

  /**
   * Create a new chat session
   *
   * @param data - The session data
   * @returns The created session
   */
  create(data: CreateChatSessionData): Promise<ChatSessionAggregate>;

  /**
   * Update session timestamp and message count
   * Called when a new message is added
   *
   * @param sessionId - The session ID
   */
  incrementMessageCount(sessionId: string): Promise<void>;

  /**
   * Update the last message timestamp
   *
   * @param sessionId - The session ID
   */
  updateLastMessageAt(sessionId: string): Promise<void>;

  /**
   * Count total sessions for a user
   *
   * @param userId - The user ID
   * @param includeDeleted - Whether to include deleted sessions
   * @returns The number of sessions
   */
  countByUserId(userId: string, includeDeleted?: boolean): Promise<number>;

  /**
   * Check if a session exists
   *
   * @param sessionId - The session ID
   * @returns True if session exists
   */
  exists(sessionId: string): Promise<boolean>;

  /**
   * Find or create a session for a user
   * Returns existing session if one with matching criteria exists,
   * otherwise creates a new one
   *
   * @param userId - The user ID
   * @param mode - The chat mode
   * @returns The found or created session
   */
  findOrCreate(userId: string, mode: ChatMode): Promise<ChatSessionAggregate>;
}
