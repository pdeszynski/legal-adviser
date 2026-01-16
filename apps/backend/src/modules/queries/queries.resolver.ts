import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { QueriesService } from './services/queries.service';
import {
  SubmitLegalQueryInput,
  AnswerLegalQueryInput,
  CreateCitationInput,
} from './dto/legal-query.dto';
import { LegalQuery, Citation } from './entities/legal-query.entity';

/**
 * Custom GraphQL Resolver for Legal Queries
 *
 * Provides custom business logic mutations that complement the
 * auto-generated CRUD resolvers from nestjs-query.
 *
 * Auto-generated operations (via nestjs-query):
 * - legalQueries: Query all queries with filtering, sorting, paging
 * - legalQuery: Query single query by ID
 * - createOneLegalQuery: Create a new query (full control)
 * - updateOneLegalQuery: Update a query
 * - deleteOneLegalQuery: Delete a query
 *
 * Custom operations (this resolver):
 * - queriesBySession: Query queries by session ID (convenience query)
 * - pendingQueries: Get queries waiting for AI answers
 * - submitLegalQuery: Submit a new query for AI processing
 * - answerLegalQuery: Add AI-generated answer to a query
 * - addCitationToQuery: Add a citation to an existing query
 *
 * Part of User Story 2: AI-Powered Legal Q&A
 */
@Resolver(() => LegalQuery)
export class QueriesResolver {
  constructor(private readonly queriesService: QueriesService) {}

  /**
   * Query: Get queries by session ID
   * Convenience query for filtering by session - also available via legalQueries filter
   */
  @Query(() => [LegalQuery], {
    name: 'queriesBySession',
    description: 'Get all legal queries for a specific session',
  })
  async findBySession(
    @Args('sessionId', { type: () => String }) sessionId: string,
  ): Promise<LegalQuery[]> {
    return this.queriesService.findBySessionId(sessionId);
  }

  /**
   * Query: Get pending queries (queries without answers)
   * Useful for monitoring AI processing queue
   */
  @Query(() => [LegalQuery], {
    name: 'pendingQueries',
    description: 'Get legal queries that are waiting for AI answers',
  })
  async getPendingQueries(
    @Args('limit', { type: () => Number, nullable: true }) limit?: number,
  ): Promise<LegalQuery[]> {
    return this.queriesService.getPendingQueries(limit);
  }

  /**
   * Mutation: Submit a new legal query
   *
   * Creates a new query and queues it for AI processing.
   * Returns the query with null answerMarkdown (pending state).
   *
   * This is the primary entry point for the Q&A flow:
   * 1. User submits question via this mutation
   * 2. Event is emitted for async AI processing
   * 3. Frontend can poll or subscribe for updates
   * 4. Use answerLegalQuery to add the AI response
   *
   * @example
   * ```graphql
   * mutation {
   *   submitLegalQuery(input: {
   *     sessionId: "uuid-here"
   *     question: "What are my rights as a tenant?"
   *   }) {
   *     id
   *     question
   *     answerMarkdown  # Will be null initially
   *     createdAt
   *   }
   * }
   * ```
   */
  @Mutation(() => LegalQuery, {
    name: 'submitLegalQuery',
    description: 'Submit a new legal query for AI processing',
  })
  async submitQuery(
    @Args('input') input: SubmitLegalQueryInput,
  ): Promise<LegalQuery> {
    return this.queriesService.submitQuery({
      sessionId: input.sessionId,
      question: input.question,
    });
  }

  /**
   * Mutation: Answer a legal query
   *
   * Adds an AI-generated answer and optional citations to an existing query.
   * Typically called by the AI processing service after generating a response.
   *
   * @example
   * ```graphql
   * mutation {
   *   answerLegalQuery(
   *     id: "query-uuid"
   *     input: {
   *       answerMarkdown: "## Your Rights as a Tenant\n\n..."
   *       citations: [
   *         { source: "Civil Code", article: "Art. 659" }
   *       ]
   *     }
   *   ) {
   *     id
   *     answerMarkdown
   *     citations { source article }
   *   }
   * }
   * ```
   */
  @Mutation(() => LegalQuery, {
    name: 'answerLegalQuery',
    description: 'Add AI-generated answer to a legal query',
  })
  async answerQuery(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: AnswerLegalQueryInput,
  ): Promise<LegalQuery> {
    const citations: Citation[] | undefined = input.citations?.map(
      (c: CreateCitationInput) => ({
        source: c.source,
        article: c.article,
        url: c.url,
        excerpt: c.excerpt,
      }),
    );

    return this.queriesService.answerQuery(id, input.answerMarkdown, citations);
  }

  /**
   * Mutation: Add a citation to an existing query
   *
   * Allows incrementally adding citations to a query after the initial answer.
   * Useful when citations are discovered during post-processing.
   */
  @Mutation(() => LegalQuery, {
    name: 'addCitationToQuery',
    description: 'Add a citation to an existing legal query',
  })
  async addCitation(
    @Args('queryId', { type: () => ID }) queryId: string,
    @Args('citation') citationInput: CreateCitationInput,
  ): Promise<LegalQuery> {
    const citation: Citation = {
      source: citationInput.source,
      article: citationInput.article,
      url: citationInput.url,
      excerpt: citationInput.excerpt,
    };

    return this.queriesService.addCitation(queryId, citation);
  }

  /**
   * Mutation: Delete a legal query
   *
   * @deprecated Use deleteOneLegalQuery from nestjs-query instead.
   * This mutation is kept for backward compatibility with existing clients.
   */
  @Mutation(() => Boolean, {
    name: 'deleteLegalQuery',
    deprecationReason: 'Use deleteOneLegalQuery instead',
    description: 'Delete a legal query (deprecated)',
  })
  async deleteQuery(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.queriesService.delete(id);
    return true;
  }
}
