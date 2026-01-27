import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  TracesListInput,
  TracesListResponse,
  LangfuseTrace,
  LangfuseTraceDetail,
  TraceObservation,
  TraceStatus,
  TraceLevel,
  AgentType,
  ObservationType,
  TokenUsage,
  TokenUsageByAgent,
  AgentLatencyMetrics,
  UserTraceAttribution,
} from '../dto/langfuse.dto';

/**
 * Cache entry with TTL
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Langfuse API response types
 */
interface LangfuseApiTrace {
  id: string;
  name: string;
  timestamp: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  status?: TraceStatus;
  level?: TraceLevel;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  observations?: LangfuseApiObservation[];
  usage?: {
    totalTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalCost?: number;
  };
  model?: string;
}

interface LangfuseApiObservation {
  id: string;
  type: 'SPAN' | 'GENERATION' | 'EVENT';
  name: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  level?: TraceLevel;
  status?: TraceStatus;
  parentObservationId?: string;
  usage?: {
    totalTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalCost?: number;
  };
  model?: string;
  input?: any;
  output?: any;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

interface LangfuseApiResponse {
  data: LangfuseApiTrace[];
  meta: {
    totalVotes?: number;
    totalPages?: number;
    limit?: number;
    currentPage?: number;
    totalCount?: number;
  };
}

/**
 * Langfuse Service
 *
 * Fetches trace data from Langfuse API for admin dashboard.
 * Implements caching and error handling for external API calls.
 *
 * Bounded Context: AI Observability
 * - Dependencies: External Langfuse API
 */
@Injectable()
export class LangfuseService {
  private readonly logger = new Logger(LangfuseService.name);
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly secretKey: string;
  private readonly enabled: boolean;

  /**
   * Cache TTL in milliseconds (2 minutes for trace data)
   */
  private static readonly CACHE_TTL = 2 * 60 * 1000;

  /**
   * In-memory cache for Langfuse API responses
   */
  private cache: Map<string, CacheEntry<any>> = new Map();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('LANGFUSE_HOST') ||
      'https://cloud.langfuse.com';
    this.publicKey =
      this.configService.get<string>('LANGFUSE_PUBLIC_KEY') || '';
    this.secretKey =
      this.configService.get<string>('LANGFUSE_SECRET_KEY') || '';
    this.enabled =
      this.configService.get<string>('LANGFUSE_ENABLED') === 'true' &&
      !!this.publicKey &&
      !!this.secretKey;

    if (this.enabled) {
      this.logger.log(`Langfuse integration enabled (host: ${this.baseUrl})`);
    } else {
      this.logger.warn('Langfuse integration disabled or missing credentials');
    }
  }

  /**
   * Check if Langfuse is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

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
      expiresAt: Date.now() + LangfuseService.CACHE_TTL,
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
   * Make authenticated request to Langfuse API
   */
  private async request<T>(
    endpoint: string,
    params?: Record<string, any>,
  ): Promise<T> {
    if (!this.enabled) {
      throw new NotFoundException('Langfuse integration is not enabled');
    }

    const url = `${this.baseUrl}/api/public${endpoint}`;
    const auth = Buffer.from(`${this.publicKey}:${this.secretKey}`).toString(
      'base64',
    );

    try {
      const response = await firstValueFrom(
        this.httpService.get<LangfuseApiResponse>(url, {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          params,
        }),
      );
      return response.data as T;
    } catch (error: any) {
      this.logger.error(
        `Langfuse API request failed: ${error.message}`,
        error.stack,
      );
      if (error.response?.status === 401) {
        throw new Error('Langfuse authentication failed. Check credentials.');
      }
      if (error.response?.status === 404) {
        throw new NotFoundException('Langfuse resource not found');
      }
      throw error;
    }
  }

