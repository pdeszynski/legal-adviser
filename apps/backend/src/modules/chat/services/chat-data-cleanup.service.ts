import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ChatMessage, MessageRole } from '../entities/chat-message.entity';
import { ChatSession } from '../entities/chat-session.entity';
import {
  EmptyMessageAnalysis,
  EmptyMessagesSummary,
  CleanupEmptyMessagesResult,
  AffectedUsersReport,
  AffectedUserInfo,
  CleanupEmptyMessagesInput,
} from '../dto/chat-data-cleanup.dto';

/**
 * Error detail from cleanup operation
 */
interface CleanupError {
  sessionId: string;
  error: string;
}

/**
 * Batch processing configuration
 */
const BATCH_SIZE = 100;

/**
 * Result of analyzing a single message
 */
interface MessageAnalysisResult {
  messageId: string;
  sessionId: string;
  userId: string;
  role: MessageRole;
  content: string | null;
  rawContent: string | null;
  hasRecoverableRawContent: boolean;
  hasClarificationMetadata: boolean;
  sequenceOrder: number;
  createdAt: Date;
}

/**
 * Chat message with optional session relation
 * Used when querying with leftJoin to get userId from session
 */
interface ChatMessageWithSession extends Pick<
  ChatMessage,
  | 'messageId'
  | 'sessionId'
  | 'role'
  | 'content'
  | 'rawContent'
  | 'metadata'
  | 'sequenceOrder'
  | 'createdAt'
> {
  session?: Pick<ChatSession, 'userId'>;
}

/**
 * Service for cleaning up empty assistant messages in the database
 *
 * Addresses data quality issues where assistant messages were saved
 * with empty content fields due to streaming response bugs.
 *
 * Features:
 * - Identify all empty assistant messages
 * - Recover content from rawContent field if available
 * - Recover content from clarification metadata
 * - Generate reports of affected users for potential notification
 * - Admin endpoints for review before cleanup
 */
@Injectable()
export class ChatDataCleanupService {
  private readonly logger = new Logger(ChatDataCleanupService.name);

  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Find all empty assistant messages in the database
   *
   * Empty means: role = ASSISTANT AND (content IS NULL OR content = '')
   */
  async findEmptyAssistantMessages(): Promise<MessageAnalysisResult[]> {
    const emptyMessages = await this.chatMessageRepository
      .createQueryBuilder('message')
      .leftJoin('message.session', 'session')
      .where('message.role = :role', { role: MessageRole.ASSISTANT })
      .andWhere('(message.content IS NULL OR message.content = :empty)', {
        empty: '',
      })
      .select([
        'message.messageId',
        'message.sessionId',
        'session.userId',
        'message.role',
        'message.content',
        'message.rawContent',
        'message.metadata',
        'message.sequenceOrder',
        'message.createdAt',
      ])
      .getMany();

    return emptyMessages.map((msg) =>
      this.analyzeMessage(msg as ChatMessageWithSession),
    );
  }

  /**
   * Analyze a single message to determine recovery options
   */
  private analyzeMessage(
    message: ChatMessageWithSession,
  ): MessageAnalysisResult {
    const hasRecoverableRawContent =
      message.rawContent !== null && message.rawContent.trim().length > 0;

    const hasClarificationMetadata =
      message.metadata?.clarification !== undefined &&
      message.metadata.clarification !== null;

    return {
      messageId: message.messageId,
      sessionId: message.sessionId,
      userId: message.session?.userId || '',
      role: message.role,
      content: message.content,
      rawContent: message.rawContent,
      hasRecoverableRawContent,
      hasClarificationMetadata,
      sequenceOrder: message.sequenceOrder,
      createdAt: message.createdAt,
    };
  }

