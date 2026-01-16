import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsNotEmpty,
  ValidateNested,
  IsEnum,
  IsArray,
  IsDateString,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CourtType } from '../entities/legal-ruling.entity';

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
 * Input type for ruling metadata in create/update operations
 */
@InputType('CreateRulingMetadataInput')
export class CreateRulingMetadataInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Legal area must be at most 100 characters' })
  @Transform(({ value }) => sanitizeString(value))
  legalArea?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, {
    each: true,
    message: 'Each related case number must be at most 100 characters',
  })
  relatedCases?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, {
    each: true,
    message: 'Each keyword must be at most 50 characters',
  })
  keywords?: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'Source reference must be at most 500 characters',
  })
  sourceReference?: string;
}

/**
 * DTO for creating a new LegalRuling
 * Used by nestjs-query auto-generated createOne mutation
 */
@InputType('CreateLegalRulingInput')
export class CreateLegalRulingInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: 'Signature is required' })
  @MinLength(3, { message: 'Signature must be at least 3 characters long' })
  @MaxLength(100, { message: 'Signature must be at most 100 characters long' })
  @Matches(/^[A-Za-z0-9\s\-\/\.]+$/, {
    message:
      'Signature can only contain letters, numbers, spaces, hyphens, slashes, and dots',
  })
  @Transform(({ value }) => sanitizeString(value))
  signature: string;

  @Field(() => String)
  @IsDateString(
    {},
    { message: 'Ruling date must be a valid ISO 8601 date string' },
  )
  @IsNotEmpty({ message: 'Ruling date is required' })
  rulingDate: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: 'Court name is required' })
  @MinLength(3, { message: 'Court name must be at least 3 characters long' })
  @MaxLength(300, { message: 'Court name must be at most 300 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  courtName: string;

  @Field(() => CourtType, { defaultValue: CourtType.OTHER })
  @IsOptional()
  @IsEnum(CourtType, {
    message: `Court type must be one of: ${Object.values(CourtType).join(', ')}`,
  })
  courtType?: CourtType;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10000, { message: 'Summary must be at most 10000 characters' })
  summary?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500000, { message: 'Full text must be at most 500000 characters' })
  fullText?: string;

  @Field(() => CreateRulingMetadataInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateRulingMetadataInput)
  metadata?: CreateRulingMetadataInput;
}

/**
 * DTO for updating a LegalRuling
 * Used by nestjs-query auto-generated updateOne mutation
 */
@InputType('UpdateLegalRulingInput')
export class UpdateLegalRulingInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Signature must be at least 3 characters long' })
  @MaxLength(100, { message: 'Signature must be at most 100 characters long' })
  @Matches(/^[A-Za-z0-9\s\-\/\.]+$/, {
    message:
      'Signature can only contain letters, numbers, spaces, hyphens, slashes, and dots',
  })
  @Transform(({ value }) => sanitizeString(value))
  signature?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Ruling date must be a valid ISO 8601 date string' },
  )
  rulingDate?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Court name must be at least 3 characters long' })
  @MaxLength(300, { message: 'Court name must be at most 300 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  courtName?: string;

  @Field(() => CourtType, { nullable: true })
  @IsOptional()
  @IsEnum(CourtType, {
    message: `Court type must be one of: ${Object.values(CourtType).join(', ')}`,
  })
  courtType?: CourtType;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10000, { message: 'Summary must be at most 10000 characters' })
  summary?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500000, { message: 'Full text must be at most 500000 characters' })
  fullText?: string;

  @Field(() => CreateRulingMetadataInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateRulingMetadataInput)
  metadata?: CreateRulingMetadataInput;
}
