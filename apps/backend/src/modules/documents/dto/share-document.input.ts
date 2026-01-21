import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { SharePermission } from '../entities/document-share.entity';

/**
 * Input DTO for sharing a document with a user
 */
@InputType()
export class ShareDocumentInput {
  @Field(() => ID, { description: 'ID of the document to share' })
  @IsUUID()
  documentId: string;

  @Field(() => ID, {
    description: 'ID of the user to share the document with',
  })
  @IsUUID()
  sharedWithUserId: string;

  @Field(() => SharePermission, {
    description: 'Permission level to grant',
    defaultValue: SharePermission.VIEW,
  })
  @IsEnum(SharePermission)
  permission: SharePermission;

  @Field(() => String, {
    nullable: true,
    description: 'Optional expiration date for the share (ISO 8601 format)',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
