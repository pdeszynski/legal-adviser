import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
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
}
