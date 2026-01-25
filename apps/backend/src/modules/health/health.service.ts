import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AiClientService } from '../../shared/ai-client/ai-client.service';
import { TemporalService } from '../temporal/temporal.service';
import type { TemporalHealthResult } from '../temporal/temporal.interfaces';
import { TemporalMetricsService } from '../temporal/temporal-metrics.service';
import { TemporalWorkerService } from '../temporal/temporal.worker';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    aiEngine: ServiceHealth;
    temporal?: TemporalServiceHealth;
  };
  metrics?: {
    temporal?: TemporalMetricsSnapshot;
  };
  uptime: number;
}

export interface TemporalMetricsSnapshot {
  workflowsStartedTotal: number;
  workflowsCompletedTotal: number;
  workflowsFailedTotal: number;
  activitiesExecutedTotal: number;
  activitiesFailedTotal: number;
  avgWorkflowDurationMs: number;
  avgActivityLatencyMs: number;
  activeWorkflowsCount: number;
  stuckActivityCount: number;
}

export interface TemporalServiceHealth extends ServiceHealth {
  namespace?: string;
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly aiClientService: AiClientService,
    @Optional()
    private readonly temporalService?: TemporalService,
    @Optional()
    private readonly temporalMetricsService?: TemporalMetricsService,
    @Optional()
    private readonly temporalWorkerService?: TemporalWorkerService,
  ) {}

  async getHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    const checks = [this.checkDatabase(), this.checkAiEngine()];

    // Only check Temporal if the service is available
    if (this.temporalService) {
      checks.push(this.checkTemporal());
    }

    const results = await Promise.allSettled(checks);

    const [dbResult, aiEngineResult, temporalResult] = results;

    const health: HealthCheckResult = {
      status: this.calculateOverallHealth(
        results.filter(
          (r) =>
            r.status === 'fulfilled' ||
            r !== temporalResult ||
            this.temporalService,
        ),
      ),
      timestamp: new Date().toISOString(),
      services: {
        database: this.extractServiceHealth(dbResult),
        aiEngine: this.extractServiceHealth(aiEngineResult),
      },
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };

    // Add Temporal health if available
    if (this.temporalService && temporalResult) {
      health.services.temporal =
        this.extractTemporalServiceHealth(temporalResult);
    }

    // Add Temporal metrics if available
    if (this.temporalMetricsService || this.temporalWorkerService) {
      health.metrics = {
        temporal: await this.getTemporalMetrics(),
      };
    }

    return health;
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      await this.dataSource.query('SELECT 1');

      return {
        status: 'healthy',
        latency: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);

      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkAiEngine(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      await this.aiClientService.healthCheck();

      return {
        status: 'healthy',
        latency: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('AI Engine health check failed', error);

      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkTemporal(): Promise<TemporalServiceHealth> {
    const startTime = Date.now();

    try {
      const result: TemporalHealthResult =
        await this.temporalService!.checkHealth();

      return {
        status: result.healthy ? 'healthy' : 'unhealthy',
        latency: result.latency,
        namespace: result.namespace,
        error: result.error,
      };
    } catch (error) {
      this.logger.error('Temporal health check failed', error);

      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private calculateOverallHealth(
    results: PromiseSettledResult<ServiceHealth>[],
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const healthyCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 'healthy',
    ).length;

    if (healthyCount === results.length) {
      return 'healthy';
    }

    if (healthyCount > 0) {
      return 'degraded';
    }

    return 'unhealthy';
  }

  private extractServiceHealth(
    result: PromiseSettledResult<ServiceHealth | TemporalServiceHealth>,
  ): ServiceHealth {
    if (result.status === 'fulfilled') {
      const { status, latency, error } = result.value;
      return { status, latency, error };
    }

    return {
      status: 'unhealthy',
      error: 'Check failed',
    };
  }

  private extractTemporalServiceHealth(
    result: PromiseSettledResult<TemporalServiceHealth>,
  ): TemporalServiceHealth {
    if (result.status === 'fulfilled') {
      return result.value;
    }

    return {
      status: 'unhealthy',
      error: 'Check failed',
    };
  }

  /**
   * Get Temporal metrics snapshot
   *
   * Aggregates metrics from both TemporalMetricsService and TemporalWorkerService.
   */
  private async getTemporalMetrics(): Promise<TemporalMetricsSnapshot> {
    const baseMetrics = this.temporalMetricsService
      ? await this.temporalMetricsService.getMetricsSnapshot()
      : {
          workflowsStartedTotal: 0,
          workflowsCompletedTotal: 0,
          workflowsFailedTotal: 0,
          activitiesExecutedTotal: 0,
          activitiesFailedTotal: 0,
          avgWorkflowDurationMs: 0,
          avgActivityLatencyMs: 0,
          activeWorkflowsCount: 0,
        };

    const workerMetrics =
      this.temporalWorkerService?.getObservabilityHealthMetrics();

    return {
      ...baseMetrics,
      stuckActivityCount: workerMetrics?.stuckActivityCount || 0,
    };
  }
}
