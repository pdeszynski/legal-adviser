import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import {
  LegalRuling,
  CourtType,
} from '../../documents/entities/legal-ruling.entity';
import {
  SaosIndexingMetrics,
  SaosIndexingByCourtType,
  SaosIndexingHealthStatus,
} from '../dto/analytics.dto';

/**
 * Cache entry with TTL
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * SAOS Indexing Analytics Service
 *
 * Provides monitoring and analytics for the SAOS/ISAP ruling indexing workflow.
 * Tracks data quality, error rates, and processing statistics.
 *
 * Bounded Context: Analytics > SAOS Indexing
 * - Dependencies: LegalRuling entity
 */
@Injectable()
export class SaosIndexingAnalyticsService {
  private readonly logger = new Logger(SaosIndexingAnalyticsService.name);

  /**
   * Cache TTL in milliseconds (5 minutes for indexing metrics)
   */
  private static readonly CACHE_TTL = 5 * 60 * 1000;

  /**
   * In-memory cache for analytics queries
   */
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * In-memory storage for recent indexing activity logs
   * In production, this should be stored in a database or Redis
   */
  private recentActivityLog: Array<{
    id: string;
    jobId: string;
    source: string;
    status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
    recordsProcessed: number;
    recordsSaved: number;
    recordsSkipped: number;
    recordsWithErrors: number;
    recordsMissingTextContent: number;
    processingTimeMs: number;
    startedAt: Date;
    completedAt?: Date;
    errorMessage?: string;
  }> = [];

  /**
   * In-memory storage for recent indexing errors
   * In production, this should be stored in a database or Redis
   */
  private recentErrors: Array<{
    id: string;
    source: string;
    errorType: string;
    errorMessage: string;
    rulingSignature?: string;
    courtName?: string;
    occurredAt: Date;
    lastSeenAt: Date;
    count: number;
  }> = [];

  /**
   * In-memory storage for recent skipped records
   * In production, this should be stored in a database or Redis
   */
  private recentSkipped: Array<{
    id: string;
    source: string;
    skipReason: string;
    rulingSignature?: string;
    skippedAt: Date;
    count: number;
  }> = [];

