/**
 * Temporal Metrics Controller
 *
 * Exposes Prometheus metrics endpoint for Temporal workflow execution.
 * Integrates with application-wide monitoring infrastructure.
 */

import { Controller, Get, Optional } from '@nestjs/common';
import { Public } from '../../modules/auth/decorators/public.decorator';
import { TemporalMetricsService } from './temporal-metrics.service';
import { TemporalObservabilityService } from './temporal-observability.service';
import { TemporalWorkerService } from './temporal.worker';

/**
 * Metrics response
 */
interface MetricsResponse {
  metrics: string;
  timestamp: string;
}

/**
 * Metrics snapshot response
 */
interface MetricsSnapshotResponse {
  workflowsStartedTotal: number;
  workflowsCompletedTotal: number;
  workflowsFailedTotal: number;
  activitiesExecutedTotal: number;
  activitiesFailedTotal: number;
  avgWorkflowDurationMs: number;
  avgActivityLatencyMs: number;
  activeWorkflowsCount: number;
  stuckActivityCount: number;
  timestamp: string;
}

/**
 * Temporal Metrics Controller
 *
 * Provides endpoints for monitoring Temporal workflow execution.
 * Metrics are exposed in Prometheus format for scraping.
 */
@Controller('metrics/temporal')
export class TemporalMetricsController {
  constructor(
    @Optional()
    private readonly metricsService?: TemporalMetricsService,
    @Optional()
    private readonly observabilityService?: TemporalObservabilityService,
    @Optional()
    private readonly workerService?: TemporalWorkerService,
  ) {}

  /**
   * Get Prometheus metrics
   *
   * Returns metrics in Prometheus text format for scraping.
   * This endpoint should be configured in Prometheus scrape configs.
   *
   * @example
   * ```yaml
   * scrape_configs:
   *   - job_name: 'temporal-application'
   *     static_configs:
   *       - targets: ['backend:3000']
   *     metrics_path: '/metrics/temporal'
   * ```
   */
  @Public()
  @Get()
  async getMetrics(): Promise<MetricsResponse> {
    const metrics = this.metricsService
      ? await this.metricsService.getMetrics()
      : '# No metrics available\n';

    return {
      metrics,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get metrics snapshot
   *
   * Returns a JSON summary of current metrics for dashboard display.
   */
  @Public()
  @Get('snapshot')
  async getSnapshot(): Promise<MetricsSnapshotResponse> {
    const snapshot = this.metricsService
      ? await this.metricsService.getMetricsSnapshot()
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

    const workerHealth = this.workerService?.getObservabilityHealthMetrics();

    return {
      ...snapshot,
      stuckActivityCount: workerHealth?.stuckActivityCount || 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get health metrics
   *
   * Returns health-related metrics including stuck activity detection.
   */
  @Public()
  @Get('health')
  getHealthMetrics(): {
    totalActiveWorkflows: number;
    totalTrackedActivities: number;
    stuckActivityCount: number;
  } {
    return (
      this.observabilityService?.getHealthMetrics() || {
        totalActiveWorkflows: 0,
        totalTrackedActivities: 0,
        stuckActivityCount: 0,
      }
    );
  }
}
