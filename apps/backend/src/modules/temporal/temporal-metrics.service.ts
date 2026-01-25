/**
 * Temporal Metrics Service
 *
 * Provides Prometheus metrics export for Temporal workflows and activities.
 * Tracks workflow execution counts, durations, success/failure rates, and activity latency.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Counter, Histogram, register, Gauge } from 'prom-client';

/**
 * Workflow execution labels for metrics
 */
export interface WorkflowLabels {
  /** Workflow type/name */
  workflow_type: string;
  /** Task queue */
  task_queue: string;
  /** Execution status (completed, failed, canceled, timed_out) */
  status: string;
  /** Namespace */
  namespace?: string;
}

/**
 * Activity execution labels for metrics
 */
export interface ActivityLabels {
  /** Activity type/name */
  activity_type: string;
  /** Workflow type that owns this activity */
  workflow_type: string;
  /** Task queue */
  task_queue: string;
  /** Execution status (completed, failed, canceled, timed_out) */
  status: string;
}

/**
 * Worker labels for metrics
 */
export interface WorkerLabels {
  /** Task queue */
  task_queue: string;
  /** Worker ID (if available) */
  worker_id?: string;
}

/**
 * Metrics summary snapshot
 */
export interface MetricsSnapshot {
  /** Total workflows started */
  workflowsStartedTotal: number;
  /** Total workflows completed */
  workflowsCompletedTotal: number;
  /** Total workflows failed */
  workflowsFailedTotal: number;
  /** Total activities executed */
  activitiesExecutedTotal: number;
  /** Total activities failed */
  activitiesFailedTotal: number;
  /** Average workflow duration in milliseconds */
  avgWorkflowDurationMs: number;
  /** Average activity latency in milliseconds */
  avgActivityLatencyMs: number;
  /** Current active workflow count */
  activeWorkflowsCount: number;
}

/**
 * Temporal Metrics Service
 *
 * Manages Prometheus metrics for Temporal workflow execution.
 * Provides counters, histograms, and gauges for monitoring.
 */
@Injectable()
export class TemporalMetricsService {
  private readonly logger = new Logger(TemporalMetricsService.name);
  private readonly prefix = 'temporal_';

  // Counters
  private readonly workflowsStartedTotal: Counter<string>;
  private readonly workflowsCompletedTotal: Counter<string>;
  private readonly workflowsFailedTotal: Counter<string>;
  private readonly workflowsCanceledTotal: Counter<string>;
  private readonly workflowsTimedOutTotal: Counter<string>;
  private readonly activitiesExecutedTotal: Counter<string>;
  private readonly activitiesFailedTotal: Counter<string>;

  // Histograms
  private readonly workflowExecutionDuration: Histogram<string>;
  private readonly activityExecutionLatency: Histogram<string>;
  private readonly workflowEndToEndLatency: Histogram<string>;

  // Gauges
  private readonly activeWorkflowsGauge: Gauge<string>;
  private readonly pendingActivitiesGauge: Gauge<string>;
  private readonly workerTaskQueueBacklog: Gauge<string>;

  // Local tracking for gauge values
  private readonly activeWorkflowsMap = new Map<string, number>();
  private readonly pendingActivitiesMap = new Map<string, number>();
  private readonly taskQueueBacklogMap = new Map<string, number>();

