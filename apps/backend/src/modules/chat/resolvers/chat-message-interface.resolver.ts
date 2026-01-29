import {
  Resolver,
  Query,
  Args,
  Context,
  Parent,
  ResolveField,
  ID,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../../auth/guards';
import { ChatMessagesService } from '../services/chat-messages.service';
import {
  ChatMessageInterface,
  TextChatMessage,
  ClarificationQuestionMessage,
  ClarificationAnswerMessage,
  CitationMessage,
  ClarificationQuestionItemType,
  ClarificationAnswerItemType,
} from '../dto/chat-message-interface.dto';
import { ChatMessageType } from '../entities/chat-message.entity';
import { ChatCitationType } from '../entities/chat-session.entity';

/**
 * Resolver for ChatMessageInterface
 *
 * This resolver provides:
 * 1. A query to get messages as the interface type with proper concrete type resolution
 * 2. ResolveField methods to add type-specific fields that aren't in the base entity
 *
 * The interface pattern allows GraphQL to return different concrete types
 * (TextChatMessage, ClarificationQuestionMessage, etc.) based on the `type` field.
 */
@Resolver(() => ChatMessageInterface)
@UseGuards(GqlAuthGuard)
export class ChatMessageInterfaceResolver {
  constructor(private readonly chatMessagesService: ChatMessagesService) {}

  /**
   * Query: Get chat messages by session ID with proper type resolution
   *
   * Returns messages that implement ChatMessageInterface, resolving to the
   * correct concrete type based on the `type` field.
   *
   * @example
   * ```graphql
   * query {
   *   chatMessagesBySession(sessionId: "uuid") {
   *     messageId
   *     role
   *     content
   *     type
   *     ... on TextChatMessage {
   *       citations { source article }
   *     }
   *     ... on ClarificationQuestionMessage {
   *       questions { question question_type }
   *       context_summary
   *       next_steps
   *     }
   *     ... on ClarificationAnswerMessage {
   *       answers { question answer }
   *       clarificationMessageId
   *     }
   *     ... on CitationMessage {
   *       citations { source article }
   *       citationCount
   *       confidence
   *     }
   *   }
   * }
   * ```
   */
  @Query(() => [ChatMessageInterface], {
    name: 'chatMessagesBySession',
    description:
      'Get chat messages for a session with proper type resolution based on message type',
  })
  async getChatMessagesBySession(
    @Args('sessionId', { type: () => ID }) sessionId: string,
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<Array<typeof ChatMessageInterface>> {
    const userId = context.req?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const messages = await this.chatMessagesService.getMessagesBySession(
      sessionId,
      userId as string,
    );

    // Transform each message to its corresponding concrete type
    return messages.map((message) => this.transformToConcreteType(message));
  }

  /**
   * Query: Get a single chat message by ID with proper type resolution
   */
  @Query(() => ChatMessageInterface, {
    name: 'chatMessageById',
    description: 'Get a single chat message by ID with proper type resolution',
    nullable: true,
  })
  async getChatMessageById(
    @Args('messageId', { type: () => ID }) messageId: string,
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<typeof ChatMessageInterface | null> {
    const userId = context.req?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const message = await this.chatMessagesService.getMessageById(
      messageId,
      userId as string,
    );

    if (!message) {
      return null;
    }

    return this.transformToConcreteType(message);
  }

  /**
   * Transform a ChatMessage entity to its concrete GraphQL type
   *
   * This method reads the `type` field and returns the appropriate
   * concrete type object with all required fields populated.
   */
  private transformToConcreteType(message: any): any {
    const baseFields = {
      messageId: message.messageId,
      sessionId: message.sessionId,
      role: message.role,
      type: message.type || 'text',
      content: message.content,
      sequenceOrder: message.sequenceOrder,
      createdAt: message.createdAt,
    };

    switch (message.type) {
      case ChatMessageType.CLARIFICATION_QUESTION: {
        const clarificationData = this.parseClarificationContent(
          message.content,
        );
        return {
          ...baseFields,
          type: ChatMessageType.CLARIFICATION_QUESTION,
          questions: clarificationData.questions || [],
          context_summary:
            clarificationData.context_summary ||
            message.metadata?.clarification?.context_summary ||
            '',
          next_steps:
            clarificationData.next_steps ||
            message.metadata?.clarification?.next_steps ||
            '',
          currentRound:
            clarificationData.currentRound ||
            message.metadata?.clarification?.currentRound ||
            null,
          totalRounds:
            clarificationData.totalRounds ||
            message.metadata?.clarification?.totalRounds ||
            null,
          answered:
            message.metadata?.clarification?.answered ||
            clarificationData.answered ||
            false,
        };
      }

      case ChatMessageType.CLARIFICATION_ANSWER: {
        const answerData = this.parseClarificationAnswerContent(
          message.content,
        );
        return {
          ...baseFields,
          type: ChatMessageType.CLARIFICATION_ANSWER,
          answers: answerData.answers || [],
          clarificationMessageId:
            message.metadata?.custom?.clarification_answers
              ?.clarification_message_id || null,
          answeredAt: message.metadata?.custom?.clarification_answers
            ?.answered_at
            ? new Date(
                message.metadata.custom.clarification_answers.answered_at,
              )
            : null,
        };
      }

      case ChatMessageType.CITATION: {
        return {
          ...baseFields,
          type: ChatMessageType.CITATION,
          citations: message.citations || [],
          citationCount: message.citations?.length || 0,
          queryType: message.metadata?.queryType || null,
          confidence: message.metadata?.confidence || null,
        };
      }

      case ChatMessageType.TEXT:
      default: {
        return {
          ...baseFields,
          type: ChatMessageType.TEXT,
          citations: message.citations || null,
        };
      }
    }
  }

  /**
   * Parse clarification content from JSON string
   *
   * Handles both JSON content and metadata-based clarification data
   */
  private parseClarificationContent(content: string): any {
    try {
      const parsed = JSON.parse(content);
      if (parsed.type === 'clarification') {
        return {
          questions:
            parsed.questions?.map((q: any) => ({
              question: q.question,
              question_type: q.question_type || q.questionType || 'text',
              options: q.options || null,
              hint: q.hint || null,
            })) || [],
          context_summary: parsed.context_summary || '',
          next_steps: parsed.next_steps || '',
          currentRound: parsed.currentRound || null,
          totalRounds: parsed.totalRounds || null,
          answered: parsed.answered || false,
        };
      }
    } catch {
      // Content is not JSON, return empty clarification data
    }
    return {
      questions: [],
      context_summary: '',
      next_steps: '',
      currentRound: null,
      totalRounds: null,
      answered: false,
    };
  }

  /**
   * Parse clarification answer content from JSON string
   */
  private parseClarificationAnswerContent(content: string): any {
    try {
      const parsed = JSON.parse(content);
      if (parsed.type === 'clarification_answer') {
        return {
          answers:
            parsed.answers?.map((a: any) => ({
              question: a.question,
              answer: a.answer,
              question_type: a.question_type || a.questionType || 'text',
            })) || [],
        };
      }
    } catch {
      // Content is not JSON, return empty answer data
    }
    return {
      answers: [],
    };
  }
}

/**
 * Field resolver for TextChatMessage
 *
 * Adds the citations field which is specific to text messages.
 */
@Resolver(() => TextChatMessage)
export class TextChatMessageResolver {
  @ResolveField('citations', () => [ChatCitationType], { nullable: true })
  getCitations(@Parent() parent: TextChatMessage): ChatCitationType[] | null {
    return (parent as any).citations || null;
  }
}

/**
 * Field resolver for ClarificationQuestionMessage
 *
 * Adds fields specific to clarification question messages.
 */
@Resolver(() => ClarificationQuestionMessage)
export class ClarificationQuestionMessageResolver {
  @ResolveField('questions', () => [ClarificationQuestionItemType])
  getQuestions(
    @Parent() parent: ClarificationQuestionMessage,
  ): ClarificationQuestionItemType[] {
    return (parent as any).questions || [];
  }

  @ResolveField('context_summary', () => String)
  getContextSummary(@Parent() parent: ClarificationQuestionMessage): string {
    return (parent as any).context_summary || '';
  }

  @ResolveField('next_steps', () => String)
  getNextSteps(@Parent() parent: ClarificationQuestionMessage): string {
    return (parent as any).next_steps || '';
  }
}

/**
 * Field resolver for ClarificationAnswerMessage
 *
 * Adds fields specific to clarification answer messages.
 */
@Resolver(() => ClarificationAnswerMessage)
export class ClarificationAnswerMessageResolver {
  @ResolveField('answers', () => [ClarificationAnswerItemType])
  getAnswers(
    @Parent() parent: ClarificationAnswerMessage,
  ): ClarificationAnswerItemType[] {
    return (parent as any).answers || [];
  }

  @ResolveField('clarificationMessageId', () => ID, { nullable: true })
  getClarificationMessageId(
    @Parent() parent: ClarificationAnswerMessage,
  ): string | null {
    return (parent as any).clarificationMessageId || null;
  }
}

/**
 * Field resolver for CitationMessage
 *
 * Adds fields specific to citation messages.
 */
@Resolver(() => CitationMessage)
export class CitationMessageResolver {
  @ResolveField('citations', () => [ChatCitationType])
  getCitations(@Parent() parent: CitationMessage): ChatCitationType[] {
    return (parent as any).citations || [];
  }

  @ResolveField('citationCount', () => Number)
  getCitationCount(@Parent() parent: CitationMessage): number {
    return (parent as any).citationCount || 0;
  }

  @ResolveField('queryType', () => String, { nullable: true })
  getQueryType(@Parent() parent: CitationMessage): string | null {
    return (parent as any).queryType || null;
  }

  @ResolveField('confidence', () => Number, { nullable: true })
  getConfidence(@Parent() parent: CitationMessage): number | null {
    return (parent as any).confidence || null;
  }
}
