import { Field, InputType, ID, ObjectType } from '@nestjs/graphql';
import { IsUUID, IsString, IsOptional, IsNotEmpty } from 'class-validator';

/**
 * Input for flagging a document for moderation
 */
@InputType('FlagDocumentForModerationInput')
export class FlagDocumentForModerationInput {
  @Field(() => ID, { description: 'Document ID to flag for moderation' })
  @IsUUID()
  documentId: string;

  @Field(() => String, {
    nullable: true,
    description: 'Reason for flagging the document',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * Input for approving a document
 */
@InputType('ApproveDocumentInput')
export class ApproveDocumentInput {
  @Field(() => ID, { description: 'Document ID to approve' })
  @IsUUID()
  documentId: string;

  @Field(() => String, {
    nullable: true,
    description: 'Optional reason for approval',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * Input for rejecting a document
 */
@InputType('RejectDocumentInput')
export class RejectDocumentInput {
  @Field(() => ID, { description: 'Document ID to reject' })
  @IsUUID()
  documentId: string;

  @Field(() => String, { description: 'Reason for rejection (required)' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

/**
 * Response for moderation action
 */
@ObjectType('ModerationActionResult')
export class ModerationActionResult {
  @Field(() => ID, { description: 'Document ID' })
  documentId: string;

  @Field(() => String, { description: 'Action performed' })
  action: 'APPROVED' | 'REJECTED' | 'FLAGGED';

  @Field(() => String, {
    nullable: true,
    description: 'Reason for the action',
  })
  reason: string | null;

  @Field(() => Boolean, { description: 'Whether user was notified' })
  userNotified: boolean;
}
