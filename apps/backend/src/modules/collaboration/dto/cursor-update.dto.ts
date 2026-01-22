import {
  InputType,
  ObjectType,
  Field,
  ID,
  GraphQLISODateTime,
} from '@nestjs/graphql';
import { IsUUID, IsInt, IsOptional, Min, IsString } from 'class-validator';

/**
 * Update Cursor Input
 *
 * Updates the user's cursor position in a document.
 * Broadcasted to other users via WebSocket.
 */
@InputType('UpdateCursorInput')
export class UpdateCursorInput {
  @Field(() => ID)
  @IsUUID()
  documentId: string;

  @Field(() => Number)
  @IsInt()
  @Min(0)
  position: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  selectionLength?: number;
}

/**
 * Cursor Event Payload
 *
 * Emitted when a user's cursor changes.
 * Used in GraphQL subscriptions to notify other collaborators.
 */
@ObjectType('CursorEventPayload')
export class CursorEventPayload {
  @Field(() => ID)
  documentId: string;

  @Field(() => ID)
  userId: string;

  @Field(() => String)
  userName: string;

  @Field(() => String, { nullable: true })
  color: string | null;

  @Field(() => Number)
  position: number;

  @Field(() => Number)
  selectionLength: number;

  @Field(() => GraphQLISODateTime)
  timestamp: Date;
}

/**
 * Document Edit Event Payload
 *
 * Emitted when a document is edited.
 * Contains the operation that was applied.
 */
@ObjectType('DocumentEditEventPayload')
export class DocumentEditEventPayload {
  @Field(() => ID)
  documentId: string;

  @Field(() => ID)
  userId: string;

  @Field(() => String)
  userName: string;

  @Field(() => String)
  operation: {
    type: string;
    position: number;
    length?: number;
    text?: string;
  };

  @Field(() => Number)
  version: number;

  @Field(() => GraphQLISODateTime)
  timestamp: Date;
}

/**
 * User Joined Document Event Payload
 *
 * Emitted when a user joins a collaborative editing session.
 */
@ObjectType('UserJoinedEventPayload')
export class UserJoinedEventPayload {
  @Field(() => ID)
  documentId: string;

  @Field(() => ID)
  userId: string;

  @Field(() => String)
  userName: string;

  @Field(() => String, { nullable: true })
  color: string | null;

  @Field(() => GraphQLISODateTime)
  timestamp: Date;
}

/**
 * User Left Document Event Payload
 *
 * Emitted when a user leaves a collaborative editing session.
 */
@ObjectType('UserLeftEventPayload')
export class UserLeftEventPayload {
  @Field(() => ID)
  documentId: string;

  @Field(() => ID)
  userId: string;

  @Field(() => String)
  userName: string;

  @Field(() => GraphQLISODateTime)
  timestamp: Date;
}
