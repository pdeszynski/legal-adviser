import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  MaxLength,
  MinLength,
  IsNotEmpty,
  ValidateNested,
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
 * DTO for document metadata validation
 * Compatible with DocumentMetadata interface via index signature
 */
export class CreateDocumentMetadataDto {
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Plaintiff name must be at most 200 characters' })
  @Transform(({ value }) => sanitizeString(value))
  plaintiffName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Defendant name must be at most 200 characters' })
  @Transform(({ value }) => sanitizeString(value))
  defendantName?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Claim amount must be a valid number' })
  @Min(0, { message: 'Claim amount cannot be negative' })
  @Max(999999999999, { message: 'Claim amount exceeds maximum allowed value' })
  claimAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3, { message: 'Currency code must be at most 3 characters' })
  @Matches(/^[A-Z]{3}$/, {
    message:
      'Currency must be a valid 3-letter ISO currency code (e.g., PLN, EUR, USD)',
  })
  claimCurrency?: string;

  // Index signature to allow additional context variables (compatible with DocumentMetadata)
  [key: string]: unknown;
}

/**
 * DTO for creating a new document
 */
export class CreateDocumentDto {
  @IsUUID('4', { message: 'Session ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Session ID is required' })
  sessionId: string;

  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(500, { message: 'Title must be at most 500 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  title: string;

  @IsEnum(DocumentType, {
    message: `Document type must be one of: ${Object.values(DocumentType).join(', ')}`,
  })
  @IsOptional()
  type?: DocumentType;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDocumentMetadataDto)
  metadata?: CreateDocumentMetadataDto;
}
