import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  MinLength,
  IsNotEmpty,
  ValidateNested,
  IsEnum,
  IsNumber,
  Min,
  IsInt,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CommentResolutionStatus } from '../entities/document-comment.entity';

/**
 * Sanitize string input by trimming whitespace and removing potentially dangerous characters
 */
const sanitizeString = (value: unknown): string | unknown => {
  if (typeof value === 'string') {
    return value
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/\s+/g, ' '); // Normalize whitespace
  }
  return value;
};

/**
 * Input type for comment position in create/update operations
 */
@InputType('CreateCommentPositionInput')
export class CreateCommentPositionInput {
  @Field(() => Number)
  @IsInt({ message: 'Start offset must be an integer' })
  @Min(0, { message: 'Start offset cannot be negative' })
  startOffset: number;

  @Field(() => Number)
  @IsInt({ message: 'End offset must be an integer' })
  @Min(0, { message: 'End offset cannot be negative' })
  endOffset: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'Commented text must be at most 1000 characters',
  })
  @Transform(({ value }) => sanitizeString(value))
  text?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: 'Section identifier must be at most 100 characters',
  })
  @Transform(({ value }) => sanitizeString(value))
  section?: string;
}

/**
 * DTO for creating a new DocumentComment
 * Used by nestjs-query auto-generated createOne mutation
 */
@InputType('CreateDocumentCommentInput')
export class CreateDocumentCommentInput {
  @Field(() => String)
  @IsUUID('4', { message: 'Document ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Document ID is required' })
  documentId: string;

  @Field(() => String)
  @IsUUID('4', { message: 'Author ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Author ID is required' })
  authorId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: 'Comment text is required' })
  @MinLength(1, { message: 'Comment text must be at least 1 character long' })
  @MaxLength(10000, {
    message: 'Comment text must be at most 10000 characters long',
  })
  @Transform(({ value }) => sanitizeString(value))
  text: string;

  @Field(() => CreateCommentPositionInput)
  @ValidateNested()
  @Type(() => CreateCommentPositionInput)
  position: CreateCommentPositionInput;

  @Field(() => CommentResolutionStatus, {
    defaultValue: CommentResolutionStatus.OPEN,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(CommentResolutionStatus, {
    message: `Resolution status must be one of: ${Object.values(CommentResolutionStatus).join(', ')}`,
  })
  resolutionStatus?: CommentResolutionStatus;
}

/**
 * DTO for updating a DocumentComment
 * Used by nestjs-query auto-generated updateOne mutation
 */
@InputType('UpdateDocumentCommentInput')
export class UpdateDocumentCommentInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Comment text must be at least 1 character long' })
  @MaxLength(10000, {
    message: 'Comment text must be at most 10000 characters long',
  })
  @Transform(({ value }) => sanitizeString(value))
  text?: string;

  @Field(() => CreateCommentPositionInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCommentPositionInput)
  position?: CreateCommentPositionInput;

  @Field(() => CommentResolutionStatus, { nullable: true })
  @IsOptional()
  @IsEnum(CommentResolutionStatus, {
    message: `Resolution status must be one of: ${Object.values(CommentResolutionStatus).join(', ')}`,
  })
  resolutionStatus?: CommentResolutionStatus;

  @Field(() => String, {
    nullable: true,
    description:
      'ID of the user who resolved the comment (required when marking as resolved)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Resolved by must be a valid UUID v4' })
  resolvedBy?: string;
}
