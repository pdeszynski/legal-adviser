import { Resolver, Mutation, Args, Context, ID, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GqlAuthGuard } from '../auth/guards';
import { ChatSessionOwnershipGuard } from './guards';
import { ChatSessionsService } from './services/chat-sessions.service';
import { ChatMessagesService } from './services/chat-messages.service';
import { ChatAuditService } from './services/chat-audit.service';
import { ChatSession, ChatMode } from './entities/chat-session.entity';
import {
  ChatMessage,
  MessageRole,
  ChatMessageType,
} from './entities/chat-message.entity';
import {
  SendChatMessageWithAIInput,
  SendChatMessageWithAIResponse,
  SendChatMessageResponse,
  SaveChatMessageInput,
  UpdateClarificationStatusInput,
  UpdateClarificationStatusResponse,
  SubmitClarificationAnswersInput,
  SubmitClarificationAnswersResponse,
  ClarificationValidationError,
} from './dto/chat-message.dto';
import { AiClientService } from '../../shared/ai-client/ai-client.service';
import { RequireQuota, QuotaType } from '../../shared';

/**
 * Custom GraphQL Resolver for Chat Messages
 *
 * Provides message creation and AI response handling:
 * - sendChatMessage: Create a message and get AI response
 * - Stores both user messages and AI responses in ChatMessage table
 * - Updates ChatSession metadata (lastMessageAt, messageCount)
 * - Creates new session if sessionId is not provided
 * - Triggers title generation for new sessions
 *
 * Authentication: All operations require valid JWT token via GqlAuthGuard
 */
