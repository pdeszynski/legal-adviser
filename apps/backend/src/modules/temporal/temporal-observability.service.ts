/**
 * Temporal Observability Service
 *
 * Integrates Temporal workflow execution with Sentry for error tracking and monitoring.
 * Provides structured logging with workflow context and captures workflow failures.
 */

import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { AppLogger } from '../../shared/logger/logger.service';

/**
 * Workflow execution context for tracing
 */
export interface WorkflowContext {
  /** Workflow ID */
  workflowId: string;
  /** Run ID */
  runId?: string;
  /** Workflow type/name */
  workflowType: string;
  /** Task queue */
  taskQueue: string;
  /** Namespace */
  namespace?: string;
  /** User ID associated with workflow (if applicable) */
  userId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Activity execution context
 */
export interface ActivityContext {
  /** Activity ID */
  activityId: string;
  /** Activity type/name */
  activityType: string;
  /** Parent workflow context */
  workflow: WorkflowContext;
  /** Attempt number */
  attempt?: number;
}

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
  /** Whether workflow completed successfully */
  success: boolean;
  /** Duration in milliseconds */
  durationMs: number;
  /** Error message if failed */
  error?: string;
  /** Error stack trace if failed */
  stack?: string;
  /** Additional result data */
  result?: unknown;
}

/**
 * Stuck activity detection info
 */
export interface StuckActivityInfo {
  activityType: string;
  workflowId: string;
  workflowType: string;
  taskQueue: string;
  lastProgress: Date;
  durationMinutes: number;
}

/**
 * Temporal Observability Service
 *
 * Handles Sentry integration and structured logging for Temporal workflows.
 */
@Injectable()
export class TemporalObservabilityService {
  private readonly logger = new Logger(TemporalObservabilityService.name);
  private readonly loggerService: AppLogger;
  private readonly stuckActivityThresholdMinutes = 30;
  private readonly workflowActivityMap = new Map<string, Map<string, Date>>();

  constructor() {
    // Create a child logger for Temporal operations
    this.loggerService = new AppLogger({
      level: process.env.LOG_LEVEL || 'info',
      json: process.env.NODE_ENV === 'production',
      colorize: process.env.NODE_ENV !== 'production',
    });
    this.loggerService.setContext('Temporal');

    this.logger.log('Temporal observability service initialized');
  }

  /**
   * Record workflow started
   */
  recordWorkflowStarted(context: WorkflowContext): void {
    const tags = this.contextToTags(context);

    this.loggerService.logWithMetadata(
      `Workflow started: ${context.workflowType}`,
      {
        workflowId: context.workflowId,
        runId: context.runId,
        workflowType: context.workflowType,
        taskQueue: context.taskQueue,
        namespace: context.namespace,
        userId: context.userId,
        ...context.metadata,
      },
      'info',
    );

    // Initialize activity tracking for this workflow
    this.workflowActivityMap.set(context.workflowId, new Map());

    // Send to Sentry as breadcrumb
    Sentry.addBreadcrumb({
      category: 'temporal.workflow',
      message: `Workflow started: ${context.workflowType}`,
      level: 'info',
      data: tags,
    });
  }

  /**
   * Record workflow completed
   */
  recordWorkflowCompleted(
    context: WorkflowContext,
    result: WorkflowExecutionResult,
  ): void {
    const tags = this.contextToTags(context);

    this.loggerService.logWithMetadata(
      `Workflow completed: ${context.workflowType}`,
      {
        workflowId: context.workflowId,
        runId: context.runId,
        workflowType: context.workflowType,
        taskQueue: context.taskQueue,
        durationMs: result.durationMs,
        success: result.success,
        result: result.result,
      },
      result.success ? 'info' : 'error',
    );

    if (result.success) {
      Sentry.addBreadcrumb({
        category: 'temporal.workflow',
        message: `Workflow completed: ${context.workflowType}`,
        level: 'info',
        data: { ...tags, durationMs: result.durationMs },
      });
    } else {
      this.captureWorkflowError(context, result);
    }

    // Clean up activity tracking
    this.workflowActivityMap.delete(context.workflowId);
  }

  /**
   * Record workflow canceled
   */
  recordWorkflowCanceled(context: WorkflowContext, reason?: string): void {
    const tags = this.contextToTags(context);

    this.loggerService.warn(
      `Workflow canceled: ${context.workflowType} - ${reason || 'No reason provided'}`,
    );

    Sentry.addBreadcrumb({
      category: 'temporal.workflow',
      message: `Workflow canceled: ${context.workflowType}`,
      level: 'warning',
      data: { ...tags, reason },
    });

    // Clean up activity tracking
    this.workflowActivityMap.delete(context.workflowId);
  }

  /**
   * Record activity started
   */
  recordActivityStarted(activityContext: ActivityContext): void {
    const { activityType, workflow, attempt } = activityContext;

    this.loggerService.debug(
      `Activity started: ${activityType} (workflow: ${workflow.workflowType}, attempt: ${attempt || 1})`,
    );

    // Track activity for stuck detection
    const workflowActivities = this.workflowActivityMap.get(
      workflow.workflowId,
    );
    if (workflowActivities) {
      workflowActivities.set(activityType, new Date());
    }

    Sentry.addBreadcrumb({
      category: 'temporal.activity',
      message: `Activity started: ${activityType}`,
      level: 'info',
      data: {
        activity_type: activityType,
        workflow_type: workflow.workflowType,
        workflow_id: workflow.workflowId,
        attempt,
      },
    });
  }