  constructor() {
    const commonLabels = ['workflow_type', 'task_queue'];

    // Counters
    this.workflowsStartedTotal = new Counter({
      name: `${this.prefix}workflows_started_total`,
      help: 'Total number of workflows started',
      labelNames: [...commonLabels, 'namespace'],
    });

    this.workflowsCompletedTotal = new Counter({
      name: `${this.prefix}workflows_completed_total`,
      help: 'Total number of workflows completed successfully',
      labelNames: commonLabels,
    });

    this.workflowsFailedTotal = new Counter({
      name: `${this.prefix}workflows_failed_total`,
      help: 'Total number of workflows that failed',
      labelNames: [...commonLabels, 'failure_reason'],
    });

    this.workflowsCanceledTotal = new Counter({
      name: `${this.prefix}workflows_canceled_total`,
      help: 'Total number of workflows canceled',
      labelNames: commonLabels,
    });

    this.workflowsTimedOutTotal = new Counter({
      name: `${this.prefix}workflows_timed_out_total`,
      help: 'Total number of workflows that timed out',
      labelNames: commonLabels,
    });

    this.activitiesExecutedTotal = new Counter({
      name: `${this.prefix}activities_executed_total`,
      help: 'Total number of activities executed successfully',
      labelNames: ['activity_type', 'workflow_type', 'task_queue'],
    });

    this.activitiesFailedTotal = new Counter({
      name: `${this.prefix}activities_failed_total`,
      help: 'Total number of activities that failed',
      labelNames: [
        'activity_type',
        'workflow_type',
        'task_queue',
        'failure_reason',
      ],
    });

    // Histograms - with buckets for common temporal durations
    const defaultBuckets = [
      1000, 5000, 10000, 30000, 60000, 120000, 300000, 600000, 1800000,
    ];

    this.workflowExecutionDuration = new Histogram({
      name: `${this.prefix}workflow_execution_duration_seconds`,
      help: 'Workflow execution duration in seconds',
      labelNames: commonLabels,
      buckets: defaultBuckets.map((b) => b / 1000), // Convert ms to seconds
    });

    this.activityExecutionLatency = new Histogram({
      name: `${this.prefix}activity_execution_latency_seconds`,
      help: 'Activity execution latency in seconds',
      labelNames: ['activity_type', 'workflow_type', 'task_queue'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
    });

    this.workflowEndToEndLatency = new Histogram({
      name: `${this.prefix}workflow_end_to_end_latency_seconds`,
      help: 'Workflow end-to-end latency from start to completion in seconds',
      labelNames: commonLabels,
      buckets: defaultBuckets.map((b) => b / 1000),
    });

    // Gauges
    this.activeWorkflowsGauge = new Gauge({
      name: `${this.prefix}active_workflows`,
      help: 'Current number of active workflows',
      labelNames: ['task_queue'],
    });

    this.pendingActivitiesGauge = new Gauge({
      name: `${this.prefix}pending_activities`,
      help: 'Current number of pending activities',
      labelNames: ['task_queue', 'activity_type'],
    });

    this.workerTaskQueueBacklog = new Gauge({
      name: `${this.prefix}task_queue_backlog`,
      help: 'Current task queue backlog (number of pending workflow tasks)',
      labelNames: ['task_queue'],
    });

    // Register all metrics
    this.registerMetrics();

    this.logger.log('Temporal metrics service initialized');
  }

  /**
   * Record workflow started
   */
  recordWorkflowStarted(labels: {
    workflowType: string;
    taskQueue: string;
    namespace?: string;
  }): void {
    const workflowType = labels.workflowType || 'unknown';
    const taskQueue = labels.taskQueue || 'default';
    const namespace = labels.namespace || 'default';

    this.workflowsStartedTotal.inc({
      workflow_type: workflowType,
      task_queue: taskQueue,
      namespace,
    });

    this.incrementActiveWorkflows(taskQueue);

    this.logger.debug(
      `Recorded workflow started: ${workflowType} on ${taskQueue}`,
    );
  }

  /**
   * Record workflow completed
   */
  recordWorkflowCompleted(labels: {
    workflowType: string;
    taskQueue: string;
    durationMs: number;
  }): void {
    const workflowType = labels.workflowType || 'unknown';
    const taskQueue = labels.taskQueue || 'default';
    const durationSec = labels.durationMs / 1000;

    this.workflowsCompletedTotal.inc({
      workflow_type: workflowType,
      task_queue: taskQueue,
    });

    this.workflowExecutionDuration.observe(
      {
        workflow_type: workflowType,
        task_queue: taskQueue,
      },
      durationSec,
    );

    this.workflowEndToEndLatency.observe(
      {
        workflow_type: workflowType,
        task_queue: taskQueue,
      },
      durationSec,
    );

    this.decrementActiveWorkflows(taskQueue);

    this.logger.debug(
      `Recorded workflow completed: ${workflowType} on ${taskQueue} (${durationSec}s)`,
    );
  }

  /**
   * Record workflow failed
   */
  recordWorkflowFailed(labels: {
    workflowType: string;
    taskQueue: string;
    durationMs: number;
    failureReason?: string;
  }): void {
    const workflowType = labels.workflowType || 'unknown';
    const taskQueue = labels.taskQueue || 'default';
    const failureReason = labels.failureReason || 'unknown';
    const durationSec = labels.durationMs / 1000;

    this.workflowsFailedTotal.inc({
      workflow_type: workflowType,
      task_queue: taskQueue,
      failure_reason: this.sanitizeLabel(failureReason),
    });

    this.workflowExecutionDuration.observe(
      {
        workflow_type: workflowType,
        task_queue: taskQueue,
      },
      durationSec,
    );

    this.decrementActiveWorkflows(taskQueue);

    this.logger.debug(
      `Recorded workflow failed: ${workflowType} on ${taskQueue} - ${failureReason}`,
    );
  }

  /**
   * Record workflow canceled
   */
  recordWorkflowCanceled(labels: {
    workflowType: string;
    taskQueue: string;
  }): void {
    const workflowType = labels.workflowType || 'unknown';
    const taskQueue = labels.taskQueue || 'default';

    this.workflowsCanceledTotal.inc({
      workflow_type: workflowType,
      task_queue: taskQueue,
    });

    this.decrementActiveWorkflows(taskQueue);

    this.logger.debug(
      `Recorded workflow canceled: ${workflowType} on ${taskQueue}`,
    );
  }

  /**
   * Record workflow timed out
   */
  recordWorkflowTimedOut(labels: {
    workflowType: string;
    taskQueue: string;
  }): void {
    const workflowType = labels.workflowType || 'unknown';
    const taskQueue = labels.taskQueue || 'default';

    this.workflowsTimedOutTotal.inc({
      workflow_type: workflowType,
      task_queue: taskQueue,
    });

    this.decrementActiveWorkflows(taskQueue);

    this.logger.debug(
      `Recorded workflow timed out: ${workflowType} on ${taskQueue}`,
    );
  }

  /**
   * Record activity executed
   */
  recordActivityExecuted(labels: {
    activityType: string;
    workflowType: string;
    taskQueue: string;
    latencyMs: number;
  }): void {
    const activityType = labels.activityType || 'unknown';
    const workflowType = labels.workflowType || 'unknown';
    const taskQueue = labels.taskQueue || 'default';
    const latencySec = labels.latencyMs / 1000;

    this.activitiesExecutedTotal.inc({
      activity_type: activityType,
      workflow_type: workflowType,
      task_queue: taskQueue,
    });

    this.activityExecutionLatency.observe(
      {
        activity_type: activityType,
        workflow_type: workflowType,
        task_queue: taskQueue,
      },
      latencySec,
    );

    this.logger.debug(
      `Recorded activity executed: ${activityType} (${latencySec}s)`,
    );
  }

  /**
   * Record activity failed
   */
  recordActivityFailed(labels: {
    activityType: string;
    workflowType: string;
    taskQueue: string;
    failureReason?: string;
  }): void {
    const activityType = labels.activityType || 'unknown';
    const workflowType = labels.workflowType || 'unknown';
    const taskQueue = labels.taskQueue || 'default';
    const failureReason = labels.failureReason || 'unknown';

    this.activitiesFailedTotal.inc({
      activity_type: activityType,
      workflow_type: workflowType,
      task_queue: taskQueue,
      failure_reason: this.sanitizeLabel(failureReason),
    });

    this.logger.debug(
      `Recorded activity failed: ${activityType} - ${failureReason}`,
    );
  }

  /**
   * Update active workflows gauge
   */
  updateActiveWorkflows(taskQueue: string, count: number): void {
    this.activeWorkflowsGauge.set({ task_queue: taskQueue }, count);
    this.activeWorkflowsMap.set(taskQueue, count);
  }

  /**
   * Update pending activities gauge
   */
  updatePendingActivities(
    taskQueue: string,
    activityType: string,
    count: number,
  ): void {
    this.pendingActivitiesGauge.set(
      { task_queue: taskQueue, activity_type: activityType },
      count,
    );
    this.pendingActivitiesMap.set(`${taskQueue}:${activityType}`, count);
  }

  /**
   * Update task queue backlog
   */
  updateTaskQueueBacklog(taskQueue: string, backlog: number): void {
    this.workerTaskQueueBacklog.set({ task_queue: taskQueue }, backlog);
    this.taskQueueBacklogMap.set(taskQueue, backlog);
  }

  /**
   * Get metrics snapshot for dashboard
   */
  async getMetricsSnapshot(): Promise<MetricsSnapshot> {
    const metrics = await register.getMetricsAsJSON();

    const findMetric = (name: string) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      metrics.find((m) => m.name === `${this.prefix}${name}`);

    const workflowsStarted = findMetric('workflows_started_total');
    const workflowsCompleted = findMetric('workflows_completed_total');
    const workflowsFailed = findMetric('workflows_failed_total');
    const activitiesExecuted = findMetric('activities_executed_total');
    const activitiesFailed = findMetric('activities_failed_total');
    const workflowDuration = findMetric('workflow_execution_duration_seconds');
    const activityLatency = findMetric('activity_execution_latency_seconds');
    const activeWorkflows = findMetric('active_workflows');

    const sumValue = (metric?: any): number =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      metric?.values?.reduce(
        (sum: number, v: any) => sum + ((v.value as number) || 0),
        0,
      ) || 0;

    const getAverageDuration = (metric?: any): number => {
      if (!metric?.values) return 0;
      const total = metric.values.reduce(
        (sum: number, v: any) => sum + ((v.metric?.sum as number) || 0),
        0,
      );
      const count = metric.values.reduce(
        (sum: number, v: any) => sum + ((v.metric?.count as number) || 0),
        0,
      );
      return count > 0 ? total / count : 0;
    };

    // Calculate total active workflows across all task queues
    const totalActiveWorkflows =
      activeWorkflows?.values?.reduce(
        (sum: number, v: any) => sum + ((v.value as number) || 0),
        0,
      ) ||
      Array.from(this.activeWorkflowsMap.values()).reduce((a, b) => a + b, 0);

    return {
      workflowsStartedTotal: sumValue(workflowsStarted),
      workflowsCompletedTotal: sumValue(workflowsCompleted),
      workflowsFailedTotal: sumValue(workflowsFailed),
      activitiesExecutedTotal: sumValue(activitiesExecuted),
      activitiesFailedTotal: sumValue(activitiesFailed),
      avgWorkflowDurationMs: getAverageDuration(workflowDuration) * 1000,
      avgActivityLatencyMs: getAverageDuration(activityLatency) * 1000,
      activeWorkflowsCount: totalActiveWorkflows,
    };
  }

  /**
   * Get Prometheus metrics as text
   */
  async getMetrics(): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return register.metrics();
  }

