import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { QueriesService, QuerySearchOptions } from './services/queries.service';
import {
  SubmitLegalQueryInput,
  AnswerLegalQueryInput,
  CreateCitationInput,
  AskLegalQuestionInput,
} from './dto/legal-query.dto';
import {
  SearchLegalQueriesInput,
  LegalQuerySearchResponse,
} from './dto/legal-query-search.dto';
import { LegalQuery, Citation } from './entities/legal-query.entity';
import { StrictThrottle, SkipThrottle } from '../../shared/throttler';
import { AiClientService } from '../../shared/ai-client/ai-client.service';
import { QuotaGuard, RequireQuota, QuotaType } from '../../shared';
import { GqlAuthGuard } from '../auth/guards';

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
@UseGuards(GqlAuthGuard, QuotaGuard)
export class QueriesResolver {
  constructor(
    private readonly queriesService: QueriesService,
    private readonly aiClientService: AiClientService,
  ) {}

  /**
   * Query: Get queries by session ID
   * Convenience query for filtering by session - also available via legalQueries filter
   */
  @SkipThrottle()
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
   * Query: Full-text search for legal queries
   *
   * Searches across questions, answers, and citations.
   * Returns results ranked by relevance with highlighted snippets.
   *
   * @param input - Search options including query string and filters
   * @returns Paginated search results with relevance ranking
   */
  @SkipThrottle()
  @Query(() => LegalQuerySearchResponse, {
    name: 'searchLegalQueries',
    description: 'Full-text search across queries with relevance ranking',
  })
  async searchQueries(
    @Args('input') input: SearchLegalQueriesInput,
  ): Promise<LegalQuerySearchResponse> {
    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;

    const searchOptions: QuerySearchOptions = {
      query: input.query,
      sessionId: input.sessionId ?? undefined,
      startDate: input.startDate ?? undefined,
      endDate: input.endDate ?? undefined,
      limit,
      offset,
    };

    const [results, totalCount] = await Promise.all([
      this.queriesService.search(searchOptions),
      this.queriesService.countSearchResults(searchOptions),
    ]);

    return {
      results: results.map((r) => ({
        ...r.query,
        rank: r.rank,
        headline: r.headline ?? null,
      })),
      totalCount,
      count: results.length,
      offset,
      hasMore: offset + results.length < totalCount,
    };
  }

  /**
   * Query: Get pending queries (queries without answers)
   * Useful for monitoring AI processing queue
   */
  @SkipThrottle()
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
   * Quota check: Requires one query quota
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
  @StrictThrottle()
  @RequireQuota(QuotaType.QUERY)
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
   * Mutation: Ask a legal question with AI (synchronous)
   *
   * Calls the AI engine to answer the question and stores the result.
   * This mutation blocks until the AI response is received.
   *
   * Unlike submitLegalQuery (which is async and event-driven),
   * this mutation returns the complete answer immediately.
   *
   * Use cases:
   * - Direct Q&A where immediate response is needed
   * - Simple synchronous question-answer flow
   * - Testing AI integration
   *
   * Quota check: Requires one query quota
   *
   * @example
   * ```graphql
   * mutation {
   *   askLegalQuestion(input: {
   *     sessionId: "uuid-here"
   *     question: "What are my rights as a tenant?"
   *     mode: "SIMPLE"
   *   }) {
   *     id
   *     question
   *     answerMarkdown
   *     citations { source article url }
   *     createdAt
   *   }
   * }
   * ```
   */
  @StrictThrottle()
  @RequireQuota(QuotaType.QUERY)
  @Mutation(() => LegalQuery, {
    name: 'askLegalQuestion',
    description: 'Ask a legal question and get AI answer synchronously',
  })
  async askQuestion(
    @Args('input') input: AskLegalQuestionInput,
  ): Promise<LegalQuery> {
    return this.queriesService.askQuestion(
      {
        sessionId: input.sessionId,
        question: input.question,
        mode: input.mode,
      },
      async (question, sessionId, mode) => {
        return this.aiClientService.askQuestion({
          question,
          session_id: sessionId,
          mode,
        });
      },
    );
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
