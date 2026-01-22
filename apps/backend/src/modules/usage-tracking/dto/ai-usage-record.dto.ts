import {
  Field,
  ObjectType,
  ID,
  GraphQLISODateTime,
  Int,
  Float,
} from '@nestjs/graphql';
import { AiOperationType } from '../entities/ai-usage-record.entity';

/**
 * Create AiUsageRecord DTO
 * Input for creating a new usage record
 */
@ObjectType('CreateAiUsageRecordInput')
export class CreateAiUsageRecordInput {
  @Field(() => AiOperationType)
  operationType: AiOperationType;

  @Field(() => Int)
  tokensUsed: number;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  requestCount?: number;

  @Field(() => ID, { nullable: true })
  resourceId?: string;

  @Field(() => String, { nullable: true })
  metadata?: string;
}

/**
 * AiUsageRecord DTO
 * Output type for usage records
 */
@ObjectType('AiUsageRecordDTO')
export class AiUsageRecordDTO {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => AiOperationType)
  operationType: AiOperationType;

  @Field(() => Int)
  tokensUsed: number;

  @Field(() => Int)
  requestCount: number;

  @Field(() => Float)
  costCalculated: number;

  @Field(() => ID, { nullable: true })
  resourceId: string | null;

  @Field(() => String, { nullable: true })
  metadata: string | null;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;
}

/**
 * Usage Statistics Query DTO
 * Input for querying usage statistics
 */
@ObjectType('UsageStatsQueryInput')
export class UsageStatsQueryInput {
  @Field(() => ID, { nullable: true })
  userId?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  startDate?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  endDate?: Date;

  @Field(() => AiOperationType, { nullable: true })
  operationType?: AiOperationType;
}

/**
 * Usage Statistics Response DTO
 * Aggregated usage statistics
 */
@ObjectType('UsageStatsResponse')
export class UsageStatsResponse {
  @Field(() => Int)
  totalRequests: number;

  @Field(() => Int)
  totalTokens: number;

  @Field(() => Float)
  totalCost: number;

  @Field(() => Int)
  operationCount: number;

  @Field(() => [OperationBreakdown], { nullable: true })
  breakdownByOperation?: OperationBreakdown[];

  @Field(() => GraphQLISODateTime)
  periodStart: Date;

  @Field(() => GraphQLISODateTime)
  periodEnd: Date;
}

/**
 * Operation Breakdown DTO
 * Breakdown of usage by operation type
 */
@ObjectType('OperationBreakdown')
export class OperationBreakdown {
  @Field(() => AiOperationType)
  operationType: AiOperationType;

  @Field(() => Int)
  requestCount: number;

  @Field(() => Int)
  tokenCount: number;

  @Field(() => Float)
  cost: number;
}

/**
 * Daily Usage DTO
 * Usage aggregated by day for chart display
 */
@ObjectType('DailyUsage')
export class DailyUsage {
  @Field(() => GraphQLISODateTime)
  date: Date;

  @Field(() => Int)
  totalRequests: number;

  @Field(() => Int)
  totalTokens: number;

  @Field(() => Float)
  totalCost: number;
}

/**
 * Daily Usage Response DTO
 * Response containing daily usage breakdown
 */
@ObjectType('DailyUsageResponse')
export class DailyUsageResponse {
  @Field(() => [DailyUsage])
  dailyUsage: DailyUsage[];

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
