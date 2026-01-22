import {
  ObjectType,
  InputType,
  Field,
  ID,
  GraphQLISODateTime,
  Int,
  Float,
  registerEnumType,
} from '@nestjs/graphql';

/**
 * Time period granularity for analytics aggregation
 */
export enum AnalyticsPeriod {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

registerEnumType(AnalyticsPeriod, {
  name: 'AnalyticsPeriod',
  description: 'Time period granularity for analytics data',
});

/**
 * Date range filter for analytics queries
 */
@ObjectType('AnalyticsDateRange')
export class AnalyticsDateRange {
  @Field(() => GraphQLISODateTime)
  start: Date;

  @Field(() => GraphQLISODateTime)
  end: Date;
}

/**
 * User growth metrics
 */
@ObjectType('UserGrowthMetrics')
export class UserGrowthMetrics {
  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  activeUsers: number;

  @Field(() => Int)
  newUsers: number;

  @Field(() => Int)
  adminUsers: number;

  @Field(() => GraphQLISODateTime)
  periodStart: Date;

  @Field(() => GraphQLISODateTime)
  periodEnd: Date;

  @Field(() => Float, { description: 'Growth rate as percentage' })
  growthRate: number;
}

/**
 * Document generation metrics
 */
@ObjectType('DocumentMetrics')
export class DocumentMetrics {
  @Field(() => Int)
  totalDocuments: number;

  @Field(() => Int)
  completedDocuments: number;

  @Field(() => Int)
  draftDocuments: number;

  @Field(() => Int)
  failedDocuments: number;

  @Field(() => Float, { description: 'Success rate as percentage' })
  successRate: number;

  @Field(() => Int, { description: 'Documents currently generating' })
  generatingDocuments: number;

  @Field(() => GraphQLISODateTime)
  periodStart: Date;

  @Field(() => GraphQLISODateTime)
  periodEnd: Date;
}

/**
 * Document type distribution
 */
@ObjectType('DocumentTypeDistribution')
export class DocumentTypeDistribution {
  @Field(() => String)
  documentType: string;

  @Field(() => Int)
  count: number;

  @Field(() => Float, { description: 'Percentage of total' })
  percentage: number;
}

/**
 * Query activity metrics
 */
@ObjectType('QueryMetrics')
export class QueryMetrics {
  @Field(() => Int)
  totalQueries: number;

  @Field(() => Int)
  uniqueUsers: number;

  @Field(() => Float, { description: 'Average queries per user' })
  avgQueriesPerUser: number;

  @Field(() => Int, { description: 'Total citations across all queries' })
  totalCitations: number;

  @Field(() => Float, { description: 'Average citations per query' })
  avgCitationsPerQuery: number;

  @Field(() => GraphQLISODateTime)
  periodStart: Date;

  @Field(() => GraphQLISODateTime)
  periodEnd: Date;
}

/**
 * AI usage and cost metrics
 */
@ObjectType('AiUsageMetrics')
export class AiUsageMetrics {
  @Field(() => Int)
  totalRequests: number;

  @Field(() => Int)
  totalTokens: number;

  @Field(() => Float, { description: 'Total cost in USD' })
  totalCost: number;

  @Field(() => Float, { description: 'Average cost per request' })
  avgCostPerRequest: number;

  @Field(() => Int, { description: 'Average tokens per request' })
  avgTokensPerRequest: number;

  @Field(() => GraphQLISODateTime)
  periodStart: Date;

  @Field(() => GraphQLISODateTime)
  periodEnd: Date;
}

/**
 * AI operation breakdown
 */
@ObjectType('AiOperationBreakdown')
export class AiOperationBreakdown {
  @Field(() => String)
  operationType: string;

  @Field(() => Int)
  requestCount: number;

  @Field(() => Int)
  totalTokens: number;

  @Field(() => Float)
  totalCost: number;

  @Field(() => Float, { description: 'Percentage of total cost' })
  costPercentage: number;
}

/**
 * System health indicators
 */
@ObjectType('SystemHealthMetrics')
export class SystemHealthMetrics {
  @Field(() => Float, { description: 'Document generation success rate' })
  documentSuccessRate: number;

  @Field(() => Float, {
    description: 'Average AI response time in ms (placeholder)',
  })
  avgResponseTime: number;

  @Field(() => Int, { description: 'Active user sessions (placeholder)' })
  activeSessions: number;

  @Field(() => GraphQLISODateTime)
  timestamp: Date;
}

/**
 * Time series data point
 */
@ObjectType('AnalyticsTimeSeriesPoint')
export class AnalyticsTimeSeriesPoint {
  @Field(() => GraphQLISODateTime)
  timestamp: Date;

  @Field(() => Int)
  count: number;

  @Field(() => Float, { nullable: true })
  value?: number;
}

/**
 * Complete analytics dashboard data
 */
@ObjectType('AnalyticsDashboard')
export class AnalyticsDashboard {
  @Field(() => UserGrowthMetrics)
  userGrowth: UserGrowthMetrics;

  @Field(() => DocumentMetrics)
  documents: DocumentMetrics;

  @Field(() => [DocumentTypeDistribution])
  documentTypeDistribution: DocumentTypeDistribution[];

  @Field(() => QueryMetrics)
  queries: QueryMetrics;

  @Field(() => AiUsageMetrics)
  aiUsage: AiUsageMetrics;

  @Field(() => [AiOperationBreakdown])
  aiOperationBreakdown: AiOperationBreakdown[];

  @Field(() => SystemHealthMetrics)
  systemHealth: SystemHealthMetrics;

  @Field(() => GraphQLISODateTime)
  generatedAt: Date;
}

/**
 * Input for dashboard analytics query
 */
@InputType('DashboardAnalyticsInput')
export class DashboardAnalyticsInput {
  @Field(() => GraphQLISODateTime, { nullable: true })
  startDate?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  endDate?: Date;

  @Field(() => AnalyticsPeriod, {
    nullable: true,
    defaultValue: AnalyticsPeriod.DAILY,
  })
  period?: AnalyticsPeriod;
}
