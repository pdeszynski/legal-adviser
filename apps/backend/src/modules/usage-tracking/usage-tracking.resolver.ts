import { Resolver, Query, Args, Context, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import {
  AiUsageRecord,
  AiOperationType,
} from './entities/ai-usage-record.entity';
import {
  UsageStatsQueryInput,
  UsageStatsResponse,
  CreateAiUsageRecordInput,
  DailyUsageResponse,
} from './dto/ai-usage-record.dto';
import { UsageTrackingService } from './services/usage-tracking.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

/**
 * Usage Tracking Resolver
 *
 * GraphQL resolver for querying AI usage statistics and records.
 * Provides endpoints for monitoring AI API usage and costs.
 *
 * Authentication: Most queries require authentication (except for admin endpoints)
 */
@Resolver(() => AiUsageRecord)
export class UsageTrackingResolver {
  constructor(private readonly usageTrackingService: UsageTrackingService) {}

  /**
   * Get usage records for the current user
   */
  @Query(() => [AiUsageRecord], { name: 'myUsageRecords' })
  @UseGuards(GqlAuthGuard)
  async getMyUsageRecords(
    @Context() context: { req: { user: { id: string } } },
    @Args('startDate', { nullable: true }) startDate?: Date,
    @Args('endDate', { nullable: true }) endDate?: Date,
    @Args('operationType', { nullable: true, type: () => AiOperationType })
    operationType?: AiOperationType,
    @Args('limit', { nullable: true, defaultValue: 100 }) limit?: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset?: number,
  ): Promise<AiUsageRecord[]> {
    const userId = context.req.user.id;
    const { records } = await this.usageTrackingService.getUserUsage(
      userId,
      startDate,
      endDate,
      operationType,
      limit,
      offset,
    );
    return records;
  }

  /**
   * Get usage statistics for the current user
   */
  @Query(() => UsageStatsResponse, { name: 'myUsageStats' })
  @UseGuards(GqlAuthGuard)
  async getMyUsageStats(
    @Context() context: { req: { user: { id: string } } },
    @Args('query', { nullable: true }) query?: UsageStatsQueryInput,
  ): Promise<UsageStatsResponse> {
    const userId = context.req.user.id;

    const queryWithUser: UsageStatsQueryInput = {
      ...query,
      userId,
    };

    return this.usageTrackingService.getUsageStats(queryWithUser);
  }

  /**
   * Get total cost for the current user
   */
  @Query(() => Number, { name: 'myTotalCost' })
  @UseGuards(GqlAuthGuard)
  async getMyTotalCost(
    @Context() context: { req: { user: { id: string } } },
    @Args('startDate', { nullable: true }) startDate?: Date,
    @Args('endDate', { nullable: true }) endDate?: Date,
  ): Promise<number> {
    const userId = context.req.user.id;
    return this.usageTrackingService.getUserTotalCost(
      userId,
      startDate,
      endDate,
    );
  }

  /**
   * Get daily usage breakdown for the current user
   * Useful for displaying usage charts
   */
  @Query(() => DailyUsageResponse, { name: 'myDailyUsage' })
  @UseGuards(GqlAuthGuard)
  async getMyDailyUsage(
    @Context() context: { req: { user: { id: string } } },
    @Args('startDate', { nullable: true }) startDate?: Date,
    @Args('endDate', { nullable: true }) endDate?: Date,
  ): Promise<DailyUsageResponse> {
    const userId = context.req.user.id;
    const now = new Date();
    const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return this.usageTrackingService.getDailyUsage(
      userId,
      startDate || defaultStartDate,
      endDate || now,
    );
  }

  /**
   * Admin: Get usage records for any user
   */
  @Query(() => [AiUsageRecord], { name: 'userUsageRecords' })
  @UseGuards(GqlAuthGuard)
  async getUserUsageRecords(
    @Args('userId') userId: string,
    @Args('startDate', { nullable: true }) startDate?: Date,
    @Args('endDate', { nullable: true }) endDate?: Date,
    @Args('operationType', { nullable: true, type: () => AiOperationType })
    operationType?: AiOperationType,
    @Args('limit', { nullable: true, defaultValue: 100 }) limit?: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset?: number,
  ): Promise<AiUsageRecord[]> {
    const { records } = await this.usageTrackingService.getUserUsage(
      userId,
      startDate,
      endDate,
      operationType,
      limit,
      offset,
    );
    return records;
  }

  /**
   * Admin: Get usage statistics for any user or time period
   */
  @Query(() => UsageStatsResponse, { name: 'usageStats' })
  @UseGuards(GqlAuthGuard)
  async getUsageStats(
    @Args('query') query: UsageStatsQueryInput,
  ): Promise<UsageStatsResponse> {
    return this.usageTrackingService.getUsageStats(query);
  }

  /**
   * Admin: Get top users by usage
   */
  @Query(() => String, { name: 'topUsersByUsage' })
  @UseGuards(GqlAuthGuard)
  async getTopUsersByUsage(
    @Args('by', { nullable: true, defaultValue: 'tokens' })
    by: 'tokens' | 'cost',
    @Args('limit', { nullable: true, defaultValue: 10 }) limit?: number,
    @Args('startDate', { nullable: true }) startDate?: Date,
    @Args('endDate', { nullable: true }) endDate?: Date,
  ): Promise<string> {
    const results = await this.usageTrackingService.getTopUsers(
      by,
      limit,
      startDate,
      endDate,
    );
    return JSON.stringify(results);
  }

  /**
   * Manually create a usage record (for testing or admin use)
   */
  @Mutation(() => AiUsageRecord, { name: 'createUsageRecord' })
  @UseGuards(GqlAuthGuard)
  async createUsageRecord(
    @Context() context: { req: { user: { id: string } } },
    @Args('input') input: CreateAiUsageRecordInput,
  ): Promise<AiUsageRecord> {
    const userId = context.req.user.id;
    let parsedMetadata: Record<string, any> | undefined = undefined;
    if (input.metadata) {
      try {
        parsedMetadata = JSON.parse(input.metadata);
      } catch {
        parsedMetadata = { raw: input.metadata };
      }
    }
    return this.usageTrackingService.recordUsage(
      userId,
      input.operationType,
      input.tokensUsed,
      input.requestCount || 1,
      input.resourceId,
      parsedMetadata,
    );
  }
}
