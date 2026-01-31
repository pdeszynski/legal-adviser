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
import { AiOperationType } from '../../usage-tracking/entities/ai-usage-record.entity';

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

/**
 * Active users count by time period
 */
@ObjectType('ActiveUsersCount')
export class ActiveUsersCount {
  @Field(() => Int, { description: 'Users active in last 24 hours' })
  last24Hours: number;

  @Field(() => Int, { description: 'Users active in last 7 days' })
  last7Days: number;

  @Field(() => Int, { description: 'Users active in last 30 days' })
  last30Days: number;

  @Field(() => GraphQLISODateTime)
  calculatedAt: Date;
}

/**
 * Token usage breakdown with time period grouping
 */
@ObjectType('TokenUsageBreakdown')
export class TokenUsageBreakdown {
  @Field(() => GraphQLISODateTime)
  periodStart: Date;

  @Field(() => GraphQLISODateTime)
  periodEnd: Date;

  @Field(() => Int, { description: 'Total tokens used' })
  totalTokens: number;

  @Field(() => Float, { description: 'Total cost in USD' })
  totalCost: number;

  @Field(() => Int, { description: 'Total requests' })
  totalRequests: number;
}

/**
 * Document generation metrics including timing
 */
@ObjectType('DocumentGenerationMetrics')
export class DocumentGenerationMetrics {
  @Field(() => Int, { description: 'Average generation time in seconds' })
  avgGenerationTime: number;

  @Field(() => Float, { description: 'Success rate as percentage' })
  successRate: number;

  @Field(() => Int, { description: 'Total documents generated' })
  totalDocuments: number;

  @Field(() => Int, { description: 'Successfully generated documents' })
  successfulDocuments: number;

  @Field(() => Int, { description: 'Failed document generations' })
  failedDocuments: number;

  @Field(() => GraphQLISODateTime)
  periodStart: Date;

  @Field(() => GraphQLISODateTime)
  periodEnd: Date;
}

/**
 * User growth statistics by time period
 */
@ObjectType('UserGrowthStats')
export class UserGrowthStats {
  @Field(() => [AnalyticsTimeSeriesPoint])
  newUsersPerPeriod: AnalyticsTimeSeriesPoint[];

  @Field(() => Int, { description: 'Total new users in range' })
  totalNewUsers: number;

  @Field(() => Float, { description: 'Average growth rate' })
  avgGrowthRate: number;

  @Field(() => GraphQLISODateTime)
  periodStart: Date;

  @Field(() => GraphQLISODateTime)
  periodEnd: Date;
}

/**
 * Document queue metrics for real-time monitoring
 * Shows current count of documents in each status across all users
 */
@ObjectType('DocumentQueueMetrics')
export class DocumentQueueMetrics {
  @Field(() => Int, { description: 'Documents currently in DRAFT status' })
  draftCount: number;

  @Field(() => Int, { description: 'Documents currently in GENERATING status' })
  generatingCount: number;

  @Field(() => Int, { description: 'Documents in COMPLETED status (total)' })
  completedCount: number;

  @Field(() => Int, { description: 'Documents in FAILED status (total)' })
  failedCount: number;

  @Field(() => GraphQLISODateTime)
  calculatedAt: Date;
}

/**
 * Recent document activity entry
 */
@ObjectType('DocumentActivityEntry')
export class DocumentActivityEntry {
  @Field(() => ID)
  documentId: string;

  @Field(() => String)
  title: string;

  @Field(() => String, { description: 'The status of the document' })
  status: string;

  @Field(() => String, { nullable: true, description: 'Document type' })
  documentType?: string;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime, {
    description: 'When the status last changed',
  })
  updatedAt: Date;

  @Field(() => ID, {
    nullable: true,
    description: 'User who owns the document',
  })
  userId?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Error message if failed',
  })
  errorMessage?: string;
}

/**
 * Recent document activity feed
 */
@ObjectType('RecentDocumentActivity')
export class RecentDocumentActivity {
  @Field(() => [DocumentActivityEntry])
  recentCompletions: DocumentActivityEntry[];

  @Field(() => [DocumentActivityEntry])
  recentFailures: DocumentActivityEntry[];

