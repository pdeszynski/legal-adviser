import {
  InterfaceType,
  ObjectType,
  Field,
  ID,
  registerEnumType,
} from '@nestjs/graphql';
import { MessageRole, ChatMessageType } from '../entities/chat-message.entity';
import { ChatCitationType } from '../entities/chat-session.entity';

// Ensure ChatMessageType is registered as a GraphQL enum
registerEnumType(ChatMessageType, {
  name: 'ChatMessageType',
  description: 'The type of message content',
});

/**
 * GraphQL Interface for Chat Messages
 *
 * This interface defines common fields shared across all chat message types.
 * Concrete types (TextChatMessage, ClarificationQuestionMessage, etc.) implement
 * this interface and provide type-specific fields.
 *
 * The `type` field serves as the discriminator for resolving the correct
 * concrete type at runtime via the resolveType method.
 *
 * See: apps/backend/src/modules/chat/resolvers/chat-message-interface.resolver.ts
 */
@InterfaceType('ChatMessageInterface', {
  resolveType: (value) => {
    // Runtime type resolution based on the `type` field
    switch (value?.type) {
      case ChatMessageType.CLARIFICATION_QUESTION:
        return 'ClarificationQuestionMessage';
      case ChatMessageType.CLARIFICATION_ANSWER:
        return 'ClarificationAnswerMessage';
      case ChatMessageType.CITATION:
        return 'CitationMessage';
      case ChatMessageType.TEXT:
      default:
        return 'TextChatMessage';
    }
  },
})
export class ChatMessageInterface {
  @Field(() => ID, { description: 'Unique message identifier' })
  messageId: string;

  @Field(() => ID, { description: 'Session ID' })
  sessionId: string;

  @Field(() => MessageRole, { description: 'Role of the message sender' })
  role: MessageRole;

  @Field(() => ChatMessageType, {
    description: 'Message type discriminator for resolving concrete types',
    nullable: true,
  })
  type: ChatMessageType | null;

  @Field(() => String, { description: 'Message content' })
  content: string;

  @Field(() => Number, { description: 'Sequence order in conversation' })
  sequenceOrder: number;

  @Field(() => Date, { description: 'Creation timestamp' })
  createdAt: Date;
}

/**
 * Leaf type for clarification questions - must be declared before composite types.
 * See CLAUDE.md "TypeScript Input/Output Type Declaration Order" section.
 */
@ObjectType('ClarificationQuestionItemType')
export class ClarificationQuestionItemType {
  @Field(() => String)
  question: string;

  @Field(() => String)
  question_type: string;

  @Field(() => [String], { nullable: true })
  options?: string[];

  @Field(() => String, { nullable: true })
  hint?: string;
}

/**
 * Leaf type for clarification answer - must be declared before composite types.
 * See CLAUDE.md "TypeScript Input/Output Type Declaration Order" section.
 */
@ObjectType('ClarificationAnswerItemType')
export class ClarificationAnswerItemType {
  @Field(() => String)
  question: string;

  @Field(() => String)
  answer: string;

  @Field(() => String, { nullable: true })
  question_type?: string;
}

/**
 * Concrete type for standard text messages
 *
 * Represents plain text messages from users or assistants.
 * This is the default message type when no special content is present.
 */
@ObjectType('TextChatMessage', {
  implements: ChatMessageInterface,
  description: 'Standard text message from user or assistant',
})
export class TextChatMessage extends ChatMessageInterface {
  @Field(() => [ChatCitationType], {
    nullable: true,
    description: 'Legal citations/references in the message',
  })
  citations?: ChatCitationType[] | null;
}

/**
 * Concrete type for clarification question messages
 *
 * Represents messages from the AI asking follow-up questions to better
 * understand the user's situation before providing a full legal response.
 */
@ObjectType('ClarificationQuestionMessage', {
  implements: ChatMessageInterface,
  description:
    'Message from AI asking follow-up clarification questions to the user',
})
export class ClarificationQuestionMessage extends ChatMessageInterface {
  @Field(() => [ClarificationQuestionItemType], {
    description: 'Clarification questions for the user',
  })
  questions: ClarificationQuestionItemType[];

  @Field(() => String, {
    description: 'Context summary for the user',
  })
  context_summary: string;

  @Field(() => String, {
    description: 'Next steps for the user',
  })
  next_steps: string;

  @Field(() => Number, {
    nullable: true,
    description: 'Current clarification round',
  })
  currentRound?: number | null;

  @Field(() => Number, {
    nullable: true,
    description: 'Total clarification rounds',
  })
  totalRounds?: number | null;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Whether the clarification has been answered',
  })
  answered?: boolean | null;
}

/**
 * Concrete type for clarification answer messages
 *
 * Represents user's answers to clarification questions.
 * These messages are created when users submit their responses.
 */
@ObjectType('ClarificationAnswerMessage', {
  implements: ChatMessageInterface,
  description: "User's answers to clarification questions",
})
export class ClarificationAnswerMessage extends ChatMessageInterface {
  @Field(() => [ClarificationAnswerItemType], {
    description: "User's answers to clarification questions",
  })
  answers: ClarificationAnswerItemType[];

  @Field(() => ID, {
    nullable: true,
    description: 'ID of the clarification message being answered',
  })
  clarificationMessageId?: string | null;

  @Field(() => Date, {
    nullable: true,
    description: 'When the answers were submitted',
  })
  answeredAt?: Date | null;
}

/**
 * Concrete type for citation messages
 *
 * Represents messages focused on legal citations and references.
 * Used when the primary content is citation information.
 */
@ObjectType('CitationMessage', {
  implements: ChatMessageInterface,
  description: 'Message focused on legal citations and references',
})
export class CitationMessage extends ChatMessageInterface {
  @Field(() => [ChatCitationType], {
    description: 'Legal citations/references',
  })
  citations: ChatCitationType[];

  @Field(() => Number, {
    description: 'Number of citations in this message',
  })
  citationCount: number;

  @Field(() => String, {
    nullable: true,
    description: 'Query type classification',
  })
  queryType?: string | null;

  @Field(() => Number, {
    nullable: true,
    description: 'Confidence score (0-1)',
  })
  confidence?: number | null;
}
