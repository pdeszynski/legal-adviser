import {
  InputType,
  Field,
  ObjectType,
  Int,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
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
  IsArray,
  ArrayContains,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
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

/**
 * Search source enum for external databases
 */
export enum SearchSource {
  LOCAL = 'LOCAL',
  SAOS = 'SAOS',
  ISAP = 'ISAP',
}

// Register enum with GraphQL
registerEnumType(SearchSource, {
  name: 'SearchSource',
  description: 'Source of the search result (LOCAL, SAOS, or ISAP)',
});

/**
 * Input type for aggregated search across multiple sources
 */
@InputType('AggregatedSearchLegalRulingsInput')
export class AggregatedSearchLegalRulingsInput {
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

  @Field(() => [SearchSource], {
    nullable: true,
    defaultValue: [SearchSource.LOCAL, SearchSource.SAOS, SearchSource.ISAP],
    description: 'Sources to search (default: all sources)',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SearchSource, { each: true })
  sources?: SearchSource[];

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
 * Aggregated search result item with source information
 */
@ObjectType('AggregatedLegalRulingSearchResult')
export class AggregatedLegalRulingSearchResult {
  @Field(() => LegalRuling, { description: 'The matching legal ruling' })
  ruling: LegalRuling;

  @Field(() => Float, { description: 'Relevance score (higher is better)' })
  rank: number;

  @Field(() => String, {
    nullable: true,
    description: 'Highlighted snippet of matching content',
  })
  headline?: string;

  @Field(() => SearchSource, { description: 'Source of the result' })
  source!: SearchSource;
}

/**
 * Paginated aggregated search results with total count
 */
@ObjectType('AggregatedLegalRulingSearchResponse')
export class AggregatedLegalRulingSearchResponse {
  @Field(() => [AggregatedLegalRulingSearchResult], {
    description: 'Search results with relevance ranking from multiple sources',
  })
  results: AggregatedLegalRulingSearchResult[];

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

/**
 * Boolean operator enum for advanced search
 */
export enum BooleanOperator {
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
}

// Register enum with GraphQL
registerEnumType(BooleanOperator, {
  name: 'BooleanOperator',
  description: 'Boolean operators for combining search terms',
});

/**
 * Search field enum for field-specific search
 */
export enum SearchField {
  SIGNATURE = 'SIGNATURE',
  COURT_NAME = 'COURT_NAME',
  SUMMARY = 'SUMMARY',
  FULL_TEXT = 'FULL_TEXT',
  KEYWORDS = 'KEYWORDS',
  LEGAL_AREA = 'LEGAL_AREA',
  ALL = 'ALL',
}

// Register enum with GraphQL
registerEnumType(SearchField, {
  name: 'SearchField',
  description: 'Specific fields to search in',
});

/**
 * Advanced search term with field specification and boolean operator
 */
@InputType('AdvancedSearchTermInput')
export class AdvancedSearchTermInput {
  @Field(() => String, { description: 'Search term text' })
  @IsString()
  @MinLength(2, { message: 'Search term must be at least 2 characters' })
  @MaxLength(200, { message: 'Search term must be at most 200 characters' })
  @Transform(({ value }) => sanitizeString(value))
  term: string;

  @Field(() => SearchField, {
    defaultValue: SearchField.ALL,
    description: 'Field to search in (default: ALL)',
  })
  @IsOptional()
  @IsEnum(SearchField)
  field?: SearchField;

  @Field(() => BooleanOperator, {
    defaultValue: BooleanOperator.AND,
    description:
      'Boolean operator to combine with previous term (default: AND)',
  })
  @IsOptional()
  @IsEnum(BooleanOperator)
  operator?: BooleanOperator;
}

/**
 * Input type for advanced search with boolean operators and field-specific search
 */
@InputType('AdvancedSearchLegalRulingsInput')
export class AdvancedSearchLegalRulingsInput {
  @Field(() => [AdvancedSearchTermInput], {
    description:
      'Array of search terms with operators and field specifications',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdvancedSearchTermInput)
  searchTerms: AdvancedSearchTermInput[];

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
    description: 'Filter by legal area from metadata',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => sanitizeString(value))
  legalArea?: string;

  @Field(() => [String], {
    nullable: true,
    description: 'Filter by keywords (must match all)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  keywords?: string[];

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

  @Field(() => [SearchSource], {
    nullable: true,
    defaultValue: [SearchSource.LOCAL, SearchSource.SAOS, SearchSource.ISAP],
    description: 'Sources to search (default: all sources)',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SearchSource, { each: true })
  sources?: SearchSource[];

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
 * Advanced search response with query explanation
 */
@ObjectType('AdvancedLegalRulingSearchResponse')
export class AdvancedLegalRulingSearchResponse {
  @Field(() => [AggregatedLegalRulingSearchResult], {
    description: 'Search results with relevance ranking',
  })
  results: AggregatedLegalRulingSearchResult[];

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

  @Field(() => String, {
    nullable: true,
    description:
      'Human-readable explanation of the search query that was executed',
  })
  queryExplanation?: string;
}
