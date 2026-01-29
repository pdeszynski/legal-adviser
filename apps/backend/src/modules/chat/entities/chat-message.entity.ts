import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import {
  FilterableField,
  IDField,
  QueryOptions,
  Relation,
} from '@ptc-org/nestjs-query-graphql';
import {
  ObjectType,
  ID,
  Field,
  GraphQLISODateTime,
  registerEnumType,
} from '@nestjs/graphql';
import { ChatSession, ChatCitation } from './chat-session.entity';

/**
 * Message Role Enum
 *
 * Defines the role of the message sender.
 */
export enum MessageRole {
  /** Message from the user */
  USER = 'user',
  /** Message from the AI assistant */
  ASSISTANT = 'assistant',
  /** System message (metadata, notifications, etc.) */
  SYSTEM = 'system',
}

registerEnumType(MessageRole, {
  name: 'MessageRole',
  description: 'The role of the message sender',
});

/**
 * Message Type Enum
 *
 * Distinguishes between different message types for proper rendering.
 * This eliminates the need for frontend JSON parsing and defensive programming.
 */
export enum ChatMessageType {
  /** Standard text message */
  TEXT = 'text',
  /** Clarification questions from AI */
  CLARIFICATION_QUESTION = 'clarification_question',
  /** User's answers to clarification questions */
  CLARIFICATION_ANSWER = 'clarification_answer',
  /** Message containing citation references */
  CITATION = 'citation',
  /** Error message */
  ERROR = 'error',
}

registerEnumType(ChatMessageType, {
  name: 'ChatMessageType',
  description: 'The type of message content',
});

/**
 * Clarification Question Interface
 *
 * Represents a single clarification question in a message.
 * Supports both legacy format (question text) and new format (questionId).
 */
export interface ClarificationQuestion {
  /** Unique identifier for the question (new format) */
  questionId?: string;
  /** The question text */
  question: string;
  /** Question type (timeline, parties, documents, amounts, jurisdiction, etc.) */
  question_type?: string;
  /** Question type enum (TEXT, OPTIONS, DATE) - new format */
  questionType?: string;
  /** Optional predefined choices for the user */
  options?: string[];
  /** Optional help text for users */
  hint?: string;
  /** Whether this question is required (new format) */
  required?: boolean;
}

/**
 * Clarification Info Interface
 *
 * Represents clarification data stored in a message metadata.
 */
export interface ClarificationInfo {
  /** Whether clarification is needed */
  needs_clarification: boolean;
  /** Array of clarification questions */
  questions: ClarificationQuestion[];
  /** Context summary for the user */
  context_summary: string;
  /** Next steps guidance */
  next_steps: string;
  /** Current round in multi-turn clarification */
  currentRound?: number;
  /** Total rounds in multi-turn clarification */
  totalRounds?: number;
  /** Whether this clarification has been answered */
  answered?: boolean;
}

/**
 * Chat Message Metadata Interface
 *
 * Additional data stored with each message for analytics and debugging.
 */
export interface ChatMessageMetadata {
  /** Confidence score of AI response (0-1) */
  confidence?: number;
  /** Model used for generation (e.g., 'gpt-4o') */
  model?: string;
  /** Token usage information */
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  /** Processing time in milliseconds */
  processingTimeMs?: number;
  /** Query type classification */
  queryType?: string;
  /** Key legal terms extracted */
  keyTerms?: string[];
  /** Language detected */
  language?: string;
  /** Clarification data for messages that need clarification */
  clarification?: ClarificationInfo;
  /** Custom metadata for extensions */
  custom?: Record<string, unknown>;
}

/**
 * GraphQL Object Type for Clarification Question
 */
@ObjectType('ClarificationQuestionType')
export class ClarificationQuestionType {
  @Field(() => String, { nullable: true })
  questionId?: string;

  @Field(() => String)
  question: string;

  @Field(() => String, { nullable: true })
  question_type?: string;

  @Field(() => String, { nullable: true })
  questionType?: string;

  @Field(() => [String], { nullable: true })
  options?: string[];

  @Field(() => String, { nullable: true })
  hint?: string;

  @Field(() => Boolean, { nullable: true })
  required?: boolean;
}

/**
 * GraphQL Object Type for Clarification Info
 */
@ObjectType('ClarificationInfoType')
export class ClarificationInfoType {
  @Field(() => Boolean)
  needs_clarification: boolean;

  @Field(() => [ClarificationQuestionType])
  questions: ClarificationQuestion[];

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
 * GraphQL Object Type for Chat Message Metadata
 */
@ObjectType('ChatMessageMetadata')
export class ChatMessageMetadataType {
  @Field(() => Number, { nullable: true })
  confidence?: number;

  @Field(() => String, { nullable: true })
  model?: string;

  @Field(() => String, { nullable: true })
  queryType?: string;

  @Field(() => [String], { nullable: true })
  keyTerms?: string[];

  @Field(() => String, { nullable: true })
  language?: string;

  @Field(() => ClarificationInfoType, { nullable: true })
  clarification?: ClarificationInfo;
}

/**
 * GraphQL Object Type for Citation (reusing from ChatSession)
 * Importing the type from chat-session.entity
 */
import { ChatCitationType } from './chat-session.entity';

/**
 * Chat Message Entity
 *
 * Represents an individual message within a chat session.
 * Stores the message content, role, citations, and metadata.
 *
 * Aggregate Root: ChatMessage (belongs to ChatSession aggregate)
 * Invariants:
 *   - A message must belong to a session
 *   - Messages have a defined sequence order
 *   - Cascade delete when ChatSession is deleted
 *
 * Uses nestjs-query decorators for auto-generated CRUD resolvers.
 */
@Entity('chat_messages')
@ObjectType('ChatMessage')
@QueryOptions({ enableTotalCount: true })
@Relation('session', () => ChatSession)
@Index(['sessionId'])
@Index(['sessionId', 'sequenceOrder'])
@Index(['role'])
@Index(['createdAt'])
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  messageId: string;