  /**
   * Reset all metrics (useful for testing)
   */
  async resetMetrics(): Promise<void> {
    await register.resetMetrics();
    this.activeWorkflowsMap.clear();
    this.pendingActivitiesMap.clear();
    this.taskQueueBacklogMap.clear();
  }

  /**
   * Increment active workflows count
   */
  private incrementActiveWorkflows(taskQueue: string): void {
    const current = this.activeWorkflowsMap.get(taskQueue) || 0;
    this.updateActiveWorkflows(taskQueue, current + 1);
  }

  /**
   * Decrement active workflows count
   */
  private decrementActiveWorkflows(taskQueue: string): void {
    const current = this.activeWorkflowsMap.get(taskQueue) || 0;
    this.updateActiveWorkflows(taskQueue, Math.max(0, current - 1));
  }

  /**
   * Sanitize label values for Prometheus
   */
  private sanitizeLabel(value: string): string {
    return value.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 200); // Prometheus label length limit
  }

  /**
   * Register all metrics with Prometheus
   */
  private registerMetrics(): void {
    const metrics = [
      this.workflowsStartedTotal,
      this.workflowsCompletedTotal,
      this.workflowsFailedTotal,
      this.workflowsCanceledTotal,
      this.workflowsTimedOutTotal,
      this.activitiesExecutedTotal,
      this.activitiesFailedTotal,
      this.workflowExecutionDuration,
      this.activityExecutionLatency,
      this.workflowEndToEndLatency,
      this.activeWorkflowsGauge,
      this.pendingActivitiesGauge,
      this.workerTaskQueueBacklog,
    ];

    for (const metric of metrics) {
      try {
        register.registerMetric(metric);
      } catch (error) {
        // Metric already registered, ignore
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes('already registered')) {
          this.logger.warn(`Failed to register metric: ${message}`);
        }
      }
    }
  }
}