  @Field(() => [DocumentActivityEntry], {
    description: 'Documents currently being generated',
  })
  currentlyGenerating: DocumentActivityEntry[];

  @Field(() => GraphQLISODateTime)
  fetchedAt: Date;
}

/**
 * Token usage metrics by user
 */
@ObjectType('UserTokenUsage')
export class UserTokenUsage {
  @Field(() => ID)
  userId: string;

  @Field(() => String, { nullable: true })
  userEmail?: string;

  @Field(() => String, { nullable: true })
  userName?: string;

  @Field(() => Int, { description: 'Total tokens used by this user' })
  totalTokens: number;

  @Field(() => Float, { description: 'Total cost in USD' })
  totalCost: number;

  @Field(() => Int, { description: 'Number of requests' })
  requestCount: number;

  @Field(() => Float, { description: 'Average tokens per request' })
  avgTokensPerRequest: number;

  @Field(() => GraphQLISODateTime)
  periodStart: Date;

  @Field(() => GraphQLISODateTime)
  periodEnd: Date;
}

/**
 * Token usage by operation type
 */
@ObjectType('TokenUsageByOperation')
export class TokenUsageByOperation {
  @Field(() => AiOperationType)
  operationType: AiOperationType;

  @Field(() => Int)
  totalTokens: number;

  @Field(() => Float)
  totalCost: number;

  @Field(() => Int)
  requestCount: number;

  @Field(() => Float, { description: 'Percentage of total tokens' })
  tokenPercentage: number;

  @Field(() => Float, { description: 'Percentage of total cost' })
  costPercentage: number;

  @Field(() => Int, { description: 'Average tokens per request' })
  avgTokensPerRequest: number;
}

/**
 * Token usage trend data point
 */
@ObjectType('TokenUsageTrend')
export class TokenUsageTrend {
  @Field(() => GraphQLISODateTime)
  timestamp: Date;

  @Field(() => Int)
  tokens: number;

  @Field(() => Float)
  cost: number;

  @Field(() => Int)
  requests: number;

  @Field(() => Float, {
    nullable: true,
    description: 'Percentage change from previous period',
  })
  changePercentage?: number;
}

/**
 * Usage anomaly detection result
 */
@ObjectType('UsageAnomaly')
export class UsageAnomaly {
  @Field(() => ID, { nullable: true })
  userId?: string;

  @Field(() => String, { nullable: true })
  userEmail?: string;

  @Field(() => GraphQLISODateTime)
  detectedAt: Date;

  @Field(() => String, {
    description: 'Type of anomaly detected',
  })
  anomalyType: 'SPIKE' | 'UNUSUAL_PATTERN' | 'HIGH_CONSUMER';

  @Field(() => String, { description: 'Description of the anomaly' })
  description: string;

  @Field(() => Int, { description: 'Token count that triggered the anomaly' })
  tokenCount: number;

  @Field(() => Float, { description: 'Expected/normal token count' })
  expectedValue: number;

  @Field(() => Float, { description: 'Deviation from expected (percentage)' })
  deviationPercentage: number;
}

/**
 * Comprehensive token usage analytics response
 */
@ObjectType('TokenUsageAnalytics')
export class TokenUsageAnalytics {
  @Field(() => Int, { description: 'All-time total tokens' })
  allTimeTokens: number;

  @Field(() => Float, { description: 'All-time total cost' })
  allTimeCost: number;

  @Field(() => Int, { description: 'Tokens this month' })
  thisMonthTokens: number;

  @Field(() => Float, { description: 'Cost this month' })
  thisMonthCost: number;

  @Field(() => Int, { description: 'Tokens today' })
  todayTokens: number;

  @Field(() => Float, { description: 'Cost today' })
  todayCost: number;

  @Field(() => Int, { description: 'Average tokens per query' })
  avgTokensPerQuery: number;

  @Field(() => [TokenUsageTrend], { description: 'Token usage over time' })
  trend: TokenUsageTrend[];

  @Field(() => [UserTokenUsage], { description: 'Per-user usage leaderboard' })
  userLeaderboard: UserTokenUsage[];