@Resolver(() => ChatMessage)
@UseGuards(GqlAuthGuard)
export class ChatMessagesResolver {
  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    private readonly chatSessionsService: ChatSessionsService,
    private readonly chatMessagesService: ChatMessagesService,
    private readonly aiClientService: AiClientService,
    private readonly auditService: ChatAuditService,
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
   * Mutation: Send a chat message and get AI response
   *
   * This is the main entry point for the chat interface. It:
   * 1. Creates or validates a chat session
   * 2. Saves the user message to the database
   * 3. Calls the AI Engine to get a response
   * 4. Saves the AI response to the database
   * 5. Updates session metadata (lastMessageAt, messageCount)
   * 6. Triggers title generation for new sessions
   *
   * Replaces the old askLegalQuestion mutation which used LegalQuery entity.
   *
   * Quota check: Requires one query quota
   *
   * @example
   * ```graphql
   * mutation {
   *   sendChatMessageWithAI(input: {
   *     question: "What are my rights as a tenant?"
   *     mode: "LAWYER"
   *     sessionId: "session-uuid"  # optional, creates new if omitted
   *   }) {
   *     sessionId
   *     answerMarkdown
   *     citations { source article url }
   *     queryType
   *     keyTerms
   *     confidence
   *     userMessage {
   *       id
   *       role
   *       content
   *       sequenceOrder
   *       createdAt
   *     }
   *     assistantMessage {
   *       id
   *       role
   *       content
   *       sequenceOrder
   *       createdAt
   *     }
   *   }
   * }
   * ```
   */
  @RequireQuota(QuotaType.QUERY)
  @Mutation(() => SendChatMessageWithAIResponse, {
    name: 'sendChatMessageWithAI',
    description:
      'Send a chat message and get AI response. Stores both messages in the database.',
  })
  async sendMessageWithAI(
    @Args('input') input: SendChatMessageWithAIInput,
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<SendChatMessageWithAIResponse> {
    const userId = context.req?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    // userId is now guaranteed to be a string
    const safeUserId: string = userId;

    // Validate mode
    const mode =
      input.mode.toUpperCase() === 'LAWYER' ? ChatMode.LAWYER : ChatMode.SIMPLE;

    // Get or create session
    let sessionId = input.sessionId;
    let session: ChatSession | null = null;

    if (sessionId) {
      // Verify existing session
      try {
        session = await this.chatSessionsService.findByIdAndUserId(
          sessionId,
          safeUserId,
        );
        // Update session mode if different
        if (session.mode !== mode) {
          session.mode = mode;
          await this.chatSessionRepository.save(session);
        }
      } catch {
        // Session doesn't exist or access denied, create new one
        session = null;
      }
    }

    if (!session) {
      // Create new session
      session = await this.chatSessionsService.create(safeUserId, { mode });
      sessionId = session.id;
    }

    // sessionId is now guaranteed to be defined after the above block
    const finalSessionId: string = sessionId!;

    // Create user message
    const userMessage = await this.chatMessagesService.createUserMessage(
      finalSessionId,
      safeUserId,
      { content: input.question },
    );

    // Get conversation history for AI context
    const conversationHistory =
      await this.chatMessagesService.getConversationHistory(
        finalSessionId,
        safeUserId,
      );

    // Log conversation history details for verification
    const historySize = conversationHistory.length;
    const historyLogContext: Record<string, unknown> = {
      sessionId: finalSessionId,
      userId: safeUserId,
      messageCount: historySize,
      totalChars: conversationHistory.reduce(
        (sum, msg) => sum + (msg.content?.length || 0),
        0,
      ),
    };

    if (historySize > 0) {
      // Log message distribution and order
      const roles = conversationHistory.map((msg) => msg.role);
      historyLogContext.roleDistribution = {
        user: roles.filter((r) => r === 'user').length,
        assistant: roles.filter((r) => r === 'assistant').length,
      };
      historyLogContext.firstRole = roles[0];
      historyLogContext.lastRole = roles[roles.length - 1];
      historyLogContext.messagePreview = conversationHistory.map((msg, i) => ({
        index: i,
        role: msg.role,
        contentLength: msg.content?.length || 0,
        contentPreview: msg.content?.substring(0, 50) || '',
      }));

      console.log(
        `[CONVERSATION_HISTORY] Session ${finalSessionId}: ${JSON.stringify(historyLogContext)}`,
      );
    } else {
      console.log(
        `[CONVERSATION_HISTORY] Session ${finalSessionId}: No history (new chat)`,
      );
    }

    // Call AI Engine
    let assistantMessage: ChatMessage | null = null;
    let answerMarkdown = '';
    let citations: any[] | null = null;
    let queryType: string | null = null;
    let keyTerms: string[] | null = null;
    let confidence: number | null = null;
    let clarificationInfo: any = null;

    try {
      const aiResponse = await this.aiClientService.askQuestion(
        {
          question: input.question,
          session_id: finalSessionId,
          mode: input.mode,
          conversation_history: conversationHistory,
        },
        safeUserId,
      );

      answerMarkdown = aiResponse.answer || '';
      citations = aiResponse.citations || [];
      queryType = aiResponse.query_type || null;
      keyTerms = aiResponse.key_terms || null;
      confidence = aiResponse.confidence || null;
      clarificationInfo = aiResponse.clarification || null;

      // Handle clarification response: serialize to JSON for content field
      if (clarificationInfo?.needs_clarification) {
        // For clarification responses, the content should contain the JSON structure
        // so the backend can parse it and store it in metadata
        answerMarkdown = JSON.stringify({
          type: 'clarification',
          questions: clarificationInfo.questions || [],
          context_summary: clarificationInfo.context_summary || '',
          next_steps: clarificationInfo.next_steps || '',
          currentRound: clarificationInfo.currentRound,
          totalRounds: clarificationInfo.totalRounds,
        });
        console.log(
          '[sendChatMessageWithAI] Clarification detected, serializing to JSON:',
          {
            questionsCount: clarificationInfo.questions?.length || 0,
            contentLength: answerMarkdown.length,
          },
        );
      }

      // Log AI request for audit
      this.auditService.logAIRequest(
        safeUserId,
        finalSessionId,
        'ASK',
        this.extractIpAddress(
          context as {
            req: { ip?: string; headers?: Record<string, unknown> };
          },
        ),
        {
          mode: input.mode,
          queryType,
          confidence,
        },
      );

      // Create assistant message
      assistantMessage = await this.chatMessagesService.createAssistantMessage(
        finalSessionId,
        safeUserId,
        {
          content: answerMarkdown,
          citations: citations || undefined,
          metadata: {
            confidence: confidence ?? undefined,
            queryType: queryType ?? undefined,
            keyTerms: keyTerms ?? undefined,
            model: 'gpt-4o',
          },
        },
      );
    } catch (error) {
      // Log error but don't fail - return user message without assistant response
      console.error('AI Engine error:', error);
    }

    return {
      userMessage: {
        messageId: userMessage.messageId,
        sessionId: userMessage.sessionId,
        role: userMessage.role,
        type: userMessage.type,
        content: userMessage.content,
        sequenceOrder: userMessage.sequenceOrder,
        createdAt: userMessage.createdAt.toISOString(),
      },
      assistantMessage: assistantMessage
        ? {
            messageId: assistantMessage.messageId,
            sessionId: assistantMessage.sessionId,
            role: assistantMessage.role,
            type: assistantMessage.type,
            content: assistantMessage.content,
            sequenceOrder: assistantMessage.sequenceOrder,
            createdAt: assistantMessage.createdAt.toISOString(),
          }
        : null,
      sessionId: finalSessionId,
      answerMarkdown: answerMarkdown || null,
      citations: citations || null,
      queryType,
      keyTerms,
      confidence,
    };
  }

  /**
   * Mutation: Save a streaming chat message
   *
   * Used by the frontend to save AI responses from streaming endpoint.
   * The streaming endpoint returns the response directly to the frontend,
   * but we still need to persist it to the database.
   *
   * @example
   * ```graphql
   * mutation {
   *   saveChatMessage(input: {
   *     sessionId: "session-uuid"
   *     content: "AI response text..."
   *     role: ASSISTANT
   *     citations: [{ source: "Civil Code", article: "Art. 123" }]
   *   }) {
   *     id
   *     role
   *     content
   *     sequenceOrder
   *     createdAt
   *   }
   * }
   * ```
   */
  @Mutation(() => SendChatMessageResponse, {
    name: 'saveChatMessage',
    description:
      'Save a chat message to the database (used for streaming responses)',
  })
  @UseGuards(ChatSessionOwnershipGuard)
  async saveMessage(
    @Args('input') input: SaveChatMessageInput,
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<SendChatMessageResponse> {
    const userId = context.req?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const safeUserId: string = userId;

    let message: ChatMessage;

    if (input.role === 'USER') {
      message = await this.chatMessagesService.createUserMessage(
        input.sessionId,
        safeUserId,
        { content: input.content, type: input.type },
      );
    } else {
      message = await this.chatMessagesService.createAssistantMessage(
        input.sessionId,
        safeUserId,
        {
          content: input.content,
          type: input.type,
          citations: input.citations,
          metadata: input.metadata,
        },
      );
    }

    return {
      messageId: message.messageId,
      sessionId: message.sessionId,
      role: message.role,
      type: message.type,
      content: message.content,
      sequenceOrder: message.sequenceOrder,
      createdAt: message.createdAt.toISOString(),
    };
  }

  /**
   * Mutation: Update clarification answered status
   *
   * Marks a clarification message as answered and optionally stores the user's answers.
   * This is called when the user submits answers to clarification questions.
   *
   * @example
   * ```graphql
   * mutation {
   *   updateClarificationStatus(input: {
   *     messageId: "message-uuid"
   *     answered: true
   *     answers: "{\"When did the employment end?\":\"2024-01-15\"}"
   *   }) {
   *     success
   *     messageId
   *     status
   *   }
   * }
   * ```
   */
  @Mutation(() => UpdateClarificationStatusResponse, {
    name: 'updateClarificationStatus',
    description: 'Update the answered status of a clarification message',
  })
  async updateClarificationStatus(
    @Args('input') input: UpdateClarificationStatusInput,
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<UpdateClarificationStatusResponse> {
    const userId = context.req?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const safeUserId: string = userId;

    try {
      const message = await this.chatMessagesService.updateClarificationStatus(
        input.messageId,
        safeUserId,
        input.answered,
        input.answers,
      );

      return {
        success: true,
        messageId: message.messageId,
        status: input.answered ? 'answered' : 'pending',
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundException') {
        throw error;
      }
      throw new Error(`Failed to update clarification status: ${error}`);
    }
  }

  /**
   * Validate clarification answers
   *
   * Checks that:
   * 1. All required questions are answered
   * 2. Answer formats match question types (OPTIONS must be one of the predefined options)
   *
   * @param questions - The clarification questions to validate against
   * @param answers - The user's answers
   * @returns Array of validation errors (empty if validation passes)
   */
  private validateClarificationAnswers(
    questions: any[],
    answers: { questionId: string; answer: string }[],
  ): ClarificationValidationError[] {
    const errors: ClarificationValidationError[] = [];
    const answersMap = new Map(answers.map((a) => [a.questionId, a.answer]));

    // Check for missing required questions and validate answer formats
    for (const question of questions) {
      const questionId = question.questionId || question.question;
      const isRequired = question.required !== false; // Default to true
      const questionType =
        question.questionType || question.question_type || 'TEXT';
      const options = question.options || [];

      if (isRequired && !answersMap.has(questionId)) {
        errors.push({
          questionId,
          message: `This question is required`,
          code: 'REQUIRED_QUESTION_MISSING',
        });
        continue;
      }

      // Validate answer format if present
      if (answersMap.has(questionId)) {
        const answer = answersMap.get(questionId);

        // For OPTIONS type, validate the answer is one of the predefined options
        if (questionType === 'OPTIONS' && options.length > 0) {
          const isOptionValid = options.some((opt: string) => opt === answer);
          if (!isOptionValid) {
            errors.push({
              questionId,
              message: `Answer must be one of the predefined options: ${options.join(', ')}`,
              code: 'INVALID_OPTION',
            });
          }
        }

        // Check for empty answers
        if (!answer || answer.trim().length === 0) {
          errors.push({
            questionId,
            message: `Answer cannot be empty`,
            code: 'EMPTY_ANSWER',
          });
        }
      }
    }

    // Check for unknown question IDs in answers
    const validQuestionIds = new Set(
      questions.map((q) => q.questionId || q.question),
    );
    for (const answer of answers) {
      if (!validQuestionIds.has(answer.questionId)) {
        errors.push({
          questionId: answer.questionId,
          message: `Unknown question ID`,
          code: 'UNKNOWN_QUESTION_ID',
        });
      }
    }

    return errors;
  }

  /**
   * Mutation: Submit clarification answers
   *
   * Creates a new user message with the clarification answers and marks the clarification as answered.
   * This ensures the user's answers are persisted to the database and survive page refreshes.
   *
   * The user message contains:
   * - content: JSON string with type 'clarification_answer' and the answers array
   * - metadata: contains the original questions for reference
   *
   * @example
   * ```graphql
   * mutation {
   *   submitClarificationAnswers(input: {
   *     sessionId: "session-uuid"
   *     clarificationMessageId: "message-uuid"
   *     answers: [
   *       { question: "When did the employment end?", answer: "2024-01-15", question_type: "timeline" }
   *     ]
   *   }) {
   *     success
   *     userMessage {
   *       id
   *       content
   *       role
   *       sequenceOrder
   *     }
   *     clarificationMessageId
   *   }
   * }
   * ```
   */
  @Mutation(() => SubmitClarificationAnswersResponse, {
    name: 'submitClarificationAnswers',
    description:
      'Submit answers to clarification questions. Validates answers and creates a user message.',
  })
  @UseGuards(ChatSessionOwnershipGuard)
  async submitClarificationAnswers(
    @Args('input') input: SubmitClarificationAnswersInput,
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<SubmitClarificationAnswersResponse> {
    const userId = context.req?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const safeUserId: string = userId;

    try {
      // First, get the clarification message to extract the original questions
      const clarificationMessage =
        await this.chatMessagesService.getMessageById(
          input.clarificationMessageId,
          safeUserId,
        );

      if (!clarificationMessage) {
        return {
          success: false,
          userMessage: null,
          clarificationMessageId: input.clarificationMessageId,
          validationErrors: [
            {
              questionId: '',
              message: 'Clarification message not found',
              code: 'MESSAGE_NOT_FOUND',
            },
          ],
        };
      }

      const clarificationInfo = clarificationMessage.metadata?.clarification;
      if (!clarificationInfo || !clarificationInfo.questions) {
        return {
          success: false,
          userMessage: null,
          clarificationMessageId: input.clarificationMessageId,
          validationErrors: [
            {
              questionId: '',
              message: 'Message does not contain clarification questions',
              code: 'NO_QUESTIONS_FOUND',
            },
          ],
        };
      }

      // Validate answers against questions
      const validationErrors = this.validateClarificationAnswers(
        clarificationInfo.questions,
        input.answers,
      );

      if (validationErrors.length > 0) {
        console.log(
          `[submitClarificationAnswers] Validation failed | errors=${JSON.stringify(validationErrors)}`,
        );
        return {
          success: false,
          userMessage: null,
          clarificationMessageId: input.clarificationMessageId,
          validationErrors,
        };
      }

      // Build answers with question text for reference
      const questionsMap = new Map(
        clarificationInfo.questions.map((q: any) => [
          q.questionId || q.question,
          q,
        ]),
      );

      // Create the answer content as structured JSON
      const enrichedAnswers = input.answers.map((a) => {
        const question = questionsMap.get(a.questionId);
        return {
          questionId: a.questionId,
          question: question?.question || a.questionId,
          answer: a.answer,
          question_type:
            question?.question_type || question?.questionType || 'text',
        };
      });

      const answerContent = JSON.stringify({
        type: 'clarification_answer',
        answers: enrichedAnswers,
      });

      // Create a user message with the answers
      const userMessage = await this.chatMessagesService.createUserMessage(
        input.sessionId,
        safeUserId,
        {
          content: answerContent,
        },
      );

      // Update the message's metadata to include the clarification message ID
      // This allows the frontend to link the answers to the correct clarification message
      await this.chatMessagesService.updateMessageMetadata(
        userMessage.messageId,
        {
          custom: {
            clarification_answers: {
              clarification_message_id: input.clarificationMessageId,
              answered_at: new Date().toISOString(),
            },
          },
        },
      );

      // Update the clarification message's answered status
      await this.chatMessagesService.updateClarificationStatus(
        input.clarificationMessageId,
        safeUserId,
        true,
        JSON.stringify(
          input.answers.reduce(
            (acc, a) => ({ ...acc, [a.questionId]: a.answer }),
            {},
          ),
        ),
      );

      console.log(
        `[submitClarificationAnswers] Created answer message | sessionId=${input.sessionId} | messageId=${userMessage.messageId} | answersCount=${input.answers.length}`,
      );

      return {
        success: true,
        userMessage: {
          messageId: userMessage.messageId,
          sessionId: userMessage.sessionId,
          role: userMessage.role,
          type: userMessage.type,
          content: userMessage.content,
          sequenceOrder: userMessage.sequenceOrder,
          createdAt: userMessage.createdAt.toISOString(),
        },
        clarificationMessageId: input.clarificationMessageId,
        validationErrors: null,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundException') {
        throw error;
      }
      throw new Error(`Failed to submit clarification answers: ${error}`);
    }
  }
}
