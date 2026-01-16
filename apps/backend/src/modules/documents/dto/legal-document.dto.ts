import { InputType, Field, Float } from '@nestjs/graphql';
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
  Max,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { DocumentType } from '../entities/legal-document.entity';

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
 * Input type for document metadata in create/update operations
 */
@InputType('CreateDocumentMetadataInput')
export class CreateDocumentMetadataInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Plaintiff name must be at most 200 characters' })
  @Transform(({ value }) => sanitizeString(value))
  plaintiffName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Defendant name must be at most 200 characters' })
  @Transform(({ value }) => sanitizeString(value))
  defendantName?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Claim amount must be a valid number' })
  @Min(0, { message: 'Claim amount cannot be negative' })
  @Max(999999999999, { message: 'Claim amount exceeds maximum allowed value' })
  claimAmount?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(3, { message: 'Currency code must be at most 3 characters' })
  @Matches(/^[A-Z]{3}$/, {
    message:
      'Currency must be a valid 3-letter ISO currency code (e.g., PLN, EUR, USD)',
  })
  claimCurrency?: string;
}

/**
 * DTO for creating a new LegalDocument
 * Used by nestjs-query auto-generated createOne mutation
 */
@InputType('CreateLegalDocumentInput')
export class CreateLegalDocumentInput {
  @Field(() => String)
  @IsUUID('4', { message: 'Session ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Session ID is required' })
  sessionId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(500, { message: 'Title must be at most 500 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  title: string;

  @Field(() => DocumentType, { defaultValue: DocumentType.OTHER })
  @IsOptional()
  @IsEnum(DocumentType, {
    message: `Document type must be one of: ${Object.values(DocumentType).join(', ')}`,
  })
  type?: DocumentType;

  @Field(() => CreateDocumentMetadataInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDocumentMetadataInput)
  metadata?: CreateDocumentMetadataInput;
}

/**
 * DTO for updating a LegalDocument
 * Used by nestjs-query auto-generated updateOne mutation
 */
@InputType('UpdateLegalDocumentInput')
export class UpdateLegalDocumentInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(500, { message: 'Title must be at most 500 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  title?: string;

  @Field(() => DocumentType, { nullable: true })
  @IsOptional()
  @IsEnum(DocumentType, {
    message: `Document type must be one of: ${Object.values(DocumentType).join(', ')}`,
  })
  type?: DocumentType;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  contentRaw?: string;

  @Field(() => CreateDocumentMetadataInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDocumentMetadataInput)
  metadata?: CreateDocumentMetadataInput;
}
