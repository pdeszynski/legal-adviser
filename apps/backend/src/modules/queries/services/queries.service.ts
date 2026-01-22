import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LegalQuery, Citation } from '../entities/legal-query.entity';
import { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';

/**
 * Submit Query DTO
 */
export interface SubmitQueryDto {
  sessionId: string;
  question: string;
  citations?: Citation[];
}

/**
 * Update Query DTO
 */
export interface UpdateQueryDto {
  question?: string;
  answerMarkdown?: string;
  citations?: Citation[];
}

/**
 * Query Options for filtering
 */
export interface QueryOptions {
  sessionId?: string;
  hasAnswer?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Search result with relevance score
 */
export interface QuerySearchResult {
  query: LegalQuery;
  rank: number;
  headline?: string;
}

/**
 * Search options for full-text search
 */
export interface QuerySearchOptions {
  query: string;
  sessionId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Query Submitted Event
 */
export class QuerySubmittedEvent {
  constructor(
    public readonly queryId: string,
    public readonly sessionId: string,
    public readonly question: string,
    public readonly timestamp: Date,
  ) {}
}

/**
 * Query Answered Event
 */
export class QueryAnsweredEvent {
  constructor(
    public readonly queryId: string,
    public readonly sessionId: string,
    public readonly citationCount: number,
    public readonly timestamp: Date,
  ) {}
}

/**
 * Queries Service
 *
 * Provides business logic operations for LegalQuery entities.
 * Emits domain events for inter-module communication.
 *
 * Part of User Story 2: AI-Powered Legal Q&A.
 *
 * This service handles:
 * - Submitting new legal queries
 * - Answering queries with AI-generated responses
 * - Managing citations and references
 * - Query lifecycle management
 */
@Injectable()
export class QueriesService {
  constructor(
    @InjectRepository(LegalQuery)
    private readonly queryRepository: Repository<LegalQuery>,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Submit a new legal query
   *
   * Creates a new query in pending state, waiting for AI processing.
   * Emits 'query.asked' event for async processing.
   */
  async submitQuery(dto: SubmitQueryDto): Promise<LegalQuery> {
    const query = this.queryRepository.create({
      sessionId: dto.sessionId,
      question: dto.question,
      answerMarkdown: null,
      citations: dto.citations ?? null,
    });

    const savedQuery = await this.queryRepository.save(query);

    // Emit domain event for async processing
    this.eventEmitter.emit(
      EVENT_PATTERNS.QUERY.ASKED,
      new QuerySubmittedEvent(
        savedQuery.id,
        savedQuery.sessionId,
        savedQuery.question,
        savedQuery.createdAt,
      ),
    );

    return savedQuery;
  }

  /**
   * Find a query by ID
   */
  async findById(id: string): Promise<LegalQuery | null> {
    return this.queryRepository.findOne({
      where: { id },
      relations: ['session'],
    });
  }

  /**
   * Find a query by ID or throw NotFoundException
   */
  async findByIdOrFail(id: string): Promise<LegalQuery> {
    const query = await this.findById(id);
    if (!query) {
      throw new NotFoundException(`Query with ID ${id} not found`);
    }
    return query;
  }

  /**
   * Find all queries with optional filtering
   */
  async findAll(options?: QueryOptions): Promise<LegalQuery[]> {
    const where: FindOptionsWhere<LegalQuery> = {};

    if (options?.sessionId) {
      where.sessionId = options.sessionId;
    }

    const queryBuilder = this.queryRepository
      .createQueryBuilder('query')
      .leftJoinAndSelect('query.session', 'session')
      .orderBy('query.createdAt', 'DESC');

    if (options?.sessionId) {
      queryBuilder.where('query.sessionId = :sessionId', {
        sessionId: options.sessionId,
      });
    }

    if (options?.hasAnswer !== undefined) {
      if (options.hasAnswer) {
        queryBuilder.andWhere('query.answerMarkdown IS NOT NULL');
      } else {
        queryBuilder.andWhere('query.answerMarkdown IS NULL');
      }
    }

    if (options?.limit) {
      queryBuilder.take(options.limit);
    }

    if (options?.offset) {
      queryBuilder.skip(options.offset);
    }

    return queryBuilder.getMany();
  }

  /**
   * Find queries by session ID
   */
  async findBySessionId(sessionId: string): Promise<LegalQuery[]> {
    return this.findAll({ sessionId });
  }

  /**
   * Update a query (primarily for adding answers)
   */
  async update(id: string, dto: UpdateQueryDto): Promise<LegalQuery> {
    const query = await this.findByIdOrFail(id);

    if (dto.question !== undefined) {
      query.question = dto.question;
    }

    if (dto.answerMarkdown !== undefined) {
      query.answerMarkdown = dto.answerMarkdown;
    }

    if (dto.citations !== undefined) {
      query.citations = dto.citations;
    }

    return this.queryRepository.save(query);
  }

  /**
   * Answer a query with AI-generated response
   *
   * Sets the answer and optional citations, then emits 'query.answered' event.
   */
  async answerQuery(
    id: string,
    answer: string,
    citations?: Citation[],
  ): Promise<LegalQuery> {
    const query = await this.findByIdOrFail(id);

    query.setAnswer(answer, citations);

    const savedQuery = await this.queryRepository.save(query);

    // Emit domain event
    this.eventEmitter.emit(
      EVENT_PATTERNS.QUERY.ANSWERED,
      new QueryAnsweredEvent(
        savedQuery.id,
        savedQuery.sessionId,
        savedQuery.getCitationCount(),
        new Date(),
      ),
    );

    return savedQuery;
  }

  /**
   * Add a citation to an existing query
   */
  async addCitation(id: string, citation: Citation): Promise<LegalQuery> {
    const query = await this.findByIdOrFail(id);
    query.addCitation(citation);
    return this.queryRepository.save(query);
  }

  /**
   * Delete a query
   */
  async delete(id: string): Promise<void> {
    const query = await this.findByIdOrFail(id);
    await this.queryRepository.remove(query);
  }

  /**
   * Count queries with optional filtering
   */
  async count(
    options?: Omit<QueryOptions, 'limit' | 'offset'>,
  ): Promise<number> {
    const queryBuilder = this.queryRepository.createQueryBuilder('query');

    if (options?.sessionId) {
      queryBuilder.where('query.sessionId = :sessionId', {
        sessionId: options.sessionId,
      });
    }

    if (options?.hasAnswer !== undefined) {
      if (options.hasAnswer) {
        queryBuilder.andWhere('query.answerMarkdown IS NOT NULL');
      } else {
        queryBuilder.andWhere('query.answerMarkdown IS NULL');
      }
    }

    return queryBuilder.getCount();
  }

  /**
   * Get pending queries (queries without answers)
   * Useful for AI processing queues
   */
  async getPendingQueries(limit?: number): Promise<LegalQuery[]> {
    return this.findAll({ hasAnswer: false, limit });
  }

  /**
   * Ask a legal question and get AI response
   *
   * Synchronously calls the AI engine to answer the question and stores the result.
   * Unlike submitQuery, this method waits for the AI response before returning.
   *
   * @param dto - Question data with optional mode
   * @param askQuestionFn - Function to call the AI engine (injected for testability)
   * @returns The query with the AI-generated answer and citations
   */
  async askQuestion(
    dto: SubmitQueryDto & { mode?: string },
    askQuestionFn: (
      question: string,
      sessionId: string,
      mode?: string,
    ) => Promise<{
      answer: string;
      citations: Array<{ source: string; article: string; url?: string }>;
      confidence: number;
    }>,
  ): Promise<LegalQuery> {
    // Create query in pending state
    const query = this.queryRepository.create({
      sessionId: dto.sessionId,
      question: dto.question,
      answerMarkdown: null,
      citations: null,
    });

    const savedQuery = await this.queryRepository.save(query);

    try {
      // Call AI engine synchronously
      const aiResponse = await askQuestionFn(
        dto.question,
        dto.sessionId,
        dto.mode || 'SIMPLE',
      );

      // Convert AI citations to entity format
      const entityCitations: Citation[] = aiResponse.citations.map((c) => ({
        source: c.source,
        article: c.article,
        url: c.url,
        excerpt: undefined,
      }));

      // Update query with AI response
      savedQuery.setAnswer(aiResponse.answer, entityCitations);
      const updatedQuery = await this.queryRepository.save(savedQuery);

      // Emit domain event
      this.eventEmitter.emit(
        EVENT_PATTERNS.QUERY.ANSWERED,
        new QueryAnsweredEvent(
          updatedQuery.id,
          updatedQuery.sessionId,
          updatedQuery.getCitationCount(),
          new Date(),
        ),
      );

      return updatedQuery;
    } catch (error) {
      // If AI call fails, still keep the query but with null answer
      // The caller can retry or handle the error
      this.eventEmitter.emit(
        EVENT_PATTERNS.QUERY.ASKED,
        new QuerySubmittedEvent(
          savedQuery.id,
          savedQuery.sessionId,
          savedQuery.question,
          savedQuery.createdAt,
        ),
      );
      throw error;
    }
  }

  /**
   * Full-text search for legal queries
   *
   * Uses PostgreSQL's full-text search with:
   * - to_tsquery for query parsing
   * - ts_rank for relevance scoring
   * - ts_headline for highlighted snippets
   *
   * @param options Search options including query string and filters
   * @returns Array of search results with relevance ranking
   */
  async search(options: QuerySearchOptions): Promise<QuerySearchResult[]> {
    const {
      query,
      sessionId,
      startDate,
      endDate,
      limit = 20,
      offset = 0,
    } = options;

    // Sanitize the search query for PostgreSQL
    const sanitizedQuery = this.sanitizeSearchQuery(query);

    if (!sanitizedQuery) {
      return [];
    }

    // Build the search query using PostgreSQL full-text search
    let sql = `
      SELECT
        q.*,
        ts_rank(
          COALESCE(q."searchVector", to_tsvector('simple', '')),
          plainto_tsquery('simple', $1)
        ) as rank,
        ts_headline(
          'simple',
          COALESCE(q.question, '') || ' ' || COALESCE(q."answerMarkdown", ''),
          plainto_tsquery('simple', $1),
          'MaxWords=35, MinWords=15, ShortWord=3, HighlightAll=FALSE, MaxFragments=2, FragmentDelimiter=" ... "'
        ) as headline
      FROM legal_queries q
      WHERE (
        q."searchVector" @@ plainto_tsquery('simple', $1)
        OR q.question ILIKE $2
        OR COALESCE(q."answerMarkdown", '') ILIKE $2
      )
    `;

    const params: (string | Date | number)[] = [
      sanitizedQuery,
      `%${sanitizedQuery}%`,
    ];
    let paramIndex = 3;

    // Add session filter
    if (sessionId) {
      sql += ` AND q."sessionId" = $${paramIndex}`;
      params.push(sessionId);
      paramIndex++;
    }

    // Add date range filters
    if (startDate) {
      sql += ` AND q."createdAt" >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      sql += ` AND q."createdAt" <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    // Order by relevance rank, then by creation date
    sql += ` ORDER BY rank DESC, q."createdAt" DESC`;

    // Add pagination
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    // Execute the raw query
    const results = await this.dataSource.query(sql, params);

    // Map results to QuerySearchResult objects
    return results.map(
      (row: Record<string, unknown> & { rank: number; headline: string }) => ({
        query: this.mapRowToQuery(row),
        rank: parseFloat(row.rank?.toString() || '0'),
        headline: row.headline,
      }),
    );
  }

  /**
   * Count search results for pagination
   */
  async countSearchResults(
    options: Omit<QuerySearchOptions, 'limit' | 'offset'>,
  ): Promise<number> {
    const { query, sessionId, startDate, endDate } = options;

    const sanitizedQuery = this.sanitizeSearchQuery(query);
    if (!sanitizedQuery) {
      return 0;
    }

    let sql = `
      SELECT COUNT(*) as count
      FROM legal_queries q
      WHERE (
        q."searchVector" @@ plainto_tsquery('simple', $1)
        OR q.question ILIKE $2
        OR COALESCE(q."answerMarkdown", '') ILIKE $2
      )
    `;

    const params: (string | Date)[] = [sanitizedQuery, `%${sanitizedQuery}%`];
    let paramIndex = 3;

    if (sessionId) {
      sql += ` AND q."sessionId" = $${paramIndex}`;
      params.push(sessionId);
      paramIndex++;
    }

    if (startDate) {
      sql += ` AND q."createdAt" >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      sql += ` AND q."createdAt" <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await this.dataSource.query(sql, params);
    return parseInt(result[0]?.count || '0', 10);
  }

  /**
   * Update the search vector for a query using PostgreSQL tsvector
   * Uses weighted vectors for different fields (A=highest, D=lowest)
   */
  async updateSearchVector(queryId: string): Promise<void> {
    // Use PostgreSQL setweight function for weighted full-text search
    // A: question (highest weight)
    // B: citation sources, articles
    // C: citation excerpts
    // D: answer (lowest weight)
    await this.dataSource.query(
      `
      UPDATE legal_queries
      SET "searchVector" = (
        setweight(to_tsvector('simple', COALESCE(question, '')), 'A') ||
        setweight(to_tsvector('simple',
          COALESCE(
            array_to_string(
              ARRAY(
                SELECT jsonb_array_elements_text(
                  COALESCE(
                    jsonb_agg(DISTINCT jsonb_build_object('source', citations->>'source')),
                    '[]'::jsonb
                  )
                )
                FROM jsonb_array_elements(citations)
              ),
              ' '
            ),
            ''
          )
        ), 'B') ||
        setweight(to_tsvector('simple', COALESCE("answerMarkdown", '')), 'D')
      )
      WHERE id = $1
    `,
      [queryId],
    );
  }

  /**
   * Rebuild search vectors for all queries
   * Useful for initial setup or after schema changes
   */
  async rebuildAllSearchVectors(): Promise<number> {
    const queries = await this.queryRepository.find({ select: ['id'] });

    for (const query of queries) {
      await this.updateSearchVector(query.id);
    }

    return queries.length;
  }

  /**
   * Sanitize search query to prevent SQL injection and handle special characters
   */
  private sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') {
      return '';
    }

    // Trim and remove excessive whitespace
    let sanitized = query.trim().replace(/\s+/g, ' ');

    // Remove special characters that could affect tsquery parsing
    // Keep alphanumeric, spaces, and Polish diacritics
    sanitized = sanitized.replace(/[^\w\s\u0080-\u017F]/g, ' ');

    return sanitized.trim();
  }

  /**
   * Map raw database row to LegalQuery entity
   */
  private mapRowToQuery(row: Record<string, unknown>): LegalQuery {
    const query = new LegalQuery();
    query.id = row['id'] as string;
    query.sessionId = row['sessionId'] as string;
    query.question = row['question'] as string;
    query.answerMarkdown = row['answerMarkdown'] as string | null;
    query.citations = row['citations'] as Citation[] | null;
    query.createdAt = new Date(row['createdAt'] as string);
    query.updatedAt = new Date(row['updatedAt'] as string);
    return query;
  }
}
