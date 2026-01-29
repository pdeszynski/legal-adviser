import { InputType, Field, ID, Int, ArgsType, ObjectType } from '@nestjs/graphql';
import { ChatMode } from '../entities/chat-session.entity';
import {
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  IsEnum,
  IsIn,
} from 'class-validator';

/**
 * Input for creating a new chat session
 *
 * Note: Session ID is ALWAYS generated server-side (UUID v4).
 * Title is ALWAYS null initially and auto-generated from the first message
 * (see chat-session-auto-title-generation feature).
 * Frontend MUST NOT send a sessionId or title - these are enforced server-side.
 */
@InputType('CreateChatSessionInput')
export class CreateChatSessionInput {
  @Field(() => ChatMode, {
    description: 'AI response mode for the session (LAWYER or SIMPLE)',
  })
  @IsEnum(ChatMode)
  mode: ChatMode;
}

/**
 * Input for updating a chat session
 * Used by nestjs-query auto-generated updateOne mutation
 * All fields are optional for partial updates
 */
@InputType('UpdateChatSessionInput')
export class UpdateChatSessionInput {
  @Field(() => String, {
    nullable: true,
    description: 'Update session title',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @Field(() => ChatMode, {
    nullable: true,
    description: 'Update AI response mode',
  })
  @IsOptional()
  @IsEnum(ChatMode)
  mode?: ChatMode;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Update pinned status',
  })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}

/**
 * Input for updating a chat session title
 */
@InputType('UpdateChatSessionTitleInput')
export class UpdateChatSessionTitleInput {
  @Field(() => ID, {
    description: 'Session ID to update',
  })
  @IsString()
  sessionId: string;

  @Field(() => String, {
    description: 'New title for the session',
  })
  @IsString()
  title: string;
}

/**
 * Input for pinning/unpinning a chat session
 */
@InputType('PinChatSessionInput')
export class PinChatSessionInput {
  @Field(() => ID, {
    description: 'Session ID to pin/unpin',
  })
  @IsString()
  sessionId: string;

  @Field(() => Boolean, {
    description: 'True to pin, false to unpin',
  })
  @IsBoolean()
  isPinned: boolean;
}

/**
 * Input for deleting a chat session
 */
@InputType('DeleteChatSessionInput')
export class DeleteChatSessionInput {
  @Field(() => ID, {
    description: 'Session ID to delete (soft delete)',
  })
  @IsString()
  sessionId: string;
}

/**
 * Input for querying chat sessions with filtering and sorting
 */
@ArgsType()
export class ChatSessionsArgs {
  @Field(() => ID, {
    nullable: true,
    description: 'User ID to filter sessions (defaults to authenticated user)',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 20,
    description: 'Number of sessions to return',
  })
  @IsOptional()
  @IsInt()
  limit?: number;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 0,
    description: 'Number of sessions to skip',
  })
  @IsOptional()
  @IsInt()
  offset?: number;

  @Field(() => ChatMode, {
    nullable: true,
    description: 'Filter by AI mode',
  })
  @IsOptional()
  @IsEnum(ChatMode)
  mode?: ChatMode;

  @Field(() => String, {
    nullable: true,
    description: 'Search in session titles',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Filter by pinned status',
  })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @Field(() => String, {
    nullable: true,
    defaultValue: 'lastMessageAt',
    description: 'Sort field (createdAt, lastMessageAt, title, messageCount)',
  })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'lastMessageAt', 'title', 'messageCount', 'updatedAt'])
  sortBy?: string;

  @Field(() => String, {
    nullable: true,
    defaultValue: 'DESC',
    description: 'Sort order (ASC, DESC)',
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  @Field(() => Boolean, {
    nullable: true,
    defaultValue: false,
    description: 'Include soft deleted sessions',
  })
  @IsOptional()
  @IsBoolean()
  includeDeleted?: boolean;
}

/**
 * Response type for chat sessions query
 */
@InputType('ChatSessionsResponse')
export class ChatSessionsResponse {
  @Field(() => [ID], {
    description: 'List of session IDs',
  })
  sessionIds: string[];

  @Field(() => Int, {
    description: 'Total count of sessions',
  })
  totalCount: number;

  @Field(() => Int, {
    description: 'Number of sessions returned',
  })
  count: number;

  @Field(() => Int, {
    description: 'Current offset',
  })
  offset: number;

  @Field(() => Boolean, {
    description: 'Whether there are more sessions',
  })
  hasMore: boolean;
}

/**
 * Input for chat session detail query
 */
@ArgsType()
export class ChatSessionDetailArgs {
  @Field(() => ID, {
    description: 'Session ID to fetch',
  })
  @IsString()
  sessionId: string;
}

/**
 * Response type for chat session detail query
 */
@InputType('ChatSessionDetailResponse')
export class ChatSessionDetailResponse {
  @Field(() => ID, {
    description: 'Session ID',
  })
  id: string;

  @Field(() => String, {
    nullable: true,
    description: 'Session title',
  })
  title: string | null;

  @Field(() => ChatMode, {
    description: 'AI mode',
  })
  mode: ChatMode;

  @Field(() => Int, {
    description: 'Message count',
  })
  messageCount: number;

  @Field(() => Boolean, {
    description: 'Whether the session is pinned',
  })
  isPinned: boolean;

  @Field(() => [ID], {
    description: 'Message IDs in order',
  })
  messageIds: string[];
}

/**
 * Response type for hard delete operation
 *
 * Returns the ID of the deleted session and the number of messages that were deleted.
 */
@ObjectType('DeleteChatSessionResult')
export class DeleteChatSessionResult {
  @Field(() => ID, {
    description: 'The ID of the deleted session',
  })
  sessionId: string;

  @Field(() => Int, {
    description: 'Number of messages deleted with this session',
  })
  messageCount: number;

  @Field(() => String, {
    description: 'Deletion type (hard or soft)',
  })
  deletionType: string;

  @Field(() => Boolean, {
    description: 'Whether the deletion was successful',
  })
  success: boolean;
}
