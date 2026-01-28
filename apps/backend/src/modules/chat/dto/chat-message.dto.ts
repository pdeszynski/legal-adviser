import { InputType, Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ChatCitationType } from '../entities/chat-session.entity';
import { ChatMessageMetadataType } from '../entities/chat-message.entity';

/**
 * Input type for ChatCitation
 */
@InputType('ChatCitationInput')
export class ChatCitationInput {
  @Field(() => String)
  source: string;

  @Field(() => String, { nullable: true })
  article?: string;

  @Field(() => String, { nullable: true })
  url?: string;

  @Field(() => String, { nullable: true })
  excerpt?: string;
}

/**
 * GraphQL Object Type for Chat Message Metadata (input variant)
 *
 * IMPORTANT: This class must be declared before CreateAssistantMessageInput
 * and SaveChatMessageInput to avoid temporal dead zone errors at runtime.
 * See CLAUDE.md "TypeScript Input/Output Type Declaration Order" section.
 */
@InputType('ChatMessageMetadataInput')
export class ChatMessageMetadataInput {
  @Field(() => Number, {
    nullable: true,
    description: 'Confidence score of AI response (0-1)',
  })
  @IsOptional()
  confidence?: number;

  @Field(() => String, {
    nullable: true,
    description: 'Model used for generation (e.g., gpt-4o)',
  })
  @IsOptional()
  model?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Query type classification',
  })
  @IsOptional()
  queryType?: string;

  @Field(() => [String], {
    nullable: true,
    description: 'Key legal terms extracted',
  })
  @IsOptional()
  @IsArray()
  keyTerms?: string[];

  @Field(() => String, {
    nullable: true,
    description: 'Language detected',
  })
  @IsOptional()
  language?: string;
}

/**
 * Input for creating a chat message
 *
 * Used for user messages which only contain content.
 * Assistant messages use CreateAssistantMessageInput which includes citations and metadata.
 */
@InputType('CreateChatMessageInput')
export class CreateChatMessageInput {
  @Field(() => String, {
    description: 'Message content (user question or AI response)',
  })
  @IsString()
  content: string;
}

/**
 * Input for creating an assistant message with metadata
 *
 * Used for AI responses which include citations and additional metadata.
 */
@InputType('CreateAssistantMessageInput')
export class CreateAssistantMessageInput {
  @Field(() => String, {
    description: 'AI response content (markdown formatted)',
  })
  @IsString()
  content: string;

  @Field(() => [ChatCitationInput], {
    nullable: true,
    description: 'Legal citations/references in the response',
  })
  @IsOptional()
  @IsArray()
  citations?: ChatCitationInput[];

  @Field(() => ChatMessageMetadataInput, {
    nullable: true,
    description: 'Additional metadata (confidence, query type, etc.)',
  })
  @IsOptional()
  @ValidateNested()
  metadata?: ChatMessageMetadataInput;
}

/**
 * Response type for sendChatMessage mutation
 *
 * Returns the created message along with session information.
 */
@ObjectType('SendChatMessageResponse')
export class SendChatMessageResponse {
  @Field(() => ID, {
    description: 'The created message ID',
  })
  messageId: string;

  @Field(() => ID, {
    description: 'The session ID',
  })
  sessionId: string;

  @Field(() => String, {
    description: 'Message role (USER or ASSISTANT)',
  })
  role: string;

  @Field(() => String, {
    description: 'Message content',
  })
  content: string;

  @Field(() => Number, {
    description: 'Sequence order in the conversation',
  })
  sequenceOrder: number;

  @Field(() => String, {
    description: 'Timestamp when the message was created',
  })
  createdAt: string;
}

/**
 * Response type for sendChatMessageWithAI mutation
 *
 * Returns both the user message and the AI response.
 */
@ObjectType('SendChatMessageWithAIResponse')
export class SendChatMessageWithAIResponse {
  @Field(() => SendChatMessageResponse, {
    description: 'The user message that was sent',
  })
  userMessage: SendChatMessageResponse;

  @Field(() => SendChatMessageResponse, {
    nullable: true,
    description: 'The AI assistant response',
  })
  assistantMessage: SendChatMessageResponse | null;

  @Field(() => ID, {
    description: 'The session ID',
  })
  sessionId: string;

  @Field(() => String, {
    nullable: true,
    description: 'AI response content (for streaming compatibility)',
  })
  answerMarkdown?: string | null;

  @Field(() => [ChatCitationType], {
    nullable: true,
    description: 'Citations from the AI response',
  })
  citations?: ChatCitationType[] | null;

  @Field(() => String, {
    nullable: true,
    description: 'Query type classification',
  })
  queryType?: string | null;

  @Field(() => [String], {
    nullable: true,
    description: 'Key legal terms extracted',
  })
  keyTerms?: string[] | null;

  @Field(() => Number, {
    nullable: true,
    description: 'Confidence score of the AI response',
  })
  confidence?: number | null;
}

/**
 * Input for sending a chat message with AI response
 *
 * Combines user message creation with AI processing.
 */
@InputType('SendChatMessageWithAIInput')
export class SendChatMessageWithAIInput {
  @Field(() => String, {
    description: 'The user question/message',
  })
  @IsString()
  question: string;

  @Field(() => String, {
    description: 'AI response mode (LAWYER or SIMPLE)',
  })
  @IsString()
  mode: string;

  @Field(() => ID, {
    nullable: true,
    description: 'Session ID (creates new session if not provided)',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

/**
 * Input for saving a chat message
 *
 * Used by the frontend to save messages after streaming completes.
 * The streaming endpoint returns the response directly, but we still
 * need to persist it to the database.
 */
@InputType('SaveChatMessageInput')
export class SaveChatMessageInput {
  @Field(() => ID, {
    description: 'The session ID',
  })
  @IsString()
  sessionId: string;

  @Field(() => String, {
    description: 'Message content',
  })
  @IsString()
  content: string;

  @Field(() => String, {
    description: 'Message role (USER or ASSISTANT)',
  })
  @IsString()
  role: string;

  @Field(() => [ChatCitationInput], {
    nullable: true,
    description: 'Citations (for assistant messages)',
  })
  @IsOptional()
  @IsArray()
  citations?: ChatCitationInput[];

  @Field(() => ChatMessageMetadataInput, {
    nullable: true,
    description: 'Additional metadata (for assistant messages)',
  })
  @IsOptional()
  @ValidateNested()
  metadata?: ChatMessageMetadataInput;
}