  /**
   * Generate a summary of empty messages
   */
  async analyzeEmptyMessages(): Promise<EmptyMessagesSummary> {
    const messages = await this.findEmptyAssistantMessages();

    const totalEmptyMessages = messages.length;
    const recoverableFromRawContent = messages.filter(
      (m) => m.hasRecoverableRawContent,
    ).length;
    const withClarificationMetadata = messages.filter(
      (m) => m.hasClarificationMetadata,
    ).length;
    const trulyEmpty = messages.filter(
      (m) => !m.hasRecoverableRawContent && !m.hasClarificationMetadata,
    ).length;

    const uniqueSessions = new Set(messages.map((m) => m.sessionId));
    const uniqueUsers = new Set(messages.map((m) => m.userId));

    return {
      totalEmptyMessages,
      recoverableFromRawContent,
      withClarificationMetadata,
      trulyEmpty,
      affectedSessions: uniqueSessions.size,
      affectedUsers: uniqueUsers.size,
      messages: messages.map((m) => ({
        messageId: m.messageId,
        sessionId: m.sessionId,
        userId: m.userId,
        role: m.role,
        content: m.content,
        rawContent: m.rawContent,
        hasRecoverableRawContent: m.hasRecoverableRawContent,
        hasClarificationMetadata: m.hasClarificationMetadata,
        sequenceOrder: m.sequenceOrder,
        createdAt: m.createdAt,
      })),
    };
  }

  /**
   * Recover content from rawContent field
   */
  private recoverFromRawContent(message: ChatMessage): boolean {
    if (message.rawContent !== null && message.rawContent.trim().length > 0) {
      message.content = message.rawContent.trim();
      return true;
    }
    return false;
  }

  /**
   * Recover content from clarification metadata
   *
   * Serializes the clarification data to JSON and stores it in content field
   */
  private recoverFromClarificationMetadata(message: ChatMessage): boolean {
    const clarification = message.metadata?.clarification;
    if (!clarification) {
      return false;
    }

    // Serialize clarification data to JSON
    const clarificationJson = JSON.stringify({
      type: 'clarification',
      questions: clarification.questions,
      context_summary: clarification.context_summary,
      next_steps: clarification.next_steps,
      current_round: clarification.currentRound,
      total_rounds: clarification.totalRounds,
      answered: clarification.answered,
    });

    message.content = clarificationJson;
    return true;
  }

  /**
   * Perform cleanup of empty messages
   *
   * @param input - Cleanup options
   * @returns Cleanup result with statistics
   */
  async cleanupEmptyMessages(
    input: CleanupEmptyMessagesInput,
  ): Promise<CleanupEmptyMessagesResult> {
    const messages = await this.findEmptyAssistantMessages();

    let recoveredFromRawContent = 0;
    let recoveredFromClarification = 0;
    let unrecoverable = 0;
    const updatedSessionIds = new Set<string>();
    const updatedUserIds = new Set<string>();

    for (const analysis of messages) {
      const message = await this.chatMessageRepository.findOne({
        where: { messageId: analysis.messageId },
      });

      if (!message) {
        this.logger.warn(
          `Message ${analysis.messageId} not found during cleanup`,
        );
        continue;
      }

      let recovered = false;

      // Try to recover from rawContent first
      if (input.recoverFromRawContent && analysis.hasRecoverableRawContent) {
        if (this.recoverFromRawContent(message)) {
          recoveredFromRawContent++;
          recovered = true;
        }
      }

      // Try to recover from clarification metadata
      if (
        !recovered &&
        input.recoverFromClarification &&
        analysis.hasClarificationMetadata
      ) {
        if (this.recoverFromClarificationMetadata(message)) {
          recoveredFromClarification++;
          recovered = true;
        }
      }

      if (!recovered) {
        unrecoverable++;
      }

      if (recovered) {
        updatedSessionIds.add(analysis.sessionId);
        updatedUserIds.add(analysis.userId);

        if (input.execute) {
          await this.chatMessageRepository.save(message);
          this.logger.log(
            `Recovered message ${analysis.messageId} in session ${analysis.sessionId}`,
          );
        } else {
          this.logger.log(
            `[DRY RUN] Would recover message ${analysis.messageId} in session ${analysis.sessionId}`,
          );
        }
      }
    }

    return {
      recoveredFromRawContent,
      recoveredFromClarification,
      markedForDeletion: 0, // Will be implemented when deletion workflow is ready
      unrecoverable,
      affectedSessions: updatedSessionIds.size,
      affectedUsers: updatedUserIds.size,
      sessionIds: Array.from(updatedSessionIds),
      userIds: Array.from(updatedUserIds),
    };
  }

