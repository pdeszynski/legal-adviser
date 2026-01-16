/**
 * AI OPERATIONS APPLICATION LAYER
 *
 * This module contains the application use cases for AI-powered legal queries.
 * Use cases orchestrate domain operations without containing business logic.
 *
 * Use Cases:
 * - SubmitQueryUseCase: Submit a new legal query
 * - GetQueryUseCase: Get query by ID
 * - ListUserQueriesUseCase: List queries for a user
 * - GetRecentQueriesUseCase: Get recent queries for a user
 * - StartProcessingQueryUseCase: Mark query as processing
 * - CompleteQueryUseCase: Complete query with AI response
 * - FailQueryUseCase: Mark query as failed
 * - CancelQueryUseCase: Cancel a pending query
 * - RetryQueryUseCase: Retry a failed query
 * - GetPendingQueriesUseCase: Get all pending queries
 */

export * from './dto';
export * from './use-cases';
export * from './services';