  /**
   * Detect agent type from trace name and metadata
   */
  private detectAgentType(trace: LangfuseApiTrace): AgentType {
    const name = trace.name?.toLowerCase() || '';
    const metadata = trace.metadata || {};

    // Check metadata first
    if (metadata.agent_type) {
      const type = metadata.agent_type.toUpperCase().replace(/-/g, '_');
      if (Object.values(AgentType).includes(type as AgentType)) {
        return type as AgentType;
      }
    }

    // Detect from trace name
    if (
      name.includes('workflow') ||
      name.includes('case_analysis') ||
      name.includes('document_generation')
    ) {
      return AgentType.WORKFLOW;
    }
    if (
      name.includes('qa') ||
      name.includes('question') ||
      name.includes('ask')
    ) {
      return AgentType.QA_AGENT;
    }
    if (name.includes('classify') || name.includes('classification')) {
      return AgentType.CLASSIFIER_AGENT;
    }
    if (
      name.includes('draft') ||
      name.includes('generate') ||
      name.includes('document')
    ) {
      return AgentType.DRAFTING_AGENT;
    }
    if (name.includes('clarif')) {
      return AgentType.CLARIFICATION_AGENT;
    }

    return AgentType.UNKNOWN;
  }

  /**
   * Convert API trace to internal format
   */
  private apiTraceToLangfuseTrace(apiTrace: LangfuseApiTrace): LangfuseTrace {
    const hasError =
      apiTrace.observations?.some((obs) => obs.errorMessage) || false;
    const totalTokens =
      apiTrace.observations?.reduce(
        (sum, obs) => sum + (obs.usage?.totalTokens || 0),
        0,
      ) ||
      apiTrace.usage?.totalTokens ||
      0;

    const promptTokens =
      apiTrace.observations?.reduce(
        (sum, obs) => sum + (obs.usage?.promptTokens || 0),
        0,
      ) ||
      apiTrace.usage?.promptTokens ||
      0;

    const completionTokens =
      apiTrace.observations?.reduce(
        (sum, obs) => sum + (obs.usage?.completionTokens || 0),
        0,
      ) ||
      apiTrace.usage?.completionTokens ||
      0;

    const totalCost =
      apiTrace.observations?.reduce(
        (sum, obs) => sum + (obs.usage?.totalCost || 0),
        0,
      ) ||
      apiTrace.usage?.totalCost ||
      0;

    return {
      id: apiTrace.id,
      name: apiTrace.name,
      timestamp: new Date(apiTrace.timestamp),
      startTime: apiTrace.startTime ? new Date(apiTrace.startTime) : undefined,
      endTime: apiTrace.endTime ? new Date(apiTrace.endTime) : undefined,
      duration: apiTrace.duration,
      status: hasError
        ? TraceStatus.ERROR
        : apiTrace.status || TraceStatus.SUCCESS,
      level: apiTrace.level,
      userId: apiTrace.userId,
      sessionId: apiTrace.sessionId,
      model: apiTrace.model || apiTrace.observations?.[0]?.model,
      usage:
        totalTokens > 0
          ? {
              totalTokens,
              promptTokens,
              completionTokens,
              totalCost,
            }
          : undefined,
      metadata: apiTrace.metadata,
      observationCount: apiTrace.observations?.length || 0,
      agentType: this.detectAgentType(apiTrace),
    };
  }

  /**
   * Convert API observation to internal format
   */
  private apiObservationToTraceObservation(
    apiObs: LangfuseApiObservation,
  ): TraceObservation {
    const hasError = !!apiObs.errorMessage;

    return {
      id: apiObs.id,
      type:
        apiObs.type === 'SPAN'
          ? ObservationType.SPAN
          : apiObs.type === 'EVENT'
            ? ObservationType.EVENT
            : ObservationType.GENERATION,
      name: apiObs.name,
      startTime: new Date(apiObs.startTime),
      endTime: apiObs.endTime ? new Date(apiObs.endTime) : undefined,
      duration: apiObs.duration,
      level: apiObs.level,
      status: hasError
        ? TraceStatus.ERROR
        : apiObs.status || TraceStatus.SUCCESS,
      parentObservationId: apiObs.parentObservationId,
      usage: apiObs.usage?.totalTokens
        ? {
            totalTokens: apiObs.usage.totalTokens,
            promptTokens: apiObs.usage.promptTokens || 0,
            completionTokens: apiObs.usage.completionTokens || 0,
            totalCost: apiObs.usage.totalCost || 0,
          }
        : undefined,
      model: apiObs.model,
      input: this.formatInputOutput(apiObs.input),
      output: this.formatInputOutput(apiObs.output),
      errorMessage: apiObs.errorMessage,
      stackTrace: apiObs.metadata?.stack_trace,
      metadata: apiObs.metadata,
    };
  }

