import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
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
  Int,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

/**
 * AI Operation Types
 * Enumerates all AI operations that can be tracked
 */
export enum AiOperationType {
  DOCUMENT_GENERATION = 'DOCUMENT_GENERATION',
  QUESTION_ANSWERING = 'QUESTION_ANSWERING',
  RULING_SEARCH = 'RULING_SEARCH',
  CASE_CLASSIFICATION = 'CASE_CLASSIFICATION',
  EMBEDDING_GENERATION = 'EMBEDDING_GENERATION',
  SEMANTIC_SEARCH = 'SEMANTIC_SEARCH',
  RAG_QUESTION_ANSWERING = 'RAG_QUESTION_ANSWERING',
}

registerEnumType(AiOperationType, {
  name: 'AiOperationType',
});

/**
 * GraphQL Object Type for AI Usage Statistics
 * Aggregated usage metrics for billing and monitoring
 */
@ObjectType('AiUsageStats')
export class AiUsageStats {
  @Field(() => ID)
  userId: string;

  @Field(() => Int)
  totalRequests: number;

  @Field(() => Int)
  totalTokens: number;

  @Field(() => Float)
  totalCost: number;

  @Field(() => GraphQLISODateTime)
  periodStart: Date;

  @Field(() => GraphQLISODateTime)
  periodEnd: Date;
}

/**
 * AiUsageRecord Entity
 *
 * Tracks AI API usage per user for billing and monitoring purposes.
 * Records token counts, request counts, and calculated costs for each AI operation.
 *
 * Aggregate Root: AiUsageRecord
 * Invariants:
 *   - tokens_used must be non-negative
 *   - cost_calculated must be non-negative
 *   - operation_type must be a valid AiOperationType
 *
 * Uses nestjs-query decorators for auto-generated CRUD resolvers.
 */
@Entity('ai_usage_records')
@ObjectType('AiUsageRecord')
@QueryOptions({ enableTotalCount: true })
@Relation('user', () => User)
@Index(['userId'])
@Index(['operationType'])
@Index(['createdAt'])
export class AiUsageRecord {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  /**
   * Reference to the user who initiated the AI operation
   */
  @Column({ type: 'uuid' })
  @FilterableField()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Type of AI operation performed
   */
  @Column({
    type: 'enum',
    enum: AiOperationType,
  })
  @FilterableField(() => AiOperationType)
  operationType: AiOperationType;

  /**
   * Number of tokens consumed by the AI operation
   * Includes both input and output tokens
   */
  @Column({ type: 'int', default: 0 })
  @FilterableField()
  tokensUsed: number;

  /**
   * Number of requests made (for batch operations)
   */
  @Column({ type: 'int', default: 1 })
  @FilterableField()
  requestCount: number;

  /**
   * Calculated cost in USD based on token usage
   * Cost model: $0.00003 per token (example rate)
   */
  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  @FilterableField()
  costCalculated: number;

  /**
   * Optional identifier for the resource being processed
   * (e.g., legal_query_id, document_id)
   */
  @Column({ type: 'uuid', nullable: true })
  @Field(() => ID, { nullable: true })
  resourceId: string | null;

  /**
   * Additional metadata about the operation
   * Stored as JSONB for flexible querying
   * Exposed as JSON string in GraphQL
   */
  @Column({ type: 'jsonb', nullable: true })
  @Field(() => String, { nullable: true })
  metadata: string | null;

  /**
   * Timestamp when the usage record was created
   */
  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  /**
   * Calculate cost based on token usage
   * Default rate: $0.00003 per token (adjust based on actual AI pricing)
   */
  static calculateCost(tokens: number, ratePerToken: number = 0.00003): number {
    return tokens * ratePerToken;
  }

  /**
   * Create a new usage record
   */
  static create(
    userId: string,
    operationType: AiOperationType,
    tokensUsed: number,
    requestCount: number = 1,
    resourceId?: string,
    metadata?: Record<string, any>,
  ): AiUsageRecord {
    const record = new AiUsageRecord();
    record.userId = userId;
    record.operationType = operationType;
    record.tokensUsed = tokensUsed;
    record.requestCount = requestCount;
    record.costCalculated = this.calculateCost(tokensUsed);
    record.resourceId = resourceId || null;
    record.metadata = metadata ? JSON.stringify(metadata) : null;
    return record;
  }
}