  /**
   * Generate a report of affected users for potential notification
   */
  async generateAffectedUsersReport(): Promise<AffectedUsersReport> {
    const messages = await this.findEmptyAssistantMessages();

    // Group by user
    const userMap = new Map<
      string,
      {
        email: string | null;
        emptyMessageCount: number;
        sessionIds: Set<string>;
      }
    >();

    for (const analysis of messages) {
      const existing = userMap.get(analysis.userId);
      if (existing) {
        existing.emptyMessageCount++;
        existing.sessionIds.add(analysis.sessionId);
      } else {
        userMap.set(analysis.userId, {
          email: null, // Email will be fetched if needed
          emptyMessageCount: 1,
          sessionIds: new Set([analysis.sessionId]),
        });
      }
    }

    // Convert to array and sort by message count
    const users: AffectedUserInfo[] = Array.from(userMap.entries()).map(
      ([userId, data]) => ({
        userId,
        email: data.email,
        emptyMessageCount: data.emptyMessageCount,
        affectedSessionCount: data.sessionIds.size,
        sessionIds: Array.from(data.sessionIds),
      }),
    );

    users.sort((a, b) => b.emptyMessageCount - a.emptyMessageCount);

    return {
      totalAffectedUsers: users.length,
      totalEmptyMessages: messages.length,
      users,
    };
  }

  /**
   * Get empty messages for a specific session
   */
  async getEmptyMessagesForSession(
    sessionId: string,
  ): Promise<EmptyMessageAnalysis[]> {
    const messages = await this.chatMessageRepository
      .createQueryBuilder('message')
      .where('message.sessionId = :sessionId', { sessionId })
      .andWhere('message.role = :role', { role: MessageRole.ASSISTANT })
      .andWhere('(message.content IS NULL OR message.content = :empty)', {
        empty: '',
      })
      .getMany();

    return messages.map((msg) => {
      const analysis = this.analyzeMessage(msg);
      return {
        messageId: analysis.messageId,
        sessionId: analysis.sessionId,
        userId: analysis.userId,
        role: analysis.role,
        content: analysis.content,
        rawContent: analysis.rawContent,
        hasRecoverableRawContent: analysis.hasRecoverableRawContent,
        hasClarificationMetadata: analysis.hasClarificationMetadata,
        sequenceOrder: analysis.sequenceOrder,
        createdAt: analysis.createdAt,
      };
    });
  }

  /**
   * Get empty messages for a specific user
   */
  async getEmptyMessagesForUser(
    userId: string,
  ): Promise<EmptyMessageAnalysis[]> {
    const messages = await this.chatMessageRepository
      .createQueryBuilder('message')
      .leftJoin('message.session', 'session')
      .where('session.userId = :userId', { userId })
      .andWhere('message.role = :role', { role: MessageRole.ASSISTANT })
      .andWhere('(message.content IS NULL OR message.content = :empty)', {
        empty: '',
      })
      .getMany();

    return messages.map((msg) => {
      const analysis = this.analyzeMessage(msg);
      return {
        messageId: analysis.messageId,
        sessionId: analysis.sessionId,
        userId: analysis.userId,
        role: analysis.role,
        content: analysis.content,
        rawContent: analysis.rawContent,
        hasRecoverableRawContent: analysis.hasRecoverableRawContent,
        hasClarificationMetadata: analysis.hasClarificationMetadata,
        sequenceOrder: analysis.sequenceOrder,
        createdAt: analysis.createdAt,
      };
    });
  }

  /**
   * Get a summary by user ID
   */
  async getUserEmptyMessageSummary(userId: string): Promise<{
    userId: string;
    totalEmptyMessages: number;
    withRecoverableRawContent: number;
    withClarificationMetadata: number;
    affectedSessions: string[];
  }> {
    const messages = await this.getEmptyMessagesForUser(userId);
    const sessionIds = new Set(messages.map((m) => m.sessionId));

    return {
      userId,
      totalEmptyMessages: messages.length,
      withRecoverableRawContent: messages.filter(
        (m) => m.hasRecoverableRawContent,
      ).length,
      withClarificationMetadata: messages.filter(
        (m) => m.hasClarificationMetadata,
      ).length,
      affectedSessions: Array.from(sessionIds),
    };
  }

