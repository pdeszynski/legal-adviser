import {
  InputType,
  Field,
  ID,
  Int,
  ArgsType,
  ObjectType,
  GraphQLISODateTime,
} from '@nestjs/graphql';
import { ChatMode } from '../entities/chat-session.entity';
import { MessageRole } from '../entities/chat-message.entity';

/**
 * Input for full-text search across chat messages
 */
@ArgsType()
export class ChatContentSearchArgs {
  @Field(() => String, {
    description: 'Search query for full-text search in message content',
  })
  query: string;

  @Field(() => ID, {
    nullable: true,
    description: 'User ID to filter messages (defaults to authenticated user)',
  })
  userId?: string;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 20,
    description: 'Number of results to return',
  })
  limit?: number;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 0,
    description: 'Number of results to skip',
  })
  offset?: number;

  @Field(() => ChatMode, {
    nullable: true,
    description: 'Filter by AI mode',
  })
  mode?: ChatMode;

  @Field(() => MessageRole, {
    nullable: true,
    description: 'Filter by message role (USER, ASSISTANT, SYSTEM)',
  })
  role?: MessageRole;

  @Field(() => String, {
    nullable: true,
    description: 'Filter by session title',
  })
  sessionTitle?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Date range start (ISO 8601 format)',
  })
  dateFrom?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Date range end (ISO 8601 format)',
  })
  dateTo?: string;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 150,
    description: 'Context window: number of characters before/after match',
  })
  contextLength?: number;
}

/**
 * Search result with highlighted matching text
 */
@ObjectType('ChatContentSearchResult')
export class ChatContentSearchResult {
  @Field(() => ID, {
    description: 'Message ID',
  })
  messageId: string;

  @Field(() => ID, {
    description: 'Session ID',
  })
  sessionId: string;

  @Field(() => String, {
    nullable: true,
    description: 'Session title',
  })
  sessionTitle: string | null;

  @Field(() => ChatMode, {
    description: 'AI mode of the session',
  })
  sessionMode: ChatMode;

  @Field(() => MessageRole, {
    description: 'Role of the message sender',
  })
  role: MessageRole;

  @Field(() => String, {
    description: 'Message content with highlighted matching text',
  })
  highlightedContent: string;

  @Field(() => String, {
    description: 'Original message content',
  })
  content: string;

  @Field(() => String, {
    nullable: true,
    description: 'Context preview with highlighted match',
  })
  contextPreview: string | null;

  @Field(() => Number, {
    description: 'Relevance ranking score (higher is more relevant)',
  })
  rank: number;

  @Field(() => [String], {
    description: 'List of matched terms',
  })
  matchedTerms: string[];

  @Field(() => GraphQLISODateTime, {
    description: 'Message creation timestamp',
  })
  createdAt: Date;

  @Field(() => Number, {
    description: 'Sequence order in the session',
  })
  sequenceOrder: number;

  @Field(() => Int, {
    description: 'Total number of messages in the session',
  })
  sessionMessageCount: number;
}

/**
 * Response type for full-text search
 */
@ObjectType('ChatContentSearchResponse')
export class ChatContentSearchResponse {
  @Field(() => [ChatContentSearchResult], {
    description: 'List of search results',
  })
  results: ChatContentSearchResult[];

  @Field(() => Int, {
    description: 'Total count of matching messages',
  })
  totalCount: number;

  @Field(() => Int, {
    description: 'Number of results returned',
  })
  count: number;

  @Field(() => Int, {
    description: 'Current offset',
  })
  offset: number;

  @Field(() => Boolean, {
    description: 'Whether there are more results',
  })
  hasMore: boolean;
}
