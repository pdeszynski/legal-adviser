import { MessageRole } from '../../../modules/chat/entities/chat-message.entity';

/**
 * Pagination options for chat message queries
 */
export interface ChatMessagePagination {
  /** Number of items per page (default: 50) */
  limit?: number;
  /** Number of items to skip (for pagination) */
  offset?: number;
  /** Start from a specific sequence order */
  startFrom?: number;
  /** Filter by message role */
  role?: MessageRole;
}

/**
 * Result type for paginated message queries
 */
export interface ChatMessageListResult {
  /** Array of messages */
  messages: ChatMessage[];
  /** Total count of messages for the session */
  total: number;
  /** Whether there are more messages */
  hasMore: boolean;
}

/**
 * Value object representing a Chat Message in the domain layer
 * This is the domain model that the repository works with
 */
export interface ChatMessage {
  messageId: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  rawContent: string | null;
  citations: import('../value-objects').Citation[] | null;
  metadata: ChatMessageMetadata | null;
  sequenceOrder: number;
  createdAt: Date;
}

/**
 * Value object for Chat Message metadata
 */
export interface ChatMessageMetadata {
  confidence?: number;
  model?: string;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  processingTimeMs?: number;
  queryType?: string;
  keyTerms?: string[];
  language?: string;
  custom?: Record<string, unknown>;
}

/**
 * Data for creating a new chat message
 */
export interface CreateChatMessageData {
  sessionId: string;
  role: MessageRole;
  content: string;
  rawContent?: string | null;
  citations?: import('../value-objects').Citation[] | null;
  metadata?: ChatMessageMetadata | null;
  sequenceOrder: number;
}

/**
 * Repository interface for Chat Message
 *
 * Provides methods for accessing and managing chat messages within sessions.
 * Messages are always retrieved in sequence order.
 * Note: ChatMessage is not an AggregateRoot - it's managed by ChatSession aggregate.
 */
export interface IChatMessageRepository {
  /**
   * Find a message by its ID
   *
   * @param id - The message ID
   * @returns The message or null if not found
   */
  findById(id: string): Promise<ChatMessage | null>;

  /**
   * Save/update a message
   *
   * @param aggregate - The message to save
   */
  save(aggregate: ChatMessage): Promise<void>;

  /**
   * Delete a message by its ID
   *
   * @param id - The message ID
   */
  delete(id: string): Promise<void>;

  /**
   * Find all messages for a specific session with pagination
   * Messages are returned in sequence order (ascending)
   *
   * @param sessionId - The session ID to find messages for
   * @param pagination - Optional pagination parameters
   * @returns Paginated list of messages
   */
  findBySessionId(
    sessionId: string,
    pagination?: ChatMessagePagination,
  ): Promise<ChatMessageListResult>;

  /**
   * Find a specific message by session ID and sequence order
   *
   * @param sessionId - The session ID
   * @param sequenceOrder - The sequence order of the message
   * @returns The message or null if not found
   */
  findBySessionAndSequence(
    sessionId: string,
    sequenceOrder: number,
  ): Promise<ChatMessage | null>;

  /**
   * Get the latest message in a session
   *
   * @param sessionId - The session ID
   * @returns The latest message or null if session has no messages
   */
  findLatestBySessionId(sessionId: string): Promise<ChatMessage | null>;

  /**
   * Get the next sequence order for a session
   * Returns the current max sequence + 1, or 0 if no messages exist
   *
   * @param sessionId - The session ID
   * @returns The next sequence order number
   */
  getNextSequenceOrder(sessionId: string): Promise<number>;

  /**
   * Create a new message in the specified session
   *
   * @param messageData - The message data to create
   * @returns The created message
   */
  create(messageData: CreateChatMessageData): Promise<ChatMessage>;

  /**
   * Delete all messages for a specific session
   * This is typically called when a session is cascade deleted
   *
   * @param sessionId - The session ID whose messages should be deleted
   * @returns Number of messages deleted
   */
  deleteBySessionId(sessionId: string): Promise<number>;

  /**
   * Count messages in a session
   *
   * @param sessionId - The session ID
   * @returns The number of messages in the session
   */
  countBySessionId(sessionId: string): Promise<number>;

  /**
   * Count messages in a session by role
   *
   * @param sessionId - The session ID
   * @param role - The message role to count
   * @returns The number of messages with the specified role
   */
  countBySessionIdAndRole(
    sessionId: string,
    role: MessageRole,
  ): Promise<number>;
}
