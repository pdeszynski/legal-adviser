import { QueryStatusEnum } from '../../../domain/ai-operations/value-objects';

/**
 * Response information DTO
 */
export interface AIResponseDto {
  readonly content: string;
  readonly confidence: number;
  readonly tokensUsed: number;
  readonly modelUsed: string;
  readonly processingTimeMs: number;
  readonly citations?: string[];
}

/**
 * Token usage information DTO
 */
export interface TokenUsageDto {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

/**
 * Standard output DTO representing a legal query.
 */
export interface LegalQueryDto {
  readonly id: string;
  readonly userId: string;
  readonly queryText: string;
  readonly status: QueryStatusEnum;
  readonly response?: AIResponseDto;
  readonly tokenUsage?: TokenUsageDto;
  readonly errorMessage?: string;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Summary DTO for query lists (without full response).
 */
export interface LegalQuerySummaryDto {
  readonly id: string;
  readonly userId: string;
  readonly queryText: string;
  readonly status: QueryStatusEnum;
  readonly hasResponse: boolean;
  readonly createdAt: Date;
}

/**
 * Paginated result for query lists.
 */
export interface PaginatedQueriesDto {
  readonly items: LegalQuerySummaryDto[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}