  @Field(() => [TokenUsageByOperation], {
    description: 'Breakdown by operation type',
  })
  byOperation: TokenUsageByOperation[];

  @Field(() => [UsageAnomaly], { description: 'Detected usage anomalies' })
  anomalies: UsageAnomaly[];

  @Field(() => GraphQLISODateTime)
  periodStart: Date;

  @Field(() => GraphQLISODateTime)
  periodEnd: Date;

  @Field(() => GraphQLISODateTime)
  generatedAt: Date;
}

/**
 * Token pricing configuration for cost estimation
 */
@ObjectType('TokenPricing')
export class TokenPricing {
  @Field(() => Float, { description: 'Price per 1K input tokens' })
  inputPricePer1k: number;

  @Field(() => Float, { description: 'Price per 1K output tokens' })
  outputPricePer1k: number;

  @Field(() => String, { description: 'Model name' })
  model: string;

  @Field(() => GraphQLISODateTime)
  effectiveFrom: Date;
}

/**
 * Token usage export data for CSV/PDF generation
 */
@ObjectType('TokenUsageExport')
export class TokenUsageExport {
  @Field(() => [UserTokenUsage])
  userUsageData: UserTokenUsage[];

  @Field(() => [TokenUsageByOperation])
  operationBreakdown: TokenUsageByOperation[];

  @Field(() => [TokenUsageTrend])
  trendData: TokenUsageTrend[];

  @Field(() => GraphQLISODateTime)
  exportedAt: Date;

  @Field(() => GraphQLISODateTime)
  periodStart: Date;

  @Field(() => GraphQLISODateTime)
  periodEnd: Date;
}

/**
 * Demo request metrics overview
 */
@ObjectType('DemoRequestMetrics')
export class DemoRequestMetrics {
  @Field(() => Int, { description: 'Total demo requests in period' })
  totalRequests: number;

  @Field(() => Int, { description: 'New requests (not yet contacted)' })
  newRequests: number;

  @Field(() => Int, { description: 'Requests that have been contacted' })
  contactedRequests: number;

  @Field(() => Int, { description: 'Requests with demos scheduled' })
  scheduledRequests: number;

  @Field(() => Int, { description: 'Requests qualified as leads' })
  qualifiedRequests: number;

  @Field(() => Int, { description: 'Requests closed (won or lost)' })
  closedRequests: number;

  @Field(() => Float, { description: 'New to contacted conversion rate %' })
  newToContactedRate: number;

  @Field(() => Float, {
    description: 'Contacted to scheduled conversion rate %',
  })
  contactedToScheduledRate: number;

  @Field(() => Float, { description: 'Overall funnel conversion rate %' })
  overallConversionRate: number;

  @Field(() => GraphQLISODateTime)
  periodStart: Date;

  @Field(() => GraphQLISODateTime)
  periodEnd: Date;
}

/**
 * Demo request status breakdown for funnel visualization
 */
@ObjectType('DemoRequestStatusBreakdown')
export class DemoRequestStatusBreakdown {
  @Field(() => String)
  status: string;

  @Field(() => Int)
  count: number;

  @Field(() => Float, { description: 'Percentage of total' })
  percentage: number;
}

/**
 * Demo request lead source distribution
 */
@ObjectType('DemoRequestLeadSource')
export class DemoRequestLeadSource {
  @Field(() => String, {
    nullable: true,
    description: 'UTM source or "direct"',
  })
  source: string | null;

  @Field(() => String, { nullable: true, description: 'UTM medium' })
  medium: string | null;

  @Field(() => Int, { description: 'Number of requests from this source' })
  count: number;

  @Field(() => Float, { description: 'Percentage of total' })
  percentage: number;
}

/**
 * Demo request company size distribution
 */
@ObjectType('DemoRequestCompanySizeDistribution')
export class DemoRequestCompanySizeDistribution {
  @Field(() => String)
  companySize: string;

  @Field(() => Int)
  count: number;

  @Field(() => Float, { description: 'Percentage of total' })
  percentage: number;
}

/**
 * Demo request industry breakdown
 */
@ObjectType('DemoRequestIndustryBreakdown')
export class DemoRequestIndustryBreakdown {
  @Field(() => String)
  industry: string;

