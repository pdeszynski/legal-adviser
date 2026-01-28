import { InputType, Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
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
 * Input type for Clarification Question
 */
@InputType('ClarificationQuestionInput')
export class ClarificationQuestionInput {
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
 * Input type for Clarification Info
 */
@InputType('ClarificationInfoInput')
export class ClarificationInfoInput {
  @Field(() => Boolean)
  needs_clarification: boolean;

  @Field(() => [ClarificationQuestionInput])
  questions: ClarificationQuestionInput[];

  @Field(() => String)
  context_summary: string;

  @Field(() => String)
  next_steps: string;

  @Field(() => Number, { nullable: true })
  currentRound?: number;

  @Field(() => Number, { nullable: true })
  totalRounds?: number;

  @Field(() => Boolean, { nullable: true })
  answered?: boolean;
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

  @Field(() => ClarificationInfoInput, {
    nullable: true,
    description: 'Clarification data for messages that need clarification',
  })
  @IsOptional()
  @ValidateNested()
  clarification?: ClarificationInfoInput;
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
  @IsNotEmpty()
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
  @IsNotEmpty()
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
  @IsNotEmpty()
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

/**
 * Role distribution in conversation history
 */
@ObjectType('ConversationRoleDistribution')
export class ConversationRoleDistribution {
  @Field(() => Number, {
    description: 'Number of user messages',
  })
  user: number;

  @Field(() => Number, {
    description: 'Number of assistant messages',
  })
  assistant: number;
}

/**
 * Message preview for debug output
 */
@ObjectType('ConversationMessagePreview')
export class ConversationMessagePreview {
  @Field(() => String, {
    description: 'Message ID',
  })
  messageId: string;

  @Field(() => String, {
    description: 'Message role (USER or ASSISTANT)',
  })
  role: string;

  @Field(() => String, {
    description: 'Full message content',
  })
  content: string;

  @Field(() => String, {
    description: 'Content preview (first 100 chars)',
  })
  contentPreview: string;

  @Field(() => Number, {
    description: 'Sequence order in conversation',
  })
  sequenceOrder: number;

  @Field(() => String, {
    description: 'Creation timestamp',
  })
  createdAt: string;
}

/**
 * AI Engine format message (role + content)
 */
@ObjectType('AIEngineMessageFormat')
export class AIEngineMessageFormat {
  @Field(() => String, {
    description: 'Message role (user or assistant)',
  })
  role: string;

  @Field(() => String, {
    description: 'Message content',
  })
  content: string;
}

/**
 * Verification info for conversation history
 */
@ObjectType('ConversationHistoryVerification')
export class ConversationHistoryVerification {
  @Field(() => Boolean, {
    description: 'Whether message order is valid',
  })
  orderValid: boolean;

  @Field(() => Boolean, {
    description: 'Whether any messages have empty content',
  })
  hasEmptyContent: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'First message role',
  })
  firstRole: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Last message role',
  })
  lastRole: string | null;

  @Field(() => Boolean, {
    description: 'Whether message count matches between different queries',
  })
  messageCountMatches: boolean;
}

/**
 * Input for updating clarification answered status
 *
 * Used when user submits answers to clarification questions.
 */
@InputType('UpdateClarificationStatusInput')
export class UpdateClarificationStatusInput {
  @Field(() => ID, {
    description: 'The message ID containing the clarification',
  })
  @IsString()
  messageId: string;

  @Field(() => Boolean, {
    description: 'Whether the clarification has been answered',
  })
  answered: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'JSON string of question-answer pairs',
  })
  @IsOptional()
  answers?: string;
}

/**
 * Response type for updating clarification status
 */
@ObjectType('UpdateClarificationStatusResponse')
export class UpdateClarificationStatusResponse {
  @Field(() => Boolean, {
    description: 'Whether the update was successful',
  })
  success: boolean;

  @Field(() => ID, {
    description: 'The message ID that was updated',
  })
  messageId: string;

  @Field(() => String, {
    nullable: true,
    description: 'The updated clarification status',
  })
  status?: string | null;
}

/**
 * Debug info for conversation history
 *
 * Returned by the debugConversationHistory query to help
 * troubleshoot conversation history flow issues.
 */
@ObjectType('ChatSessionDebugInfo')
export class ChatSessionDebugInfo {
  @Field(() => String, {
    description: 'Session ID',
  })
  sessionId: string;

  @Field(() => Number, {
    description: 'Total number of messages in history',
  })
  messageCount: number;

  @Field(() => Number, {
    description: 'Total characters across all messages',
  })
  totalCharacters: number;

  @Field(() => ConversationRoleDistribution, {
    description: 'Role distribution in conversation',
  })
  roleDistribution: ConversationRoleDistribution;

  @Field(() => [ConversationMessagePreview], {
    description: 'Message previews with full details',
  })
  messages: ConversationMessagePreview[];

  @Field(() => [AIEngineMessageFormat], {
    description: 'Messages in AI Engine format (what gets sent to AI)',
  })
  aiEngineFormat: AIEngineMessageFormat[];

  @Field(() => ConversationHistoryVerification, {
    description: 'Verification information',
  })
  verification: ConversationHistoryVerification;
}
