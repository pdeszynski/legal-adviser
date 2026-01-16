import { InputType, Field, Float } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  MinLength,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  IsNumber,
  Min,
  Max,
  ArrayMaxSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

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
 * Input type for legal ground in create/update operations
 */
@InputType('LegalGroundInput')
export class LegalGroundInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: 'Ground name is required' })
  @MaxLength(200, { message: 'Ground name must be at most 200 characters' })
  @Transform(({ value }) => sanitizeString(value))
  name: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: 'Ground description is required' })
  @MaxLength(2000, {
    message: 'Ground description must be at most 2000 characters',
  })
  @Transform(({ value }) => sanitizeString(value))
  description: string;

  @Field(() => Float)
  @IsNumber({}, { message: 'Confidence score must be a valid number' })
  @Min(0, { message: 'Confidence score cannot be less than 0' })
  @Max(1, { message: 'Confidence score cannot be greater than 1' })
  confidenceScore: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20, { message: 'Cannot have more than 20 legal basis entries' })
  legalBasis?: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Notes must be at most 1000 characters' })
  @Transform(({ value }) => sanitizeString(value))
  notes?: string;
}

/**
 * Input type for related document link in create/update operations
 */
@InputType('RelatedDocumentLinkInput')
export class RelatedDocumentLinkInput {
  @Field(() => String)
  @IsUUID('4', { message: 'Document ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Document ID is required' })
  documentId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: 'Relationship type is required' })
  @MaxLength(50, {
    message: 'Relationship type must be at most 50 characters',
  })
  @Transform(({ value }) => sanitizeString(value))
  relationshipType: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Relevance score must be a valid number' })
  @Min(0, { message: 'Relevance score cannot be less than 0' })
  @Max(1, { message: 'Relevance score cannot be greater than 1' })
  relevanceScore?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must be at most 500 characters' })
  @Transform(({ value }) => sanitizeString(value))
  description?: string;
}

/**
 * Input type for analysis metadata in create/update operations
 */
@InputType('AnalysisMetadataInput')
export class AnalysisMetadataInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Model name must be at most 100 characters' })
  modelUsed?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Processing time must be a valid number' })
  @Min(0, { message: 'Processing time cannot be negative' })
  processingTimeMs?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50, {
    message: 'Analysis version must be at most 50 characters',
  })
  analysisVersion?: string;
}

/**
 * DTO for creating a new LegalAnalysis
 * Used by nestjs-query auto-generated createOne mutation
 */
@InputType('CreateLegalAnalysisInput')
export class CreateLegalAnalysisInput {
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

  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: 'Input description is required' })
  @MinLength(10, {
    message: 'Input description must be at least 10 characters long',
  })
  @MaxLength(50000, {
    message: 'Input description must be at most 50000 characters long',
  })
  @Transform(({ value }) => sanitizeString(value))
  inputDescription: string;

  @Field(() => [LegalGroundInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LegalGroundInput)
  @ArrayMaxSize(50, { message: 'Cannot have more than 50 identified grounds' })
  identifiedGrounds?: LegalGroundInput[];

  @Field(() => [RelatedDocumentLinkInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RelatedDocumentLinkInput)
  @ArrayMaxSize(100, {
    message: 'Cannot have more than 100 related document links',
  })
  relatedDocumentLinks?: RelatedDocumentLinkInput[];

  @Field(() => AnalysisMetadataInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => AnalysisMetadataInput)
  metadata?: AnalysisMetadataInput;
}

/**
 * DTO for updating a LegalAnalysis
 * Used by nestjs-query auto-generated updateOne mutation
 */
@InputType('UpdateLegalAnalysisInput')
export class UpdateLegalAnalysisInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(500, { message: 'Title must be at most 500 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  title?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(10, {
    message: 'Input description must be at least 10 characters long',
  })
  @MaxLength(50000, {
    message: 'Input description must be at most 50000 characters long',
  })
  @Transform(({ value }) => sanitizeString(value))
  inputDescription?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Overall confidence score must be a valid number' })
  @Min(0, { message: 'Overall confidence score cannot be less than 0' })
  @Max(1, { message: 'Overall confidence score cannot be greater than 1' })
  overallConfidenceScore?: number;

  @Field(() => [LegalGroundInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LegalGroundInput)
  @ArrayMaxSize(50, { message: 'Cannot have more than 50 identified grounds' })
  identifiedGrounds?: LegalGroundInput[];

  @Field(() => [RelatedDocumentLinkInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RelatedDocumentLinkInput)
  @ArrayMaxSize(100, {
    message: 'Cannot have more than 100 related document links',
  })
  relatedDocumentLinks?: RelatedDocumentLinkInput[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10000, { message: 'Summary must be at most 10000 characters' })
  @Transform(({ value }) => sanitizeString(value))
  summary?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10000, {
    message: 'Recommendations must be at most 10000 characters',
  })
  @Transform(({ value }) => sanitizeString(value))
  recommendations?: string;

  @Field(() => AnalysisMetadataInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => AnalysisMetadataInput)
  metadata?: AnalysisMetadataInput;
}