  @Field(() => Int)
  count: number;

  @Field(() => Float, { description: 'Percentage of total' })
  percentage: number;
}

/**
 * Demo request top use cases
 */
@ObjectType('DemoRequestTopUseCase')
export class DemoRequestTopUseCase {
  @Field(() => String, { description: 'Truncated use case text' })
  useCase: string;

  @Field(() => Int, { description: 'Number of similar requests' })
  count: number;
}

/**
 * Demo request time series data point
 */
@ObjectType('DemoRequestTimeSeriesPoint')
export class DemoRequestTimeSeriesPoint {
  @Field(() => GraphQLISODateTime)
  timestamp: Date;

  @Field(() => Int)
  count: number;
}

/**
 * Demo request average response time metrics
 */
@ObjectType('DemoRequestResponseTimeMetrics')
export class DemoRequestResponseTimeMetrics {
  @Field(() => Float, {
    description: 'Average hours from submission to first contact',
  })
  avgHoursToContact: number;

  @Field(() => Float, { description: 'Median hours to contact' })
  medianHoursToContact: number;

  @Field(() => Int, { description: 'Total contacted requests measured' })
  totalContacted: number;

  @Field(() => GraphQLISODateTime)
  calculatedAt: Date;
}

/**
 * Comprehensive demo request analytics
 */
@ObjectType('DemoRequestAnalytics')
export class DemoRequestAnalytics {
  @Field(() => DemoRequestMetrics)
  metrics: DemoRequestMetrics;

  @Field(() => [DemoRequestStatusBreakdown], {
    description: 'Status distribution for funnel visualization',
  })
  statusBreakdown: DemoRequestStatusBreakdown[];

  @Field(() => [DemoRequestLeadSource], {
    description: 'Lead source distribution',
  })
  leadSources: DemoRequestLeadSource[];

  @Field(() => [DemoRequestCompanySizeDistribution], {
    description: 'Company size distribution',
  })
  companySizeDistribution: DemoRequestCompanySizeDistribution[];

  @Field(() => [DemoRequestIndustryBreakdown], {
    description: 'Industry breakdown',
  })
  industryBreakdown: DemoRequestIndustryBreakdown[];

  @Field(() => [DemoRequestTopUseCase], {
    description: 'Top mentioned use cases',
  })
  topUseCases: DemoRequestTopUseCase[];

  @Field(() => [DemoRequestTimeSeriesPoint], {
    description: 'Requests over time (by day)',
  })
  requestsOverTime: DemoRequestTimeSeriesPoint[];

  @Field(() => DemoRequestResponseTimeMetrics, {
    description: 'Average response time metrics',
  })
  responseTimeMetrics: DemoRequestResponseTimeMetrics;

  @Field(() => GraphQLISODateTime)
  generatedAt: Date;
}

/**
 * User count by role breakdown
 */
@ObjectType('UserCountByRole')
export class UserCountByRole {
  @Field(() => Int, { description: 'Total number of admin users' })
  adminCount: number;

  @Field(() => Int, { description: 'Total number of super admin users' })
  superAdminCount: number;

  @Field(() => Int, { description: 'Total number of lawyer users' })
  lawyerCount: number;

  @Field(() => Int, { description: 'Total number of paralegal users' })
  paralegalCount: number;

  @Field(() => Int, { description: 'Total number of client users' })
  clientCount: number;

  @Field(() => Int, { description: 'Total number of guest users' })
  guestCount: number;
}

/**
 * Document count by status breakdown
 */
@ObjectType('DocumentCountByStatus')
export class DocumentCountByStatus {
  @Field(() => Int, { description: 'Documents in DRAFT status' })
  draftCount: number;

  @Field(() => Int, { description: 'Documents in GENERATING status' })
  generatingCount: number;

  @Field(() => Int, { description: 'Documents in COMPLETED status' })
  completedCount: number;

  @Field(() => Int, { description: 'Documents in FAILED status' })
  failedCount: number;
}

/**
 * Admin Dashboard Stats
 *
 * Aggregated statistics for the admin dashboard at /admin.
 * Provides a quick overview of platform metrics.
 */