  constructor(
    @InjectRepository(LegalRuling)
    private readonly rulingRepository: Repository<LegalRuling>,
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
      expiresAt: Date.now() + SaosIndexingAnalyticsService.CACHE_TTL,
    });
  }

  /**
   * Get comprehensive SAOS indexing metrics
   */
  async getSaosIndexingMetrics(): Promise<SaosIndexingMetrics> {
    const cacheKey = 'saosIndexingMetrics';
    const cached = this.getCached<SaosIndexingMetrics>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Run all queries in parallel for performance
    const [
      totalRulings,
      saosRulings,
      isapRulings,
      rulingsWithFullText,
      rulingsWithSummary,
      lastRuling,
      newRulingsCount,
      updatedRulingsCount,
    ] = await Promise.all([
      // Total rulings count
      this.rulingRepository.count(),

      // SAOS rulings count (from metadata)
      this.rulingRepository
        .createQueryBuilder('ruling')
        .where("ruling.metadata->>'indexedFrom' = :source", { source: 'SAOS' })
        .getCount(),

      // ISAP rulings count (from metadata)
      this.rulingRepository
        .createQueryBuilder('ruling')
        .where("ruling.metadata->>'indexedFrom' = :source", { source: 'ISAP' })
        .getCount(),

      // Rulings with full text
      this.rulingRepository
        .createQueryBuilder('ruling')
        .where('ruling.fullText IS NOT NULL')
        .andWhere("ruling.fullText != ''")
        .getCount(),

      // Rulings with summary
      this.rulingRepository
        .createQueryBuilder('ruling')
        .where('ruling.summary IS NOT NULL')
        .andWhere("ruling.summary != ''")
        .getCount(),

      // Most recently added ruling
      this.rulingRepository.findOne({
        order: { createdAt: 'DESC' },
        select: ['createdAt', 'updatedAt'],
      }),

      // New rulings in last 24 hours
      this.rulingRepository.count({
        where: { createdAt: MoreThanOrEqual(last24h) },
      }),

      // Updated rulings in last 24 hours
      this.rulingRepository.count({
        where: { updatedAt: MoreThanOrEqual(last24h) },
      }),
    ]);

    // Calculate derived metrics
    const rulingsMissingFullText = totalRulings - rulingsWithFullText;
    const fullTextCoverageRate =
      totalRulings > 0 ? (rulingsWithFullText / totalRulings) * 100 : 0;

    // Get last indexing run timestamp from activity log
    const lastCompletedRun = this.recentActivityLog
      .filter((log) => log.status === 'COMPLETED')
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())[0];

    const result: SaosIndexingMetrics = {
      totalRulings,
      saosRulings,
      isapRulings,
      rulingsWithFullText,
      rulingsMissingFullText,
      rulingsWithSummary,
      fullTextCoverageRate: Math.round(fullTextCoverageRate * 100) / 100,
      lastIndexingRunAt: lastCompletedRun?.completedAt || lastRuling?.createdAt || null,
      lastRulingAddedAt: lastRuling?.createdAt || null,
      newRulingsLast24Hours: newRulingsCount,
      lastRulingUpdatedAt: lastRuling?.updatedAt || null,
      updatedRulingsLast24Hours: updatedRulingsCount,
      calculatedAt: now,
    };

    this.setCached(cacheKey, result);
    return result;
  }

  /**
   * Get indexing breakdown by court type
   */
  async getSaosIndexingByCourtType(): Promise<SaosIndexingByCourtType[]> {
    const cacheKey = 'saosIndexingByCourtType';
    const cached = this.getCached<SaosIndexingByCourtType[]>(cacheKey);
    if (cached) return cached;

    const results = await this.rulingRepository
      .createQueryBuilder('ruling')
      .select('ruling.courtType', 'courtType')
      .addSelect('COUNT(*)', 'count')
      .addSelect(
        "SUM(CASE WHEN ruling.fullText IS NOT NULL AND ruling.fullText != '' THEN 1 ELSE 0 END)",
        'withFullText',
      )
      .groupBy('ruling.courtType')
      .orderBy('count', 'DESC')
      .getRawMany();

    const totalRulings = await this.rulingRepository.count();

    const result: SaosIndexingByCourtType[] = results.map((r) => ({
      courtType: r.courtType,
      count: parseInt(r.count, 10),
      withFullText: parseInt(r.withFullText || '0', 10),
      percentage:
        totalRulings > 0
          ? Math.round((parseInt(r.count, 10) / totalRulings) * 10000) / 100
          : 0,
    }));

    this.setCached(cacheKey, result);
    return result;
  }

  /**
   * Get recent indexing activity logs
   */
  getRecentActivity(limit: number = 10) {
    return this.recentActivityLog
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get recent indexing errors
   */
  getRecentErrors(limit: number = 20) {
    return this.recentErrors
      .sort((a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get recent skipped records
   */
  getRecentSkipped(limit: number = 20) {
    return this.recentSkipped
      .sort((a, b) => b.skippedAt.getTime() - a.skippedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Log indexing activity
   */
  logIndexingActivity(input: {
    jobId: string;
    source: string;
    status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
    recordsProcessed: number;
    recordsSaved: number;
    recordsSkipped: number;
    recordsWithErrors: number;
    recordsMissingTextContent: number;
    processingTimeMs: number;
    errorMessage?: string;
  }): void {
    const now = new Date();
    const id = `${input.jobId}-${now.getTime()}`;

    const activity = {
      id,
      jobId: input.jobId,
      source: input.source,
      status: input.status,
      recordsProcessed: input.recordsProcessed,
      recordsSaved: input.recordsSaved,
      recordsSkipped: input.recordsSkipped,
      recordsWithErrors: input.recordsWithErrors,
      recordsMissingTextContent: input.recordsMissingTextContent,
      processingTimeMs: input.processingTimeMs,
      startedAt: now,
      completedAt: input.status !== 'RUNNING' ? now : undefined,
      errorMessage: input.errorMessage,
    };

    // Update existing activity if exists
    const existingIndex = this.recentActivityLog.findIndex(
      (log) => log.jobId === input.jobId,
    );
    if (existingIndex >= 0) {
      this.recentActivityLog[existingIndex] = {
        ...this.recentActivityLog[existingIndex],
        ...activity,
        startedAt: this.recentActivityLog[existingIndex].startedAt,
      };
    } else {
      this.recentActivityLog.push(activity);
    }

    // Keep only last 100 entries
    if (this.recentActivityLog.length > 100) {
      this.recentActivityLog = this.recentActivityLog.slice(-100);
    }

    // Log errors
    if (input.recordsWithErrors > 0) {
      this.logger.warn(
        `SAOS indexing job ${input.jobId} completed with ${input.recordsWithErrors} errors`,
      );
    }

    // Log missing text content warnings
    if (input.recordsMissingTextContent > 0) {
      this.logger.warn(
        `SAOS indexing job ${input.jobId}: ${input.recordsMissingTextContent} records missing text content`,
      );
    }
  }

  /**
   * Log indexing error
   */
  logIndexingError(input: {
    source: string;
    errorType: string;
    errorMessage: string;
    rulingSignature?: string;
    courtName?: string;
  }): void {
    const now = new Date();
    const id = `${input.source}-${input.errorType}-${now.getTime()}`;

    // Check if similar error exists and update count
    const existingIndex = this.recentErrors.findIndex(
      (err) =>
        err.errorType === input.errorType &&
        err.errorMessage === input.errorMessage &&
        err.rulingSignature === input.rulingSignature,
    );

    if (existingIndex >= 0) {
      this.recentErrors[existingIndex].count++;
      this.recentErrors[existingIndex].lastSeenAt = now;
    } else {
      this.recentErrors.push({
        id,
        source: input.source,
        errorType: input.errorType,
        errorMessage: input.errorMessage,
        rulingSignature: input.rulingSignature,
        courtName: input.courtName,
        occurredAt: now,
        lastSeenAt: now,
        count: 1,
      });
    }

    // Keep only last 100 entries
    if (this.recentErrors.length > 100) {
      this.recentErrors = this.recentErrors.slice(-100);
    }
  }

  /**
   * Log skipped record
   */
  logSkippedRecord(input: {
    source: string;
    skipReason: string;
    rulingSignature?: string;
  }): void {
    const now = new Date();
    const id = `${input.source}-${input.skipReason}-${now.getTime()}`;

    // Check if similar skip exists and update count
    const existingIndex = this.recentSkipped.findIndex(
      (skip) =>
        skip.skipReason === input.skipReason &&
        skip.rulingSignature === input.rulingSignature,
    );

    if (existingIndex >= 0) {
      this.recentSkipped[existingIndex].count++;
    } else {
      this.recentSkipped.push({
        id,
        source: input.source,
        skipReason: input.skipReason,
        rulingSignature: input.rulingSignature,
        skippedAt: now,
        count: 1,
      });
    }

    // Keep only last 100 entries
    if (this.recentSkipped.length > 100) {
      this.recentSkipped = this.recentSkipped.slice(-100);
    }
  }

  /**
   * Get overall health status of the SAOS indexing system
   */
  async getSaosIndexingHealthStatus(): Promise<SaosIndexingHealthStatus> {
    const [metrics, byCourtType, recentActivity] = await Promise.all([
      this.getSaosIndexingMetrics(),
      this.getSaosIndexingByCourtType(),
      Promise.resolve(this.getRecentActivity(10)),
    ]);

    const recentErrors = this.getRecentErrors(20);
    const recentSkipped = this.getRecentSkipped(20);

    // Determine health status and generate alerts
    const alerts: string[] = [];
    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';

    // Check for critical issues
    if (metrics.totalRulings === 0) {
      status = 'CRITICAL';
      alerts.push('No rulings indexed yet');
    } else {
      // Check data quality metrics
      if (metrics.fullTextCoverageRate < 50) {
        status = 'CRITICAL';
        alerts.push(
          `Low full text coverage: ${metrics.fullTextCoverageRate.toFixed(1)}%`,
        );
      } else if (metrics.fullTextCoverageRate < 80) {
        status = 'WARNING';
        alerts.push(
          `Reduced full text coverage: ${metrics.fullTextCoverageRate.toFixed(1)}%`,
        );
      }

      // Check for recent activity
      const hoursSinceLastRun = metrics.lastIndexingRunAt
        ? (Date.now() - metrics.lastIndexingRunAt.getTime()) / (1000 * 60 * 60)
        : Infinity;

      if (hoursSinceLastRun > 48) {
        status = 'WARNING';
        alerts.push(`No indexing run in ${hoursSinceLastRun.toFixed(0)} hours`);
      }

      // Check error rate
      const recentCompleted = recentActivity.filter(
        (a) => a.status === 'COMPLETED' || a.status === 'PARTIAL',
      );
      if (recentCompleted.length > 0) {
        const totalProcessed = recentCompleted.reduce(
          (sum, a) => sum + a.recordsProcessed,
          0,
        );
        const totalErrors = recentCompleted.reduce(
          (sum, a) => sum + a.recordsWithErrors,
          0,
        );
        const errorRate =
          totalProcessed > 0 ? (totalErrors / totalProcessed) * 100 : 0;

        if (errorRate > 10) {
          status = 'CRITICAL';
          alerts.push(`High error rate: ${errorRate.toFixed(1)}%`);
        } else if (errorRate > 5) {
          status = 'WARNING';
          alerts.push(`Elevated error rate: ${errorRate.toFixed(1)}%`);
        }
      }

      // Check for no new rulings
      if (metrics.newRulingsLast24Hours === 0 && hoursSinceLastRun < 24) {
        alerts.push('No new rulings indexed in last 24 hours');
      }
    }

    // Set description based on status
    const descriptions = {
      HEALTHY: 'SAOS indexing system is operating normally',
      WARNING: 'SAOS indexing system has warnings that should be reviewed',
      CRITICAL: 'SAOS indexing system requires immediate attention',
    };

    return {
      status,
      description: descriptions[status],
      metrics,
      byCourtType,
      recentActivity,
      recentErrors,
      recentSkipped,
      alerts,
      calculatedAt: new Date(),
    };
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries (useful after manual indexing runs)
   */
  clearCache(): void {
    this.cache.clear();
  }
}
