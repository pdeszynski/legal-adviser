/**
 * Temporal Service
 *
 * Provides a high-level interface for interacting with Temporal workflows.
 * Handles workflow execution, signaling, and querying.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  Optional,
} from '@nestjs/common';
import {
  TEMPORAL_MODULE_OPTIONS,
  TEMPORAL_DEFAULTS,
} from './temporal.constants';
import type {
  TemporalModuleOptions,
  WorkflowStartOptions,
  TemporalHealthResult,
  ScheduleDescription,
  ScheduleOptions,
  ScheduleUpdateOptions,
  ScheduleBackfillOptions,
  ScheduleTriggerOptions,
  ScheduleOverlapPolicy,
  ScheduleListResult,
  ScheduleListOptions,
} from './temporal.interfaces';
import { TemporalMetricsService } from './temporal-metrics.service';
import { TemporalObservabilityService } from './temporal-observability.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  AuditActionType,
  AuditResourceType,
} from '../audit-log/entities/audit-log.entity';
import {
  ScheduleNotFoundError,
  ScheduleAlreadyExistsError,
  InvalidCronExpressionError,
  WorkflowNotFoundError,
  ScheduleOperationError,
  ScheduleAlreadyPausedError,
  ScheduleNotPausedError,
  InvalidScheduleSpecError,
  TemporalServiceUnavailableError,
  TemporalError,
} from './exceptions';

/**
 * Workflow Execution Result
 *
 * Result returned after starting a workflow.
 */
export interface WorkflowStartResult {
  /** Unique workflow ID */
  workflowId: string;
  /** First execution ID (run ID) */
  runId: string;
  /** Task queue the workflow was dispatched to */
  taskQueue: string;
  /** Workflow type/name */
  workflowType: string;
}

/**
 * Workflow Query Result
 *
 * Result from querying a workflow's current state.
 */
export interface WorkflowQueryResult<T = unknown> {
  /** Query result data */
  result: T;
  /** Current workflow run ID */
  runId: string;
  /** Whether the workflow is still running */
  isRunning: boolean;
}

/**
 * Raw Temporal Schedule Description
 *
 * Type definition for the raw schedule description returned by Temporal SDK.
 * This mirrors the structure of client.schedule.handle.describe() response.
 */
interface ScheduleDescriptionRaw {
  /** Schedule ID */
  scheduleId?: string;
  /** Current state of the schedule */
  state?: {
    /** Whether the schedule is paused */
    paused: boolean;
    /** Number of missed actions */
    numMissedActions?: number;
  };
  /** Action specification */
  action?: {
    /** Start workflow action */
    startWorkflow?: {
      /** Workflow type name */
      workflowType?: string;
      /** Workflow function */
      workflow?: string;
      /** Workflow ID template */
      workflowId?: string;
      /** Task queue for the workflow */
      taskQueue?: string;
      /** Arguments to pass to workflow */
      args?: unknown[];
    };
  };
  /** Schedule specification */
  spec?: {
    /** Cron expressions */
    cronExpressions?: Array<{ expression: string; comment?: string }>;
    /** Interval specification */
    interval?: { seconds: number };
    /** Start time */
    startTime?: string;
    /** End time */
    endTime?: string;
    /** Timezone */
    timezone?: string;
  };
  /** Schedule policies */
  policies?: {
    /** Overlap policy */
    overlap?: 'SKIP' | 'ALLOW_ALL' | 'BUFFER_ONE';
    /** Catchup window */
    catchupWindow?: string;
  };
  /** Schedule information */
  info?: {
    /** Number of missed actions */
    missedActions?: number;
    /** Total actions */
    totalActions?: number;
    /** Successful actions */
    successfulActions?: number;
    /** Failed actions */
    failedActions?: number;
  };
  /** Recent action executions */
  recentActions?: Array<{
    /** Workflow ID */
    workflowId?: string;
    /** Run ID */
    runId?: string;
    /** When the action started */
    startedAt?: string;
    /** Action status */
    status?: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
  }>;
  /** Future scheduled action times */
  futureActionTimes?: string[];
}

/**
 * Temporal Service
 *
 * Main service for interacting with Temporal workflows.
 *
 * Note: The temporalio SDK uses ESM-only exports. This service uses dynamic imports
 * to work around TypeScript/CommonJS compatibility issues. The SDK will be loaded
 * at runtime when the first workflow operation is called.
 */
@Injectable()
export class TemporalService {
  private readonly logger = new Logger(TemporalService.name);
  private client: unknown = null;
  private Connection: unknown = null;
  private Client: unknown = null;

  // Track workflow start times for duration calculation
  private readonly workflowStartTimes = new Map<string, number>();

  constructor(
    @Inject(TEMPORAL_MODULE_OPTIONS)
    private readonly options: TemporalModuleOptions,
    @Optional()
    private readonly metricsService?: TemporalMetricsService,
    @Optional()
    private readonly observabilityService?: TemporalObservabilityService,
    @Optional()
    private readonly auditLogService?: AuditLogService,
  ) {}

  /**
   * Initialize Temporal client (lazy loading)
   *
   * Dynamically imports the Temporal SDK and creates a client connection.
   */
  private async initializeClient(): Promise<unknown> {
    if (this.client) {
      return this.client;
    }

    try {
      // Dynamic import to handle ESM-only temporalio package
      const clientModule = await import('@temporalio/client');
      const { Connection, Client } = clientModule;

      this.Connection = Connection;
      this.Client = Client;

      const connection = await Connection.connect({
        address: this.options.clusterUrl,
        tls: this.options.tlsEnabled
          ? ({
              serverRootCACertificate: await this.loadCertificate(
                this.options.serverRootCaCertPath,
              ),
              clientCertPair: {
                crt: await this.loadCertificate(this.options.clientCertPath),
                key: await this.loadCertificate(
                  this.options.clientPrivateKeyPath,
                ),
              },
            } as any)
          : undefined,
      });

      this.client = new Client({
        connection,
        namespace: this.options.namespace,
      });

      this.logger.log(
        `Connected to Temporal at ${this.options.clusterUrl} (namespace: ${this.options.namespace})`,
      );

      return this.client;
    } catch (error) {
      this.logger.error('Failed to connect to Temporal', error);
      throw new BadRequestException('Failed to connect to Temporal server');
    }
  }