@ObjectType('AdminDashboardStats')
export class AdminDashboardStats {
  @Field(() => Int, { description: 'Total number of users' })
  totalUsers: number;

  @Field(() => Int, { description: 'Total number of documents' })
  totalDocuments: number;

  @Field(() => Int, { description: 'Total number of queries/conversations' })
  totalQueries: number;

  @Field(() => Int, { description: 'Total number of chat sessions' })
  totalChatSessions: number;

  @Field(() => Int, { description: 'Number of active sessions' })
  activeSessionsCount: number;

  @Field(() => UserCountByRole, {
    description: 'User count breakdown by role',
  })
  userCountByRole: UserCountByRole;

  @Field(() => DocumentCountByStatus, {
    description: 'Document count breakdown by status',
  })
  documentCountByStatus: DocumentCountByStatus;

  @Field(() => GraphQLISODateTime, {
    description: 'When these stats were calculated',
  })
  calculatedAt: Date;
}

/**
 * SAOS Indexing Metrics
 *
 * Comprehensive monitoring metrics for the SAOS/ISAP ruling indexing workflow.
 * Tracks data quality, error rates, and processing statistics.
 */
@ObjectType('SaosIndexingMetrics')
export class SaosIndexingMetrics {
  @Field(() => Int, { description: 'Total legal rulings in database' })
  totalRulings: number;

  @Field(() => Int, { description: 'Rulings indexed from SAOS' })
  saosRulings: number;

  @Field(() => Int, { description: 'Rulings indexed from ISAP' })
  isapRulings: number;

  @Field(() => Int, {
    description: 'Rulings with full text content (data quality metric)',
  })
  rulingsWithFullText: number;

  @Field(() => Int, {
    description: 'Rulings missing full text content (data quality issue)',
  })
  rulingsMissingFullText: number;

  @Field(() => Int, {
    description: 'Rulings with summary/thesis content',
  })
  rulingsWithSummary: number;

  @Field(() => Float, {
    description: 'Percentage of rulings with full text content',
  })
  fullTextCoverageRate: number;

  @Field(() => GraphQLISODateTime, {
    description: 'Timestamp of the most recent ruling import',
  })
  lastIndexingRunAt: Date | null;

  @Field(() => GraphQLISODateTime, {
    description: 'Timestamp of the most recently added ruling',
    nullable: true,
  })
  lastRulingAddedAt: Date | null;

  @Field(() => Int, {
    description: 'Number of new rulings added in the last 24 hours',
  })
  newRulingsLast24Hours: number;

  @Field(() => GraphQLISODateTime, {
    description: 'Timestamp of the most recent ruling update',
    nullable: true,
  })
  lastRulingUpdatedAt: Date | null;

  @Field(() => Int, {
    description: 'Number of rulings updated in the last 24 hours',
  })
  updatedRulingsLast24Hours: number;

  @Field(() => GraphQLISODateTime, {
    description: 'When these metrics were calculated',
  })
  calculatedAt: Date;
}

/**
 * SAOS Indexing by Court Type
 *
 * Breakdown of indexed rulings by court type.
 */
@ObjectType('SaosIndexingByCourtType')
export class SaosIndexingByCourtType {
  @Field(() => String, { description: 'Court type' })
  courtType: string;

  @Field(() => Int, { description: 'Number of rulings from this court type' })
  count: number;

  @Field(() => Int, {
    description: 'Number of rulings with full text from this court type',
  })
  withFullText: number;

  @Field(() => Float, {
    description: 'Percentage of total rulings',
  })
  percentage: number;
}

/**
 * SAOS Indexing Error
 *
 * Represents a recorded indexing error for tracking.
 */
@ObjectType('SaosIndexingError')
export class SaosIndexingError {
  @Field(() => ID)
  id: string;

  @Field(() => String, {
    description: 'Source of the indexing (SAOS or ISAP)',
  })
  source: string;

  @Field(() => String, { description: 'Error type/category' })
  errorType: string;

  @Field(() => String, { description: 'Error message' })
  errorMessage: string;

