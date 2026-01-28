import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession, ChatCitation } from '../entities/chat-session.entity';
import { ChatMessage, MessageRole, ClarificationInfo } from '../entities/chat-message.entity';
import { ChatSessionsService } from './chat-sessions.service';
import {
  CreateChatMessageInput,
  CreateAssistantMessageInput,
} from '../dto/chat-message.dto';

/**
 * Service for managing chat messages within sessions
 *
 * Handles message creation, retrieval, and session updates:
 * - Creating user and assistant messages
 * - Managing sequence order for proper conversation flow
 * - Updating session metadata (lastMessageAt, messageCount, updatedAt)
 * - Triggering title generation for first message
 * - Fetching conversation history for AI context
 */
@Injectable()
export class ChatMessagesService {
  private readonly logger = new Logger(ChatMessagesService.name);

  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    private readonly chatSessionsService: ChatSessionsService,
  ) {}

  /**
   * Validate message content is not empty
   *
   * @param content - The message content to validate
   * @throws BadRequestException if content is empty or only whitespace
   */
  private validateContent(content: string): void {
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new BadRequestException(
        'Message content cannot be empty. Please provide a valid message.',
      );
    }
  }

  /**
   * Create a user message in a session
   *
   * Creates a message with role USER, assigns sequence order,
   * updates session metadata, and triggers title generation if needed.
   *
   * @param sessionId - The chat session ID
   * @param userId - The authenticated user ID
   * @param input - Message creation input
   * @returns The created message
   */
  async createUserMessage(
    sessionId: string,
    userId: string,
    input: CreateChatMessageInput,
  ): Promise<ChatMessage> {
    // Validate content is not empty
    this.validateContent(input.content);

    // Verify session ownership
    await this.chatSessionsService.verifyOwnership(sessionId, userId);

    // Get next sequence order
    const nextOrder = await this.getNextSequenceOrder(sessionId);

    // Create user message
    const message = this.chatMessageRepository.create({
      sessionId,
      role: MessageRole.USER,
      content: input.content,
      rawContent: input.content, // User messages store raw content as-is
      sequenceOrder: nextOrder,
      citations: null,
      metadata: null,
    });

    const savedMessage = await this.chatMessageRepository.save(message);

    // Log content length for verification
    this.logger.log(
      `[CHAT_MESSAGE_SAVE] USER message saved | sessionId=${sessionId} | messageId=${savedMessage.messageId} | contentLength=${input.content.length} | sequenceOrder=${nextOrder}`,
    );

    // Update session metadata
    await this.updateSessionOnNewMessage(sessionId);

    // Trigger title generation if this is the first message
    if (nextOrder === 0) {
      // Run asynchronously to avoid blocking the response
      this.chatSessionsService
        .generateTitleFromFirstMessage(sessionId, input.content)
        .catch((err) => {
          this.logger.warn(
            `Failed to generate title for session ${sessionId}: ${err.message}`,
          );
        });
    }

    this.logger.debug(
      `Created user message ${savedMessage.messageId} in session ${sessionId} at order ${nextOrder}`,
    );

    return savedMessage;
  }

  /**
   * Create an assistant message in a session
   *
   * Creates a message with role ASSISTANT, assigns sequence order,
   * stores citations and metadata, and updates session metadata.
   * Automatically detects and parses clarification JSON from content.
   *
   * @param sessionId - The chat session ID
   * @param userId - The authenticated user ID
   * @param input - Assistant message creation input
   * @returns The created message
   */
  async createAssistantMessage(
    sessionId: string,
    userId: string,
    input: CreateAssistantMessageInput,
  ): Promise<ChatMessage> {
    // Validate content is not empty
    this.validateContent(input.content);

    // Verify session ownership
    await this.chatSessionsService.verifyOwnership(sessionId, userId);

    // Get next sequence order
    const nextOrder = await this.getNextSequenceOrder(sessionId);

    // Check if content contains clarification JSON and parse it
    const clarificationFromContent = this.parseClarificationFromContent(input.content);

    // Merge clarification from content with provided metadata
    const metadata = input.metadata ?? {};
    if (clarificationFromContent) {
      metadata.clarification = clarificationFromContent;
      this.logger.debug(
        `Detected clarification JSON in message for session ${sessionId}, stored in metadata`,
      );
    }

    // Create assistant message
    const message = this.chatMessageRepository.create({
      sessionId,
      role: MessageRole.ASSISTANT,
      content: input.content,
      rawContent: input.content, // Store AI response for audit purposes
      sequenceOrder: nextOrder,
      citations: input.citations ?? null,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    });

    const savedMessage = await this.chatMessageRepository.save(message);

    // Log content length for verification
    this.logger.log(
      `[CHAT_MESSAGE_SAVE] ASSISTANT message saved | sessionId=${sessionId} | messageId=${savedMessage.messageId} | contentLength=${input.content.length} | sequenceOrder=${nextOrder} | hasCitations=${!!input.citations?.length}`,
    );

    // Update session metadata
    await this.updateSessionOnNewMessage(sessionId);

    this.logger.debug(
      `Created assistant message ${savedMessage.messageId} in session ${sessionId} at order ${nextOrder}`,
    );

    return savedMessage;
  }

  /**
   * Get messages for a session in sequence order
   *
   * @param sessionId - The chat session ID
   * @param userId - The authenticated user ID
   * @returns Array of messages sorted by sequenceOrder
   */
  async getMessagesBySession(
    sessionId: string,
    userId: string,
  ): Promise<ChatMessage[]> {
    // Verify session ownership
    await this.chatSessionsService.verifyOwnership(sessionId, userId);

    const messages = await this.chatMessageRepository
      .createQueryBuilder('message')
      .where('message.sessionId = :sessionId', { sessionId })
      .orderBy('message.sequenceOrder', 'ASC')
      .getMany();

    return messages;
  }

  /**
   * Get conversation history in AI Engine format
   *
   * Returns messages formatted for the AI Engine conversation_history parameter.
   * Maps MessageRole enum (USER/ASSISTANT) to 'user'/'assistant' strings.
   *
   * @param sessionId - The chat session ID
   * @param userId - The authenticated user ID
   * @param limit - Maximum number of recent exchanges to return (default: 10)
   * @returns Array of {role, content} objects for AI context
   */
  async getConversationHistory(
    sessionId: string,
    userId: string,
    limit = 10,
  ): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    // Verify session ownership
    await this.chatSessionsService.verifyOwnership(sessionId, userId);

    const messages = await this.chatMessageRepository
      .createQueryBuilder('message')
      .where('message.sessionId = :sessionId', { sessionId })
      .orderBy('message.sequenceOrder', 'DESC')
      .limit(limit * 2) // Get pairs of messages
      .getMany();

    // Reverse to get chronological order and map to AI Engine format
    return messages
      .reverse()
      .filter((msg) => msg.role !== MessageRole.SYSTEM)
      .map((msg) => ({
        role: msg.role === MessageRole.USER ? 'user' : 'assistant',
        content: msg.content,
      }));
  }

  /**
   * Get a single message by ID
   *
   * @param messageId - The message ID
   * @param userId - The authenticated user ID
   * @returns The message or null if not found
   */
  async getMessageById(
    messageId: string,
    userId: string,
  ): Promise<ChatMessage | null> {
    const message = await this.chatMessageRepository.findOne({
      where: { messageId },
    });

    if (!message) {
      return null;
    }

    // Verify session ownership
    await this.chatSessionsService.verifyOwnership(message.sessionId, userId);

    return message;
  }

  /**
   * Get the next sequence order for a session
   *
   * @param sessionId - The chat session ID
   * @returns The next sequence order number
   */
  private async getNextSequenceOrder(sessionId: string): Promise<number> {
    const result = await this.chatMessageRepository
      .createQueryBuilder('message')
      .select('MAX(message.sequenceOrder)', 'maxOrder')
      .where('message.sessionId = :sessionId', { sessionId })
      .getRawOne();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    return (result?.maxOrder ?? -1) + 1;
  }

  /**
   * Update session metadata when a new message is added
   *
   * Updates:
   * - lastMessageAt: Set to current time
   * - messageCount: Increment by 1
   * - updatedAt: Automatically updated by TypeORM
   *
   * @param sessionId - The chat session ID
   */
  private async updateSessionOnNewMessage(sessionId: string): Promise<void> {
    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      this.logger.warn(`Session ${sessionId} not found for message update`);
      return;
    }

    session.updateLastMessage();
    await this.chatSessionRepository.save(session);

    this.logger.debug(
      `Updated session ${sessionId}: lastMessageAt=${session.lastMessageAt}, messageCount=${session.messageCount}`,
    );
  }

  /**
   * Delete a message
   *
   * Note: This does not resequence remaining messages.
   * Messages keep their original sequenceOrder for consistency.
   *
   * @param messageId - The message ID
   * @param userId - The authenticated user ID
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.chatMessageRepository.findOne({
      where: { messageId },
    });

    if (!message) {
      throw new NotFoundException(`Message ${messageId} not found`);
    }

    // Verify session ownership
    await this.chatSessionsService.verifyOwnership(message.sessionId, userId);

    await this.chatMessageRepository.remove(message);

    this.logger.debug(`Deleted message ${messageId}`);
  }

  /**
   * Delete all messages in a session
   *
   * Used when a session is permanently deleted.
   *
   * @param sessionId - The chat session ID
   */
  async deleteMessagesBySession(sessionId: string): Promise<void> {
    await this.chatMessageRepository.delete({ sessionId });
    this.logger.debug(`Deleted all messages in session ${sessionId}`);
  }

  /**
   * Update clarification answered status for a message
   *
   * Marks a clarification message as answered and optionally stores the user's answers.
   *
   * @param messageId - The message ID containing the clarification
   * @param userId - The authenticated user ID
   * @param answered - Whether the clarification has been answered
   * @param answers - Optional JSON string of question-answer pairs
   * @returns The updated message
   */
  async updateClarificationStatus(
    messageId: string,
    userId: string,
    answered: boolean,
    answers?: string,
  ): Promise<ChatMessage> {
    const message = await this.getMessageById(messageId, userId);

    if (!message) {
      throw new NotFoundException(`Message ${messageId} not found`);
    }

    // Update the clarification status in metadata
    const currentMetadata = message.metadata ?? {};
    const currentClarification = currentMetadata.clarification;

    // If there's no existing clarification, we can't update it
    if (!currentClarification) {
      throw new NotFoundException(`Message ${messageId} does not contain a clarification`);
    }

    const updatedMetadata = {
      ...currentMetadata,
      clarification: {
        needs_clarification: currentClarification.needs_clarification ?? true,
        questions: currentClarification.questions ?? [],
        context_summary: currentClarification.context_summary ?? '',
        next_steps: currentClarification.next_steps ?? '',
        currentRound: currentClarification.currentRound,
        totalRounds: currentClarification.totalRounds,
        answered,
        ...(answers && { answers }),
        ...(answered && { answeredAt: new Date().toISOString() }),
      },
    };

    message.metadata = updatedMetadata;
    const savedMessage = await this.chatMessageRepository.save(message);

    this.logger.debug(
      `Updated clarification status for message ${messageId}: answered=${answered}`,
    );

    return savedMessage;
  }

  /**
   * Find the most recent pending clarification message in a session
   *
   * @param sessionId - The chat session ID
   * @param userId - The authenticated user ID
   * @returns The pending clarification message or null
   */
  async findPendingClarification(
    sessionId: string,
    userId: string,
  ): Promise<ChatMessage | null> {
    // Verify session ownership
    await this.chatSessionsService.verifyOwnership(sessionId, userId);

    const messages = await this.chatMessageRepository
      .createQueryBuilder('message')
      .where('message.sessionId = :sessionId', { sessionId })
      .andWhere('message.role = :role', { role: MessageRole.ASSISTANT })
      .orderBy('message.sequenceOrder', 'DESC')
      .getMany();

    // Find the most recent message with clarification that hasn't been answered
    for (const message of messages) {
      if (
        message.metadata?.clarification?.needs_clarification &&
        !message.metadata.clarification.answered
      ) {
        return message;
      }
    }

    return null;
  }

  /**
   * Count messages in a session
   *
   * @param sessionId - The chat session ID
   * @returns The message count
   */
  async countMessages(sessionId: string): Promise<number> {
    return this.chatMessageRepository.count({
      where: { sessionId },
    });
  }

  /**
   * Parse clarification JSON from content string
   *
   * Detects if the content contains a clarification JSON structure
   * and parses it into a ClarificationInfo object.
   *
   * @param content - The message content
   * @returns Parsed clarification info or null if not a clarification message
   */
  private parseClarificationFromContent(content: string): ClarificationInfo | null {
    if (!content || typeof content !== 'string') {
      return null;
    }

    const trimmed = content.trim();

    // Check if content starts with clarification JSON
    if (
      !trimmed.startsWith('{"type":"clarification"') &&
      !trimmed.startsWith('{"type": "clarification"')
    ) {
      return null;
    }

    try {
      const data = JSON.parse(trimmed);
      if (data.type === 'clarification' && Array.isArray(data.questions)) {
        return {
          needs_clarification: true,
          questions: (data.questions as Array<{
            question: string;
            question_type?: string;
            options?: string[];
            hint?: string;
          }>).map((q) => ({
            question: q.question,
            question_type: q.question_type || 'text',
            options: q.options,
            hint: q.hint,
          })),
          context_summary: data.context_summary || '',
          next_steps: data.next_steps || '',
          currentRound: data.currentRound,
          totalRounds: data.totalRounds,
          answered: false,
        };
      }
    } catch (err) {
      this.logger.debug(`Failed to parse clarification JSON: ${err}`);
    }

    return null;
  }
}