  /**
   * Find all empty chat sessions (sessions with messageCount = 0)
   *
   * Empty sessions are those that were created but never had any messages sent.
   * This can happen when users navigate to the chat page but don't send a message.
   *
   * @returns Array of empty session IDs with metadata
   */
  async findEmptySessions(): Promise<
    Array<{
      sessionId: string;
      userId: string;
      mode: string;
      createdAt: Date;
      title: string | null;
    }>
  > {
    const emptySessions = await this.chatSessionRepository
      .createQueryBuilder('session')
      .where('session.messageCount = 0')
      .andWhere('session.deletedAt IS NULL')
      .select([
        'session.id',
        'session.userId',
        'session.mode',
        'session.createdAt',
        'session.title',
      ])
      .getMany();

    return emptySessions.map((session) => ({
      sessionId: session.id,
      userId: session.userId,
      mode: session.mode,
      createdAt: session.createdAt,
      title: session.title,
    }));
  }

  /**
   * Delete empty chat sessions (soft delete)
   *
   * Marks empty sessions as deleted without permanently removing them.
   * This cleans up the chat history while preserving data for audit purposes.
   *
   * @param execute - If false, perform a dry run and return counts only
   * @returns Summary of deleted sessions
   */
  async deleteEmptySessions(execute = false): Promise<{
    totalEmptySessions: number;
    deletedSessions: number;
    affectedUsers: number;
    sessionIds: string[];
    userIds: string[];
  }> {
    const result = await this.deleteEmptySessionsBatched(execute);
    return {
      totalEmptySessions: result.totalEmptySessions,
      deletedSessions: result.deletedSessions,
      affectedUsers: result.affectedUsers,
      sessionIds: result.sessionIds,
      userIds: result.userIds,
    };
  }

