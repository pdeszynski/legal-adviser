import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ClarificationSessionsService } from './services/clarification-sessions.service';
import {
  ClarificationSession,
  ClarificationState,
} from './entities/clarification-session.entity';
import {
  CreateClarificationSessionInput,
  SubmitClarificationAnswersInput,
  CancelClarificationSessionInput,
} from './dto/clarification-session.dto';
import { GqlAuthGuard } from '../auth/guards';
import { SkipThrottle } from '../../shared/throttler';

/**
 * Custom GraphQL Resolver for Clarification Sessions
 *
 * Provides mutations and queries for managing multi-turn clarification flows.
 * Complements the auto-generated CRUD resolvers from nestjs-query.
 *
 * Auto-generated operations (via nestjs-query):
 * - clarificationSessions: Query all sessions with filtering, sorting, paging
 * - clarificationSession: Query single session by ID
 * - createOneClarificationSession: Create a new session (full control)
 * - updateOneClarificationSession: Update a session
 * - deleteOneClarificationSession: Delete a session
 *
 * Custom operations (this resolver):
 * - clarificationSessionByQuery: Get active clarification session for a query
 * - submitClarificationAnswers: Submit user's answers to clarification questions
 * - cancelClarificationSession: Cancel an active clarification session
 * - getClarificationContext: Get formatted context for AI processing
 */
@Resolver(() => ClarificationSession)
@UseGuards(GqlAuthGuard)
export class ClarificationSessionsResolver {
  constructor(
    private readonly clarificationService: ClarificationSessionsService,
  ) {}

  /**
   * Query: Get active clarification session for a query
   *
   * Returns the current (non-terminal) clarification session for a specific query.
   * Useful for checking if a query has pending clarifications.
   */
  @SkipThrottle()
  @Query(() => ClarificationSession, {
    name: 'clarificationSessionByQuery',
    description: 'Get the active clarification session for a specific query',
    nullable: true,
  })
  async findByQuery(
    @Args('queryId', { type: () => String }) queryId: string,
  ): Promise<ClarificationSession | null> {
    return this.clarificationService.findActiveByQueryId(queryId);
  }

  /**
   * Query: Get formatted context for AI processing
   *
   * Returns a formatted string containing all accumulated context and answers
   * for a clarification session. Used internally by the AI engine.
   */
  @SkipThrottle()
  @Query(() => String, {
    name: 'getClarificationContext',
    description:
      'Get formatted context for AI processing from a clarification session',
    nullable: true,
  })
  async getContext(
    @Args('sessionId', { type: () => String }) sessionId: string,
  ): Promise<string | null> {
    try {
      return await this.clarificationService.getFormattedContext(sessionId);
    } catch {
      return null;
    }
  }

  /**
   * Query: Get clarification sessions by state
   *
   * Returns all sessions in a specific state.
   * Useful for monitoring and debugging.
   */
  @SkipThrottle()
  @Query(() => [ClarificationSession], {
    name: 'clarificationSessionsByState',
    description: 'Get all clarification sessions in a specific state',
  })
  async findByState(
    @Args('state', { type: () => ClarificationState })
    state: ClarificationState,
  ): Promise<ClarificationSession[]> {
    return this.clarificationService.findByState(state);
  }

  /**
   * Query: Get clarification sessions for user session
   *
   * Returns all clarification sessions associated with a user session.
   */
  @SkipThrottle()
  @Query(() => [ClarificationSession], {
    name: 'clarificationSessionsByUserSession',
    description: 'Get all clarification sessions for a user session',
  })
  async findByUserSession(
    @Args('sessionId', { type: () => String }) sessionId: string,
  ): Promise<ClarificationSession[]> {
    return this.clarificationService.findByUserSessionId(sessionId);
  }

  /**
   * Mutation: Create a new clarification session
   *
   * Creates a new clarification session for a query.
   * Typically called internally when AI determines clarification is needed.
   *
   * @example
   * ```graphql
   * mutation {
   *   createClarificationSession(input: {
   *     queryId: "uuid-here"
   *     questions: ["What is the timeline?", "Who are the parties involved?"]
   *     initialContext: ["User is asking about contract termination"]
   *   }) {
   *     id
   *     state
   *     questionsAsked
   *     expiresAt
   *   }
   * }
   * ```
   */
  @Mutation(() => ClarificationSession, {
    name: 'createClarificationSession',
    description: 'Create a new clarification session for a query',
  })
  async createSession(
    @Args('input') input: CreateClarificationSessionInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<ClarificationSession> {
    return this.clarificationService.createSession({
      queryId: input.queryId,
      sessionId: input.sessionId,
      questions: input.questions,
      initialContext: input.initialContext,
    });
  }

  /**
   * Mutation: Submit answers to a clarification session
   *
   * Submits the user's answers to clarification questions.
   * Transitions the session from PENDING to ANSWERED state.
   *
   * @example
   * ```graphql
   * mutation {
   *   submitClarificationAnswers(input: {
   *     sessionId: "uuid-here"
   *     answers: [
   *       { question: "What is the timeline?", question_type: "timeline", answer: "Within 30 days" }
   *       { question: "Who are the parties?", question_type: "parties", answer: "My company and Vendor X" }
   *     ]
   *   }) {
   *     id
   *     state
   *     answersReceived { question answer }
   *     rounds
   *   }
   * }
   * ```
   */
  @Mutation(() => ClarificationSession, {
    name: 'submitClarificationAnswers',
    description: 'Submit answers to clarification questions',
  })
  async submitAnswers(
    @Args('input') input: SubmitClarificationAnswersInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<ClarificationSession> {
    return this.clarificationService.submitAnswers({
      sessionId: input.sessionId,
      answers: input.answers,
      additionalContext: input.additionalContext,
    });
  }

  /**
   * Mutation: Cancel a clarification session
   *
   * Cancels an active clarification session.
   * Transitions the session to CANCELLED state.
   *
   * @example
   * ```graphql
   * mutation {
   *   cancelClarificationSession(input: {
   *     sessionId: "uuid-here"
   *   }) {
   *     id
   *     state
   *     completedAt
   *   }
   * }
   * ```
   */
  @Mutation(() => ClarificationSession, {
    name: 'cancelClarificationSession',
    description: 'Cancel an active clarification session',
  })
  async cancelSession(
    @Args('input') input: CancelClarificationSessionInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<ClarificationSession> {
    return this.clarificationService.cancelSession(input.sessionId);
  }

  /**
   * Mutation: Complete a clarification session
   *
   * Marks a clarification session as complete with a reference to the final query.
   * Transitions the session to COMPLETE state.
   * Typically called internally after AI processes the answers.
   *
   * @example
   * ```graphql
   * mutation {
   *   completeClarificationSession(
   *     sessionId: "uuid-here"
   *     finalQueryId: "final-query-uuid"
   *   ) {
   *     id
   *     state
   *     finalQueryId
   *     completedAt
   *   }
   * }
   * ```
   */
  @Mutation(() => ClarificationSession, {
    name: 'completeClarificationSession',
    description: 'Complete a clarification session with final answer reference',
  })
  async completeSession(
    @Args('sessionId', { type: () => String }) sessionId: string,
    @Args('finalQueryId', { type: () => String }) finalQueryId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<ClarificationSession> {
    return this.clarificationService.completeSession(sessionId, finalQueryId);
  }
}
