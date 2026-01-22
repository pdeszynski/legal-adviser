import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {
  LegalDocument,
  DocumentStatus,
} from '../../documents/entities/legal-document.entity';
import { LegalQuery } from '../../queries/entities/legal-query.entity';
import { AiUsageRecord } from '../../usage-tracking/entities/ai-usage-record.entity';
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
} from '../dto/analytics.dto';

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
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(LegalDocument)
    private readonly documentRepository: Repository<LegalDocument>,
    @InjectRepository(LegalQuery)
    private readonly queryRepository: Repository<LegalQuery>,
    @InjectRepository(AiUsageRecord)
    private readonly usageRepository: Repository<AiUsageRecord>,
  ) {}

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
}
