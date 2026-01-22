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
} from './dto/analytics.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

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
