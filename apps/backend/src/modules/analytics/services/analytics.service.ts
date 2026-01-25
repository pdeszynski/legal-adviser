import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {
  LegalDocument,
  DocumentStatus,
} from '../../documents/entities/legal-document.entity';
import { LegalQuery } from '../../queries/entities/legal-query.entity';
import { AiUsageRecord } from '../../usage-tracking/entities/ai-usage-record.entity';
import { DemoRequestOrmEntity } from '../../../infrastructure/persistence/entities/demo-request.orm-entity';
import {
  AnalyticsDashboard,
  UserGrowthMetrics,
  DocumentMetrics,
  DocumentTypeDistribution,
  QueryMetrics,
  AiUsageMetrics,
  AiOperationBreakdown,
  SystemHealthMetrics,
  DashboardAnalyticsInput,
  ActiveUsersCount,
  TokenUsageBreakdown,
  DocumentGenerationMetrics,
  UserGrowthStats,
  AnalyticsTimeSeriesPoint,
  DocumentQueueMetrics,
  RecentDocumentActivity,
  DocumentActivityEntry,
  TokenUsageAnalytics,
  UserTokenUsage,
  TokenUsageByOperation,
  TokenUsageTrend,
  UsageAnomaly,
  TokenUsageExport,
  DemoRequestAnalytics,
  DemoRequestMetrics,
  DemoRequestStatusBreakdown,
  DemoRequestLeadSource,
  DemoRequestCompanySizeDistribution,
  DemoRequestIndustryBreakdown,
  DemoRequestTopUseCase,
  DemoRequestTimeSeriesPoint,
  DemoRequestResponseTimeMetrics,
} from '../dto/analytics.dto';

/**
 * Cache entry with TTL
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Analytics Service
 *
 * Aggregates platform-wide analytics from multiple modules.
 * Provides dashboard metrics for admin monitoring.
 *
 * Bounded Context: Analytics
 * - Aggregates data from: Users, Documents, Queries, Usage Tracking
 */
@Injectable()
export class AnalyticsService {
  /**
   * Default cache TTL in milliseconds (5 minutes)
   */
  private static readonly CACHE_TTL = 5 * 60 * 1000;