  /**
   * Format input/output for display
   */
  private formatInputOutput(value: any): string[] | undefined {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string') return [value];
    if (Array.isArray(value))
      return value.map((v) => (typeof v === 'string' ? v : JSON.stringify(v)));
    return [JSON.stringify(value)];
  }

  /**
   * Get list of traces with filtering and pagination
   */
  async getTraces(input: TracesListInput): Promise<TracesListResponse> {
    if (!this.enabled) {
      return this.getEmptyTracesList(input);
    }

    const cacheKey = this.getCacheKey('getTraces', input);
    const cached = this.getCached<TracesListResponse>(cacheKey);
    if (cached) return cached;

    const page = input.page || 1;
    const limit = input.limit || 20;

    // Build query parameters
    const params: Record<string, any> = {
      page,
      limit,
    };

    if (input.userId) params.userId = input.userId;
    if (input.sessionId) params.sessionId = input.sessionId;
    if (input.startDate) params.startDate = input.startDate;
    if (input.endDate) params.endDate = input.endDate;

    // Map status to API params if needed
    if (input.status === TraceStatus.ERROR) {
      params.status = 'ERROR';
    }

    try {
      const response = await this.request<LangfuseApiResponse>(
        '/traces',
        params,
      );
      const traces = (response.data || []).map(this.apiTraceToLangfuseTrace);

      // Apply client-side filtering for agent type and search term
      let filteredTraces = traces;
      if (input.agentType && input.agentType !== AgentType.UNKNOWN) {
        filteredTraces = filteredTraces.filter(
          (t) => t.agentType === input.agentType,
        );
      }
      if (input.searchTerm) {
        const term = input.searchTerm.toLowerCase();
        filteredTraces = filteredTraces.filter(
          (t) =>
            t.name.toLowerCase().includes(term) ||
            t.userId?.toLowerCase().includes(term) ||
            t.sessionId?.toLowerCase().includes(term),
        );
      }

      // Apply sorting
      const sortBy = input.sortBy || 'startTime';
      const sortOrder = input.sortOrder === 'ASC' ? 1 : -1;
      filteredTraces.sort((a, b) => {
        const aVal = (a as any)[sortBy];
        const bVal = (b as any)[sortBy];
        if (!aVal) return 1;
        if (!bVal) return -1;
        if (aVal < bVal) return -1 * sortOrder;
        if (aVal > bVal) return 1 * sortOrder;
        return 0;
      });

      // Apply pagination after filtering
      const totalCount = filteredTraces.length;
      const totalPages = Math.ceil(totalCount / limit);
      const startIndex = (page - 1) * limit;
      const paginatedTraces = filteredTraces.slice(
        startIndex,
        startIndex + limit,
      );

      const result: TracesListResponse = {
        traces: paginatedTraces,
        totalCount: response.meta?.totalCount || totalCount,
        page,
        limit,
        totalPages: response.meta?.totalPages || totalPages,
        fetchedAt: new Date(),
      };

      this.setCached(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch traces: ${error}`);
      return this.getEmptyTracesList(input);
    }
  }

  /**
   * Get empty traces list response
   */
  private getEmptyTracesList(input: TracesListInput): TracesListResponse {
    return {
      traces: [],
      totalCount: 0,
      page: input.page || 1,
      limit: input.limit || 20,
      totalPages: 0,
      fetchedAt: new Date(),
    };
  }

  /**
   * Get detailed trace information with all observations
   */
  async getTraceDetail(traceId: string): Promise<LangfuseTraceDetail> {
    if (!this.enabled) {
      throw new NotFoundException('Langfuse integration is not enabled');
    }

    const cacheKey = this.getCacheKey('getTraceDetail', { traceId });
    const cached = this.getCached<LangfuseTraceDetail>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.request<{ data: LangfuseApiTrace }>(
        `/traces/${traceId}`,
      );
      const apiTrace = response.data;

      const observations = (apiTrace.observations || []).map(
        this.apiObservationToTraceObservation,
      );

      // Find error from observations
      const errorObs = observations.find((o) => o.errorMessage);

      // Calculate aggregate usage
      const totalTokens = observations.reduce(
        (sum, o) => sum + (o.usage?.totalTokens || 0),
        0,
      );
      const promptTokens = observations.reduce(
        (sum, o) => sum + (o.usage?.promptTokens || 0),
        0,
      );
      const completionTokens = observations.reduce(
        (sum, o) => sum + (o.usage?.completionTokens || 0),
        0,
      );
      const totalCost = observations.reduce(
        (sum, o) => sum + (o.usage?.totalCost || 0),
        0,
      );

      const result: LangfuseTraceDetail = {
        id: apiTrace.id,
        name: apiTrace.name,
        timestamp: new Date(apiTrace.timestamp),
        startTime: apiTrace.startTime
          ? new Date(apiTrace.startTime)
          : undefined,
        endTime: apiTrace.endTime ? new Date(apiTrace.endTime) : undefined,
        duration: apiTrace.duration,
        status: errorObs
          ? TraceStatus.ERROR
          : apiTrace.status || TraceStatus.SUCCESS,
        level: apiTrace.level,
        userId: apiTrace.userId,
        userEmail: apiTrace.metadata?.user_email,
        sessionId: apiTrace.sessionId,
        model: apiTrace.model,
        usage:
          totalTokens > 0
            ? {
                totalTokens,
                promptTokens,
                completionTokens,
                totalCost,
              }
            : undefined,
        metadata: apiTrace.metadata,
        observations,
        errorMessage: errorObs?.errorMessage,
        stackTrace: errorObs?.stackTrace,
        fetchedAt: new Date(),
        agentType: this.detectAgentType(apiTrace),
      };

      this.setCached(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch trace detail: ${error}`);
      throw new NotFoundException(`Trace ${traceId} not found`);
    }
  }

