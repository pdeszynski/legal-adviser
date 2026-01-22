import { Injectable, Logger } from '@nestjs/common';
import {
  ServiceResult,
  successResult,
  failureResult,
  PaginationParams,
} from '../../common';
import {
  ApplicationError,
  NotFoundError,
} from '../../common/application-error';
import {
  SubmitQueryDto,
  SubmitQueryResultDto,
  LegalQueryDto,
  LegalQuerySummaryDto,
  PaginatedQueriesDto,
} from '../dto';
import { SubmitQueryUseCase } from '../use-cases/submit-query.use-case';
import {
  GetQueryUseCase,
  GetQueryInput,
} from '../use-cases/get-query.use-case';
import {
  ListUserQueriesUseCase,
  ListUserQueriesInput,
} from '../use-cases/list-user-queries.use-case';
import { GetRecentQueriesUseCase } from '../use-cases/get-recent-queries.use-case';
import { StartProcessingQueryUseCase } from '../use-cases/start-processing-query.use-case';
import { CompleteQueryUseCase } from '../use-cases/complete-query.use-case';
import { FailQueryUseCase } from '../use-cases/fail-query.use-case';
import { CancelQueryUseCase } from '../use-cases/cancel-query.use-case';
import { RetryQueryUseCase } from '../use-cases/retry-query.use-case';
import { GetPendingQueriesUseCase } from '../use-cases/get-pending-queries.use-case';
import { QueryStatusEnum } from '../../../domain/ai-operations/value-objects';

/**
 * Query Application Service
 *
 * This service acts as an orchestrator for AI-powered legal query operations.
 * It coordinates between use cases, handles cross-cutting concerns,
 * and provides a unified API for the presentation layer.
 *
 * Key responsibilities:
 * - Coordinate multiple use cases when needed
 * - Handle error transformation
 * - Provide consistent result structure
 * - Support pagination and filtering
 * - Query lifecycle management
 */
@Injectable()
export class QueryApplicationService {
  private readonly logger = new Logger(QueryApplicationService.name);

  constructor(
    private readonly submitQueryUseCase: SubmitQueryUseCase,
    private readonly getQueryUseCase: GetQueryUseCase,
    private readonly listUserQueriesUseCase: ListUserQueriesUseCase,
    private readonly getRecentQueriesUseCase: GetRecentQueriesUseCase,
    private readonly startProcessingQueryUseCase: StartProcessingQueryUseCase,
    private readonly completeQueryUseCase: CompleteQueryUseCase,
    private readonly failQueryUseCase: FailQueryUseCase,
    private readonly cancelQueryUseCase: CancelQueryUseCase,
    private readonly retryQueryUseCase: RetryQueryUseCase,
    private readonly getPendingQueriesUseCase: GetPendingQueriesUseCase,
  ) {}

  /**
   * Submits a new legal query for processing.
   *
   * @param dto - Query submission data
   * @returns Service result with submitted query info
   */
  async submitQuery(
    dto: SubmitQueryDto,
  ): Promise<ServiceResult<SubmitQueryResultDto>> {
    try {
      this.logger.log(`Submitting query for user: ${dto.userId}`);
      const result = await this.submitQueryUseCase.execute(dto);
      this.logger.log(`Query submitted successfully: ${result.id}`);
      return successResult(result);
    } catch (error) {
      return this.handleError<SubmitQueryResultDto>(error, 'submit query');
    }
  }

  /**
   * Retrieves a query by ID.
   *
   * @param queryId - The query ID
   * @returns Service result with query data
   */
  async getQuery(queryId: string): Promise<ServiceResult<LegalQueryDto>> {
    try {
      this.logger.log(`Getting query: ${queryId}`);
      const result = await this.getQueryUseCase.execute({ queryId });
      return successResult(result);
    } catch (error) {
      return this.handleError<LegalQueryDto>(error, 'get query');
    }
  }

