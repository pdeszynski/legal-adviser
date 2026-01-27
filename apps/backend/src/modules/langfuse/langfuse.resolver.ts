import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LangfuseService } from './services/langfuse.service';
import {
  TracesListInput,
  TracesListResponse,
  LangfuseTraceDetail,
  TokenUsageByAgent,
  AgentLatencyMetrics,
  UserTraceAttribution,
} from './dto/langfuse.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

/**
 * Langfuse Resolver
 *
 * GraphQL resolver for Langfuse trace data.
 * All endpoints require admin authentication.
 *
 * Authentication: Admin only (AdminGuard)
 */
@Resolver()
export class LangfuseResolver {
  constructor(private readonly langfuseService: LangfuseService) {}

  /**
   * Get list of traces with filtering and pagination
   * Admin-only access
   */
  @Query(() => TracesListResponse, { name: 'langfuseTraces', nullable: true })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getTraces(
    @Args('input', { nullable: true }) input?: TracesListInput,
  ): Promise<TracesListResponse | null> {
    if (!this.langfuseService.isEnabled()) {
      return null;
    }
    return this.langfuseService.getTraces(input || {});
  }

  /**
   * Get detailed trace information
   * Admin-only access
   */
  @Query(() => LangfuseTraceDetail, {
    name: 'langfuseTraceDetail',
    nullable: true,
  })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getTraceDetail(
    @Args('traceId', { type: () => String }) traceId: string,
  ): Promise<LangfuseTraceDetail | null> {
    if (!this.langfuseService.isEnabled()) {
      return null;
    }
    try {
      return await this.langfuseService.getTraceDetail(traceId);
    } catch {
      return null;
    }
  }

  /**
   * Get token usage breakdown by agent type
   * Admin-only access
   */
  @Query(() => [TokenUsageByAgent], {
    name: 'langfuseTokenUsageByAgent',
    nullable: true,
  })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getTokenUsageByAgent(
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
  ): Promise<TokenUsageByAgent[] | null> {
    if (!this.langfuseService.isEnabled()) {
      return [];
    }
    return this.langfuseService.getTokenUsageByAgent(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Get latency metrics by agent type
   * Admin-only access
   */
  @Query(() => [AgentLatencyMetrics], {
    name: 'langfuseLatencyMetrics',
    nullable: true,
  })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getLatencyMetrics(
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
  ): Promise<AgentLatencyMetrics[] | null> {
    if (!this.langfuseService.isEnabled()) {
      return [];
    }
    return this.langfuseService.getLatencyMetricsByAgent(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Get user trace attribution
   * Admin-only access
   */
  @Query(() => [UserTraceAttribution], {
    name: 'langfuseUserAttribution',
    nullable: true,
  })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getUserAttribution(
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
    @Args('limit', { nullable: true, defaultValue: 20 }) limit?: number,
  ): Promise<UserTraceAttribution[] | null> {
    if (!this.langfuseService.isEnabled()) {
      return [];
    }
    return this.langfuseService.getUserTraceAttribution(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit,
    );
  }
}