  /**
   * Get token usage breakdown by agent type
   */
  async getTokenUsageByAgent(
    startDate?: Date,
    endDate?: Date,
  ): Promise<TokenUsageByAgent[]> {
    if (!this.enabled) {
      return [];
    }

    const cacheKey = this.getCacheKey('getTokenUsageByAgent', {
      startDate,
      endDate,
    });
    const cached = this.getCached<TokenUsageByAgent[]>(cacheKey);
    if (cached) return cached;

    const params: Record<string, any> = {
      limit: 1000, // Get a large sample
    };
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    try {
      const response = await this.request<LangfuseApiResponse>(
        '/traces',
        params,
      );
      const traces = (response.data || []).map(this.apiTraceToLangfuseTrace);

      // Group by agent type
      const byAgent = new Map<
        AgentType,
        {
          tokens: number;
          count: number;
          cost: number;
        }
      >();

      for (const trace of traces) {
        const existing = byAgent.get(trace.agentType) || {
          tokens: 0,
          count: 0,
          cost: 0,
        };
        existing.tokens += trace.usage?.totalTokens || 0;
        existing.count += 1;
        existing.cost += trace.usage?.totalCost || 0;
        byAgent.set(trace.agentType, existing);
      }

      const totalTokens = Array.from(byAgent.values()).reduce(
        (sum, v) => sum + v.tokens,
        0,
      );

      const result: TokenUsageByAgent[] = Array.from(byAgent.entries()).map(
        ([agentType, data]) => ({
          agentType,
          totalTokens: data.tokens,
          requestCount: data.count,
          totalCost: data.cost,
          tokenPercentage:
            totalTokens > 0 ? (data.tokens / totalTokens) * 100 : 0,
          avgTokensPerRequest:
            data.count > 0 ? Math.round(data.tokens / data.count) : 0,
        }),
      );

      this.setCached(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch token usage by agent: ${error}`);
      return [];
    }
  }

  /**
   * Get latency metrics by agent type
   */
  async getLatencyMetricsByAgent(
    startDate?: Date,
    endDate?: Date,
  ): Promise<AgentLatencyMetrics[]> {
    if (!this.enabled) {
      return [];
    }

    const cacheKey = this.getCacheKey('getLatencyMetricsByAgent', {
      startDate,
      endDate,
    });
    const cached = this.getCached<AgentLatencyMetrics[]>(cacheKey);
    if (cached) return cached;

    const params: Record<string, any> = {
      limit: 1000,
    };
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    try {
      const response = await this.request<LangfuseApiResponse>(
        '/traces',
        params,
      );
      const traces = (response.data || []).map(this.apiTraceToLangfuseTrace);

      // Group durations by agent type
      const byAgent = new Map<AgentType, number[]>();

      for (const trace of traces) {
        if (trace.duration) {
          const existing = byAgent.get(trace.agentType) || [];
          existing.push(trace.duration);
          byAgent.set(trace.agentType, existing);
        }
      }

      const result: AgentLatencyMetrics[] = Array.from(byAgent.entries()).map(
        ([agentType, durations]) => {
          durations.sort((a, b) => a - b);
          const sum = durations.reduce((s, d) => s + d, 0);
          const avg = sum / durations.length;
          const min = durations[0];
          const max = durations[durations.length - 1];
          const median = durations[Math.floor(durations.length / 2)];
          const p95 = durations[Math.floor(durations.length * 0.95)];

          return {
            agentType,
            avgLatency: Math.round(avg),
            minLatency: Math.round(min),
            maxLatency: Math.round(max),
            medianLatency: Math.round(median),
            p95Latency: Math.round(p95),
            requestCount: durations.length,
          };
        },
      );

      this.setCached(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch latency metrics: ${error}`);
      return [];
    }
  }

