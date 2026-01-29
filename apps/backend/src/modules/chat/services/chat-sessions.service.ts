import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { ChatSession } from '../entities/chat-session.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import {
  CreateChatSessionInput,
  ChatSessionsArgs,
} from '../dto/chat-session.dto';
import { TitleGenerationService } from './title-generation.service';
import { ChatAuditService } from './chat-audit.service';

/**
 * Service for managing chat sessions
 *
 * Handles CRUD operations for chat sessions including:
 * - Creating new sessions
 * - Querying user sessions with filtering and sorting
 * - Updating session titles
 * - Soft deleting sessions
 * - Pinning/unpinning sessions
 * - Auto-generating titles from first message
 */
@Injectable()
export class ChatSessionsService {
  private readonly logger = new Logger(ChatSessionsService.name);

  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    private readonly titleGenerationService: TitleGenerationService,
    private readonly dataSource: DataSource,
    private readonly auditService: ChatAuditService,
  ) {}

  /**
   * Find chat sessions for a user with filtering and sorting
   */
  async findByUserId(
    userId: string,
    options: Partial<ChatSessionsArgs> = {},
  ): Promise<{ sessions: ChatSession[]; totalCount: number }> {
    const {
      limit = 20,
      offset = 0,
      mode,
      search,
      isPinned,
      sortBy = 'lastMessageAt',
      sortOrder = 'DESC',
      includeDeleted = false,
    } = options;

    const queryBuilder = this.chatSessionRepository
      .createQueryBuilder('session')
      .where('session.userId = :userId', { userId })
      // Exclude empty sessions (those with no messages)
      .andWhere('session.messageCount > 0', {});

    // Filter by mode if specified
    if (mode) {
      queryBuilder.andWhere('session.mode = :mode', { mode });
    }

    // Filter by pinned status if specified
    if (isPinned !== undefined) {
      queryBuilder.andWhere('session.isPinned = :isPinned', { isPinned });
    }

    // Search in title if specified
    if (search) {
      queryBuilder.andWhere('session.title ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // Exclude soft deleted sessions unless explicitly requested
    if (!includeDeleted) {
      queryBuilder.andWhere('session.deletedAt IS NULL');
    }

    // Get total count
    const totalCount = await queryBuilder.getCount();

    // Validate sort field
    const validSortFields = [
      'createdAt',
      'lastMessageAt',
      'title',
      'messageCount',
      'updatedAt',
    ];
    const sortField = validSortFields.includes(sortBy ?? '')
      ? sortBy
      : 'lastMessageAt';
    const direction = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Apply sorting: pinned sessions first, then by the selected sort field
    queryBuilder
      .orderBy('session.isPinned', 'DESC') // Pinned sessions first
      .addOrderBy(`session.${sortField}`, direction)
      .limit(limit)
      .offset(offset);

    const sessions = await queryBuilder.getMany();

    return { sessions, totalCount };
  }

  /**
   * Find a single session by ID
   */
  async findById(sessionId: string): Promise<ChatSession | null> {
    return this.chatSessionRepository.findOne({
      where: { id: sessionId },
    });
  }

  /**
   * Find session by ID with user authorization check
   */
  async findByIdAndUserId(
    sessionId: string,
    userId: string,
  ): Promise<ChatSession> {
    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException(`Chat session ${sessionId} not found`);
    }

    return session;
  }

  /**
   * Get session detail with all messages
   */
  async getSessionDetail(
    sessionId: string,
    userId: string,
  ): Promise<{
    session: ChatSession;
    messages: ChatMessage[];
  }> {
    const session = await this.findByIdAndUserId(sessionId, userId);

    const messages = await this.chatMessageRepository
      .createQueryBuilder('message')
      .where('message.sessionId = :sessionId', { sessionId })
      .orderBy('message.sequenceOrder', 'ASC')
      .getMany();

    return { session, messages };
  }

  /**
   * Create a new chat session
   *
   * Session ID is generated server-side (UUID v4).
   * Title is always null initially - will be auto-generated from first message.
   *
   * @param userId - Authenticated user ID from JWT context
   * @param input - Session creation input (mode only, no title or sessionId)
   * @returns The created session with server-generated ID
   */
  async create(
    userId: string,
    input: CreateChatSessionInput,
  ): Promise<ChatSession> {
    const session = this.chatSessionRepository.create({
      userId,
      title: null, // Always null initially, auto-generated from first message
      mode: input.mode,
      messageCount: 0,
      isPinned: false,
      lastMessageAt: new Date(),
    });

    return this.chatSessionRepository.save(session);
  }

  /**
   * Update session title
   */
  async updateTitle(
    sessionId: string,
    userId: string,
    title: string,
  ): Promise<ChatSession> {
    const session = await this.findByIdAndUserId(sessionId, userId);
    session.updateTitle(title);
    return this.chatSessionRepository.save(session);
  }

  /**
   * Pin or unpin a session
   */
  async setPin(
    sessionId: string,
    userId: string,
    isPinned: boolean,
  ): Promise<ChatSession> {
    const session = await this.findByIdAndUserId(sessionId, userId);
    session.setPin(isPinned);
    return this.chatSessionRepository.save(session);
  }

  /**
   * Toggle pin status
   */
  async togglePin(sessionId: string, userId: string): Promise<ChatSession> {
    const session = await this.findByIdAndUserId(sessionId, userId);
    session.togglePin();
    return this.chatSessionRepository.save(session);
  }

  /**
   * Soft delete a session
   *
   * Marks the session as deleted by setting the deletedAt timestamp.
   * The session and its messages remain in the database but are filtered from default queries.
   *
   * @param sessionId - The session ID to soft delete
   * @param userId - The user ID requesting the deletion (for ownership verification)
   * @param ipAddress - Optional IP address for audit logging
   * @returns The soft-deleted session with deletedAt timestamp set
   * @throws NotFoundException if session not found
   */
  async softDelete(
    sessionId: string,
    userId: string,
    ipAddress?: string,
  ): Promise<ChatSession> {
    const session = await this.findByIdAndUserId(sessionId, userId);
    session.softDelete();
    const savedSession = await this.chatSessionRepository.save(session);

    // Log soft delete to audit logs
    this.auditService.logSessionModification(
      userId,
      'SOFT_DELETE',
      sessionId,
      ipAddress,
      {
        messageCount: session.messageCount || 0,
        deletionType: 'soft',
      },
    );

    this.logger.log(
      `Soft deleted chat session ${sessionId} for user ${userId}`,
    );

    return savedSession;
  }

  /**
   * Restore a soft deleted session
   */
  async restore(sessionId: string, userId: string): Promise<ChatSession> {
    const session = await this.findByIdAndUserId(sessionId, userId);
    session.restore();
    return this.chatSessionRepository.save(session);
  }

  /**
   * Permanently delete a session (hard delete)
   *
   * Use with caution - this will permanently delete the session and all associated messages.
   * This operation is wrapped in a database transaction to ensure atomic deletion.
   *
   * Cascade delete behavior:
   * - TypeORM cascade will delete all ChatMessage records associated with this session
   * - The deletion is performed within a transaction for data integrity
   *
   * @param sessionId - The session ID to delete
   * @param userId - The user ID requesting the deletion (for ownership verification)
   * @param ipAddress - Optional IP address for audit logging
   * @returns The ID of the deleted session
   * @throws NotFoundException if session not found
   * @throws ForbiddenException if user doesn't own the session
   */
  async hardDelete(
    sessionId: string,
    userId: string,
    ipAddress?: string,
  ): Promise<{ sessionId: string; messageCount: number }> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Fetch the session within the transaction
      const session = await queryRunner.manager.findOne(ChatSession, {
        where: { id: sessionId, userId },
      });

      if (!session) {
        throw new NotFoundException(
          `Chat session ${sessionId} not found or access denied`,
        );
      }

      // Get message count for audit logging before deletion
      const messageCount = session.messageCount || 0;

      // Delete all associated messages explicitly to ensure cascade works
      // This is a safety measure even though TypeORM cascade should handle it
      await queryRunner.manager.delete(ChatMessage, { sessionId });

      // Delete the session
      await queryRunner.manager.remove(session);

      // Commit the transaction
      await queryRunner.commitTransaction();

      // Log deletion to audit logs (after successful commit)
      this.auditService.logSessionModification(userId, 'DELETE', sessionId, ipAddress, {
        messageCount,
        deletionType: 'hard',
      });

      this.logger.log(
        `Hard deleted chat session ${sessionId} for user ${userId} (${messageCount} messages)`,
      );

      return { sessionId, messageCount };
    } catch (error) {
      // Rollback on any error
      await queryRunner.rollbackTransaction();

      this.logger.error(
        `Failed to hard delete chat session ${sessionId}: ${error.message}`,
      );

      // Re-throw the error to be handled by the caller
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  /**
   * Update session when a new message is added
   * Called by the chat messages service
   */
  async onMessageAdded(sessionId: string): Promise<void> {
    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (session) {
      session.updateLastMessage();
      await this.chatSessionRepository.save(session);
    }
  }

  /**
   * Auto-generate title from first message
   *
   * Calls the AI Engine to generate a descriptive title for the session.
   * Falls back to simple truncation if AI generation fails.
   * Runs asynchronously to avoid blocking the message creation flow.
   */
  async generateTitleFromFirstMessage(
    sessionId: string,
    firstMessage: string,
  ): Promise<void> {
    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session || session.title) {
      return; // Skip if session not found or title already exists
    }

    try {
      // Generate title using AI Engine
      const title = await this.titleGenerationService.generateTitle(
        firstMessage,
        sessionId,
      );

      // Update session with generated title
      session.updateTitle(title);
      await this.chatSessionRepository.save(session);

      this.logger.debug(`Generated title for session ${sessionId}: "${title}"`);
    } catch (error) {
      this.logger.warn(
        `Failed to generate title for session ${sessionId}: ${error.message}`,
      );

      // Fallback to simple truncation
      session.generateTitleFromMessage(firstMessage);
      await this.chatSessionRepository.save(session);
    }
  }

  /**
   * Generate title from first message (non-async version for internal use)
   *
   * This is a simpler version that doesn't call the AI Engine,
   * used for quick fallbacks.
   */
  generateSimpleTitle(message: string): string {
    // Remove common greetings and prefixes
    let cleaned = message
      .replace(/^(hi|hello|hey|czesc|czesc')[,!\s]*/i, '')
      .trim();

    // Truncate to ~50 characters
    if (cleaned.length > 50) {
      cleaned = cleaned.substring(0, 47) + '...';
    }

    // Capitalize first letter
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  /**
   * Get session count for a user
   */
  async getCount(userId: string, includeDeleted = false): Promise<number> {
    const queryBuilder = this.chatSessionRepository
      .createQueryBuilder('session')
      .where('session.userId = :userId', { userId });

    if (!includeDeleted) {
      queryBuilder.andWhere('session.deletedAt IS NULL');
    }

    return queryBuilder.getCount();
  }

  /**
   * Check if a user owns a session
   */
  async isOwner(sessionId: string, userId: string): Promise<boolean> {
    const count = await this.chatSessionRepository.count({
      where: { id: sessionId, userId },
    });
    return count > 0;
  }

  /**
   * Verify session ownership and throw if not authorized
   */
  async verifyOwnership(sessionId: string, userId: string): Promise<void> {
    const isOwner = await this.isOwner(sessionId, userId);
    if (!isOwner) {
      throw new ForbiddenException(
        'You do not have access to this chat session',
      );
    }
  }
}
