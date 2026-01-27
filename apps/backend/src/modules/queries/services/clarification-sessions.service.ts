import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ClarificationSession,
  ClarificationState,
  ClarificationAnswer,
} from '../entities/clarification-session.entity';
import { LegalQuery } from '../entities/legal-query.entity';
import { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * DTO for creating a clarification session
 */
export interface CreateClarificationSessionDto {
  queryId: string;
  sessionId?: string;
  questions: string[];
  initialContext?: string[];
}

/**
 * DTO for submitting answers to a clarification session
 */
export interface SubmitAnswersDto {
  sessionId: string;
  answers: Array<{ question: string; question_type: string; answer: string }>;
  additionalContext?: string[];
}

/**
 * Clarification Session Created Event
 */
export class ClarificationSessionCreatedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly queryId: string,
    public readonly questionCount: number,
    public readonly timestamp: Date,
  ) {}
}

/**
 * Clarification Session Completed Event
 */
export class ClarificationSessionCompletedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly queryId: string,
    public readonly finalQueryId: string,
    public readonly rounds: number,
    public readonly timestamp: Date,
  ) {}
}

/**
 * Clarification Session Expired Event
 */
export class ClarificationSessionExpiredEvent {
  constructor(
    public readonly sessionId: string,
    public readonly queryId: string,
    public readonly timestamp: Date,
  ) {}
}

/**
 * Clarification Session State Transition Event
 */
export class ClarificationSessionStateTransitionEvent {
  constructor(
    public readonly sessionId: string,
    public readonly queryId: string,
    public readonly fromState: ClarificationState,
    public readonly toState: ClarificationState,
    public readonly timestamp: Date,
  ) {}
}

/**
 * Clarification Sessions Service
 *
 * Manages multi-turn clarification flows with proper state machine handling.
 *
 * State Machine:
 * - PENDING: Questions have been posed to user
 * - ANSWERED: User has provided answers, awaiting AI processing
 * - COMPLETE: Final answer has been generated
 * - EXPIRED: Session timed out (24 hours)
 * - CANCELLED: User cancelled the flow
 *
 * Features:
 * - State transition validation
 * - Automatic expiration handling
 * - Context accumulation across rounds
 * - Event emission for cross-module communication
 * - Periodic cleanup of stale sessions
 */
@Injectable()
export class ClarificationSessionsService {
  private readonly logger = new Logger(ClarificationSessionsService.name);
  private static readonly SESSION_TTL_HOURS = 24;