  /**
   * Get trace attribution by user
   */
  async getUserTraceAttribution(
    startDate?: Date,
    endDate?: Date,
    limit: number = 20,
  ): Promise<UserTraceAttribution[]> {
    if (!this.enabled) {
      return [];
    }

    const cacheKey = this.getCacheKey('getUserTraceAttribution', {
      startDate,
      endDate,
      limit,
    });
    const cached = this.getCached<UserTraceAttribution[]>(cacheKey);
    if (cached) return cached;

    const params: Record<string, any> = {
      limit: 1000,
    };
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    try {
      const response = await this.request<LangfuseApiResponse>(
        '/traces',
        params,
      );
      const traces = (response.data || []).map(this.apiTraceToLangfuseTrace);

      // Group by user
      const byUser = new Map<
        string,
        {
          email?: string;
          traces: Date[];
          tokens: number;
          cost: number;
        }
      >();

      for (const trace of traces) {
        if (!trace.userId) continue;
        const existing = byUser.get(trace.userId) || {
          traces: [],
          tokens: 0,
          cost: 0,
        };
        // userEmail is in metadata for trace list, full trace detail has it as top-level property
        const email = (trace as any).userEmail || trace.metadata?.user_email;
        if (email && !existing.email) existing.email = email;
        existing.traces.push(trace.timestamp);
        existing.tokens += trace.usage?.totalTokens || 0;
        existing.cost += trace.usage?.totalCost || 0;
        byUser.set(trace.userId, existing);
      }

      const result: UserTraceAttribution[] = Array.from(byUser.entries())
        .map(([userId, data]) => {
          const sorted = data.traces.sort((a, b) => a.getTime() - b.getTime());
          return {
            userId,
            userEmail: data.email,
            traceCount: data.traces.length,
            totalTokens: data.tokens,
            totalCost: data.cost,
            firstTraceAt: sorted[0],
            lastTraceAt: sorted[sorted.length - 1],
          };
        })
        .sort((a, b) => b.totalTokens - a.totalTokens)
        .slice(0, limit);

      this.setCached(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch user attribution: ${error}`);
      return [];
    }
  }
}
