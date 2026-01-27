import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import {
  FilterableField,
  IDField,
  QueryOptions,
  Relation,
} from '@ptc-org/nestjs-query-graphql';
import {
  ObjectType,
  ID,
  Field,
  GraphQLISODateTime,
  registerEnumType,
} from '@nestjs/graphql';
import { UserSession } from '../../users/entities/user-session.entity';
import { LegalQuery } from './legal-query.entity';

/**
 * Clarification State Enum
 *
 * Represents the current state of a clarification session in the state machine.
 *
 * State Transitions:
 * - PENDING -> ANSWERED: User submits answers to clarification questions
 * - ANSWERED -> COMPLETE: AI processes answers and generates final response
 * - PENDING -> EXPIRED: Session times out (24 hours)
 * - ANSWERED -> EXPIRED: Session times out during processing
 * - Any -> CANCELLED: User cancels the clarification flow
 */
export enum ClarificationState {
  /** Initial state - questions have been posed to user */
  PENDING = 'PENDING',
  /** User has provided answers, awaiting AI processing */
  ANSWERED = 'ANSWERED',
  /** Clarification complete, final answer has been generated */
  COMPLETE = 'COMPLETE',
  /** Session expired due to timeout */
  EXPIRED = 'EXPIRED',
  /** User cancelled the clarification flow */
  CANCELLED = 'CANCELLED',
}

registerEnumType(ClarificationState, {
  name: 'ClarificationState',
  description: 'The current state of a clarification session',
});

/**
 * Clarification Answer Interface
 *
 * Represents a single answer provided by the user during clarification.
 */
export interface ClarificationAnswer {
  /** The question that was asked */
  question: string;
  /** The type of question */
  question_type: string;
  /** The user's answer */
  answer: string;
  /** Timestamp when the answer was provided */
  answered_at?: Date;
}

/**
 * GraphQL Object Type for Clarification Answer
 */
@ObjectType('ClarificationAnswer')
export class ClarificationAnswerType {
  @Field(() => String)
  question: string;

  @Field(() => String)
  question_type: string;

  @Field(() => String)
  answer: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  answered_at?: Date;
}

/**
 * Clarification Session Entity
 *
 * Tracks multi-turn clarification flows for legal queries.
 *
 * Aggregate Root: ClarificationSession
 * Invariants:
 *   - A session must be linked to a legal query
 *   - Original query text cannot be changed after creation
 *   - State transitions follow the state machine rules
 *   - Sessions expire after 24 hours of inactivity
 *
 * Uses nestjs-query decorators for auto-generated CRUD resolvers.
 *
 * State Machine:
 *
 *     ┌─────────┐
 *     │ PENDING │
 *     └────┬────┘
 *          │
 *          ├─────────────┐
 *          │             │
 *          ▼             ▼
 *     ┌─────────┐   ┌──────────┐
 *     │ANSWERED │   │ EXPIRED  │◄─────┐
 *     └────┬────┘   └──────────┘      │
 *          │             │             │
 *          │             └─────────────┘
 *          ▼
 *     ┌──────────┐
 *     │ COMPLETE │
 *     └──────────┘
 *
 *     Any state ──> CANCELLED
 */
@Entity('clarification_sessions')
@ObjectType('ClarificationSession')
@QueryOptions({ enableTotalCount: true })
@Relation('query', () => LegalQuery)
@Relation('session', () => UserSession)
@Index(['queryId'])
@Index(['sessionId'])
@Index(['state'])
@Index(['createdAt'])
@Index(['expiresAt'])
export class ClarificationSession {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  /**
   * Reference to the legal query that triggered clarification
   */
  @Column({ type: 'uuid' })
  @FilterableField(() => ID)
  queryId: string;

