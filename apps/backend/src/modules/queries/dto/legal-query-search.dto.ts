import { InputType, Field, Int, ObjectType } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Sanitize search query to prevent SQL injection and XSS
 */
const sanitizeSearchQuery = (value: unknown): string | unknown => {
  if (typeof value === 'string') {
    return value
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[%&]/g, ''); // Remove SQL wildcards and special chars
  }
  return value;
};

/**
 * Input type for searching legal queries
 *
 * Provides full-text search across questions and answers
 * with optional filtering by session and date range.
 */
@InputType('SearchLegalQueriesInput')
export class SearchLegalQueriesInput {
  @Field(() => String, {
    description:
      'Search query for full-text search across questions and answers',
  })
  @IsString()
  @MinLength(2, { message: 'Search query must be at least 2 characters long' })
  @MaxLength(500, {
    message: 'Search query must be at most 500 characters long',
  })
  @Type(() => String)
  query: string;

  @Field(() => String, { nullable: true, description: 'Filter by session ID' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Start date for date range filter (ISO 8601 format)',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @Field(() => String, {
    nullable: true,
    description: 'End date for date range filter (ISO 8601 format)',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @Field(() => Int, {
    nullable: true,
    description: 'Maximum number of results to return',
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Number of results to skip for pagination',
  })
  @IsOptional()
  @Type(() => Number)
  offset?: number;
}

/**
 * Response type for search results with relevance ranking
 */
@ObjectType('LegalQuerySearchResult')
export class LegalQuerySearchResult {
  @Field(() => String)
  id: string;

  @Field(() => String)
  sessionId: string;

  @Field(() => String)
  question: string;

  @Field(() => String, { nullable: true })
  answerMarkdown: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Float, {
    description: 'Relevance ranking score (higher is more relevant)',
  })
  rank: number;

  @Field(() => String, {
    nullable: true,
    description: 'Highlighted snippet of matching content',
  })
  headline: string | null;
}

/**
 * Paginated search results response
 */
@ObjectType('LegalQuerySearchResponse')
export class LegalQuerySearchResponse {
  @Field(() => [LegalQuerySearchResult])
  results: LegalQuerySearchResult[];

  @Field(() => Int)
  totalCount: number;

  @Field(() => Int)
  count: number;

  @Field(() => Int)
  offset: number;

  @Field(() => Boolean)
  hasMore: boolean;
}

/**
 * Type imports for compatibility
 */
import { Float } from '@nestjs/graphql';
