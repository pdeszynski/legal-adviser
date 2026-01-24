import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AnalyticsService } from './services/analytics.service';
import {
  AnalyticsDashboard,
  DashboardAnalyticsInput,
  UserGrowthMetrics,
  DocumentMetrics,
  QueryMetrics,
  AiUsageMetrics,
  SystemHealthMetrics,
  ActiveUsersCount,
  TokenUsageBreakdown,
  DocumentGenerationMetrics,
  UserGrowthStats,
  AnalyticsTimeSeriesPoint,
  DocumentQueueMetrics,
  RecentDocumentActivity,
  TokenUsageAnalytics,
  UserTokenUsage,
  TokenUsageByOperation,
  TokenUsageTrend,
  TokenUsageExport,
} from './dto/analytics.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Int } from '@nestjs/graphql';

/**
 * Analytics Resolver
 *
 * GraphQL resolver for platform analytics and dashboard metrics.
 * All endpoints require admin authentication.
 *
 * Authentication: Admin only (AdminGuard)
 */
@Resolver()
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get complete dashboard analytics
   * Admin-only access
   */
  @Query(() => AnalyticsDashboard, { name: 'analyticsDashboard' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getDashboard(
    @Args('input', { nullable: true }) input?: DashboardAnalyticsInput,
  ): Promise<AnalyticsDashboard> {
    return this.analyticsService.getDashboardData(input || {});
  }

  /**
   * Get user growth metrics
   * Admin-only access
   */
  @Query(() => UserGrowthMetrics, { name: 'userGrowthMetrics' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getUserGrowth(
    @Args('input', { nullable: true }) input?: DashboardAnalyticsInput,
  ): Promise<UserGrowthMetrics> {
    const { startDate, endDate } = this.getDateRange(input);
    return this.analyticsService.getUserGrowthMetrics(startDate, endDate);
  }

  /**
   * Get document metrics
   * Admin-only access
   */
  @Query(() => DocumentMetrics, { name: 'documentMetrics' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getDocumentMetrics(
    @Args('input', { nullable: true }) input?: DashboardAnalyticsInput,
  ): Promise<DocumentMetrics> {
    const { startDate, endDate } = this.getDateRange(input);
    return this.analyticsService.getDocumentMetrics(startDate, endDate);
  }

  /**
   * Get query metrics
   * Admin-only access
   */
  @Query(() => QueryMetrics, { name: 'queryMetrics' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getQueryMetrics(
    @Args('input', { nullable: true }) input?: DashboardAnalyticsInput,
  ): Promise<QueryMetrics> {
    const { startDate, endDate } = this.getDateRange(input);
    return this.analyticsService.getQueryMetrics(startDate, endDate);
  }

  /**
   * Get AI usage metrics
   * Admin-only access
   */
  @Query(() => AiUsageMetrics, { name: 'aiUsageMetrics' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getAiUsageMetrics(
    @Args('input', { nullable: true }) input?: DashboardAnalyticsInput,
  ): Promise<AiUsageMetrics> {
    const { startDate, endDate } = this.getDateRange(input);
    return this.analyticsService.getAiUsageMetrics(startDate, endDate);
  }

  /**
   * Get system health metrics
   * Admin-only access
   */
  @Query(() => SystemHealthMetrics, { name: 'systemHealthMetrics' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getSystemHealth(
    @Args('input', { nullable: true }) input?: DashboardAnalyticsInput,
  ): Promise<SystemHealthMetrics> {
    const { startDate, endDate } = this.getDateRange(input);
    return this.analyticsService.getSystemHealthMetrics(startDate, endDate);
  }

  /**
   * Get total document count grouped by status
   * Admin-only access
   */
  @Query(() => DocumentMetrics, { name: 'getTotalDocumentCount' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getTotalDocumentCount(
    @Args('input', { nullable: true }) input?: DashboardAnalyticsInput,
  ): Promise<DocumentMetrics> {
    const { startDate, endDate } = this.getDateRange(input);
    return this.analyticsService.getDocumentMetrics(startDate, endDate);
  }

  /**
   * Get active users count for different time periods
   * Admin-only access
   */
  @Query(() => ActiveUsersCount, { name: 'getActiveUsersCount' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getActiveUsersCount(): Promise<ActiveUsersCount> {
    return this.analyticsService.getActiveUsersCount();
  }

  /**
   * Get total token usage with daily/monthly breakdown
   * Admin-only access
   */
  @Query(() => [TokenUsageBreakdown], { name: 'getTotalTokenUsage' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getTotalTokenUsage(
    @Args('input', { nullable: true }) input?: DashboardAnalyticsInput,
  ): Promise<TokenUsageBreakdown[]> {
    const { startDate, endDate } = this.getDateRange(input);
    const period = input?.period || 'DAILY';
    return this.analyticsService.getTotalTokenUsage(startDate, endDate, period);
  }

  /**
   * Get query volume per day chart data
   * Admin-only access
   */
  @Query(() => [AnalyticsTimeSeriesPoint], { name: 'getQueryVolume' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getQueryVolume(
    @Args('input', { nullable: true }) input?: DashboardAnalyticsInput,
  ): Promise<AnalyticsTimeSeriesPoint[]> {
    const { startDate, endDate } = this.getDateRange(input);
    return this.analyticsService.getQueryVolume(startDate, endDate);
  }

  /**
   * Get document generation metrics including timing and success rate
   * Admin-only access
   */
  @Query(() => DocumentGenerationMetrics, {
    name: 'getDocumentGenerationMetrics',
  })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getDocumentGenerationMetrics(
    @Args('input', { nullable: true }) input?: DashboardAnalyticsInput,
  ): Promise<DocumentGenerationMetrics> {
    const { startDate, endDate } = this.getDateRange(input);
    return this.analyticsService.getDocumentGenerationMetrics(
      startDate,
      endDate,
    );
  }

  /**
   * Get user growth stats with new users per period
   * Admin-only access
   */
  @Query(() => UserGrowthStats, { name: 'getUserGrowthStats' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getUserGrowthStats(
    @Args('input', { nullable: true }) input?: DashboardAnalyticsInput,
  ): Promise<UserGrowthStats> {
    const { startDate, endDate } = this.getDateRange(input);
    const period = input?.period || 'DAILY';
    return this.analyticsService.getUserGrowthStats(startDate, endDate, period);
  }

  /**
   * Get current document queue metrics for real-time monitoring
   * Admin-only access
   */
  @Query(() => DocumentQueueMetrics, { name: 'documentQueueMetrics' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getDocumentQueueMetrics(): Promise<DocumentQueueMetrics> {
    return this.analyticsService.getDocumentQueueMetrics();
  }

  /**
   * Get recent document activity for admin monitoring
   * Admin-only access
   */
  @Query(() => RecentDocumentActivity, { name: 'recentDocumentActivity' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getRecentDocumentActivity(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 })
    limit?: number,
  ): Promise<RecentDocumentActivity> {
    return this.analyticsService.getRecentDocumentActivity(limit);
  }

  /**
   * Get comprehensive token usage analytics
   * Admin-only access
   */
  @Query(() => TokenUsageAnalytics, { name: 'tokenUsageAnalytics' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getTokenUsageAnalytics(
    @Args('input', { nullable: true }) input?: DashboardAnalyticsInput,
  ): Promise<TokenUsageAnalytics> {
    return this.analyticsService.getTokenUsageAnalytics(input || {});
  }

  /**
   * Get token usage trend over time
   * Admin-only access
   */
  @Query(() => [TokenUsageTrend], { name: 'tokenUsageTrend' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getTokenUsageTrend(
    @Args('input', { nullable: true }) input?: DashboardAnalyticsInput,
  ): Promise<TokenUsageTrend[]> {
    const { startDate, endDate } = this.getDateRange(input);
    return this.analyticsService.getTokenUsageTrend(startDate, endDate);
  }

  /**
   * Get user token usage leaderboard
   * Admin-only access
   */
  @Query(() => [UserTokenUsage], { name: 'userTokenLeaderboard' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getUserTokenLeaderboard(
    @Args('input', { nullable: true }) input?: DashboardAnalyticsInput,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit?: number,
  ): Promise<UserTokenUsage[]> {
    const { startDate, endDate } = this.getDateRange(input);
    return this.analyticsService.getUserTokenLeaderboard(
      startDate,
      endDate,
      limit,
    );
  }

  /**
   * Get token usage breakdown by operation type
   * Admin-only access
   */
  @Query(() => [TokenUsageByOperation], { name: 'tokenUsageByOperation' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getTokenUsageByOperation(
    @Args('input', { nullable: true }) input?: DashboardAnalyticsInput,
  ): Promise<TokenUsageByOperation[]> {
    const { startDate, endDate } = this.getDateRange(input);
    return this.analyticsService.getTokenUsageByOperation(startDate, endDate);
  }

  /**
   * Get token usage export data for CSV/PDF generation
   * Admin-only access
   */
  @Query(() => TokenUsageExport, { name: 'tokenUsageExport' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getTokenUsageExport(
    @Args('input', { nullable: true }) input?: DashboardAnalyticsInput,
  ): Promise<TokenUsageExport> {
    return this.analyticsService.getTokenUsageExport(input || {});
  }

  /**
   * Calculate date range from input or default to last 30 days
   */
  private getDateRange(input?: DashboardAnalyticsInput): {
    startDate: Date;
    endDate: Date;
  } {
    const endDate = input?.endDate || new Date();
    const startDate =
      input?.startDate ||
      new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { startDate, endDate };
  }
}