  @Field(() => String, {
    description: 'Signature of the ruling that failed to index',
    nullable: true,
  })
  rulingSignature?: string;

  @Field(() => String, {
    description: 'Court name for context',
    nullable: true,
  })
  courtName?: string;

  @Field(() => GraphQLISODateTime, { description: 'When the error occurred' })
  occurredAt: Date;

  @Field(() => GraphQLISODateTime, {
    description: 'Last time this error was seen',
  })
  lastSeenAt: Date;

  @Field(() => Int, { description: 'Number of times this error occurred' })
  count: number;
}

/**
 * SAOS Indexing Skipped Record
 *
 * Represents a skipped record with reason for tracking.
 */
@ObjectType('SaosIndexingSkippedRecord')
export class SaosIndexingSkippedRecord {
  @Field(() => ID)
  id: string;

  @Field(() => String, {
    description: 'Source of the indexing (SAOS or ISAP)',
  })
  source: string;

  @Field(() => String, { description: 'Reason for skipping' })
  skipReason: string;

  @Field(() => String, {
    description: 'Signature of the skipped ruling',
    nullable: true,
  })
  rulingSignature?: string;

  @Field(() => GraphQLISODateTime, { description: 'When the record was skipped' })
  skippedAt: Date;

  @Field(() => Int, { description: 'Number of times this skip occurred' })
  count: number;
}

/**
 * SAOS Indexing Activity Log
 *
 * Represents a single indexing activity/batch execution.
 */
@ObjectType('SaosIndexingActivityLog')
export class SaosIndexingActivityLog {
  @Field(() => ID)
  id: string;

  @Field(() => String, { description: 'Job ID for the indexing run' })
  jobId: string;

  @Field(() => String, { description: 'Source (SAOS or ISAP)' })
  source: string;

  @Field(() => String, {
    description: 'Status of the indexing run',
  })
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';

  @Field(() => Int, { description: 'Number of records processed' })
  recordsProcessed: number;

  @Field(() => Int, { description: 'Number of records saved/updated' })
  recordsSaved: number;

  @Field(() => Int, { description: 'Number of records skipped (duplicates)' })
  recordsSkipped: number;

  @Field(() => Int, { description: 'Number of records with errors' })
  recordsWithErrors: number;

  @Field(() => Int, {
    description: 'Number of records missing text content',
  })
  recordsMissingTextContent: number;

  @Field(() => Int, { description: 'Processing time in milliseconds' })
  processingTimeMs: number;

  @Field(() => GraphQLISODateTime, { description: 'When the indexing started' })
  startedAt: Date;

  @Field(() => GraphQLISODateTime, {
    description: 'When the indexing completed',
    nullable: true,
  })
  completedAt?: Date;

  @Field(() => String, {
    description: 'Error message if failed',
    nullable: true,
  })
  errorMessage?: string;
}

/**
 * SAOS Indexing Health Status
 *
 * Overall health status of the SAOS indexing system.
 */
@ObjectType('SaosIndexingHealthStatus')
export class SaosIndexingHealthStatus {
  @Field(() => String, { description: 'Overall health status' })
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';

  @Field(() => String, { description: 'Health status description' })
  description: string;

  @Field(() => SaosIndexingMetrics, {
    description: 'Current indexing metrics',
  })
  metrics: SaosIndexingMetrics;

  @Field(() => [SaosIndexingByCourtType], {
    description: 'Rulings breakdown by court type',
  })
  byCourtType: SaosIndexingByCourtType[];

  @Field(() => [SaosIndexingActivityLog], {
    description: 'Recent indexing activity logs',
  })
  recentActivity: SaosIndexingActivityLog[];

  @Field(() => [SaosIndexingError], {
    description: 'Recent indexing errors',
  })
  recentErrors: SaosIndexingError[];

  @Field(() => [SaosIndexingSkippedRecord], {
    description: 'Recent skipped records',
  })
  recentSkipped: SaosIndexingSkippedRecord[];

  @Field(() => [String], {
    description: 'Active alerts/warnings',
  })
  alerts: string[];

  @Field(() => GraphQLISODateTime, {
    description: 'When health status was calculated',
  })
  calculatedAt: Date;
}