  @ManyToOne(() => LegalQuery, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'queryId' })
  query: LegalQuery;

  /**
   * Reference to the user session (optional, for tracking)
   */
  @Column({ type: 'uuid', nullable: true })
  @FilterableField(() => ID, { nullable: true })
  sessionId: string | null;

  @ManyToOne(() => UserSession, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sessionId' })
  session: UserSession | null;

  /**
   * The original user query text
   * Stored separately in case the original query is modified
   */
  @Column({ type: 'text' })
  @FilterableField()
  originalQuery: string;

  /**
   * Current state in the clarification flow
   */
  @Column({
    type: 'enum',
    enum: ClarificationState,
    default: ClarificationState.PENDING,
  })
  @FilterableField(() => ClarificationState)
  state: ClarificationState;

  /**
   * Clarification questions posed to the user
   * Stored as JSONB for structured access
   */
  @Column({ type: 'jsonb', default: [] })
  @Field(() => [String], {
    description: 'Array of clarification question texts',
  })
  questionsAsked: string[];

  /**
   * Answers provided by the user
   * Stored as JSONB for structured access
   */
  @Column({ type: 'jsonb', default: [] })
  @Field(() => [ClarificationAnswerType], {
    description: 'User answers to clarification questions',
  })
  answersReceived: ClarificationAnswer[];

  /**
   * Accumulated context from all clarification rounds
   * This will be passed to the AI for final answer generation
   */
  @Column({ type: 'jsonb', nullable: true })
  @Field(() => [String], {
    nullable: true,
    description: 'Accumulated context for AI processing',
  })
  accumulatedContext: string[] | null;

  /**
   * Number of clarification rounds (for tracking complexity)
   */
  @Column({ type: 'int', default: 0 })
  @FilterableField(() => Number, {
    description: 'Number of clarification rounds',
  })
  rounds: number;

  /**
   * Timestamp when the session expires (24 hours after creation/last activity)
   */
  @Column({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime, {
    description: 'Session expiration timestamp',
  })
  expiresAt: Date;

  /**
   * Timestamp when the session was completed
   */
  @Column({ type: 'timestamp', nullable: true })
  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: 'Session completion timestamp',
  })
  completedAt: Date | null;

  /**
   * Reference to the final query that contains the AI's answer
   * Set when the session reaches COMPLETE state
   */
  @Column({ type: 'uuid', nullable: true })
  @FilterableField(() => ID, {
    nullable: true,
    description: 'Final query ID with complete answer',
  })
  finalQueryId: string | null;

  @ManyToOne(() => LegalQuery, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'finalQueryId' })
  finalQuery: LegalQuery | null;

  /**
   * Error message if the session failed
   */
  @Column({ type: 'text', nullable: true })
  @Field(() => String, {
    nullable: true,
    description: 'Error message if session failed',
  })
  errorMessage: string | null;

  /**
   * Timestamp when the session was created
   */
  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  /**
   * Timestamp when the session was last updated
   */
  @UpdateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  updatedAt: Date;

  /**
   * Lifecycle hook to set expiration on creation
   */
  @BeforeInsert()
  setExpiration(): void {
    if (!this.expiresAt) {
      // Sessions expire after 24 hours
      this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Lifecycle hook to update expiration on state changes
   */
  @BeforeUpdate()
  updateExpirationOnActivity(): void {
    // Extend expiration when user provides answers
    if (
      this.state === ClarificationState.ANSWERED &&
      this.answersReceived.length > 0
    ) {
      this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Check if the session is expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if the session is in a terminal state
   */
  isTerminal(): boolean {
    return [
      ClarificationState.COMPLETE,
      ClarificationState.EXPIRED,
      ClarificationState.CANCELLED,
    ].includes(this.state);
  }

  /**
   * Check if the session can accept answers
   */
  canAcceptAnswers(): boolean {
    return this.state === ClarificationState.PENDING && !this.isExpired();
  }

  /**
   * Get the number of questions asked
   */
  getQuestionCount(): number {
    return this.questionsAsked?.length ?? 0;
  }

  /**
   * Get the number of answers received
   */
  getAnswerCount(): number {
    return this.answersReceived?.length ?? 0;
  }

  /**
   * Check if all questions have been answered
   */
  allQuestionsAnswered(): boolean {
    return this.getAnswerCount() >= this.getQuestionCount();
  }

  /**
   * Add answers to the session
   */
  addAnswers(answers: ClarificationAnswer[]): void {
    const timestamp = new Date();
    const answersWithTimestamp = answers.map((a) => ({
      ...a,
      answered_at: a.answered_at || timestamp,
    }));

    if (!this.answersReceived) {
      this.answersReceived = [];
    }

    this.answersReceived.push(...answersWithTimestamp);
    this.rounds += 1;
  }

  /**
   * Add context to the accumulated context array
   */
  addContext(context: string[]): void {
    if (!this.accumulatedContext) {
      this.accumulatedContext = [];
    }
    this.accumulatedContext.push(...context);
  }

  /**
   * Get formatted context for AI processing
   */
  getFormattedContext(): string {
    if (!this.accumulatedContext || this.accumulatedContext.length === 0) {
      return '';
    }

    const answersText = this.answersReceived
      .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
      .join('\n\n');

    return `Original Query: ${this.originalQuery}\n\nClarification Answers:\n${answersText}`;
  }

  /**
   * Transition to a new state
   * @throws Error if transition is invalid
   */
  transitionTo(newState: ClarificationState): void {
    const validTransitions: Record<ClarificationState, ClarificationState[]> = {
      [ClarificationState.PENDING]: [
        ClarificationState.ANSWERED,
        ClarificationState.EXPIRED,
        ClarificationState.CANCELLED,
      ],
      [ClarificationState.ANSWERED]: [
        ClarificationState.COMPLETE,
        ClarificationState.EXPIRED,
        ClarificationState.CANCELLED,
      ],
      [ClarificationState.COMPLETE]: [],
      [ClarificationState.EXPIRED]: [],
      [ClarificationState.CANCELLED]: [],
    };

    if (!validTransitions[this.state].includes(newState)) {
      throw new Error(
        `Invalid state transition from ${this.state} to ${newState}`,
      );
    }

    this.state = newState;

    if (newState === ClarificationState.COMPLETE) {
      this.completedAt = new Date();
    }
  }

  /**
   * Mark the session as cancelled
   */
  cancel(): void {
    this.transitionTo(ClarificationState.CANCELLED);
  }

  /**
   * Mark the session as expired
   */
  expire(): void {
    this.transitionTo(ClarificationState.EXPIRED);
  }

  /**
   * Complete the session with a final query reference
   */
  complete(finalQueryId: string): void {
    this.transitionTo(ClarificationState.COMPLETE);
    this.finalQueryId = finalQueryId;
  }
}
