import { ObjectType, Field, ID, Int, Float, InputType } from '@nestjs/graphql';
import { MessageRole } from '../entities/chat-message.entity';

/**
 * Empty message analysis result
 *
 * Represents a single empty assistant message found during analysis
 */
@ObjectType('EmptyMessageAnalysis')
export class EmptyMessageAnalysis {
  @Field(() => ID, {
    description: 'The message ID',
  })
  messageId: string;

  @Field(() => ID, {
    description: 'The session ID',
  })
  sessionId: string;

  @Field(() => ID, {
    description: 'The user ID',
  })
  userId: string;

  @Field(() => MessageRole, {
    description: 'Message role',
  })
  role: MessageRole;

  @Field(() => String, {
    nullable: true,
    description: 'Content field value (should be empty)',
  })
  content: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Raw content field value (may have data)',
  })
  rawContent: string | null;

  @Field(() => Boolean, {
    description: 'Whether rawContent has data that can be recovered',
  })
  hasRecoverableRawContent: boolean;

  @Field(() => Boolean, {
    description: 'Whether metadata contains clarification data',
  })
  hasClarificationMetadata: boolean;

  @Field(() => Int, {
    description: 'Sequence order in the conversation',
  })
  sequenceOrder: number;

  @Field(() => String, {
    description: 'Timestamp when the message was created',
  })
  createdAt: Date;
}

/**
 * Summary of empty messages analysis
 *
 * Aggregated statistics about empty messages found
 */
@ObjectType('EmptyMessagesSummary')
export class EmptyMessagesSummary {
  @Field(() => Int, {
    description: 'Total number of empty assistant messages found',
  })
  totalEmptyMessages: number;

  @Field(() => Int, {
    description: 'Number of messages with recoverable rawContent',
  })
  recoverableFromRawContent: number;

  @Field(() => Int, {
    description: 'Number of messages with clarification metadata',
  })
  withClarificationMetadata: number;

  @Field(() => Int, {
    description: 'Number of messages that are truly empty (both content and rawContent)',
  })
  trulyEmpty: number;

  @Field(() => Int, {
    description: 'Number of affected sessions',
  })
  affectedSessions: number;

  @Field(() => Int, {
    description: 'Number of affected users',
  })
  affectedUsers: number;

  @Field(() => [EmptyMessageAnalysis], {
    description: 'List of empty messages found',
  })
  messages: EmptyMessageAnalysis[];
}

/**
 * Result of cleanup operation
 *
 * Returns statistics about what was cleaned up
 */
@ObjectType('CleanupEmptyMessagesResult')
export class CleanupEmptyMessagesResult {
  @Field(() => Int, {
    description: 'Number of messages recovered from rawContent',
  })
  recoveredFromRawContent: number;

  @Field(() => Int, {
    description: 'Number of messages recovered from clarification metadata',
  })
  recoveredFromClarification: number;

  @Field(() => Int, {
    description: 'Number of messages marked for deletion (truly empty)',
  })
  markedForDeletion: number;

  @Field(() => Int, {
    description: 'Number of messages that could not be recovered',
  })
  unrecoverable: number;

  @Field(() => Int, {
    description: 'Number of affected sessions',
  })
  affectedSessions: number;

  @Field(() => Int, {
    description: 'Number of affected users',
  })
  affectedUsers: number;

  @Field(() => [String], {
    description: 'List of affected session IDs',
  })
  sessionIds: string[];

  @Field(() => [String], {
    description: 'List of affected user IDs',
  })
  userIds: string[];
}

/**
 * Affected user information for notification
 */
@ObjectType('AffectedUserInfo')
export class AffectedUserInfo {
  @Field(() => ID, {
    description: 'The user ID',
  })
  userId: string;

  @Field(() => String, {
    nullable: true,
    description: 'User email (if available)',
  })
  email: string | null;

  @Field(() => Int, {
    description: 'Number of empty messages for this user',
  })
  emptyMessageCount: number;

  @Field(() => Int, {
    description: 'Number of affected sessions',
  })
  affectedSessionCount: number;

  @Field(() => [String], {
    description: 'List of affected session IDs',
  })
  sessionIds: string[];
}

/**
 * Report of affected users
 *
 * Aggregated information for user notification
 */
@ObjectType('AffectedUsersReport')
export class AffectedUsersReport {
  @Field(() => Int, {
    description: 'Total number of affected users',
  })
  totalAffectedUsers: number;

  @Field(() => Int, {
    description: 'Total number of empty messages across all users',
  })
  totalEmptyMessages: number;

  @Field(() => [AffectedUserInfo], {
    description: 'List of affected users with details',
  })
  users: AffectedUserInfo[];
}

/**
 * Input for cleanup operation
 */
@InputType('CleanupEmptyMessagesInput')
export class CleanupEmptyMessagesInput {
  @Field(() => Boolean, {
    nullable: true,
    defaultValue: false,
    description: 'Actually perform the cleanup (false = dry run)',
  })
  execute: boolean;

  @Field(() => Boolean, {
    nullable: true,
    defaultValue: true,
    description: 'Recover messages from rawContent if available',
  })
  recoverFromRawContent: boolean;

  @Field(() => Boolean, {
    nullable: true,
    defaultValue: true,
    description: 'Recover messages from clarification metadata',
  })
  recoverFromClarification: boolean;

  @Field(() => Boolean, {
    nullable: true,
    defaultValue: false,
    description: 'Mark truly empty messages for deletion',
  })
  markForDeletion: boolean;
}