  /**
   * Delete empty chat sessions with batch processing
   *
   * Improved version that:
   * 1. Processes sessions in batches of 100 to avoid long-running transactions
   * 2. Verifies no ChatMessage records exist before deleting sessions
   * 3. Tracks errors for audit trail
   * 4. Returns skipped sessions count separately from deleted count
   *
   * @param execute - If false, perform a dry run and return counts only
   * @returns Summary of deleted sessions with errors
   */
  async deleteEmptySessionsBatched(execute = false): Promise<{
    totalEmptySessions: number;
    deletedSessions: number;
    skippedSessions: number;
    affectedUsers: number;
    sessionIds: string[];
    userIds: string[];
    errors: CleanupError[];
  }> {
    const emptySessions = await this.findEmptySessions();

    const uniqueUsers = new Set<string>();
    const deletedSessionIds: string[] = [];
    const errors: CleanupError[] = [];
    let deletedSessions = 0;
    let skippedSessions = 0;

    if (execute) {
      // Process in batches to avoid long-running transactions
      for (let i = 0; i < emptySessions.length; i += BATCH_SIZE) {
        const batch = emptySessions.slice(i, i + BATCH_SIZE);

        this.logger.log(
          `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(emptySessions.length / BATCH_SIZE)} (${batch.length} sessions)`,
        );

        // Use QueryRunner for transaction management
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          for (const session of batch) {
            try {
              // Verify no ChatMessage records exist for this session
              const messageCount = await queryRunner.manager.count(
                ChatMessage,
                {
                  where: { sessionId: session.sessionId },
                },
              );

              if (messageCount > 0) {
                skippedSessions++;
                errors.push({
                  sessionId: session.sessionId,
                  error: `Session has ${messageCount} message(s), skipping`,
                });
                this.logger.warn(
                  `Skipping session ${session.sessionId}: has ${messageCount} message(s)`,
                );
                continue;
              }

              // Find the session entity
              const sessionEntity = await queryRunner.manager.findOne(
                ChatSession,
                {
                  where: { id: session.sessionId },
                },
              );

              if (!sessionEntity) {
                skippedSessions++;
                errors.push({
                  sessionId: session.sessionId,
                  error: 'Session not found in database',
                });
                this.logger.warn(
                  `Session ${session.sessionId} not found in database`,
                );
                continue;
              }

              // Soft delete the session
              sessionEntity.deletedAt = new Date();
              await queryRunner.manager.save(sessionEntity);

              deletedSessions++;
              deletedSessionIds.push(session.sessionId);
              uniqueUsers.add(session.userId);

              this.logger.log(
                `Soft deleted empty session ${session.sessionId} for user ${session.userId}`,
              );
            } catch (error) {
              skippedSessions++;
              const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
              errors.push({
                sessionId: session.sessionId,
                error: errorMessage,
              });
              this.logger.error(
                `Error processing session ${session.sessionId}: ${errorMessage}`,
              );
            }
          }

          // Commit the transaction
          await queryRunner.commitTransaction();
        } catch (error) {
          // Rollback on error
          await queryRunner.rollbackTransaction();
          this.logger.error(
            `Batch transaction failed, rolling back: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          throw error;
        } finally {
          // Release the query runner
          await queryRunner.release();
        }
      }
    } else {
      // Dry run - simulate what would happen
      this.logger.log(
        `[DRY RUN] Would process ${emptySessions.length} empty sessions in ${Math.ceil(emptySessions.length / BATCH_SIZE)} batches`,
      );

      for (const session of emptySessions) {
        // Check if session has messages
        const messageCount = await this.chatMessageRepository.count({
          where: { sessionId: session.sessionId },
        });

        if (messageCount > 0) {
          skippedSessions++;
          errors.push({
            sessionId: session.sessionId,
            error: `Session has ${messageCount} message(s), would skip`,
          });
        } else {
          deletedSessions++;
          deletedSessionIds.push(session.sessionId);
          uniqueUsers.add(session.userId);
        }
      }
    }

    return {
      totalEmptySessions: emptySessions.length,
      deletedSessions,
      skippedSessions,
      affectedUsers: uniqueUsers.size,
      sessionIds: deletedSessionIds,
      userIds: Array.from(uniqueUsers),
      errors,
    };
  }

  /**
   * Permanently delete empty chat sessions (hard delete)
   *
   * WARNING: This operation cannot be undone. Use with caution.
   * Consider using deleteEmptySessions (soft delete) for safety.
   *
   * @returns Summary of permanently deleted sessions
   */
  async hardDeleteEmptySessions(): Promise<{
    totalDeleted: number;
    affectedUsers: number;
  }> {
    const emptySessions = await this.findEmptySessions();

    const uniqueUsers = new Set(emptySessions.map((s) => s.userId));

    let totalDeleted = 0;
    for (const session of emptySessions) {
      const sessionEntity = await this.chatSessionRepository.findOne({
        where: { id: session.sessionId },
      });

      if (sessionEntity) {
        await this.chatSessionRepository.remove(sessionEntity);
        totalDeleted++;

        this.logger.log(
          `Permanently deleted empty session ${session.sessionId} for user ${session.userId}`,
        );
      }
    }

    return {
      totalDeleted,
      affectedUsers: uniqueUsers.size,
    };
  }

  /**
   * Get empty sessions metrics for monitoring
   *
   * Returns current count of empty sessions with timestamp and alert status.
   * Useful for monitoring dashboards to track empty session count over time.
   *
   * @param alertThreshold - Threshold for alerting (default: 100)
   * @returns Empty sessions metrics
   */
  async getEmptySessionsMetrics(alertThreshold = 100): Promise<{
    count: number;
    timestamp: string;
    alertThreshold: number | null;
    requiresAttention: boolean;
  }> {
    const emptySessions = await this.findEmptySessions();
    const count = emptySessions.length;

    return {
      count,
      timestamp: new Date().toISOString(),
      alertThreshold,
      requiresAttention: count > alertThreshold,
    };
  }
}
