import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ChatSession } from '../entities/chat-session.entity';
import { ChatMessage, MessageRole } from '../entities/chat-message.entity';
import {
  MigrateChatSessionInput,
  MigrateChatBulkInput,
  MigrateChatBulkResult,
  MigrateChatSessionResult,
} from '../dto/chat-migration.dto';

/**
 * Service for migrating chat data from localStorage to the database
 *
 * Handles:
 * - Validation of session IDs and message data
 * - Detection of duplicate sessions
 * - Batch creation of sessions and messages
 * - Transaction-based migration for data integrity
 */
@Injectable()
export class ChatMigrationService {
  private readonly logger = new Logger(ChatMigrationService.name);

  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Migrate a single chat session from localStorage
   *
   * @param userId - The authenticated user's ID
   * @param input - The session data to migrate
   * @returns Result of the migration attempt
   */
  async migrateSession(
    userId: string,
    input: MigrateChatSessionInput,
  ): Promise<MigrateChatSessionResult> {
    // Validate session ID format (UUID v4)
    if (!this.isValidUuidV4(input.sessionId)) {
      return {
        sessionId: input.sessionId,
        success: false,
        error: 'Invalid session ID format. Must be UUID v4.',
        messageCount: 0,
      };
    }

    // Check for duplicate session
    const existingSession = await this.chatSessionRepository.findOne({
      where: { id: input.sessionId, userId },
    });

    if (existingSession) {
      return {
        sessionId: input.sessionId,
        success: false,
        error: 'Session already exists in database.',
        messageCount: 0,
      };
    }

    // Validate messages array
    if (!input.messages || input.messages.length === 0) {
      return {
        sessionId: input.sessionId,
        success: false,
        error: 'Session must contain at least one message.',
        messageCount: 0,
      };
    }

    // Validate message content and calculate timestamps
    const now = new Date();
    let lastMessageAt: Date | null = null;
    let firstUserMessage = '';

    for (let i = 0; i < input.messages.length; i++) {
      const msg = input.messages[i];
      if (!msg.content || msg.content.trim().length === 0) {
        return {
          sessionId: input.sessionId,
          success: false,
          error: `Message at index ${i} has empty content.`,
          messageCount: 0,
        };
      }

      // Track timestamp of the last message
      const msgTimestamp = msg.timestamp ? new Date(msg.timestamp) : now;
      if (!lastMessageAt || msgTimestamp > lastMessageAt) {
        lastMessageAt = msgTimestamp;
      }

      // Track first user message for title generation
      if (!firstUserMessage && msg.role === MessageRole.USER) {
        firstUserMessage = msg.content;
      }
    }

    // Use transaction to ensure data integrity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create the session
      const session = queryRunner.manager.create(ChatSession, {
        id: input.sessionId,
        userId,
        title: input.title || null,
        mode: input.mode,
        messageCount: input.messages.length,
        isPinned: false,
        lastMessageAt: lastMessageAt || now,
        createdAt: now,
        updatedAt: now,
      });

      await queryRunner.manager.save(ChatSession, session);

      // Create messages in sequence order
      for (let i = 0; i < input.messages.length; i++) {
        const msg = input.messages[i];
        const message = queryRunner.manager.create(ChatMessage, {
          messageId: this.generateMessageId(),
          sessionId: session.id,
          role: msg.role,
          content: msg.content,
          rawContent: msg.rawContent || null,
          citations: msg.citations || [],
          metadata: null,
          sequenceOrder: i,
          createdAt: msg.timestamp ? new Date(msg.timestamp) : now,
        });

        await queryRunner.manager.save(ChatMessage, message);
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Successfully migrated session ${input.sessionId} for user ${userId} with ${input.messages.length} messages`,
      );

      return {
        sessionId: session.id,
        success: true,
        error: null,
        messageCount: input.messages.length,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      this.logger.error(
        `Failed to migrate session ${input.sessionId}: ${error.message}`,
      );

      return {
        sessionId: input.sessionId,
        success: false,
        error: error.message,
        messageCount: 0,
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Migrate multiple chat sessions in bulk
   *
   * @param userId - The authenticated user's ID
   * @param input - Bulk migration input with multiple sessions
   * @returns Aggregated migration results
   */
  async migrateBulk(
    userId: string,
    input: MigrateChatBulkInput,
  ): Promise<MigrateChatBulkResult> {
    const results: MigrateChatSessionResult[] = [];
    let successfulCount = 0;
    let failedCount = 0;
    let totalMessagesMigrated = 0;

    for (const sessionInput of input.sessions) {
      const result = await this.migrateSession(userId, sessionInput);
      results.push(result);

      if (result.success) {
        successfulCount++;
        totalMessagesMigrated += result.messageCount;
      } else {
        failedCount++;

        // If error is "already exists" and skipDuplicates is true, don't count as failure
        if (input.skipDuplicates && result.error?.includes('already exists')) {
          failedCount--;
        }
      }
    }

    this.logger.log(
      `Bulk migration completed for user ${userId}: ${successfulCount} successful, ${failedCount} failed, ${totalMessagesMigrated} messages`,
    );

    return {
      results,
      totalProcessed: input.sessions.length,
      successfulCount,
      failedCount,
      totalMessagesMigrated,
    };
  }

  /**
   * Check if a session already exists in the database
   *
   * @param userId - The user's ID
   * @param sessionId - The session ID to check
   * @returns True if session exists
   */
  async sessionExists(userId: string, sessionId: string): Promise<boolean> {
    const count = await this.chatSessionRepository.count({
      where: { id: sessionId, userId },
    });
    return count > 0;
  }

  /**
   * Check which sessions from a list already exist
   *
   * @param userId - The user's ID
   * @param sessionIds - List of session IDs to check
   * @returns Set of existing session IDs
   */
  async getExistingSessionIds(
    userId: string,
    sessionIds: string[],
  ): Promise<Set<string>> {
    const existing = await this.chatSessionRepository
      .createQueryBuilder('session')
      .where('session.userId = :userId', { userId })
      .andWhere('session.id IN (:...sessionIds)', { sessionIds })
      .select('session.id')
      .getMany();

    return new Set(existing.map((s) => s.id));
  }

  /**
   * Validate UUID v4 format
   */
  private isValidUuidV4(id: string): boolean {
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidV4Regex.test(id);
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return crypto.randomUUID();
  }
}
