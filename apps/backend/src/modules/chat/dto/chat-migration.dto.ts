import { InputType, Field, ID, ObjectType, Int } from '@nestjs/graphql';
import { MessageRole } from '../entities/chat-message.entity';
import { ChatMode } from '../entities/chat-session.entity';

/**
 * Input for a single message during migration
 */
@InputType('MigrateChatMessageInput')
export class MigrateChatMessageInput {
  @Field(() => MessageRole, {
    description: 'Role of the message sender',
  })
  role: MessageRole;

  @Field(() => String, {
    description: 'Message content',
  })
  content: string;

  @Field(() => String, {
    nullable: true,
    description: 'Original content before AI processing',
  })
  rawContent?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'ISO timestamp of when the message was created',
  })
  timestamp?: string;
}

/**
 * Citation data for migration
 */
@InputType('MigrateChatCitationInput')
export class MigrateChatCitationInput {
  @Field(() => String, {
    description: 'Source of the citation',
  })
  source: string;

  @Field(() => String, {
    nullable: true,
    description: 'Article or section reference',
  })
  article?: string;

  @Field(() => String, {
    nullable: true,
    description: 'URL to the source document',
  })
  url?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Brief excerpt or description',
  })
  excerpt?: string;
}

/**
 * Extended message input with citations
 */
@InputType('MigrateChatMessageWithCitationsInput')
export class MigrateChatMessageWithCitationsInput extends MigrateChatMessageInput {
  @Field(() => [MigrateChatCitationInput], {
    nullable: true,
    description: 'Citations for assistant messages',
  })
  citations?: MigrateChatCitationInput[] | null;
}

/**
 * Input for migrating a single chat session from localStorage
 */
@InputType('MigrateChatSessionInput')
export class MigrateChatSessionInput {
  @Field(() => String, {
    description: 'Session ID from localStorage (UUID v4)',
  })
  sessionId: string;

  @Field(() => [MigrateChatMessageWithCitationsInput], {
    description: 'Messages to migrate',
  })
  messages: MigrateChatMessageWithCitationsInput[];

  @Field(() => String, {
    nullable: true,
    description: 'Optional title for the session',
  })
  title?: string | null;

  @Field(() => ChatMode, {
    description: 'AI mode used for this session',
    defaultValue: ChatMode.SIMPLE,
  })
  mode: ChatMode;
}

/**
 * Result of a single session migration
 */
@ObjectType('MigrateChatSessionResult')
export class MigrateChatSessionResult {
  @Field(() => ID, {
    description: 'The session ID in the database',
  })
  sessionId: string;

  @Field(() => Boolean, {
    description: 'Whether migration was successful',
  })
  success: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'Error message if migration failed',
  })
  error?: string | null;

  @Field(() => Int, {
    description: 'Number of messages migrated',
  })
  messageCount: number;
}

/**
 * Result of bulk chat migration
 */
@ObjectType('MigrateChatBulkResult')
export class MigrateChatBulkResult {
  @Field(() => [MigrateChatSessionResult], {
    description: 'Results for each session migration attempt',
  })
  results: MigrateChatSessionResult[];

  @Field(() => Int, {
    description: 'Total number of sessions processed',
  })
  totalProcessed: number;

  @Field(() => Int, {
    description: 'Number of successfully migrated sessions',
  })
  successfulCount: number;

  @Field(() => Int, {
    description: 'Number of failed migrations',
  })
  failedCount: number;

  @Field(() => Int, {
    description: 'Total number of messages migrated',
  })
  totalMessagesMigrated: number;
}

/**
 * Input for bulk migration of multiple sessions
 */
@InputType('MigrateChatBulkInput')
export class MigrateChatBulkInput {
  @Field(() => [MigrateChatSessionInput], {
    description: 'Sessions to migrate',
  })
  sessions: MigrateChatSessionInput[];

  @Field(() => Boolean, {
    nullable: true,
    defaultValue: false,
    description: 'Skip sessions that already exist in the database',
  })
  skipDuplicates?: boolean;
}

/**
 * Status of localStorage migration for a user
 */
@ObjectType('LocalStorageMigrationStatus')
export class LocalStorageMigrationStatus {
  @Field(() => Boolean, {
    description: 'Whether the user has completed migration',
  })
  hasMigrated: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'Timestamp of last migration attempt',
  })
  lastMigrationAt?: string | null;

  @Field(() => Int, {
    description: 'Number of sessions migrated',
  })
  sessionsMigrated: number;
}
