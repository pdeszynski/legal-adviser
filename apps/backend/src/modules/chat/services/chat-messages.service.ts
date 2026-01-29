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
import {
  ChatMessage,
  MessageRole,
  ClarificationInfo,
  ChatMessageMetadata,
} from '../entities/chat-message.entity';
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
   * @param role - Optional message role for better error messages
   * @param hasClarificationMetadata - Whether clarification metadata is present
   * @throws BadRequestException if content is empty or only whitespace
   */
  private validateContent(
    content: string,
    role?: MessageRole,
    hasClarificationMetadata = false,
  ): void {
    if (
      !content ||
      typeof content !== 'string' ||
      content.trim().length === 0
    ) {
      // Special error for clarification responses with empty content
      if (hasClarificationMetadata) {
        this.logger.error(
          `[CLARIFICATION_VALIDATION_ERROR] Clarification message has empty content. ` +
            `For clarification responses, the content field must contain the JSON structure. ` +
            `Expected format: {"type":"clarification","questions":[...],"context_summary":"...","next_steps":"..."}`,
        );
        throw new BadRequestException(
          'Clarification JSON content cannot be empty. ' +
            'For clarification responses, the content field must contain the JSON structure: ' +
            '{"type":"clarification","questions":[...],"context_summary":"...","next_steps":"..."}',
        );
      }

      throw new BadRequestException(
        'Message content cannot be empty. Please provide a valid message.',
      );
    }
  }

  /**
   * Check if content is a clarification JSON
   *
   * @param content - The message content to check
   * @returns true if content contains clarification JSON structure
   */
  private isClarificationJson(content: string): boolean {
    if (!content || typeof content !== 'string') {
      return false;
    }

    const trimmed = content.trim();
    return (
      trimmed.startsWith('{"type":"clarification"') ||
      trimmed.startsWith('{"type": "clarification"')
    );
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
      metadata: null, // User messages don't have metadata by default
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
    // Check if content contains clarification JSON
    const isClarification = this.isClarificationJson(input.content);
    const hasClarificationMetadata =
      isClarification || !!input.metadata?.clarification;

    // Log clarification detection for debugging
    if (isClarification) {
      this.logger.log(
        `[CLARIFICATION_DETECTED] Session ${sessionId} | Content starts with clarification JSON | ` +
          `contentLength=${input.content.length} | ` +
          `hasMetadataClarification=${!!input.metadata?.clarification}`,
      );
    }

    // Validate content is not empty
    // If metadata contains clarification but content is empty, that's a data quality issue
    this.validateContent(
      input.content,
      MessageRole.ASSISTANT,
      hasClarificationMetadata,
    );

    // Verify session ownership
    await this.chatSessionsService.verifyOwnership(sessionId, userId);

    // Get next sequence order
    const nextOrder = await this.getNextSequenceOrder(sessionId);

    // Check if content contains clarification JSON and parse it
    const clarificationFromContent = this.parseClarificationFromContent(
      input.content,
    );

    // Merge clarification from content with provided metadata
    const metadata: ChatMessageMetadata = input.metadata
      ? { ...input.metadata }
      : {};
    if (clarificationFromContent) {
      metadata.clarification = clarificationFromContent;
      this.logger.log(
        `[CLARIFICATION_PARSED] Session ${sessionId} | Parsed clarification from content | ` +
          `questionsCount=${clarificationFromContent.questions?.length || 0} | ` +
          `context_summary="${clarificationFromContent.context_summary?.substring(0, 50) || ''}..."`,
      );
    }

    // Additional validation: if metadata has clarification but content doesn't contain it
    if (metadata.clarification && !clarificationFromContent) {
      this.logger.warn(
        `[CLARIFICATION_METADATA_MISMATCH] Session ${sessionId} | Metadata has clarification but content doesn't contain JSON | ` +
          `This may indicate frontend didn't serialize clarification to content field`,
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

    // Log content length for verification with clarification details
    if (clarificationFromContent) {
      this.logger.log(
        `[CHAT_MESSAGE_SAVE] ASSISTANT message saved (CLARIFICATION) | ` +
          `sessionId=${sessionId} | messageId=${savedMessage.messageId} | ` +
          `contentLength=${input.content.length} | sequenceOrder=${nextOrder} | ` +
          `hasClarification=true | questionsCount=${clarificationFromContent.questions?.length || 0} | ` +
          `contextSummary="${clarificationFromContent.context_summary?.substring(0, 50) || ''}..."`,
      );
    } else {
      this.logger.log(
        `[CHAT_MESSAGE_SAVE] ASSISTANT message saved | sessionId=${sessionId} | messageId=${savedMessage.messageId} | contentLength=${input.content.length} | sequenceOrder=${nextOrder} | hasCitations=${!!input.citations?.length}`,
      );
    }

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
   * Parses clarification_answer JSON messages into plain text for AI consumption.
   * Example: {"type":"clarification_answer","answers":[...]}
   *   becomes: "Based on your questions:\n1) When did...? - [answer]\n2) ..."
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
    const history: Array<{ role: 'user' | 'assistant'; content: string }> =
      messages
        .reverse()
        .filter((msg) => msg.role !== MessageRole.SYSTEM)
        .map((msg) => {
          let content = msg.content;

          // Parse clarification_answer JSON messages into plain text for AI
          if (
            msg.role === MessageRole.USER &&
            this.isClarificationAnswerJson(msg.content)
          ) {
            const parsedContent = this.parseClarificationAnswerToText(
              msg.content,
            );
            if (parsedContent) {
              content = parsedContent;
              this.logger.log(
                `[CONVERSATION_HISTORY] Parsed clarification_answer JSON to plain text | ` +
                  `sessionId=${sessionId} | messageId=${msg.messageId} | ` +
                  `originalLength=${msg.content.length} | parsedLength=${content.length}`,
              );
            }
          }

          return {
            role:
              msg.role === MessageRole.USER
                ? ('user' as const)
                : ('assistant' as const),
            content,
          };
        });

    // Log summary for debugging
    this.logger.log(
      `[CONVERSATION_HISTORY] Retrieved ${history.length} messages for session ${sessionId} | ` +
        `limit=${limit} | userCount=${history.filter((m) => m.role === 'user').length} | ` +
        `assistantCount=${history.filter((m) => m.role === 'assistant').length}`,
    );

    return history;
  }

  /**
   * Check if content is a clarification_answer JSON
   *
   * @param content - The message content to check
   * @returns true if content contains clarification_answer JSON structure
   */
  private isClarificationAnswerJson(content: string): boolean {
    if (!content || typeof content !== 'string') {
      return false;
    }

    const trimmed = content.trim();
    return (
      trimmed.startsWith('{"type":"clarification_answer"') ||
      trimmed.startsWith('{"type": "clarification_answer"')
    );
  }

  /**
   * Parse clarification_answer JSON to plain text for AI Engine
   *
   * Converts: {"type":"clarification_answer","answers":[{"question":"...","answer":"..."}]}
   * To: "Based on your questions:\n1) [question] - [answer]\n2) [question] - [answer]\n..."
   *
   * @param content - The JSON string containing clarification_answer
   * @returns Plain text representation or null if parsing fails
   */
  private parseClarificationAnswerToText(content: string): string | null {
    if (!content || typeof content !== 'string') {
      return null;
    }

    const trimmed = content.trim();

    // Verify it's a clarification_answer JSON
    if (
      !trimmed.startsWith('{"type":"clarification_answer"') &&
      !trimmed.startsWith('{"type": "clarification_answer"')
    ) {
      return null;
    }

    try {
      const data = JSON.parse(trimmed);

      if (
        data.type !== 'clarification_answer' ||
        !Array.isArray(data.answers)
      ) {
        return null;
      }

      // Format answers as natural language text for AI Engine
      const answersText = data.answers
        .map((a: { question: string; answer: string }, index: number) => {
          return `${index + 1}) ${a.question} - ${a.answer}`;
        })
        .join('\n');

      const formattedText = `Based on your questions:\n${answersText}`;

      this.logger.debug(
        `[parseClarificationAnswerToText] Converted ${data.answers.length} answers to plain text | ` +
          `outputLength=${formattedText.length}`,
      );

      return formattedText;
    } catch (err) {
      this.logger.warn(
        `[parseClarificationAnswerToText] Failed to parse JSON: ${err}`,
      );
      return null;
    }
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
      throw new NotFoundException(
        `Message ${messageId} does not contain a clarification`,
      );
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
   * Update message metadata
   *
   * @param messageId - The message ID
   * @param metadata - The metadata to merge with existing metadata
   * @returns The updated message
   */
  async updateMessageMetadata(
    messageId: string,
    metadata: Partial<ChatMessageMetadata>,
  ): Promise<ChatMessage> {
    const message = await this.chatMessageRepository.findOne({
      where: { messageId },
    });
    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Merge metadata
    message.metadata = {
      ...message.metadata,
      ...metadata,
    };

    return await this.chatMessageRepository.save(message);
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
  private parseClarificationFromContent(
    content: string,
  ): ClarificationInfo | null {
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
          questions: (
            data.questions as Array<{
              question: string;
              question_type?: string;
              options?: string[];
              hint?: string;
            }>
          ).map((q) => ({
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
