import { InputType, Field, ObjectType, Int, Float } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CourtType, LegalRuling } from '../entities/legal-ruling.entity';

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
 * Input type for full-text search of legal rulings
 */
@InputType('SearchLegalRulingsInput')
export class SearchLegalRulingsInput {
  @Field(() => String, { description: 'Search query text' })
  @IsString()
  @MinLength(2, { message: 'Search query must be at least 2 characters' })
  @MaxLength(500, { message: 'Search query must be at most 500 characters' })
  @Transform(({ value }) => sanitizeString(value))
  query: string;

  @Field(() => CourtType, {
    nullable: true,
    description: 'Filter by court type',
  })
  @IsOptional()
  @IsEnum(CourtType, {
    message: `Court type must be one of: ${Object.values(CourtType).join(', ')}`,
  })
  courtType?: CourtType;

  @Field(() => String, {
    nullable: true,
    description: 'Filter by ruling date from (ISO 8601 date string)',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'dateFrom must be a valid ISO 8601 date string' },
  )
  dateFrom?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Filter by ruling date to (ISO 8601 date string)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'dateTo must be a valid ISO 8601 date string' })
  dateTo?: string;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 20,
    description: 'Maximum number of results to return (default: 20, max: 100)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 0,
    description: 'Number of results to skip for pagination',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

/**
 * Input type for filtering legal rulings (non-search)
 */
@InputType('FilterLegalRulingsInput')
export class FilterLegalRulingsInput {
  @Field(() => CourtType, {
    nullable: true,
    description: 'Filter by court type',
  })
  @IsOptional()
  @IsEnum(CourtType)
  courtType?: CourtType;

  @Field(() => String, {
    nullable: true,
    description: 'Filter by court name (partial match)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Transform(({ value }) => sanitizeString(value))
  courtName?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Filter by legal area from metadata (partial match)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => sanitizeString(value))
  legalArea?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Filter by ruling date from (ISO 8601 date string)',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Filter by ruling date to (ISO 8601 date string)',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 20,
    description: 'Maximum number of results to return (default: 20, max: 100)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 0,
    description: 'Number of results to skip for pagination',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

/**
 * Search result item with relevance information
 */
@ObjectType('LegalRulingSearchResult')
export class LegalRulingSearchResult {
  @Field(() => LegalRuling, { description: 'The matching legal ruling' })
  ruling: LegalRuling;

  @Field(() => Float, { description: 'Relevance score (higher is better)' })
  rank: number;

  @Field(() => String, {
    nullable: true,
    description: 'Highlighted snippet of matching content',
  })
  headline?: string;
}

/**
 * Paginated search results with total count
 */
@ObjectType('LegalRulingSearchResponse')
export class LegalRulingSearchResponse {
  @Field(() => [LegalRulingSearchResult], {
    description: 'Search results with relevance ranking',
  })
  results: LegalRulingSearchResult[];

  @Field(() => Int, {
    description: 'Total number of matching results (for pagination)',
  })
  totalCount: number;

  @Field(() => Int, { description: 'Number of results returned' })
  count: number;

  @Field(() => Int, { description: 'Current offset' })
  offset: number;

  @Field(() => Boolean, { description: 'Whether there are more results' })
  hasMore: boolean;
}