  /**
   * Lists queries for a user with optional filters.
   *
   * @param userId - The user ID
   * @param status - Optional status filter
   * @param pagination - Pagination parameters
   * @returns Service result with paginated query list
   */
  async listUserQueries(
    userId: string,
    status?: QueryStatusEnum,
    pagination?: PaginationParams,
  ): Promise<ServiceResult<PaginatedQueriesDto>> {
    try {
      this.logger.log(
        `Listing queries for user: ${userId}, status: ${status || 'all'}`,
      );
      const input: ListUserQueriesInput = {
        userId,
        status,
        page: pagination?.page,
        pageSize: pagination?.limit,
      };
      const result = await this.listUserQueriesUseCase.execute(input);
      return successResult(result);
    } catch (error) {
      return this.handleError<PaginatedQueriesDto>(error, 'list user queries');
    }
  }

  /**
   * Gets recent queries for a user.
   *
   * @param userId - The user ID
   * @param limit - Maximum number of queries to return
   * @returns Service result with recent queries
   */
  async getRecentQueries(
    userId: string,
    limit: number = 10,
  ): Promise<ServiceResult<LegalQuerySummaryDto[]>> {
    try {
      this.logger.log(
        `Getting recent queries for user: ${userId}, limit: ${limit}`,
      );
      const result = await this.getRecentQueriesUseCase.execute({
        userId,
        limit,
      });
      return successResult(result);
    } catch (error) {
      return this.handleError<LegalQuerySummaryDto[]>(
        error,
        'get recent queries',
      );
    }
  }

  /**
   * Starts processing a query (marks as in-progress).
   *
   * @param queryId - The query ID
   * @returns Service result with updated query
   */
  async startProcessingQuery(
    queryId: string,
  ): Promise<ServiceResult<LegalQueryDto>> {
    try {
      this.logger.log(`Starting processing for query: ${queryId}`);
      const result = await this.startProcessingQueryUseCase.execute({
        queryId,
      });
      this.logger.log(`Query processing started: ${queryId}`);
      return successResult(result);
    } catch (error) {
      return this.handleError<LegalQueryDto>(error, 'start processing query');
    }
  }

  /**
   * Completes a query with AI response.
   *
   * @param queryId - The query ID
   * @param content - The AI response content
   * @param confidence - Confidence level of the response
   * @param tokensUsed - Number of tokens used
   * @param modelUsed - The AI model used
   * @param processingTimeMs - Processing time in milliseconds
   * @param citations - Optional citations
   * @returns Service result with completed query
   */
  async completeQuery(
    queryId: string,
    content: string,
    confidence: number,
    tokensUsed: number,
    modelUsed: string,
    processingTimeMs: number,
    citations?: string[],
  ): Promise<ServiceResult<LegalQueryDto>> {
    try {
      this.logger.log(`Completing query: ${queryId}`);
      const result = await this.completeQueryUseCase.execute({
        queryId,
        content,
        confidence,
        tokensUsed,
        modelUsed,
        processingTimeMs,
        citations,
      });
      this.logger.log(`Query completed successfully: ${queryId}`);
      return successResult(result);
    } catch (error) {
      return this.handleError<LegalQueryDto>(error, 'complete query');
    }
  }

  /**
   * Marks a query as failed.
   *
   * @param queryId - The query ID
   * @param errorMessage - The error message
   * @returns Service result with failed query
   */
  async failQuery(
    queryId: string,
    errorMessage: string,
  ): Promise<ServiceResult<LegalQueryDto>> {
    try {
      this.logger.log(`Failing query: ${queryId} with error: ${errorMessage}`);
      const result = await this.failQueryUseCase.execute({
        queryId,
        errorMessage,
      });
      this.logger.log(`Query marked as failed: ${queryId}`);
      return successResult(result);
    } catch (error) {
      return this.handleError<LegalQueryDto>(error, 'fail query');
    }
  }

  /**
   * Cancels a pending query.
   *
   * @param queryId - The query ID
   * @param userId - The user requesting cancellation
   * @returns Service result with cancelled query
   */
  async cancelQuery(
    queryId: string,
    userId: string,
  ): Promise<ServiceResult<LegalQueryDto>> {
    try {
      this.logger.log(`Cancelling query: ${queryId} by user: ${userId}`);

      // Verify ownership before cancellation
      const queryResult = await this.getQuery(queryId);
      if (!queryResult.success || !queryResult.data) {
        return failureResult('NOT_FOUND', 'Query not found');
      }
      if (queryResult.data.userId !== userId) {
        return failureResult(
          'FORBIDDEN',
          'Not authorized to cancel this query',
        );
      }

      const result = await this.cancelQueryUseCase.execute({ queryId });
      this.logger.log(`Query cancelled successfully: ${queryId}`);
      return successResult(result);
    } catch (error) {
      return this.handleError<LegalQueryDto>(error, 'cancel query');
    }
  }