  /**
   * Record activity completed
   */
  recordActivityCompleted(
    activityContext: ActivityContext,
    durationMs: number,
    success: boolean,
    error?: Error,
  ): void {
    const { activityType, workflow } = activityContext;

    if (success) {
      this.loggerService.debug(
        `Activity completed: ${activityType} (${durationMs}ms)`,
      );
    } else {
      this.loggerService.error(
        `Activity failed: ${activityType} - ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
    }

    // Remove from tracking
    const workflowActivities = this.workflowActivityMap.get(
      workflow.workflowId,
    );
    if (workflowActivities) {
      workflowActivities.delete(activityType);
    }

    if (!success && error) {
      this.captureActivityError(activityContext, error, durationMs);
    }

    Sentry.addBreadcrumb({
      category: 'temporal.activity',
      message: `Activity ${success ? 'completed' : 'failed'}: ${activityType}`,
      level: success ? 'info' : 'error',
      data: {
        activity_type: activityType,
        workflow_type: workflow.workflowType,
        workflow_id: workflow.workflowId,
        durationMs,
        success,
      },
    });
  }

  /**
   * Check for stuck activities and send alerts
   */
  checkForStuckActivities(): StuckActivityInfo[] {
    const stuckActivities: StuckActivityInfo[] = [];
    const now = new Date();
    const thresholdMs = this.stuckActivityThresholdMinutes * 60 * 1000;

    for (const [workflowId, activities] of this.workflowActivityMap.entries()) {
      for (const [activityType, lastProgress] of activities.entries()) {
        const elapsed = now.getTime() - lastProgress.getTime();

        if (elapsed > thresholdMs) {
          const stuckInfo: StuckActivityInfo = {
            activityType,
            workflowId,
            workflowType: 'unknown',
            taskQueue: 'unknown',
            lastProgress,
            durationMinutes: Math.floor(elapsed / 60000),
          };

          stuckActivities.push(stuckInfo);

          this.loggerService.error(
            `Stuck activity detected: ${activityType} in workflow ${workflowId} (${stuckInfo.durationMinutes} minutes)`,
          );

          // Send to Sentry
          Sentry.captureMessage(`Stuck Temporal activity: ${activityType}`, {
            level: 'error',
            tags: {
              temporal_component: 'activity',
              activity_type: activityType,
              workflow_id: workflowId,
              stuck_duration_minutes: String(stuckInfo.durationMinutes),
            },
            extra: stuckInfo,
          });
        }
      }
    }

    return stuckActivities;
  }

  /**
   * Get metrics for health check
   */
  getHealthMetrics(): {
    totalActiveWorkflows: number;
    totalTrackedActivities: number;
    stuckActivityCount: number;
  } {
    let totalTrackedActivities = 0;
    const stuckActivities = this.checkForStuckActivities();

    for (const activities of this.workflowActivityMap.values()) {
      totalTrackedActivities += activities.size;
    }

    return {
      totalActiveWorkflows: this.workflowActivityMap.size,
      totalTrackedActivities,
      stuckActivityCount: stuckActivities.length,
    };
  }

  /**
   * Capture workflow error to Sentry
   */
  private captureWorkflowError(
    context: WorkflowContext,
    result: WorkflowExecutionResult,
  ): void {
    const error = new Error(
      `Workflow failed: ${context.workflowType} - ${result.error || 'Unknown error'}`,
    );

    Sentry.captureException(error, {
      tags: this.contextToTags(context),
      level: 'error',
      extra: {
        workflowId: context.workflowId,
        runId: context.runId,
        workflowType: context.workflowType,
        taskQueue: context.taskQueue,
        durationMs: result.durationMs,
        errorMessage: result.error,
        stackTrace: result.stack,
        result: result.result,
        userId: context.userId,
        metadata: context.metadata,
      },
    });

    this.loggerService.error(
      `Workflow error captured: ${context.workflowType}`,
      result.stack || result.error,
    );
  }

  /**
   * Capture activity error to Sentry
   */
  private captureActivityError(
    activityContext: ActivityContext,
    error: Error,
    durationMs: number,
  ): void {
    const { activityType, workflow, attempt } = activityContext;

    Sentry.captureException(error, {
      tags: {
        temporal_component: 'activity',
        activity_type: activityType,
        workflow_type: workflow.workflowType,
        workflow_id: workflow.workflowId,
        task_queue: workflow.taskQueue,
        attempt: String(attempt || 1),
      },
      level: 'error',
      extra: {
        activityId: activityContext.activityId,
        workflow: workflow,
        durationMs,
        userId: workflow.userId,
      },
    });
  }

  /**
   * Convert workflow context to Sentry tags
   */
  private contextToTags(context: WorkflowContext): Record<string, string> {
    return {
      temporal_component: 'workflow',
      workflow_type: context.workflowType,
      task_queue: context.taskQueue,
      namespace: context.namespace || 'default',
      ...(context.userId && { user_id: context.userId }),
    };
  }

  /**
   * Clean up completed workflow tracking
   */
  cleanupWorkflow(workflowId: string): void {
    this.workflowActivityMap.delete(workflowId);
  }

  /**
   * Set stuck activity threshold
   */
  setStuckActivityThreshold(minutes: number): void {
    this.stuckActivityThresholdMinutes = minutes;
    this.logger.log(`Stuck activity threshold set to ${minutes} minutes`);
  }
}