  /**
   * Reference to the chat session this message belongs to
   */
  @Column({ type: 'uuid' })
  @FilterableField(() => ID, {
    description: 'ID of the chat session this message belongs to',
  })
  sessionId: string;

  @ManyToOne(() => ChatSession, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'sessionId' })
  session: ChatSession;

  /**
   * Role of the message sender
   */
  @Column({
    type: 'enum',
    enum: MessageRole,
    default: MessageRole.USER,
  })
  @FilterableField(() => MessageRole, {
    description: 'Role of the message sender',
  })
  role: MessageRole;

  /**
   * Type of message content
   * Distinguishes between TEXT, CLARIFICATION_QUESTION, CLARIFICATION_ANSWER, CITATION, ERROR
   * This field helps the frontend render messages correctly without JSON parsing
   */
  @Column({
    type: 'enum',
    enum: ChatMessageType,
    default: ChatMessageType.TEXT,
    nullable: true, // Nullable for backward compatibility with existing data
  })
  @FilterableField(() => ChatMessageType, {
    description: 'Type of message content',
    nullable: true,
  })
  type: ChatMessageType | null;

  /**
   * Processed message content (after AI processing, markdown formatted)
   * For user messages: the original question
   * For assistant messages: the formatted answer
   */
  @Column({ type: 'text' })
  @FilterableField(() => String, {
    description: 'Message content (markdown for assistant responses)',
  })
  content: string;

  /**
   * Original raw content before AI processing
   * Stores the exact user input or unmodified AI response
   */
  @Column({ type: 'text', nullable: true })
  @Field(() => String, {
    nullable: true,
    description: 'Original content before AI processing',
  })
  rawContent: string | null;

  /**
   * Citations/references for assistant messages
   * Stored as JSONB for flexible querying and structured rendering
   */
  @Column({ type: 'jsonb', nullable: true, default: [] })
  @Field(() => [ChatCitationType], {
    nullable: true,
    description: 'Legal citations/references in assistant responses',
  })
  citations: ChatCitation[] | null;

  /**
   * Additional metadata for analytics and debugging
   * Includes confidence scores, model info, token usage, etc.
   */
  @Column({ type: 'jsonb', nullable: true })
  @Field(() => ChatMessageMetadataType, {
    nullable: true,
    description: 'Additional message metadata',
  })
  metadata: ChatMessageMetadata | null;

  /**
   * Sequence order of the message within the session
   * Ensures proper message ordering when retrieving history
   */
  @Column({ type: 'int' })
  @FilterableField(() => Number, {
    description: 'Sequence order of the message within the session',
  })
  sequenceOrder: number;

  /**
   * Timestamp when the message was created
   */
  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  /**
   * Check if this is a user message
   */
  isUserMessage(): boolean {
    return this.role === MessageRole.USER;
  }

  /**
   * Check if this is an assistant message
   */
  isAssistantMessage(): boolean {
    return this.role === MessageRole.ASSISTANT;
  }

  /**
   * Check if this is a system message
   */
  isSystemMessage(): boolean {
    return this.role === MessageRole.SYSTEM;
  }

  /**
   * Check if this is a text message
   */
  isTextMessage(): boolean {
    return this.type === ChatMessageType.TEXT || this.type === null;
  }

  /**
   * Check if this is a clarification question message
   */
  isClarificationQuestion(): boolean {
    return this.type === ChatMessageType.CLARIFICATION_QUESTION;
  }

  /**
   * Check if this is a clarification answer message
   */
  isClarificationAnswer(): boolean {
    return this.type === ChatMessageType.CLARIFICATION_ANSWER;
  }

  /**
   * Check if this is a citation message
   */
  isCitationMessage(): boolean {
    return this.type === ChatMessageType.CITATION;
  }

  /**
   * Check if this is an error message
   */
  isErrorMessage(): boolean {
    return this.type === ChatMessageType.ERROR;
  }

  /**
   * Set the message type
   */
  setType(type: ChatMessageType): void {
    this.type = type;
  }

  /**
   * Check if the message has citations
   */
  hasCitations(): boolean {
    return this.citations !== null && this.citations.length > 0;
  }

  /**
   * Get the number of citations
   */
  getCitationCount(): number {
    return this.citations?.length ?? 0;
  }

  /**
   * Add a citation to the message
   */
  addCitation(citation: ChatCitation): void {
    if (!this.citations) {
      this.citations = [];
    }
    this.citations.push(citation);
  }

  /**
   * Set citations for the message
   */
  setCitations(citations: ChatCitation[]): void {
    this.citations = citations;
  }

  /**
   * Update metadata
   */
  updateMetadata(metadata: Partial<ChatMessageMetadata>): void {
    this.metadata = {
      ...this.metadata,
      ...metadata,
    };
  }

  /**
   * Get confidence score from metadata
   */
  getConfidence(): number | null {
    return this.metadata?.confidence ?? null;
  }

  /**
   * Get model name from metadata
   */
  getModel(): string | null {
    return this.metadata?.model ?? null;
  }

  /**
   * Get token usage from metadata
   */
  getTokenUsage(): ChatMessageMetadata['tokenUsage'] | null {
    return this.metadata?.tokenUsage ?? null;
  }
}
