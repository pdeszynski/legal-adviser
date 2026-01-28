import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ChatMessage, MessageRole, ChatMessageMetadata } from '../entities/chat-message.entity';
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
      .andWhere('(message.content IS NULL OR message.content = :empty)', { empty: '' })
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

    return emptyMessages.map((msg) => this.analyzeMessage(msg));
  }

  /**
   * Analyze a single message to determine recovery options
   */
  private analyzeMessage(message: ChatMessage): MessageAnalysisResult {
    const hasRecoverableRawContent =
      message.rawContent !== null && message.rawContent.trim().length > 0;

    const hasClarificationMetadata =
      message.metadata?.clarification !== undefined &&
      message.metadata.clarification !== null;

    return {
      messageId: message.messageId,
      sessionId: message.sessionId,
      userId: (message.session as any)?.userId || '',
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
    if (
      message.rawContent !== null &&
      message.rawContent.trim().length > 0
    ) {
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
        this.logger.warn(`Message ${analysis.messageId} not found during cleanup`);
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
}