  /**
   * Retries a failed query.
   *
   * @param queryId - The query ID
   * @param userId - The user requesting retry
   * @returns Service result with retried query
   */
  async retryQuery(
    queryId: string,
    userId: string,
  ): Promise<ServiceResult<LegalQueryDto>> {
    try {
      this.logger.log(`Retrying query: ${queryId} by user: ${userId}`);

      // Verify ownership before retry
      const queryResult = await this.getQuery(queryId);
      if (!queryResult.success || !queryResult.data) {
        return failureResult('NOT_FOUND', 'Query not found');
      }
      if (queryResult.data.userId !== userId) {
        return failureResult('FORBIDDEN', 'Not authorized to retry this query');
      }

      const result = await this.retryQueryUseCase.execute({ queryId });
      this.logger.log(`Query retry initiated: ${queryId}`);
      return successResult(result);
    } catch (error) {
      return this.handleError<LegalQueryDto>(error, 'retry query');
    }
  }

  /**
   * Gets all pending queries (for processing).
   *
   * @returns Service result with pending queries
   */
  async getPendingQueries(): Promise<ServiceResult<LegalQuerySummaryDto[]>> {
    try {
      this.logger.log('Getting pending queries');
      const result = await this.getPendingQueriesUseCase.execute();
      return successResult(result);
    } catch (error) {
      return this.handleError<LegalQuerySummaryDto[]>(
        error,
        'get pending queries',
      );
    }
  }

  /**
   * Checks if a user owns a query.
   *
   * @param queryId - The query ID
   * @param userId - The user ID
   * @returns Service result with ownership status
   */
  async checkQueryOwnership(
    queryId: string,
    userId: string,
  ): Promise<ServiceResult<boolean>> {
    try {
      const queryResult = await this.getQuery(queryId);
      if (!queryResult.success || !queryResult.data) {
        return failureResult('NOT_FOUND', 'Query not found');
      }
      return successResult(queryResult.data.userId === userId);
    } catch (error) {
      return this.handleError<boolean>(error, 'check query ownership');
    }
  }

  /**
   * Gets query statistics for a user.
   *
   * @param userId - The user ID
   * @returns Service result with query statistics
   */
  async getQueryStatistics(userId: string): Promise<
    ServiceResult<{
      total: number;
      byStatus: Record<QueryStatusEnum, number>;
      totalTokensUsed: number;
    }>
  > {
    try {
      this.logger.log(`Getting query statistics for user: ${userId}`);
      const queriesResult = await this.listUserQueries(userId, undefined, {
        limit: 10000,
      });

      if (!queriesResult.success || !queriesResult.data) {
        return failureResult('OPERATION_FAILED', 'Failed to get queries');
      }

      const queries = queriesResult.data.items;
      const byStatus = queries.reduce(
        (acc, query) => {
          acc[query.status] = (acc[query.status] || 0) + 1;
          return acc;
        },
        {} as Record<QueryStatusEnum, number>,
      );

      // For total tokens, we would need full query data
      // This is a simplified version
      return successResult({
        total: queries.length,
        byStatus,
        totalTokensUsed: 0, // Would need to aggregate from full queries
      });
    } catch (error) {
      return this.handleError(error, 'get query statistics');
    }
  }

  /**
   * Handles errors and transforms them into service results.
   */
  private handleError<T>(error: unknown, operation: string): ServiceResult<T> {
    if (error instanceof NotFoundError) {
      this.logger.warn(`Not found during ${operation}: ${error.message}`);
      return failureResult('NOT_FOUND', error.message, error.details);
    }

    if (error instanceof ApplicationError) {
      this.logger.warn(
        `Application error during ${operation}: ${error.message}`,
      );
      return failureResult(error.code, error.message, error.details);
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(`Unexpected error during ${operation}: ${errorMessage}`);
    return failureResult('INTERNAL_ERROR', `Failed to ${operation}`, {
      originalError: errorMessage,
    });
  }
}