  /**
   * In-memory cache for analytics queries
   */
  private cache: Map<string, CacheEntry<any>> = new Map();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(LegalDocument)
    private readonly documentRepository: Repository<LegalDocument>,
    @InjectRepository(LegalQuery)
    private readonly queryRepository: Repository<LegalQuery>,
    @InjectRepository(AiUsageRecord)
    private readonly usageRepository: Repository<AiUsageRecord>,
    @InjectRepository(DemoRequestOrmEntity)
    private readonly demoRequestRepository: Repository<DemoRequestOrmEntity>,
  ) {}

  /**
   * Get or set cached value
   */
  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached value with TTL
   */
  private setCached<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + AnalyticsService.CACHE_TTL,
    });
  }

  /**
   * Generate cache key from parameters
   */
  private getCacheKey(method: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((k) => `${k}:${params[k]}`)
      .join('|');
    return `${method}:${sortedParams}`;
  }

  /**
   * Clear expired cache entries
   */
  private clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get complete dashboard analytics
   */
  async getDashboardData(
    input: DashboardAnalyticsInput,
  ): Promise<AnalyticsDashboard> {
    const { startDate, endDate } = this.getDateRange(input);

    const [
      userGrowth,
      documents,
      documentTypeDistribution,
      queries,
      aiUsage,
      aiOperationBreakdown,
      systemHealth,
    ] = await Promise.all([
      this.getUserGrowthMetrics(startDate, endDate),
      this.getDocumentMetrics(startDate, endDate),
      this.getDocumentTypeDistribution(startDate, endDate),
      this.getQueryMetrics(startDate, endDate),
      this.getAiUsageMetrics(startDate, endDate),
      this.getAiOperationBreakdown(startDate, endDate),
      this.getSystemHealthMetrics(startDate, endDate),
    ]);

    return {
      userGrowth,
      documents,
      documentTypeDistribution,
      queries,
      aiUsage,
      aiOperationBreakdown,
      systemHealth,
      generatedAt: new Date(),
    };
  }

  /**
   * Get user growth metrics
   */
  async getUserGrowthMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<UserGrowthMetrics> {
    const [totalUsers, activeUsers, newUsers, adminUsers] = await Promise.all([
      this.userRepository.count({
        where: { createdAt: LessThanOrEqual(endDate) },
      }),
      this.userRepository.count({ where: { isActive: true } }),
      this.userRepository.count({
        where: { createdAt: Between(startDate, endDate) },
      }),
      this.userRepository.count({ where: { role: 'admin' as const } }),
    ]);

    // Calculate previous period for growth rate
    const daysInPeriod = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const prevStartDate = new Date(
      startDate.getTime() - daysInPeriod * 24 * 60 * 60 * 1000,
    );
    const prevEndDate = new Date(startDate.getTime() - 1);

    const previousPeriodUsers = await this.userRepository.count({
      where: { createdAt: Between(prevStartDate, prevEndDate) },
    });

    const growthRate =
      previousPeriodUsers > 0
        ? ((newUsers - previousPeriodUsers) / previousPeriodUsers) * 100
        : 0;

    return {
      totalUsers,
      activeUsers,
      newUsers,
      adminUsers,
      periodStart: startDate,
      periodEnd: endDate,
      growthRate: Math.round(growthRate * 100) / 100,
    };
  }

  /**
   * Get document generation metrics
   */
  async getDocumentMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<DocumentMetrics> {
    const [
      totalDocuments,
      completedDocuments,
      draftDocuments,
      failedDocuments,
      generatingDocuments,
    ] = await Promise.all([
      this.documentRepository.count({
        where: { createdAt: Between(startDate, endDate) },
      }),
      this.documentRepository.count({
        where: {
          createdAt: Between(startDate, endDate),
          status: DocumentStatus.COMPLETED,
        },
      }),
      this.documentRepository.count({
        where: {
          createdAt: Between(startDate, endDate),
          status: DocumentStatus.DRAFT,
        },
      }),
      this.documentRepository.count({
        where: {
          createdAt: Between(startDate, endDate),
          status: DocumentStatus.FAILED,
        },
      }),
      this.documentRepository.count({
        where: {
          createdAt: Between(startDate, endDate),
          status: DocumentStatus.GENERATING,
        },
      }),
    ]);

    const successRate =
      totalDocuments > 0 ? (completedDocuments / totalDocuments) * 100 : 0;

    return {
      totalDocuments,
      completedDocuments,
      draftDocuments,
      failedDocuments,
      generatingDocuments,
      successRate: Math.round(successRate * 100) / 100,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }

  /**
   * Get document type distribution
   */
  async getDocumentTypeDistribution(
    startDate: Date,
    endDate: Date,
  ): Promise<DocumentTypeDistribution[]> {
    const results = await this.documentRepository
      .createQueryBuilder('doc')
      .select('doc.type', 'documentType')
      .addSelect('COUNT(*)', 'count')
      .where('doc.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('doc.type')
      .orderBy('count', 'DESC')
      .getRawMany();

    const total = results.reduce((sum, r) => sum + parseInt(r.count), 0);

    return results.map((r) => ({
      documentType: r.documentType,
      count: parseInt(r.count),
      percentage:
        total > 0 ? Math.round((parseInt(r.count) / total) * 10000) / 100 : 0,
    }));
  }

  /**
   * Get query activity metrics
   */
  async getQueryMetrics(startDate: Date, endDate: Date): Promise<QueryMetrics> {
    const [totalQueries, uniqueUsers, totalCitations] = await Promise.all([
      this.queryRepository.count({
        where: { createdAt: Between(startDate, endDate) },
      }),
      this.queryRepository
        .createQueryBuilder('query')
        .select('COUNT(DISTINCT query.sessionId)', 'count')
        .where('query.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .getRawOne()
        .then((result) => parseInt(result?.count || '0')),
      this.queryRepository
        .createQueryBuilder('query')
        .select('SUM(array_length(query.citations, 1))', 'total')
        .where('query.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .andWhere('query.citations IS NOT NULL')
        .getRawOne()
        .then((result) => parseInt(result?.total || '0')),
    ]);

    const avgQueriesPerUser = uniqueUsers > 0 ? totalQueries / uniqueUsers : 0;
    const avgCitationsPerQuery =
      totalQueries > 0 ? totalCitations / totalQueries : 0;

    return {
      totalQueries,
      uniqueUsers,
      avgQueriesPerUser: Math.round(avgQueriesPerUser * 100) / 100,
      totalCitations,
      avgCitationsPerQuery: Math.round(avgCitationsPerQuery * 100) / 100,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }

  /**
   * Get AI usage and cost metrics
   */
  async getAiUsageMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<AiUsageMetrics> {
    const result = await this.usageRepository
      .createQueryBuilder('usage')
      .select('COUNT(*)', 'totalRequests')
      .addSelect('SUM(usage.tokensUsed)', 'totalTokens')
      .addSelect('SUM(usage.costCalculated)', 'totalCost')
      .where('usage.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    const totalRequests = parseInt(result?.totalRequests || '0');
    const totalTokens = parseInt(result?.totalTokens || '0');
    const totalCost = parseFloat(result?.totalCost || '0');

    const avgCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;
    const avgTokensPerRequest =
      totalRequests > 0 ? totalTokens / totalRequests : 0;

    return {
      totalRequests,
      totalTokens,
      totalCost: Math.round(totalCost * 1000000) / 1000000,
      avgCostPerRequest: Math.round(avgCostPerRequest * 1000000) / 1000000,
      avgTokensPerRequest: Math.round(avgTokensPerRequest * 100) / 100,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }

  /**
   * Get AI operation breakdown
   */
  async getAiOperationBreakdown(
    startDate: Date,
    endDate: Date,
  ): Promise<AiOperationBreakdown[]> {
    const results = await this.usageRepository
      .createQueryBuilder('usage')
      .select('usage.operationType', 'operationType')
      .addSelect('COUNT(*)', 'requestCount')
      .addSelect('SUM(usage.tokensUsed)', 'totalTokens')
      .addSelect('SUM(usage.costCalculated)', 'totalCost')
      .where('usage.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('usage.operationType')
      .orderBy('totalCost', 'DESC')
      .getRawMany();

    const totalCost = results.reduce(
      (sum, r) => sum + parseFloat(r.totalCost || 0),
      0,
    );

    return results.map((r) => ({
      operationType: r.operationType,
      requestCount: parseInt(r.requestCount),
      totalTokens: parseInt(r.totalTokens),
      totalCost: Math.round(parseFloat(r.totalCost) * 1000000) / 1000000,
      costPercentage:
        totalCost > 0
          ? Math.round((parseFloat(r.totalCost) / totalCost) * 10000) / 100
          : 0,
    }));
  }

  /**
   * Get system health metrics
   */
  async getSystemHealthMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<SystemHealthMetrics> {
    const documentSuccessRate = await this.getDocumentMetrics(
      startDate,
      endDate,
    ).then((metrics) => metrics.successRate);

    return {
      documentSuccessRate: Math.round(documentSuccessRate * 100) / 100,
      avgResponseTime: 0, // Placeholder: would need actual response time tracking
      activeSessions: 0, // Placeholder: would need session tracking
      timestamp: new Date(),
    };
  }

  /**
   * Calculate date range from input or default to last 30 days
   */
  private getDateRange(input: DashboardAnalyticsInput): {
    startDate: Date;
    endDate: Date;
  } {
    const endDate = input.endDate || new Date();
    const days = input.startDate
      ? Math.ceil(
          (endDate.getTime() - input.startDate.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 30;

    const startDate =
      input.startDate ||
      new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    return { startDate, endDate };
  }

  /**
   * Get active users count for different time periods (24h, 7d, 30d)
   * Active users are those who have created a session within the period
   */
  async getActiveUsersCount(): Promise<ActiveUsersCount> {
    const cacheKey = this.getCacheKey('activeUsersCount', {});

    const cached = this.getCached<ActiveUsersCount>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Count distinct users who have created sessions in each period
    const [last24hCount, last7dCount, last30dCount] = await Promise.all([
      this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.sessions', 'session')
        .where('session.createdAt >= :since', { since: last24h })
        .getCount(),
      this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.sessions', 'session')
        .where('session.createdAt >= :since', { since: last7d })
        .getCount(),
      this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.sessions', 'session')
        .where('session.createdAt >= :since', { since: last30d })
        .getCount(),
    ]);

    const result: ActiveUsersCount = {
      last24Hours: last24hCount,
      last7Days: last7dCount,
      last30Days: last30dCount,
      calculatedAt: now,
    };

    this.setCached(cacheKey, result);
    return result;
  }

  /**
   * Get total token usage with daily/monthly breakdown
   */
  async getTotalTokenUsage(
    startDate: Date,
    endDate: Date,
    period: string = 'DAILY',
  ): Promise<TokenUsageBreakdown[]> {
    const cacheKey = this.getCacheKey('totalTokenUsage', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      period,
    });

    const cached = this.getCached<TokenUsageBreakdown[]>(cacheKey);
    if (cached) return cached;

    // Determine date truncation based on period
    let truncateFormat: string;
    switch (period) {
      case 'HOURLY':
        truncateFormat = "date_trunc('hour', usage.createdAt)";
        break;
      case 'DAILY':
        truncateFormat = "date_trunc('day', usage.createdAt)";
        break;
      case 'WEEKLY':
        truncateFormat = "date_trunc('week', usage.createdAt)";
        break;
      case 'MONTHLY':
        truncateFormat = "date_trunc('month', usage.createdAt)";
        break;
      case 'YEARLY':
        truncateFormat = "date_trunc('year', usage.createdAt)";
        break;
      default:
        truncateFormat = "date_trunc('day', usage.createdAt)";
    }

    const results = await this.usageRepository
      .createQueryBuilder('usage')
      .select(truncateFormat, 'periodStart')
      .addSelect('MAX(usage.createdAt)', 'periodEnd')
      .addSelect('SUM(usage.tokensUsed)', 'totalTokens')
      .addSelect('SUM(usage.costCalculated)', 'totalCost')
      .addSelect('COUNT(*)', 'totalRequests')
      .where('usage.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('periodStart')
      .orderBy('periodStart', 'ASC')
      .getRawMany();

    const result: TokenUsageBreakdown[] = results.map((r) => ({
      periodStart: new Date(r.periodStart),
      periodEnd: new Date(r.periodEnd),
      totalTokens: parseInt(r.totalTokens || '0'),
      totalCost: parseFloat(r.totalCost || '0'),
      totalRequests: parseInt(r.totalRequests || '0'),
    }));

    this.setCached(cacheKey, result);
    return result;
  }

  /**
   * Get query volume per day chart data
   */
  async getQueryVolume(
    startDate: Date,
    endDate: Date,
  ): Promise<AnalyticsTimeSeriesPoint[]> {
    const cacheKey = this.getCacheKey('queryVolume', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const cached = this.getCached<AnalyticsTimeSeriesPoint[]>(cacheKey);
    if (cached) return cached;

    const results = await this.queryRepository
      .createQueryBuilder('query')
      .select("date_trunc('day', query.createdAt)", 'timestamp')
      .addSelect('COUNT(*)', 'count')
      .where('query.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('timestamp')
      .orderBy('timestamp', 'ASC')
      .getRawMany();

    const result: AnalyticsTimeSeriesPoint[] = results.map((r) => ({
      timestamp: new Date(r.timestamp),
      count: parseInt(r.count),
    }));

    this.setCached(cacheKey, result);
    return result;
  }

  /**
   * Get document generation metrics including timing and success rate
   * Note: Average generation time is estimated based on createdAt timestamps
   * since explicit generation time tracking is not available in the current schema
   */
  async getDocumentGenerationMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<DocumentGenerationMetrics> {
    const cacheKey = this.getCacheKey('documentGenerationMetrics', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const cached = this.getCached<DocumentGenerationMetrics>(cacheKey);
    if (cached) return cached;

    const [totalDocuments, successfulDocuments, failedDocuments] =
      await Promise.all([
        this.documentRepository.count({
          where: { createdAt: Between(startDate, endDate) },
        }),
        this.documentRepository.count({
          where: {
            createdAt: Between(startDate, endDate),
            status: DocumentStatus.COMPLETED,
          },
        }),
        this.documentRepository.count({
          where: {
            createdAt: Between(startDate, endDate),
            status: DocumentStatus.FAILED,
          },
        }),
      ]);

    const successRate =
      totalDocuments > 0 ? (successfulDocuments / totalDocuments) * 100 : 0;

    // Estimate average generation time
    // In a production system, this would use actual timing data stored in the entity
    const avgGenerationTime = 30; // Placeholder: 30 seconds default estimate

    const result: DocumentGenerationMetrics = {
      avgGenerationTime,
      successRate: Math.round(successRate * 100) / 100,
      totalDocuments,
      successfulDocuments,
      failedDocuments,
      periodStart: startDate,
      periodEnd: endDate,
    };

    this.setCached(cacheKey, result);
    return result;
  }

  /**
   * Get user growth stats with new users per period
   */
  async getUserGrowthStats(
    startDate: Date,
    endDate: Date,
    period: string = 'DAILY',
  ): Promise<UserGrowthStats> {
    const cacheKey = this.getCacheKey('userGrowthStats', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      period,
    });

    const cached = this.getCached<UserGrowthStats>(cacheKey);
    if (cached) return cached;

    // Determine date truncation based on period
    let truncateFormat: string;
    switch (period) {
      case 'HOURLY':
        truncateFormat = "date_trunc('hour', user.createdAt)";
        break;
      case 'DAILY':
        truncateFormat = "date_trunc('day', user.createdAt)";
        break;
      case 'WEEKLY':
        truncateFormat = "date_trunc('week', user.createdAt)";
        break;
      case 'MONTHLY':
        truncateFormat = "date_trunc('month', user.createdAt)";
        break;
      case 'YEARLY':
        truncateFormat = "date_trunc('year', user.createdAt)";
        break;
      default:
        truncateFormat = "date_trunc('day', user.createdAt)";
    }

    const results = await this.userRepository
      .createQueryBuilder('user')
      .select(truncateFormat, 'timestamp')
      .addSelect('COUNT(*)', 'count')
      .where('user.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('timestamp')
      .orderBy('timestamp', 'ASC')
      .getRawMany();

    const newUsersPerPeriod: AnalyticsTimeSeriesPoint[] = results.map((r) => ({
      timestamp: new Date(r.timestamp),
      count: parseInt(r.count),
    }));

    const totalNewUsers = newUsersPerPeriod.reduce(
      (sum, p) => sum + p.count,
      0,
    );

    // Calculate average growth rate (users per day)
    const daysInPeriod = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const avgGrowthRate = daysInPeriod > 0 ? totalNewUsers / daysInPeriod : 0;

    const result: UserGrowthStats = {
      newUsersPerPeriod,
      totalNewUsers,
      avgGrowthRate: Math.round(avgGrowthRate * 100) / 100,
      periodStart: startDate,
      periodEnd: endDate,
    };

    this.setCached(cacheKey, result);
    return result;
  }

  /**
   * Get current document queue metrics for real-time monitoring
   * Returns count of documents in each status (not filtered by time period)
   */
  async getDocumentQueueMetrics(): Promise<DocumentQueueMetrics> {
    // No cache - always return fresh data for real-time monitoring
    const [draftCount, generatingCount, completedCount, failedCount] =
      await Promise.all([
        this.documentRepository.count({
          where: { status: DocumentStatus.DRAFT },
        }),
        this.documentRepository.count({
          where: { status: DocumentStatus.GENERATING },
        }),
        this.documentRepository.count({
          where: { status: DocumentStatus.COMPLETED },
        }),
        this.documentRepository.count({
          where: { status: DocumentStatus.FAILED },
        }),
      ]);

    return {
      draftCount,
      generatingCount,
      completedCount,
      failedCount,
      calculatedAt: new Date(),
    };
  }

  /**
   * Get recent document activity for admin monitoring
   * Returns recently completed, failed, and currently generating documents
   */
  async getRecentDocumentActivity(
    limit: number = 10,
  ): Promise<RecentDocumentActivity> {
    // No cache - always return fresh data for real-time monitoring
    const now = new Date();

    // Get recently completed documents (last 24 hours, most recent first)
    const recentCompleted = await this.documentRepository
      .createQueryBuilder('doc')
      .leftJoin('doc.session', 'session')
      .leftJoin('session.user', 'user')
      .select([
        'doc.id',
        'doc.title',
        'doc.status',
        'doc.type',
        'doc.createdAt',
        'doc.updatedAt',
        'user.id',
      ])
      .where('doc.status = :status', { status: DocumentStatus.COMPLETED })
      .andWhere('doc.updatedAt >= :since', {
        since: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      })
      .orderBy('doc.updatedAt', 'DESC')
      .limit(limit)
      .getRawMany();

    // Get recently failed documents (last 24 hours, most recent first)
    const recentFailed = await this.documentRepository
      .createQueryBuilder('doc')
      .leftJoin('doc.session', 'session')
      .leftJoin('session.user', 'user')
      .select([
        'doc.id',
        'doc.title',
        'doc.status',
        'doc.type',
        'doc.createdAt',
        'doc.updatedAt',
        'user.id',
      ])
      .where('doc.status = :status', { status: DocumentStatus.FAILED })
      .andWhere('doc.updatedAt >= :since', {
        since: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      })
      .orderBy('doc.updatedAt', 'DESC')
      .limit(limit)
      .getRawMany();

    // Get currently generating documents
    const currentlyGenerating = await this.documentRepository
      .createQueryBuilder('doc')
      .leftJoin('doc.session', 'session')
      .leftJoin('session.user', 'user')
      .select([
        'doc.id',
        'doc.title',
        'doc.status',
        'doc.type',
        'doc.createdAt',
        'doc.updatedAt',
        'user.id',
      ])
      .where('doc.status = :status', { status: DocumentStatus.GENERATING })
      .orderBy('doc.createdAt', 'DESC')
      .limit(limit)
      .getRawMany();

    const mapToActivityEntry = (raw: any): DocumentActivityEntry => ({
      documentId: raw.doc_id,
      title: raw.doc_title,
      status: raw.doc_status,
      documentType: raw.doc_type || undefined,
      createdAt: new Date(raw.doc_createdAt),
      updatedAt: new Date(raw.doc_updatedAt),
      userId: raw.user_id || undefined,
    });

    return {
      recentCompletions: recentCompleted.map(mapToActivityEntry),
      recentFailures: recentFailed.map(mapToActivityEntry),
      currentlyGenerating: currentlyGenerating.map(mapToActivityEntry),
      fetchedAt: now,
    };
  }

  /**
   * Get comprehensive token usage analytics
   * Returns all-time, monthly, daily metrics with trends, user leaderboard, and anomalies
   */
  async getTokenUsageAnalytics(
    input: DashboardAnalyticsInput,
  ): Promise<TokenUsageAnalytics> {
    const { startDate, endDate } = this.getDateRange(input);

    const cacheKey = this.getCacheKey('tokenUsageAnalytics', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const cached = this.getCached<TokenUsageAnalytics>(cacheKey);
    if (cached) return cached;

    // Get date ranges for different time periods
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all queries in parallel
    const [
      allTimeData,
      thisMonthData,
      todayData,
      trendData,
      userLeaderboard,
      byOperation,
      avgTokensPerQuery,
    ] = await Promise.all([
      this.getAggregatedUsageData(new Date(0), now),
      this.getAggregatedUsageData(monthStart, now),
      this.getAggregatedUsageData(todayStart, now),
      this.getTokenUsageTrend(startDate, endDate),
      this.getUserTokenLeaderboard(startDate, endDate),
      this.getTokenUsageByOperation(startDate, endDate),
      this.getAvgTokensPerQuery(startDate, endDate),
    ]);

    // Detect anomalies
    const anomalies = await this.detectUsageAnomalies(
      startDate,
      endDate,
      trendData,
    );

    const result: TokenUsageAnalytics = {
      allTimeTokens: allTimeData.totalTokens,
      allTimeCost: allTimeData.totalCost,
      thisMonthTokens: thisMonthData.totalTokens,
      thisMonthCost: thisMonthData.totalCost,
      todayTokens: todayData.totalTokens,
      todayCost: todayData.totalCost,
      avgTokensPerQuery,
      trend: trendData,
      userLeaderboard,
      byOperation,
      anomalies,
      periodStart: startDate,
      periodEnd: endDate,
      generatedAt: now,
    };

    this.setCached(cacheKey, result);
    return result;
  }

  /**
   * Get aggregated usage data for a date range
   */
  private async getAggregatedUsageData(
    startDate: Date,
    endDate: Date,
  ): Promise<{ totalTokens: number; totalCost: number; requestCount: number }> {
    const result = await this.usageRepository
      .createQueryBuilder('usage')
      .select('SUM(usage.tokensUsed)', 'totalTokens')
      .addSelect('SUM(usage.costCalculated)', 'totalCost')
      .addSelect('COUNT(*)', 'requestCount')
      .where('usage.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    return {
      totalTokens: parseInt(result?.totalTokens || '0'),
      totalCost: parseFloat(result?.totalCost || '0'),
      requestCount: parseInt(result?.requestCount || '0'),
    };
  }

  /**
   * Get token usage trend over time
   */
  async getTokenUsageTrend(
    startDate: Date,
    endDate: Date,
    period: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY',
  ): Promise<TokenUsageTrend[]> {
    const cacheKey = this.getCacheKey('tokenUsageTrend', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      period,
    });

    const cached = this.getCached<TokenUsageTrend[]>(cacheKey);
    if (cached) return cached;

    let truncateFormat: string;
    switch (period) {
      case 'HOURLY':
        truncateFormat = "date_trunc('hour', usage.createdAt)";
        break;
      case 'DAILY':
        truncateFormat = "date_trunc('day', usage.createdAt)";
        break;
      case 'WEEKLY':
        truncateFormat = "date_trunc('week', usage.createdAt)";
        break;
      case 'MONTHLY':
        truncateFormat = "date_trunc('month', usage.createdAt)";
        break;
      default:
        truncateFormat = "date_trunc('day', usage.createdAt)";
    }

    const results = await this.usageRepository
      .createQueryBuilder('usage')
      .select(truncateFormat, 'timestamp')
      .addSelect('SUM(usage.tokensUsed)', 'tokens')
      .addSelect('SUM(usage.costCalculated)', 'cost')
      .addSelect('COUNT(*)', 'requests')
      .where('usage.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('timestamp')
      .orderBy('timestamp', 'ASC')
      .getRawMany();

    // Calculate percentage changes
    const result: TokenUsageTrend[] = results.map((r, index) => {
      const changePercentage =
        index > 0
          ? ((parseInt(r.tokens) - parseInt(results[index - 1].tokens)) /
              parseInt(results[index - 1].tokens)) *
            100
          : 0;

      return {
        timestamp: new Date(r.timestamp),
        tokens: parseInt(r.tokens || '0'),
        cost: parseFloat(r.cost || '0'),
        requests: parseInt(r.requests || '0'),
        changePercentage: Math.round(changePercentage * 100) / 100,
      };
    });

    this.setCached(cacheKey, result);
    return result;
  }

  /**
   * Get user token usage leaderboard
   */
  async getUserTokenLeaderboard(
    startDate: Date,
    endDate: Date,
    limit: number = 20,
  ): Promise<UserTokenUsage[]> {
    const cacheKey = this.getCacheKey('userTokenLeaderboard', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit,
    });

    const cached = this.getCached<UserTokenUsage[]>(cacheKey);
    if (cached) return cached;

    const results = await this.usageRepository
      .createQueryBuilder('usage')
      .select('usage.userId', 'userId')
      .addSelect('SUM(usage.tokensUsed)', 'totalTokens')
      .addSelect('SUM(usage.costCalculated)', 'totalCost')
      .addSelect('COUNT(*)', 'requestCount')
      .where('usage.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('usage.userId')
      .orderBy('totalTokens', 'DESC')
      .limit(limit)
      .getRawMany();

    // Fetch user details for all user IDs
    const userIds = results.map((r) => r.userId);
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id IN (:...userIds)', { userIds })
      .getMany();

    const userMap = new Map(users.map((u) => [u.id, u]));

    const result: UserTokenUsage[] = results.map((r) => {
      const user = userMap.get(r.userId);
      const avgTokens =
        parseInt(r.requestCount) > 0
          ? parseInt(r.totalTokens) / parseInt(r.requestCount)
          : 0;

      return {
        userId: r.userId,
        userEmail: user?.email,
        userName:
          user?.name || user?.firstName
            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
            : undefined,
        totalTokens: parseInt(r.totalTokens || '0'),
        totalCost:
          Math.round(parseFloat(r.totalCost || '0') * 1000000) / 1000000,
        requestCount: parseInt(r.requestCount || '0'),
        avgTokensPerRequest: Math.round(avgTokens),
        periodStart: startDate,
        periodEnd: endDate,
      };
    });

    this.setCached(cacheKey, result);
    return result;
  }

  /**
   * Get token usage breakdown by operation type
   */
  async getTokenUsageByOperation(
    startDate: Date,
    endDate: Date,
  ): Promise<TokenUsageByOperation[]> {
    const cacheKey = this.getCacheKey('tokenUsageByOperation', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const cached = this.getCached<TokenUsageByOperation[]>(cacheKey);
    if (cached) return cached;

    const results = await this.usageRepository
      .createQueryBuilder('usage')
      .select('usage.operationType', 'operationType')
      .addSelect('SUM(usage.tokensUsed)', 'totalTokens')
      .addSelect('SUM(usage.costCalculated)', 'totalCost')
      .addSelect('COUNT(*)', 'requestCount')
      .where('usage.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('usage.operationType')
      .orderBy('totalTokens', 'DESC')
      .getRawMany();

    const totalTokens = results.reduce(
      (sum, r) => sum + parseInt(r.totalTokens || '0'),
      0,
    );
    const totalCost = results.reduce(
      (sum, r) => sum + parseFloat(r.totalCost || '0'),
      0,
    );

    const result: TokenUsageByOperation[] = results.map((r) => {
      const reqCount = parseInt(r.requestCount || '0');
      const tokens = parseInt(r.totalTokens || '0');

      return {
        operationType: r.operationType,
        totalTokens: tokens,
        totalCost:
          Math.round(parseFloat(r.totalCost || '0') * 1000000) / 1000000,
        requestCount: reqCount,
        tokenPercentage:
          totalTokens > 0
            ? Math.round((tokens / totalTokens) * 10000) / 100
            : 0,
        costPercentage:
          totalCost > 0
            ? Math.round((parseFloat(r.totalCost || '0') / totalCost) * 10000) /
              100
            : 0,
        avgTokensPerRequest: reqCount > 0 ? Math.round(tokens / reqCount) : 0,
      };
    });

    this.setCached(cacheKey, result);
    return result;
  }

  /**
   * Get average tokens per query
   */
  async getAvgTokensPerQuery(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.usageRepository
      .createQueryBuilder('usage')
      .select('SUM(usage.tokensUsed)', 'totalTokens')
      .addSelect('COUNT(*)', 'requestCount')
      .where('usage.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    const totalTokens = parseInt(result?.totalTokens || '0');
    const requestCount = parseInt(result?.requestCount || '0');

    return requestCount > 0 ? Math.round(totalTokens / requestCount) : 0;
  }

  /**
   * Detect usage anomalies (spikes, unusual patterns, high consumers)
   */
  async detectUsageAnomalies(
    startDate: Date,
    endDate: Date,
    trendData: TokenUsageTrend[],
  ): Promise<UsageAnomaly[]> {
    const anomalies: UsageAnomaly[] = [];

    // Calculate average and standard deviation of token usage
    if (trendData.length < 3) {
      return anomalies;
    }

    const values = trendData.map((t) => t.tokens);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);
    const threshold = mean + 2 * stdDev; // 2 standard deviations above mean

    // Detect spikes in trend data
    for (const point of trendData) {
      if (point.tokens > threshold) {
        anomalies.push({
          detectedAt: point.timestamp,
          anomalyType: 'SPIKE',
          description: `Unusual spike in token usage: ${point.tokens.toLocaleString()} tokens`,
          tokenCount: point.tokens,
          expectedValue: Math.round(mean),
          deviationPercentage: Math.round(((point.tokens - mean) / mean) * 100),
        });
      }
    }

    // Detect high-consuming users
    const userLeaderboard = await this.getUserTokenLeaderboard(
      startDate,
      endDate,
      5,
    );
    if (userLeaderboard.length > 0) {
      const userAvg =
        userLeaderboard.reduce((sum, u) => sum + u.totalTokens, 0) /
        userLeaderboard.length;
      const highUserThreshold = userAvg * 3; // 3x the average of top users

      for (const user of userLeaderboard) {
        if (user.totalTokens > highUserThreshold) {
          anomalies.push({
            userId: user.userId,
            userEmail: user.userEmail,
            detectedAt: new Date(),
            anomalyType: 'HIGH_CONSUMER',
            description: `User ${user.userEmail || user.userId} has consumed ${user.totalTokens.toLocaleString()} tokens`,
            tokenCount: user.totalTokens,
            expectedValue: Math.round(userAvg),
            deviationPercentage: Math.round(
              ((user.totalTokens - userAvg) / userAvg) * 100,
            ),
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Get token usage export data for CSV/PDF generation
   */
  async getTokenUsageExport(
    input: DashboardAnalyticsInput,
  ): Promise<TokenUsageExport> {
    const { startDate, endDate } = this.getDateRange(input);

    const [userUsageData, operationBreakdown, trendData] = await Promise.all([
      this.getUserTokenLeaderboard(startDate, endDate, 100),
      this.getTokenUsageByOperation(startDate, endDate),
      this.getTokenUsageTrend(startDate, endDate, 'DAILY'),
    ]);

    return {
      userUsageData,
      operationBreakdown,
      trendData,
      exportedAt: new Date(),
      periodStart: startDate,
      periodEnd: endDate,
    };
  }

  /**
   * Get comprehensive demo request analytics
   * Includes metrics, funnel breakdown, lead sources, and trends
   */
  async getDemoRequestAnalytics(
    input: DashboardAnalyticsInput,
  ): Promise<DemoRequestAnalytics> {
    const { startDate, endDate } = this.getDateRange(input);

    const cacheKey = this.getCacheKey('demoRequestAnalytics', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const cached = this.getCached<DemoRequestAnalytics>(cacheKey);
    if (cached) return cached;

    const [
      metrics,
      statusBreakdown,
      leadSources,
      companySizeDistribution,
      industryBreakdown,
      topUseCases,
      requestsOverTime,
      responseTimeMetrics,
    ] = await Promise.all([
      this.getDemoRequestMetrics(startDate, endDate),
      this.getDemoRequestStatusBreakdown(startDate, endDate),
      this.getDemoRequestLeadSources(startDate, endDate),
      this.getDemoRequestCompanySizeDistribution(startDate, endDate),
      this.getDemoRequestIndustryBreakdown(startDate, endDate),
      this.getDemoRequestTopUseCases(startDate, endDate),
      this.getDemoRequestsOverTime(startDate, endDate),
      this.getDemoRequestResponseTimeMetrics(startDate, endDate),
    ]);

    const result: DemoRequestAnalytics = {
      metrics,
      statusBreakdown,
      leadSources,
      companySizeDistribution,
      industryBreakdown,
      topUseCases,
      requestsOverTime,
      responseTimeMetrics,
      generatedAt: new Date(),
    };

    this.setCached(cacheKey, result);
    return result;
  }

  /**
   * Get demo request metrics with conversion rates
   */
  async getDemoRequestMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<DemoRequestMetrics> {
    const results = await this.demoRequestRepository
      .createQueryBuilder('dr')
      .select('dr.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('dr.submittedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('dr.status')
      .getRawMany();

    const statusCounts: Record<string, number> = {
      NEW: 0,
      CONTACTED: 0,
      SCHEDULED: 0,
      QUALIFIED: 0,
      CLOSED: 0,
    };

    for (const row of results) {
      statusCounts[row.status] = parseInt(row.count);
    }

    const totalRequests = Object.values(statusCounts).reduce(
      (a, b) => a + b,
      0,
    );
    const newRequests = statusCounts.NEW;
    const contactedRequests = statusCounts.CONTACTED;
    const scheduledRequests = statusCounts.SCHEDULED;
    const qualifiedRequests = statusCounts.QUALIFIED;
    const closedRequests = statusCounts.CLOSED;

    // Calculate conversion rates
    const newToContactedRate =
      newRequests > 0 ? (contactedRequests / newRequests) * 100 : 0;
    const contactedToScheduledRate =
      contactedRequests > 0 ? (scheduledRequests / contactedRequests) * 100 : 0;
    const overallConversionRate =
      newRequests > 0 ? (closedRequests / newRequests) * 100 : 0;

    return {
      totalRequests,
      newRequests,
      contactedRequests,
      scheduledRequests,
      qualifiedRequests,
      closedRequests,
      newToContactedRate: Math.round(newToContactedRate * 100) / 100,
      contactedToScheduledRate:
        Math.round(contactedToScheduledRate * 100) / 100,
      overallConversionRate: Math.round(overallConversionRate * 100) / 100,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }

  /**
   * Get demo request status breakdown for funnel visualization
   */
  async getDemoRequestStatusBreakdown(
    startDate: Date,
    endDate: Date,
  ): Promise<DemoRequestStatusBreakdown[]> {
    const results = await this.demoRequestRepository
      .createQueryBuilder('dr')
      .select('dr.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('dr.submittedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('dr.status')
      .orderBy('count', 'DESC')
      .getRawMany();

    const total = results.reduce((sum, r) => sum + parseInt(r.count), 0);

    return results.map((r) => ({
      status: r.status,
      count: parseInt(r.count),
      percentage:
        total > 0 ? Math.round((parseInt(r.count) / total) * 10000) / 100 : 0,
    }));
  }

  /**
   * Get demo request lead sources from UTM parameters
   */
  async getDemoRequestLeadSources(
    startDate: Date,
    endDate: Date,
  ): Promise<DemoRequestLeadSource[]> {
    const results = await this.demoRequestRepository
      .createQueryBuilder('dr')
      .select("COALESCE(dr.metadata->>'utm_source', 'direct')", 'source')
      .addSelect("COALESCE(dr.metadata->>'utm_medium', 'none')", 'medium')
      .addSelect('COUNT(*)', 'count')
      .where('dr.submittedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('source, medium')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const total = results.reduce((sum, r) => sum + parseInt(r.count), 0);

    return results.map((r) => ({
      source: r.source === 'direct' ? null : r.source,
      medium: r.medium === 'none' ? null : r.medium,
      count: parseInt(r.count),
      percentage:
        total > 0 ? Math.round((parseInt(r.count) / total) * 10000) / 100 : 0,
    }));
  }

  /**
   * Get demo request company size distribution
   */
  async getDemoRequestCompanySizeDistribution(
    startDate: Date,
    endDate: Date,
  ): Promise<DemoRequestCompanySizeDistribution[]> {
    const results = await this.demoRequestRepository
      .createQueryBuilder('dr')
      .select('dr.companySize', 'companySize')
      .addSelect('COUNT(*)', 'count')
      .where('dr.submittedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('dr.companySize IS NOT NULL')
      .groupBy('dr.companySize')
      .orderBy('count', 'DESC')
      .getRawMany();

    const total = results.reduce((sum, r) => sum + parseInt(r.count), 0);

    return results.map((r) => ({
      companySize: r.companySize || 'Unknown',
      count: parseInt(r.count),
      percentage:
        total > 0 ? Math.round((parseInt(r.count) / total) * 10000) / 100 : 0,
    }));
  }

  /**
   * Get demo request industry breakdown
   */
  async getDemoRequestIndustryBreakdown(
    startDate: Date,
    endDate: Date,
  ): Promise<DemoRequestIndustryBreakdown[]> {
    const results = await this.demoRequestRepository
      .createQueryBuilder('dr')
      .select('dr.industry', 'industry')
      .addSelect('COUNT(*)', 'count')
      .where('dr.submittedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('dr.industry IS NOT NULL')
      .groupBy('dr.industry')
      .orderBy('count', 'DESC')
      .getRawMany();

    const total = results.reduce((sum, r) => sum + parseInt(r.count), 0);

    return results.map((r) => ({
      industry: r.industry || 'Unknown',
      count: parseInt(r.count),
      percentage:
        total > 0 ? Math.round((parseInt(r.count) / total) * 10000) / 100 : 0,
    }));
  }

  /**
   * Get top use cases mentioned in demo requests
   * Groups similar use cases and returns top mentions
   */
  async getDemoRequestTopUseCases(
    startDate: Date,
    endDate: Date,
  ): Promise<DemoRequestTopUseCase[]> {
    const results = await this.demoRequestRepository
      .createQueryBuilder('dr')
      .select('dr.useCase', 'useCase')
      .addSelect('COUNT(*)', 'count')
      .where('dr.submittedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('dr.useCase')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return results.map((r) => ({
      useCase:
        r.useCase.length > 100
          ? r.useCase.substring(0, 100) + '...'
          : r.useCase,
      count: parseInt(r.count),
    }));
  }

  /**
   * Get demo requests over time (daily)
   */
  async getDemoRequestsOverTime(
    startDate: Date,
    endDate: Date,
  ): Promise<DemoRequestTimeSeriesPoint[]> {
    const results = await this.demoRequestRepository
      .createQueryBuilder('dr')
      .select("date_trunc('day', dr.submittedAt)", 'timestamp')
      .addSelect('COUNT(*)', 'count')
      .where('dr.submittedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('timestamp')
      .orderBy('timestamp', 'ASC')
      .getRawMany();

    return results.map((r) => ({
      timestamp: new Date(r.timestamp),
      count: parseInt(r.count),
    }));
  }

  /**
   * Get demo request response time metrics
   * Calculates average time from submission to first contact
   */
  async getDemoRequestResponseTimeMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<DemoRequestResponseTimeMetrics> {
    const results = await this.demoRequestRepository
      .createQueryBuilder('dr')
      .select(
        'EXTRACT(EPOCH FROM (dr.contactedAt - dr.submittedAt)) / 3600',
        'hoursToContact',
      )
      .where('dr.submittedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('dr.contactedAt IS NOT NULL')
      .getRawMany();

    const hoursToContact = results
      .map((r) => parseFloat(r.hoursToContact))
      .filter((h) => h >= 0 && h < 720); // Filter outliers: max 30 days

    const totalContacted = hoursToContact.length;

    if (totalContacted === 0) {
      return {
        avgHoursToContact: 0,
        medianHoursToContact: 0,
        totalContacted: 0,
        calculatedAt: new Date(),
      };
    }

    // Calculate average
    const avgHoursToContact =
      hoursToContact.reduce((a, b) => a + b, 0) / totalContacted;

    // Calculate median
    const sorted = [...hoursToContact].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const medianHoursToContact =
      sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;

    return {
      avgHoursToContact: Math.round(avgHoursToContact * 100) / 100,
      medianHoursToContact: Math.round(medianHoursToContact * 100) / 100,
      totalContacted,
      calculatedAt: new Date(),
    };
  }
}