  constructor(
    @InjectRepository(ClarificationSession)
    private readonly sessionRepository: Repository<ClarificationSession>,
    @InjectRepository(LegalQuery)
    private readonly queryRepository: Repository<LegalQuery>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new clarification session
   *
   * Called when the AI determines that clarification is needed.
   *
   * @param dto - Session creation data
   * @returns The created session in PENDING state
   */
  async createSession(
    dto: CreateClarificationSessionDto,
  ): Promise<ClarificationSession> {
    // Verify the query exists
    const query = await this.queryRepository.findOne({
      where: { id: dto.queryId },
    });

    if (!query) {
      throw new NotFoundException(`Query with ID ${dto.queryId} not found`);
    }

    // Check if there's already an active clarification session for this query
    const existingSession = await this.findActiveByQueryId(dto.queryId);
    if (existingSession) {
      this.logger.warn(
        `Active clarification session already exists for query ${dto.queryId}. Returning existing session.`,
      );
      return existingSession;
    }

    // Create the session
    const session = this.sessionRepository.create({
      queryId: dto.queryId,
      sessionId: dto.sessionId || null,
      originalQuery: query.question,
      state: ClarificationState.PENDING,
      questionsAsked: dto.questions,
      answersReceived: [],
      accumulatedContext: dto.initialContext || [],
      rounds: 0,
      expiresAt: new Date(
        Date.now() +
          ClarificationSessionsService.SESSION_TTL_HOURS * 60 * 60 * 1000,
      ),
    });

    const savedSession = await this.sessionRepository.save(session);

    // Emit event
    this.eventEmitter.emit(
      EVENT_PATTERNS.CLARIFICATION.CREATED,
      new ClarificationSessionCreatedEvent(
        savedSession.id,
        savedSession.queryId,
        savedSession.getQuestionCount(),
        new Date(),
      ),
    );

    this.logger.log(
      `Created clarification session ${savedSession.id} for query ${dto.queryId}`,
    );

    return savedSession;
  }

  /**
   * Submit answers to a clarification session
   *
   * Adds the user's answers and transitions the session to ANSWERED state.
   *
   * @param dto - Answers submission data
   * @returns The updated session in ANSWERED state
   * @throws BadRequestException if session cannot accept answers
   */
  async submitAnswers(dto: SubmitAnswersDto): Promise<ClarificationSession> {
    const session = await this.findByIdOrFail(dto.sessionId);

    // Check if session can accept answers
    if (!session.canAcceptAnswers()) {
      if (session.isExpired()) {
        await this.expireSession(session.id);
        throw new BadRequestException(
          'Clarification session has expired. Please start a new query.',
        );
      }
      throw new BadRequestException(
        `Cannot submit answers to a session in ${session.state} state`,
      );
    }

    // Add answers to the session
    const answers: ClarificationAnswer[] = dto.answers.map((a) => ({
      question: a.question,
      question_type: a.question_type,
      answer: a.answer,
      answered_at: new Date(),
    }));

    session.addAnswers(answers);

    // Add additional context if provided
    if (dto.additionalContext && dto.additionalContext.length > 0) {
      session.addContext(dto.additionalContext);
    }

    // Transition to ANSWERED state
    session.transitionTo(ClarificationState.ANSWERED);

    const savedSession = await this.sessionRepository.save(session);

    // Emit state transition event
    this.eventEmitter.emit(
      EVENT_PATTERNS.CLARIFICATION.STATE_TRANSITION,
      new ClarificationSessionStateTransitionEvent(
        savedSession.id,
        savedSession.queryId,
        ClarificationState.PENDING,
        ClarificationState.ANSWERED,
        new Date(),
      ),
    );

    this.logger.log(
      `Submitted answers for clarification session ${dto.sessionId}, transitioned to ANSWERED`,
    );

    return savedSession;
  }

  /**
   * Find a clarification session by ID
   */
  async findById(id: string): Promise<ClarificationSession | null> {
    return this.sessionRepository.findOne({
      where: { id },
      relations: ['query', 'session', 'finalQuery'],
    });
  }

  /**
   * Find a clarification session by ID or throw
   */
  async findByIdOrFail(id: string): Promise<ClarificationSession> {
    const session = await this.findById(id);
    if (!session) {
      throw new NotFoundException(
        `Clarification session with ID ${id} not found`,
      );
    }
    return session;
  }

  /**
   * Find active (non-terminal) clarification session for a query
   */
  async findActiveByQueryId(
    queryId: string,
  ): Promise<ClarificationSession | null> {
    return this.sessionRepository.findOne({
      where: {
        queryId,
        state: ClarificationState.PENDING as ClarificationState,
      },
    });
  }

  /**
   * Find all sessions for a query
   */
  async findByQueryId(queryId: string): Promise<ClarificationSession[]> {
    return this.sessionRepository.find({
      where: { queryId },
      relations: ['query', 'finalQuery'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find all sessions for a user session
   */
  async findByUserSessionId(
    sessionId: string,
  ): Promise<ClarificationSession[]> {
    return this.sessionRepository.find({
      where: { sessionId },
      relations: ['query', 'finalQuery'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find all sessions in a specific state
   */
  async findByState(
    state: ClarificationState,
  ): Promise<ClarificationSession[]> {
    return this.sessionRepository.find({
      where: { state },
      relations: ['query', 'finalQuery'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Cancel a clarification session
   *
   * Transitions the session to CANCELLED state.
   *
   * @param sessionId - ID of the session to cancel
   * @returns The cancelled session
   */
  async cancelSession(sessionId: string): Promise<ClarificationSession> {
    const session = await this.findByIdOrFail(sessionId);

    if (session.isTerminal()) {
      throw new BadRequestException(
        `Cannot cancel a session in ${session.state} state`,
      );
    }

    session.cancel();
    const savedSession = await this.sessionRepository.save(session);

    // Emit state transition event
    this.eventEmitter.emit(
      EVENT_PATTERNS.CLARIFICATION.STATE_TRANSITION,
      new ClarificationSessionStateTransitionEvent(
        savedSession.id,
        savedSession.queryId,
        session.state,
        ClarificationState.CANCELLED,
        new Date(),
      ),
    );

    this.logger.log(`Cancelled clarification session ${sessionId}`);

    return savedSession;
  }

  /**
   * Expire a clarification session
   *
   * Transitions the session to EXPIRED state. Called internally.
   *
   * @param sessionId - ID of the session to expire
   * @returns The expired session
   */
  async expireSession(sessionId: string): Promise<ClarificationSession> {
    const session = await this.findByIdOrFail(sessionId);

    if (session.isTerminal()) {
      return session;
    }

    session.expire();
    const savedSession = await this.sessionRepository.save(session);

    // Emit expiration event
    this.eventEmitter.emit(
      EVENT_PATTERNS.CLARIFICATION.EXPIRED,
      new ClarificationSessionExpiredEvent(
        savedSession.id,
        savedSession.queryId,
        new Date(),
      ),
    );

    this.logger.log(`Expired clarification session ${sessionId}`);

    return savedSession;
  }

  /**
   * Complete a clarification session
   *
   * Transitions the session to COMPLETE state with a reference to the final query.
   *
   * @param sessionId - ID of the session to complete
   * @param finalQueryId - ID of the query containing the final answer
   * @returns The completed session
   */
  async completeSession(
    sessionId: string,
    finalQueryId: string,
  ): Promise<ClarificationSession> {
    const session = await this.findByIdOrFail(sessionId);

    session.complete(finalQueryId);
    const savedSession = await this.sessionRepository.save(session);

    // Emit completion event
    this.eventEmitter.emit(
      EVENT_PATTERNS.CLARIFICATION.COMPLETED,
      new ClarificationSessionCompletedEvent(
        savedSession.id,
        savedSession.queryId,
        finalQueryId,
        savedSession.rounds,
        new Date(),
      ),
    );

    this.logger.log(
      `Completed clarification session ${sessionId} with final query ${finalQueryId}`,
    );

    return savedSession;
  }

  /**
   * Update a session's state
   *
   * Used for internal state transitions.
   *
   * @param sessionId - ID of the session to update
   * @param state - New state
   * @param finalQueryId - Optional final query ID
   * @param errorMessage - Optional error message
   * @returns The updated session
   */
  async updateState(
    sessionId: string,
    state?: ClarificationState,
    finalQueryId?: string,
    errorMessage?: string,
  ): Promise<ClarificationSession> {
    const session = await this.findByIdOrFail(sessionId);

    if (state) {
      session.transitionTo(state);
    }

    if (finalQueryId) {
      session.finalQueryId = finalQueryId;
    }

    if (errorMessage) {
      session.errorMessage = errorMessage;
    }

    return this.sessionRepository.save(session);
  }

  /**
   * Add context to a session
   *
   * Adds additional context to the accumulated context array.
   *
   * @param sessionId - ID of the session
   * @param context - Context to add
   * @returns The updated session
   */
  async addContext(
    sessionId: string,
    context: string[],
  ): Promise<ClarificationSession> {
    const session = await this.findByIdOrFail(sessionId);

    session.addContext(context);

    return this.sessionRepository.save(session);
  }

  /**
   * Get the formatted context for AI processing
   *
   * Returns a formatted string with all accumulated context and answers.
   *
   * @param sessionId - ID of the session
   * @returns Formatted context string
   */
  async getFormattedContext(sessionId: string): Promise<string> {
    const session = await this.findByIdOrFail(sessionId);
    return session.getFormattedContext();
  }

  /**
   * Delete a clarification session
   *
   * Permanently removes the session from the database.
   *
   * @param sessionId - ID of the session to delete
   */
  async delete(sessionId: string): Promise<void> {
    const session = await this.findByIdOrFail(sessionId);
    await this.sessionRepository.remove(session);
    this.logger.log(`Deleted clarification session ${sessionId}`);
  }

  /**
   * Scheduled task: Expire stale sessions
   *
   * Runs every hour to mark expired sessions.
   * Sessions older than 24 hours are marked as EXPIRED.
   *
   * @Cron(CronExpression.EVERY_HOUR)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async expireStaleSessions(): Promise<void> {
    const now = new Date();
    const expiredSessions = await this.sessionRepository.find({
      where: {
        expiresAt: LessThan(now),
        state: ClarificationState.PENDING as ClarificationState,
      },
      relations: ['query'],
    });

    let expiredCount = 0;

    for (const session of expiredSessions) {
      try {
        await this.expireSession(session.id);
        expiredCount++;
      } catch (error) {
        this.logger.error(
          `Failed to expire session ${session.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    if (expiredCount > 0) {
      this.logger.log(`Expired ${expiredCount} stale clarification sessions`);
    }
  }

  /**
   * Scheduled task: Clean up old completed sessions
   *
   * Runs daily at 3 AM to remove completed sessions older than 30 days.
   *
   * @Cron('0 3 * * *')
   */
  @Cron('0 3 * * *')
  async cleanupOldSessions(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await this.sessionRepository
      .createQueryBuilder('session')
      .delete()
      .where('state IN (:...states) AND "createdAt" < :cutoff', {
        states: [ClarificationState.COMPLETE, ClarificationState.CANCELLED],
        cutoff: thirtyDaysAgo,
      })
      .execute();

    const deletedCount = result.affected || 0;

    if (deletedCount > 0) {
      this.logger.log(`Cleaned up ${deletedCount} old clarification sessions`);
    }

    return deletedCount;
  }

  /**
   * Get statistics for a query's clarification sessions
   *
   * Returns aggregate statistics about all clarification sessions for a query.
   *
   * @param queryId - ID of the query
   * @returns Statistics object
   */
  async getQueryStats(queryId: string): Promise<{
    totalSessions: number;
    completedSessions: number;
    expiredSessions: number;
    cancelledSessions: number;
    averageRounds: number;
  }> {
    const sessions = await this.findByQueryId(queryId);

    return {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(
        (s) => s.state === ClarificationState.COMPLETE,
      ).length,
      expiredSessions: sessions.filter(
        (s) => s.state === ClarificationState.EXPIRED,
      ).length,
      cancelledSessions: sessions.filter(
        (s) => s.state === ClarificationState.CANCELLED,
      ).length,
      averageRounds:
        sessions.length > 0
          ? sessions.reduce((sum, s) => sum + s.rounds, 0) / sessions.length
          : 0,
    };
  }
}