  /**
   * Get the Temporal workflow client
   *
   * Creates a new client connection if one doesn't exist.
   */
  async getClient(): Promise<unknown> {
    return this.initializeClient();
  }

  /**
   * Start a new workflow execution
   *
   * @param workflowType - The workflow function or name
   * @param args - Arguments to pass to the workflow
   * @param options - Workflow execution options
   * @returns Workflow start result with workflow ID and run ID
   */
  async startWorkflow<_T = unknown>(
    workflowType: string | ((...args: unknown[]) => Promise<unknown>),
    args: unknown[] = [],
    options: WorkflowStartOptions,
  ): Promise<WorkflowStartResult> {
    const client = (await this.getClient()) as {
      workflow: {
        start: (
          workflow: unknown,
          opts: Record<string, unknown>,
        ) => Promise<{ firstExecutionRunId: string }>;
      };
    };

    const workflowId =
      options.workflowId || this.generateWorkflowId(String(workflowType));
    const taskQueue = options.taskQueue || this.options.taskQueue;
    const workflowTypeStr =
      typeof workflowType === 'string' ? workflowType : 'function';

    try {
      const handle = await client.workflow.start(workflowType, {
        workflowId,
        taskQueue,
        args,
        workflowExecutionTimeout:
          options.workflowExecutionTimeout ||
          TEMPORAL_DEFAULTS.MAX_WORKFLOW_EXECUTION_TIME,
        workflowTaskTimeout:
          options.workflowTaskTimeout ||
          TEMPORAL_DEFAULTS.MAX_WORKFLOW_TASK_TIMEOUT,
        retry: {
          initialInterval: options.retryInitialInterval || 1000,
          maximumInterval: options.retryMaximumInterval || 60000,
          maximumAttempts: options.retryMaximumAttempts || 3,
          nonRetryableErrorTypes: options.retryNonRetryableErrorTypes || [],
        },
      });

      this.logger.log(
        `Started workflow ${workflowId} of type ${workflowTypeStr} on queue ${taskQueue}`,
      );

      // Record workflow started in metrics and observability
      const startTime = Date.now();
      this.workflowStartTimes.set(workflowId, startTime);

      this.metricsService?.recordWorkflowStarted({
        workflowType: workflowTypeStr,
        taskQueue,
        namespace: this.options.namespace,
      });

      this.observabilityService?.recordWorkflowStarted({
        workflowId,
        runId: handle.firstExecutionRunId,
        workflowType: workflowTypeStr,
        taskQueue,
        namespace: this.options.namespace,
        metadata: options.metadata,
      });

      return {
        workflowId,
        runId: handle.firstExecutionRunId,
        taskQueue,
        workflowType: workflowTypeStr,
      };
    } catch (error) {
      this.logger.error(`Failed to start workflow ${workflowId}`, error);

      // Record failed start attempt
      this.metricsService?.recordWorkflowFailed({
        workflowType: workflowTypeStr,
        taskQueue,
        durationMs: 0,
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Execute a workflow and wait for result
   *
   * @param workflowType - The workflow function or name
   * @param args - Arguments to pass to the workflow
   * @param options - Workflow execution options
   * @returns Workflow result
   */
  async executeWorkflow<T = unknown>(
    workflowType: string | ((...args: unknown[]) => Promise<T>),
    args: unknown[] = [],
    options: WorkflowStartOptions,
  ): Promise<T> {
    const startTime = Date.now();
    const workflowTypeStr =
      typeof workflowType === 'string' ? workflowType : 'function';

    try {
      const result = await this.startWorkflow(workflowType, args, options);
      const workflowResult = await this.getWorkflowResult<T>(
        result.workflowId,
        result.taskQueue,
      );

      // Record successful completion
      const durationMs = Date.now() - startTime;
      this.metricsService?.recordWorkflowCompleted({
        workflowType: workflowTypeStr,
        taskQueue: result.taskQueue,
        durationMs,
      });

      this.observabilityService?.recordWorkflowCompleted(
        {
          workflowId: result.workflowId,
          runId: result.runId,
          workflowType: workflowTypeStr,
          taskQueue: result.taskQueue,
          namespace: this.options.namespace,
        },
        {
          success: true,
          durationMs,
        },
      );

      return workflowResult;
    } catch (error) {
      // Record failed execution
      const durationMs = Date.now() - startTime;
      this.metricsService?.recordWorkflowFailed({
        workflowType: workflowTypeStr,
        taskQueue: options.taskQueue || this.options.taskQueue,
        durationMs,
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Get a workflow handle by ID
   *
   * @param workflowId - The workflow ID
   * @param runId - Optional run ID for specific execution
   * @param taskQueue - Task queue (defaults to module default)
   * @returns Workflow handle
   */
  async getWorkflowHandle(
    workflowId: string,
    runId?: string,
    taskQueue?: string,
  ): Promise<unknown> {
    const client = await this.getClient();
    const queue = taskQueue || this.options.taskQueue;

    return (
      client as { workflow: { getHandle: (...args: unknown[]) => unknown } }
    ).workflow.getHandle(workflowId, runId, { taskQueue: queue });
  }

  /**
   * Get workflow result
   *
   * @param workflowId - The workflow ID
   * @param taskQueue - Task queue (defaults to module default)
   * @returns Workflow result
   */
  async getWorkflowResult<T = unknown>(
    workflowId: string,
    taskQueue?: string,
  ): Promise<T> {
    const handle = await this.getWorkflowHandle(
      workflowId,
      undefined,
      taskQueue,
    );

    try {
      return await (handle as { result: () => Promise<T> }).result();
    } catch (error) {
      this.logger.error(
        `Failed to get result for workflow ${workflowId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Query a workflow's current state
   *
   * @param workflowId - The workflow ID
   * @param queryName - Name of the query handler
   * @param args - Arguments to pass to the query
   * @param taskQueue - Task queue (defaults to module default)
   * @returns Query result
   */
  async queryWorkflow<T = unknown>(
    workflowId: string,
    queryName: string,
    args: unknown[] = [],
    taskQueue?: string,
  ): Promise<WorkflowQueryResult<T>> {
    const handle = await this.getWorkflowHandle(
      workflowId,
      undefined,
      taskQueue,
    );

    try {
      const result = await (
        handle as { query: (name: string, ...args: unknown[]) => Promise<T> }
      ).query(queryName, ...args);

      const description = await (
        handle as {
          describe: () => Promise<{
            runId?: string;
            status?: { name: string };
          }>;
        }
      ).describe();

      return {
        result,
        runId: description.runId || '',
        isRunning: description.status?.name === 'RUNNING',
      };
    } catch (error) {
      this.logger.error(
        `Failed to query workflow ${workflowId} with query ${queryName}`,
        error,
      );
      throw new NotFoundException(
        `Workflow ${workflowId} not found or query ${queryName} failed`,
      );
    }
  }

  /**
   * Send a signal to a running workflow
   *
   * @param workflowId - The workflow ID
   * @param signalName - Name of the signal handler
   * @param args - Arguments to pass to the signal
   * @param taskQueue - Task queue (defaults to module default)
   */
  async signalWorkflow(
    workflowId: string,
    signalName: string,
    args: unknown[] = [],
    taskQueue?: string,
  ): Promise<void> {
    const handle = await this.getWorkflowHandle(
      workflowId,
      undefined,
      taskQueue,
    );

    try {
      await (
        handle as {
          signal: (name: string, ...args: unknown[]) => Promise<void>;
        }
      ).signal(signalName, ...args);

      this.logger.log(`Sent signal ${signalName} to workflow ${workflowId}`);
    } catch (error) {
      this.logger.error(
        `Failed to signal workflow ${workflowId} with signal ${signalName}`,
        error,
      );
      throw new NotFoundException(
        `Workflow ${workflowId} not found or signal ${signalName} failed`,
      );
    }
  }

  /**
   * Cancel a running workflow
   *
   * @param workflowId - The workflow ID
   * @param taskQueue - Task queue (defaults to module default)
   */
  async cancelWorkflow(workflowId: string, taskQueue?: string): Promise<void> {
    const queue = taskQueue || this.options.taskQueue;
    const handle = await this.getWorkflowHandle(workflowId, undefined, queue);

    try {
      await (handle as { cancel: () => Promise<void> }).cancel();

      this.logger.log(`Cancelled workflow ${workflowId}`);

      // Record cancellation
      this.metricsService?.recordWorkflowCanceled({
        workflowType: 'unknown',
        taskQueue: queue,
      });

      this.observabilityService?.recordWorkflowCanceled({
        workflowId,
        runId: undefined,
        workflowType: 'unknown',
        taskQueue: queue,
        namespace: this.options.namespace,
      });

      // Clean up start time tracking
      this.workflowStartTimes.delete(workflowId);
    } catch (error) {
      this.logger.error(`Failed to cancel workflow ${workflowId}`, error);
      throw new NotFoundException(
        `Workflow ${workflowId} not found or already completed`,
      );
    }
  }

  /**
   * Terminate a running workflow
   *
   * @param workflowId - The workflow ID
   * @param reason - Reason for termination
   * @param taskQueue - Task queue (defaults to module default)
   */
  async terminateWorkflow(
    workflowId: string,
    reason?: string,
    taskQueue?: string,
  ): Promise<void> {
    const queue = taskQueue || this.options.taskQueue;
    const handle = await this.getWorkflowHandle(workflowId, undefined, queue);

    try {
      await (
        handle as { terminate: (reason?: string) => Promise<void> }
      ).terminate(reason);

      this.logger.log(
        `Terminated workflow ${workflowId}${reason ? `: ${reason}` : ''}`,
      );

      // Record termination as cancellation
      this.metricsService?.recordWorkflowCanceled({
        workflowType: 'unknown',
        taskQueue: queue,
      });

      this.observabilityService?.recordWorkflowCanceled(
        {
          workflowId,
          runId: undefined,
          workflowType: 'unknown',
          taskQueue: queue,
          namespace: this.options.namespace,
        },
        reason || 'Terminated',
      );

      // Clean up start time tracking
      this.workflowStartTimes.delete(workflowId);
    } catch (error) {
      this.logger.error(`Failed to terminate workflow ${workflowId}`, error);
      throw new NotFoundException(
        `Workflow ${workflowId} not found or already completed`,
      );
    }
  }

  /**
   * Describe a workflow execution
   *
   * @param workflowId - The workflow ID
   * @param runId - Optional run ID
   * @param taskQueue - Task queue (defaults to module default)
   * @returns Workflow execution description
   */
  async describeWorkflow(
    workflowId: string,
    runId?: string,
    taskQueue?: string,
  ): Promise<unknown> {
    const handle = await this.getWorkflowHandle(workflowId, runId, taskQueue);

    try {
      return await (handle as { describe: () => Promise<unknown> }).describe();
    } catch (error) {
      this.logger.error(`Failed to describe workflow ${workflowId}`, error);
      throw new NotFoundException(`Workflow ${workflowId} not found`);
    }
  }

  /**
   * Check Temporal connection health
   *
   * @returns Health check result
   */
  async checkHealth(): Promise<TemporalHealthResult> {
    const startTime = Date.now();

    try {
      const client = (await this.getClient()) as {
        connection?: {
          service?: {
            getWorkflowExecutionHistory?: (
              ...args: unknown[]
            ) => Promise<unknown>;
          };
        };
      };

      // Try to verify connection by checking if client exists
      // A more thorough check would require making an actual API call
      if (client) {
        return {
          healthy: true,
          latency: Date.now() - startTime,
          namespace: this.options.namespace,
        };
      }

      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: 'Client not initialized',
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate a unique workflow ID
   *
   * @param workflowType - Type/name of the workflow
   * @returns Unique workflow ID
   */
  private generateWorkflowId(workflowType: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${workflowType}-${timestamp}-${random}`;
  }

  /**
   * Load certificate from file
   *
   * @param path - Path to certificate file
   * @returns Certificate content
   */
  private async loadCertificate(path?: string): Promise<string | undefined> {
    if (!path) {
      return undefined;
    }

    try {
      const fs = await import('node:fs/promises');
      return await fs.readFile(path, 'utf-8');
    } catch (error) {
      this.logger.error(`Failed to load certificate from ${path}`, error);
      throw new BadRequestException(`Failed to load certificate from ${path}`);
    }
  }

  /**
   * Create a Temporal schedule
   *
   * Creates a new schedule for recurring workflow execution using cron expressions.
   *
   * @param options - Schedule creation options
   * @returns The created schedule ID
   */
  async createSchedule(options: ScheduleOptions): Promise<string> {
    const client = (await this.getClient()) as {
      schedule: {
        create: (
          opts: Record<string, unknown>,
        ) => Promise<{ scheduleId: string }>;
      };
    };

    const { scheduleId, action, spec, policies } = options;

    // Get cron expression from spec (support both direct cron and calendar specs)
    const cronExpression =
      spec.cronExpressions?.[0]?.expression || (spec as any).cronExpression;

    if (!cronExpression && !spec.calendars && !spec.interval) {
      throw new InvalidScheduleSpecError(
        'Schedule spec must include cronExpressions, calendars, or interval',
        { scheduleId },
      );
    }

    // Validate and parse cron expression if provided
    let calendarSpec: Record<string, unknown> | undefined;
    if (cronExpression) {
      try {
        this.validateCronExpression(cronExpression);
        calendarSpec = this.parseCronToCalendarSpec(cronExpression);
      } catch (error) {
        if (error instanceof InvalidCronExpressionError) {
          throw error;
        }
        throw new InvalidCronExpressionError(
          cronExpression,
          error instanceof Error ? error.message : 'Unknown validation error',
        );
      }
    }

    // Map overlap policy string to SDK enum
    const overlapPolicyMap: Record<ScheduleOverlapPolicy, string> = {
      SKIP: 'SKIP',
      ALLOW_ALL: 'ALLOW_ALL',
      BUFFER_ONE: 'BUFFER_ONE',
    };

    const overlapPolicy = policies?.overlap
      ? overlapPolicyMap[policies.overlap]
      : 'SKIP';

    try {
      const result = await client.schedule.create({
        scheduleId,
        action: {
          type: action.type,
          workflowType: action.workflowType,
          args: action.args || [],
          taskQueue: action.taskQueue || this.options.taskQueue,
          // Generate a unique workflow ID for each scheduled execution
          workflowId: `${action.workflowId}-${Date.now()}`,
          memo: action.memo,
          searchAttributes: action.searchAttributes,
        },
        spec: calendarSpec
          ? {
              calendars: [calendarSpec],
            }
          : spec.calendars
            ? {
                calendars: spec.calendars,
              }
            : spec.interval
              ? {
                  interval: spec.interval,
                }
              : undefined,
        policies: {
          overlap: overlapPolicy,
          catchupWindow: policies?.catchupWindow || '1 day',
          pauseOnFailure: policies?.pauseOnFailure,
        },
        memo: options.memo,
        searchAttributes: options.searchAttributes,
        initialPaused: options.paused,
      });

      this.logger.log(`Schedule ${scheduleId} created successfully`);

      // Record schedule creation in metrics
      this.metricsService?.recordWorkflowStarted({
        workflowType: action.workflowType,
        taskQueue: action.taskQueue || this.options.taskQueue,
        namespace: this.options.namespace,
      });

      return result.scheduleId;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to create schedule ${scheduleId}: ${errorMessage}`,
        error,
      );

      // Record failed schedule creation
      this.metricsService?.recordWorkflowFailed({
        workflowType: action.workflowType,
        taskQueue: action.taskQueue || this.options.taskQueue,
        durationMs: 0,
        failureReason: errorMessage,
      });

      // Map to specific error type
      if (errorMessage.includes('already exists')) {
        throw new ScheduleAlreadyExistsError(scheduleId);
      }

      if (
        errorMessage.includes('not found') &&
        errorMessage.includes('workflow')
      ) {
        throw new WorkflowNotFoundError(
          action.workflowType,
          action.taskQueue || this.options.taskQueue,
        );
      }

      if (errorMessage.includes('cron') || errorMessage.includes('calendar')) {
        throw new InvalidCronExpressionError(
          cronExpression || 'unknown',
          errorMessage,
        );
      }

      throw new ScheduleOperationError('create', scheduleId, errorMessage);
    }
  }

  /**
   * Validate cron expression format
   *
   * Validates standard 5-field cron expression: minute hour day month weekday
   *
   * @param cronExpression - Cron expression to validate
   * @throws InvalidCronExpressionError if invalid
   */
  private validateCronExpression(cronExpression: string): void {
    const parts = cronExpression.trim().split(/\s+/);

    if (parts.length !== 5) {
      throw new InvalidCronExpressionError(
        cronExpression,
        `Expected 5 fields (minute hour day month weekday), got ${parts.length}`,
      );
    }

    // Basic validation - each field should contain valid cron characters
    const validChars = /^[\d*,\-/?LW]+$/;
    const [minute, hour, day, month, weekday] = parts;

    for (const [field, value] of [
      ['minute', minute],
      ['hour', hour],
      ['day', day],
      ['month', month],
      ['weekday', weekday],
    ]) {
      if (!value || !validChars.test(value)) {
        throw new InvalidCronExpressionError(
          cronExpression,
          `${field} field contains invalid characters: "${value}"`,
        );
      }
    }

    // Validate ranges
    this.validateCronField('minute', minute, 0, 59, cronExpression);
    this.validateCronField('hour', hour, 0, 23, cronExpression);
    this.validateCronField('day', day, 1, 31, cronExpression);
    this.validateCronField('month', month, 1, 12, cronExpression);
    this.validateCronField('weekday', weekday, 0, 7, cronExpression);
  }

  /**
   * Validate a single cron field value range
   *
   * @param fieldName - Name of the field being validated
   * @param value - Field value to validate
   * @param min - Minimum valid value
   * @param max - Maximum valid value
   * @param cronExpression - The full cron expression for error reporting
   * @throws InvalidCronExpressionError if any value is out of range
   */
  private validateCronField(
    fieldName: string,
    value: string,
    min: number,
    max: number,
    cronExpression: string,
  ): void {
    // Skip validation for wildcards, ranges, and lists
    if (
      value === '*' ||
      value.includes(',') ||
      value.includes('-') ||
      value.includes('/')
    ) {
      return;
    }

    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && (numValue < min || numValue > max)) {
      throw new InvalidCronExpressionError(
        cronExpression,
        `${fieldName} value ${numValue} is out of range [${min}, ${max}]`,
      );
    }
  }

  /**
   * Parse cron expression to Temporal calendar spec
   *
   * Converts a standard 5-field cron expression (minute hour day month weekday)
   * to Temporal's calendar spec format.
   *
   * @param cronExpression - Standard cron expression
   * @returns Temporal calendar spec
   */
  private parseCronToCalendarSpec(
    cronExpression: string,
  ): Record<string, unknown> {
    const parts = cronExpression.trim().split(/\s+/);
    const [minute, hour, day, month, weekday] = parts;

    const spec: Record<string, unknown> = {
      comment: `Cron: ${cronExpression}`,
    };

    // Parse minute field
    if (minute !== '*') {
      spec.minute = this.parseCronField(minute);
    }

    // Parse hour field
    if (hour !== '*') {
      spec.hour = this.parseCronField(hour);
    }

    // Parse day of month field
    if (day !== '*') {
      spec.dayOfMonth = this.parseCronField(day);
    }

    // Parse month field
    if (month !== '*') {
      spec.month = this.parseCronField(month);
    }

    // Parse day of week field
    // Note: cron uses 0=Sunday, but Temporal expects 7=Sunday (1=Monday, ..., 7=Sunday)
    if (weekday !== '*') {
      spec.dayOfWeek = this.parseCronField(weekday, true);
    }

    return spec;
  }

  /**
   * Parse a single cron field to Temporal format
   *
   * Handles:
   * - Single value: "5" -> 5
   * - Wildcard: "*" -> undefined (not set)
   * - Range: "1-5" -> [1, 2, 3, 4, 5]
   * - List: "1,3,5" -> [1, 3, 5]
   * - Step: "* /5" or "1-10/2" -> generates appropriate values
   *
   * @param field - Cron field value
   * @param isDayOfWeek - Whether this is a dayOfWeek field (special handling)
   * @returns Parsed value (number, array, string, or undefined for wildcard)
   */
  private parseCronField(
    field: string,
    isDayOfWeek = false,
  ): number | number[] | string | string[] | Array<number | string> {
    // Handle step notation (e.g., */5, 1-10/2)
    if (field.includes('/')) {
      const [base, step] = field.split('/');
      const stepNum = parseInt(step, 10);

      if (base === '*') {
        // Return step notation as string for Temporal
        return `*/${step}`;
      }

      // Handle range with step (e.g., 1-10/2)
      if (base.includes('-')) {
        const [start, end] = base.split('-').map(Number);
        const values: (number | string)[] = [];
        for (let i = start; i <= end; i += stepNum) {
          values.push(this.convertDayOfWeekForTemporal(i, isDayOfWeek));
        }
        return values;
      }

      return `*/${step}`;
    }

    // Handle range (e.g., 1-5)
    if (field.includes('-')) {
      const [start, end] = field.split('-').map(Number);
      const values: (number | string)[] = [];
      for (let i = start; i <= end; i++) {
        values.push(this.convertDayOfWeekForTemporal(i, isDayOfWeek));
      }
      return values;
    }

    // Handle list (e.g., 1,3,5)
    if (field.includes(',')) {
      return field.split(',').map((v) =>
        this.convertDayOfWeekForTemporal(parseInt(v, 10), isDayOfWeek),
      );
    }

    // Handle single value
    const num = parseInt(field, 10);
    if (isNaN(num)) {
      return field;
    }
    return this.convertDayOfWeekForTemporal(num, isDayOfWeek);
  }

  /**
   * Day of week name mapping for Temporal CalendarSpec
   * Maps cron values (0=Sun, 1=Mon, ..., 6=Sat) to Temporal day names
   */
  private readonly DAY_NAMES = [
    'SUNDAY', // 0
    'MONDAY', // 1
    'TUESDAY', // 2
    'WEDNESDAY', // 3
    'THURSDAY', // 4
    'FRIDAY', // 5
    'SATURDAY', // 6
  ] as const;

  /**
   * Convert cron dayOfWeek value to Temporal CalendarSpec format
   *
   * Standard cron: 0=Sunday, 1=Monday, ..., 6=Saturday
   * Temporal: Expects day name strings like "SUNDAY", "MONDAY", etc.
   *
   * @param value - Day of week number from cron
   * @param isDayOfWeek - Whether this is a dayOfWeek field
   * @returns Converted value for Temporal (number for other fields, string for dayOfWeek)
   */
  private convertDayOfWeekForTemporal(value: number, isDayOfWeek: boolean): number | string {
    if (!isDayOfWeek) {
      return value;
    }
    // Convert cron weekday (0=Sun, 1=Mon, ..., 6=Sat) to Temporal day names
    // Temporal CalendarSpec expects: "SUNDAY", "MONDAY", "TUESDAY", etc.
    if (value >= 0 && value <= 6) {
      return this.DAY_NAMES[value];
    }
    // Also handle 7 which some cron systems use for Sunday
    if (value === 7) {
      return 'SUNDAY';
    }
    return value; // Fallback for unexpected values
  }

  /**
   * Describe a schedule
   *
   * Retrieves detailed information about a Temporal schedule including
   * current state, next run times, action details, and recent execution history.
   *
   * @param scheduleId - The schedule ID to describe
   * @returns Schedule description with details or exists: false if not found
   */
  async describeSchedule(scheduleId: string): Promise<ScheduleDescription> {
    try {
      const client = (await this.getClient()) as {
        schedule?: {
          getHandle: (id: string) => {
            describe: () => Promise<ScheduleDescriptionRaw>;
          };
        };
      };

      if (!client.schedule) {
        this.logger.warn(
          'Schedule functionality not available in Temporal client',
        );
        return { scheduleId, exists: false };
      }

      const scheduleHandle = client.schedule.getHandle(scheduleId);
      const rawDescription = await scheduleHandle.describe();

      // Transform Temporal SDK's raw description to our typed interface
      return this.transformScheduleDescription(scheduleId, rawDescription);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Handle non-existent schedules gracefully
      if (
        errorMessage.includes('not found') ||
        errorMessage.includes('does not exist') ||
        errorMessage.includes('resource not found')
      ) {
        this.logger.debug(`Schedule ${scheduleId} does not exist`);
        return { scheduleId, exists: false };
      }

      this.logger.error(
        `Failed to describe schedule ${scheduleId}: ${errorMessage}`,
        error,
      );

      // Throw specific error for other failures
      throw new ScheduleOperationError('describe', scheduleId, errorMessage);
    }
  }

  /**
   * List all schedules
   *
   * Returns a paginated list of schedule IDs.
   *
   * @param options - List options with pagination
   * @returns List of schedule IDs with pagination token
   */
  async listSchedules(
    options?: ScheduleListOptions,
  ): Promise<ScheduleListResult> {
    try {
      const client = (await this.getClient()) as {
        schedule?: {
          list: () => {
            [Symbol.asyncIterator]: () => AsyncIterator<{ id: string }, void>;
          };
        };
      };

      if (!client.schedule) {
        this.logger.warn(
          'Schedule functionality not available in Temporal client',
        );
        return { scheduleIds: [] };
      }

      const scheduleIds: string[] = [];
      const iterator = client.schedule.list()[Symbol.asyncIterator]();

      // Collect schedule IDs up to the page size limit
      const pageSize = options?.pageSize ?? 100;
      let count = 0;

      while (count < pageSize) {
        const { value, done } = await iterator.next();
        if (done) break;

        if (value?.id) {
          scheduleIds.push(value.id);
          count++;
        }
      }

      this.logger.log(`Listed ${scheduleIds.length} schedules`);

      return {
        scheduleIds,
        nextPageToken: undefined, // Temporal SDK iterator doesn't expose pagination tokens
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Failed to list schedules: ${errorMessage}`, error);

      throw new ScheduleOperationError('list', 'all', errorMessage);
    }
  }

  /**
   * Transform raw Temporal schedule description to our typed interface
   *
   * @param scheduleId - The schedule ID
   * @param raw - Raw schedule description from Temporal SDK
   * @returns Transformed schedule description
   */
  private transformScheduleDescription(
    scheduleId: string,
    raw: ScheduleDescriptionRaw,
  ): ScheduleDescription {
    const result: ScheduleDescription = {
      scheduleId,
      exists: true,
      paused: raw.state?.paused ?? false,
      nextRunTimes: raw.futureActionTimes?.map((t) => new Date(t)),
      missedActions: raw.info?.missedActions,
      totalActions: raw.info?.totalActions,
      successfulActions: raw.info?.successfulActions,
      failedActions: raw.info?.failedActions,
    };

    // Extract action details
    if (raw.action?.startWorkflow) {
      const action = raw.action.startWorkflow;
      result.action = {
        workflowType: action.workflowType || action.workflow || '',
        workflowId: action.workflowId || '',
        taskQueue: action.taskQueue || '',
        args: action.args || [],
      };
    }

    // Extract spec details
    if (raw.spec?.cronExpressions?.length) {
      result.spec = {
        cronExpression: raw.spec.cronExpressions[0].expression,
        startTime: raw.spec.startTime,
        endTime: raw.spec.endTime,
        timezone: raw.spec.timezone,
      };
    } else if (raw.spec?.interval) {
      // Handle interval-based schedules
      result.spec = {
        cronExpression: `interval:${raw.spec.interval.seconds}s`,
        startTime: raw.spec.startTime,
        endTime: raw.spec.endTime,
        timezone: raw.spec.timezone,
      };
    }

    // Extract policy details
    if (raw.policies) {
      result.policies = {
        overlap: raw.policies.overlap,
        catchupWindow: raw.policies.catchupWindow,
      };
    }

    // Extract recent action executions
    if (raw.recentActions?.length) {
      result.recentActions = raw.recentActions.map((action) => ({
        workflowId: action.workflowId || '',
        runId: action.runId || '',
        startedAt: action.startedAt ? new Date(action.startedAt) : undefined,
        status: action.status,
      }));
    }

    // Set convenience fields
    const lastAction = raw.recentActions?.[0];
    if (lastAction?.startedAt) {
      result.lastRunAt = new Date(lastAction.startedAt);
    }
    const nextRun = raw.futureActionTimes?.[0];
    if (nextRun) {
      result.nextRunAt = new Date(nextRun);
    }

    return result;
  }

  /**
   * Pause a schedule
   *
   * Pauses a schedule so it won't trigger new workflow executions.
   * Validates the schedule exists before pausing and logs the action to audit logs.
   *
   * @param scheduleId - The schedule ID to pause
   * @param userId - Optional user ID for audit logging
   * @param ipAddress - Optional IP address for audit logging
   * @param userAgent - Optional user agent for audit logging
   */
  async pauseSchedule(
    scheduleId: string,
    userId?: string | null,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<void> {
    // Validate schedule exists before pausing
    const description = await this.describeSchedule(scheduleId);
    if (!description.exists) {
      this.logger.warn(`Schedule ${scheduleId} does not exist`);
      throw new ScheduleNotFoundError(scheduleId);
    }

    // Check if already paused
    if (description.paused) {
      this.logger.debug(`Schedule ${scheduleId} is already paused`);
      throw new ScheduleAlreadyPausedError(scheduleId);
    }

    try {
      const client = (await this.getClient()) as {
        schedule?: {
          getHandle: (id: string) => {
            pause: () => Promise<void>;
          };
        };
      };

      if (!client.schedule) {
        throw new TemporalServiceUnavailableError(
          'Schedule functionality not available',
        );
      }

      const scheduleHandle = client.schedule.getHandle(scheduleId);
      await scheduleHandle.pause();

      this.logger.log(`Schedule ${scheduleId} paused successfully`);

      // Log to audit
      await this.auditLogService?.logAction(
        AuditActionType.PAUSE,
        AuditResourceType.SCHEDULE,
        {
          resourceId: scheduleId,
          userId: userId ?? undefined,
          ipAddress: ipAddress ?? undefined,
          userAgent: userAgent ?? undefined,
          statusCode: 200,
          changeDetails: {
            before: { paused: false },
            after: { paused: true },
            context: { scheduleId },
          },
        },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to pause schedule ${scheduleId}: ${errorMessage}`,
        error,
      );

      // Log failed attempt to audit
      await this.auditLogService?.logAction(
        AuditActionType.PAUSE,
        AuditResourceType.SCHEDULE,
        {
          resourceId: scheduleId,
          userId: userId ?? undefined,
          ipAddress: ipAddress ?? undefined,
          userAgent: userAgent ?? undefined,
          statusCode: 400,
          errorMessage,
        },
      );

      // Re-throw our custom errors
      if (
        error instanceof ScheduleNotFoundError ||
        error instanceof ScheduleAlreadyPausedError ||
        error instanceof TemporalServiceUnavailableError
      ) {
        throw error;
      }

      throw new ScheduleOperationError('pause', scheduleId, errorMessage);
    }
  }

  /**
   * Resume a schedule
   *
   * Resumes a paused schedule.
   * Validates the schedule exists before resuming and logs the action to audit logs.
   *
   * @param scheduleId - The schedule ID to resume
   * @param userId - Optional user ID for audit logging
   * @param ipAddress - Optional IP address for audit logging
   * @param userAgent - Optional user agent for audit logging
   */
  async resumeSchedule(
    scheduleId: string,
    userId?: string | null,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<void> {
    // Validate schedule exists before resuming
    const description = await this.describeSchedule(scheduleId);
    if (!description.exists) {
      this.logger.warn(`Schedule ${scheduleId} does not exist`);
      throw new ScheduleNotFoundError(scheduleId);
    }

    // Check if already running
    if (!description.paused) {
      this.logger.debug(`Schedule ${scheduleId} is not paused`);
      throw new ScheduleNotPausedError(scheduleId);
    }

    try {
      const client = (await this.getClient()) as {
        schedule?: {
          getHandle: (id: string) => {
            unpause: () => Promise<void>;
          };
        };
      };

      if (!client.schedule) {
        throw new TemporalServiceUnavailableError(
          'Schedule functionality not available',
        );
      }

      const scheduleHandle = client.schedule.getHandle(scheduleId);
      await scheduleHandle.unpause();

      this.logger.log(`Schedule ${scheduleId} resumed successfully`);

      // Log to audit
      await this.auditLogService?.logAction(
        AuditActionType.RESUME,
        AuditResourceType.SCHEDULE,
        {
          resourceId: scheduleId,
          userId: userId ?? undefined,
          ipAddress: ipAddress ?? undefined,
          userAgent: userAgent ?? undefined,
          statusCode: 200,
          changeDetails: {
            before: { paused: true },
            after: { paused: false },
            context: { scheduleId },
          },
        },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to resume schedule ${scheduleId}: ${errorMessage}`,
        error,
      );

      // Log failed attempt to audit
      await this.auditLogService?.logAction(
        AuditActionType.RESUME,
        AuditResourceType.SCHEDULE,
        {
          resourceId: scheduleId,
          userId: userId ?? undefined,
          ipAddress: ipAddress ?? undefined,
          userAgent: userAgent ?? undefined,
          statusCode: 400,
          errorMessage,
        },
      );

      // Re-throw our custom errors
      if (
        error instanceof ScheduleNotFoundError ||
        error instanceof ScheduleNotPausedError ||
        error instanceof TemporalServiceUnavailableError
      ) {
        throw error;
      }

      throw new ScheduleOperationError('resume', scheduleId, errorMessage);
    }
  }

  /**
   * Delete a schedule
   *
   * Permanently deletes a schedule from Temporal.
   *
   * @param scheduleId - The schedule ID to delete
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    try {
      const client = (await this.getClient()) as {
        schedule?: {
          getHandle: (id: string) => {
            delete: () => Promise<void>;
          };
        };
      };

      if (!client.schedule) {
        throw new TemporalServiceUnavailableError(
          'Schedule functionality not available',
        );
      }

      const scheduleHandle = client.schedule.getHandle(scheduleId);
      await scheduleHandle.delete();

      this.logger.log(`Schedule ${scheduleId} deleted successfully`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to delete schedule ${scheduleId}: ${errorMessage}`,
        error,
      );

      // Re-throw our custom errors
      if (error instanceof TemporalServiceUnavailableError) {
        throw error;
      }

      // Check for not found error
      if (
        errorMessage.includes('not found') ||
        errorMessage.includes('does not exist')
      ) {
        throw new ScheduleNotFoundError(scheduleId);
      }

      throw new ScheduleOperationError('delete', scheduleId, errorMessage);
    }
  }

  /**
   * Update a schedule
   *
   * Updates an existing schedule with new configuration.
   *
   * @param scheduleId - The schedule ID to update
   * @param options - Update options
   */
  async updateSchedule(
    scheduleId: string,
    options: ScheduleUpdateOptions,
  ): Promise<void> {
    try {
      const client = (await this.getClient()) as {
        schedule?: {
          getHandle: (id: string) => {
            update: (opts: Record<string, unknown>) => Promise<void>;
          };
        };
      };

      if (!client.schedule) {
        throw new TemporalServiceUnavailableError(
          'Schedule functionality not available',
        );
      }

      const scheduleHandle = client.schedule.getHandle(scheduleId);

      const updateData: Record<string, unknown> = {};

      if (options.action) {
        updateData.action = {
          type: options.action.type,
          workflowType: options.action.workflowType,
          args: options.action.args || [],
          taskQueue: options.action.taskQueue || this.options.taskQueue,
          workflowId: options.action.workflowId,
          memo: options.action.memo,
          searchAttributes: options.action.searchAttributes,
        };
      }

      if (options.spec) {
        if (options.spec.calendars) {
          updateData.spec = { calendars: options.spec.calendars };
        } else if (options.spec.interval) {
          updateData.spec = { interval: options.spec.interval };
        } else if (options.spec.cronExpressions?.length) {
          const cronExpr = options.spec.cronExpressions[0].expression;
          const calendarSpec = this.parseCronToCalendarSpec(cronExpr);
          updateData.spec = { calendars: [calendarSpec] };
        }
      }

      if (options.policies) {
        updateData.policies = options.policies;
      }

      await scheduleHandle.update(updateData);

      this.logger.log(`Schedule ${scheduleId} updated successfully`);

      // Handle paused state change
      if (options.paused === true) {
        await this.pauseSchedule(scheduleId);
      } else if (options.paused === false) {
        await this.resumeSchedule(scheduleId);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to update schedule ${scheduleId}: ${errorMessage}`,
        error,
      );

      // Re-throw our custom errors
      if (
        error instanceof TemporalServiceUnavailableError ||
        error instanceof ScheduleNotFoundError ||
        error instanceof ScheduleAlreadyPausedError ||
        error instanceof ScheduleNotPausedError
      ) {
        throw error;
      }

      throw new ScheduleOperationError('update', scheduleId, errorMessage);
    }
  }

  /**
   * Trigger a schedule immediately
   *
   * Immediately triggers a workflow execution from a schedule.
   *
   * @param scheduleId - The schedule ID to trigger
   * @param options - Optional trigger options
   * @returns The workflow execution result
   */
  async triggerSchedule(
    scheduleId: string,
    options?: ScheduleTriggerOptions,
  ): Promise<{ workflowId: string; runId: string }> {
    try {
      const client = (await this.getClient()) as {
        schedule?: {
          getHandle: (id: string) => {
            trigger: (opts?: Record<string, unknown>) => Promise<{
              workflowId: string;
              firstExecutionRunId: string;
            }>;
          };
        };
      };

      if (!client.schedule) {
        throw new TemporalServiceUnavailableError(
          'Schedule functionality not available',
        );
      }

      const scheduleHandle = client.schedule.getHandle(scheduleId);

      const triggerOptions: Record<string, unknown> = {};
      if (options?.overlap) {
        triggerOptions.overlap = options.overlap;
      }

      const result = await scheduleHandle.trigger(triggerOptions);

      this.logger.log(
        `Schedule ${scheduleId} triggered successfully: workflow ${result.workflowId}`,
      );

      return {
        workflowId: result.workflowId,
        runId: result.firstExecutionRunId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to trigger schedule ${scheduleId}: ${errorMessage}`,
        error,
      );

      // Re-throw our custom errors
      if (error instanceof TemporalServiceUnavailableError) {
        throw error;
      }

      // Check for not found error
      if (
        errorMessage.includes('not found') ||
        errorMessage.includes('does not exist')
      ) {
        throw new ScheduleNotFoundError(scheduleId);
      }

      throw new ScheduleOperationError('trigger', scheduleId, errorMessage);
    }
  }

  /**
   * Backfill a schedule
   *
   * Backfills missed schedule executions within a time range.
   *
   * @param scheduleId - The schedule ID to backfill
   * @param options - Backfill options
   */
  async backfillSchedule(
    scheduleId: string,
    options: ScheduleBackfillOptions,
  ): Promise<void> {
    try {
      const client = (await this.getClient()) as {
        schedule?: {
          getHandle: (id: string) => {
            backfill: (opts: ScheduleBackfillOptions) => Promise<void>;
          };
        };
      };

      if (!client.schedule) {
        throw new TemporalServiceUnavailableError(
          'Schedule functionality not available',
        );
      }

      const scheduleHandle = client.schedule.getHandle(scheduleId);
      await scheduleHandle.backfill(options);

      this.logger.log(
        `Schedule ${scheduleId} backfill initiated from ${options.startAt} to ${options.endAt}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to backfill schedule ${scheduleId}: ${errorMessage}`,
        error,
      );

      // Re-throw our custom errors
      if (error instanceof TemporalServiceUnavailableError) {
        throw error;
      }

      // Check for not found error
      if (
        errorMessage.includes('not found') ||
        errorMessage.includes('does not exist')
      ) {
        throw new ScheduleNotFoundError(scheduleId);
      }

      throw new ScheduleOperationError('backfill', scheduleId, errorMessage);
    }
  }

  /**
   * Extract error code from error object
   *
   * @param error - Error object
   * @returns Error code or undefined
   */
  private extractErrorCode(error: unknown): string | undefined {
    if (error instanceof TemporalError) {
      return error.code;
    }
    if (error instanceof Error && 'code' in error) {
      return String((error as Record<string, unknown>).code);
    }
    return undefined;
  }
}
