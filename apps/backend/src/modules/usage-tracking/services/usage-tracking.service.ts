import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  AiUsageRecord,
  AiOperationType,
} from '../entities/ai-usage-record.entity';
import {
  UsageStatsQueryInput,
  UsageStatsResponse,
  OperationBreakdown,
  DailyUsageResponse,
  DailyUsage,
} from '../dto/ai-usage-record.dto';

/**
 * Usage Tracking Service
 *
 * Manages AI API usage tracking for billing and monitoring.
 * Provides methods for recording usage, querying statistics,
 * and aggregating data by time periods and operation types.
 *
 * Domain Service: Part of the Usage Tracking bounded context
 */
@Injectable()
export class UsageTrackingService {
  private readonly logger = new Logger(UsageTrackingService.name);

  constructor(
    @InjectRepository(AiUsageRecord)
    private readonly usageRepository: Repository<AiUsageRecord>,
  ) {}

  /**
   * Record a new AI usage event
   * Automatically calculates cost based on token usage
   */
  async recordUsage(
    userId: string,
    operationType: AiOperationType,
    tokensUsed: number,
    requestCount: number = 1,
    resourceId?: string,
    metadata?: Record<string, any>,
  ): Promise<AiUsageRecord> {
    try {
      const record = AiUsageRecord.create(
        userId,
        operationType,
        tokensUsed,
        requestCount,
        resourceId,
        metadata,
      );

      const saved = await this.usageRepository.save(record);
      this.logger.debug(
        `Recorded usage: ${operationType} for user ${userId}, tokens: ${tokensUsed}, cost: $${saved.costCalculated}`,
      );

      return saved;
    } catch (error) {
      this.logger.error(`Failed to record usage for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Get usage records for a specific user with optional filtering
   */
  async getUserUsage(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    operationType?: AiOperationType,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ records: AiUsageRecord[]; total: number }> {
    const whereConditions: any = { userId };

    if (operationType) {
      whereConditions.operationType = operationType;
    }

    if (startDate || endDate) {
      whereConditions.createdAt = Between(
        startDate || new Date(0),
        endDate || new Date(),
      );
    }

    const [records, total] = await this.usageRepository.findAndCount({
      where: whereConditions,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { records, total };
  }

  /**
   * Get aggregated usage statistics for a user or time period
   */
  async getUsageStats(
    query: UsageStatsQueryInput,
  ): Promise<UsageStatsResponse> {
    const {
      userId,
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: last 30 days
      endDate = new Date(),
      operationType,
    } = query;

    const whereConditions: any = {
      createdAt: Between(startDate, endDate),
    };

    if (userId) {
      whereConditions.userId = userId;
    }

    if (operationType) {
      whereConditions.operationType = operationType;
    }

    const records = await this.usageRepository.find({
      where: whereConditions,
    });

    const totalRequests = records.reduce((sum, r) => sum + r.requestCount, 0);
    const totalTokens = records.reduce((sum, r) => sum + r.tokensUsed, 0);
    const totalCost = records.reduce(
      (sum, r) => sum + Number(r.costCalculated),
      0,
    );

    // Breakdown by operation type
    const operationMap = new Map<AiOperationType, OperationBreakdown>();

    records.forEach((record) => {
      const existing = operationMap.get(record.operationType);
      if (existing) {
        existing.requestCount += record.requestCount;
        existing.tokenCount += record.tokensUsed;
        existing.cost += Number(record.costCalculated);
      } else {
        operationMap.set(record.operationType, {
          operationType: record.operationType,
          requestCount: record.requestCount,
          tokenCount: record.tokensUsed,
          cost: Number(record.costCalculated),
        });
      }
    });

    const breakdownByOperation = Array.from(operationMap.values());

    return {
      totalRequests,
      totalTokens,
      totalCost,
      operationCount: records.length,
      breakdownByOperation,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }

  /**
   * Get total cost for a user in a time period
   */
  async getUserTotalCost(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const whereConditions: any = {
      userId,
    };

    if (startDate || endDate) {
      whereConditions.createdAt = Between(
        startDate || new Date(0),
        endDate || new Date(),
      );
    }

    const result = await this.usageRepository
      .createQueryBuilder('usage')
      .select('SUM(usage.costCalculated)', 'total')
      .where('usage.userId = :userId', { userId })
      .andWhere(
        startDate ? 'usage.createdAt >= :startDate' : '1=1',
        startDate ? { startDate } : {},
      )
      .andWhere(
        endDate ? 'usage.createdAt <= :endDate' : '1=1',
        endDate ? { endDate } : {},
      )
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  /**
   * Get top users by token usage or cost
   */
  async getTopUsers(
    by: 'tokens' | 'cost' = 'tokens',
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ userId: string; total: number }[]> {
    const sortBy =
      by === 'tokens' ? 'usage.tokensUsed' : 'usage.costCalculated';

    const whereConditions: any = {};
    if (startDate || endDate) {
      whereConditions.createdAt = Between(
        startDate || new Date(0),
        endDate || new Date(),
      );
    }

    const results = await this.usageRepository
      .createQueryBuilder('usage')
      .select('usage.userId', 'userId')
      .addSelect(`SUM(${sortBy})`, 'total')
      .where(
        startDate ? 'usage.createdAt >= :startDate' : '1=1',
        startDate ? { startDate } : {},
      )
      .andWhere(
        endDate ? 'usage.createdAt <= :endDate' : '1=1',
        endDate ? { endDate } : {},
      )
      .groupBy('usage.userId')
      .orderBy(`SUM(${sortBy})`, 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((r) => ({
      userId: r.userId,
      total: parseFloat(r.total),
    }));
  }

  /**
   * Delete old usage records (for data retention)
   */
  async deleteOldRecords(beforeDate: Date): Promise<number> {
    const result = await this.usageRepository.delete({
      createdAt: Between(new Date(0), beforeDate),
    });

    this.logger.log(`Deleted ${result.affected} old usage records`);
    return result.affected || 0;
  }

  /**
   * Get daily usage aggregation for a user over a time period
   * Groups usage by day for chart display
   */
  async getDailyUsage(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DailyUsageResponse> {
    const records = await this.usageRepository
      .createQueryBuilder('usage')
      .select('usage.createdAt', 'createdAt')
      .addSelect('SUM(usage.requestCount)', 'totalRequests')
      .addSelect('SUM(usage.tokensUsed)', 'totalTokens')
      .addSelect('SUM(usage.costCalculated)', 'totalCost')
      .where('usage.userId = :userId', { userId })
      .andWhere('usage.createdAt >= :startDate', { startDate })
      .andWhere('usage.createdAt <= :endDate', { endDate })
      .groupBy('DATE(usage.createdAt)')
      .orderBy('DATE(usage.createdAt)', 'ASC')
      .getRawMany();

    const dailyUsage: DailyUsage[] = records.map((r) => ({
      date: r.createdAt,
      totalRequests: parseInt(r.totalRequests) || 0,
      totalTokens: parseInt(r.totalTokens) || 0,
      totalCost: parseFloat(r.totalCost) || 0,
    }));

    const totalRequests = dailyUsage.reduce(
      (sum, d) => sum + d.totalRequests,
      0,
    );
    const totalTokens = dailyUsage.reduce((sum, d) => sum + d.totalTokens, 0);
    const totalCost = dailyUsage.reduce((sum, d) => sum + d.totalCost, 0);

    return {
      dailyUsage,
      totalRequests,
      totalTokens,
      totalCost,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }
}
