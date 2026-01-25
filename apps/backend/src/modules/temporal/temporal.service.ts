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
} from './temporal.interfaces';
import { TemporalMetricsService } from './temporal-metrics.service';
import { TemporalObservabilityService } from './temporal-observability.service';
import type { WorkflowContext } from './temporal-observability.service';

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
        metadata: options.metadata as Record<string, unknown> | undefined,
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
   * Create a schedule (stub implementation - not yet implemented)
   *
   * TODO: Implement Temporal schedule creation
   */
  async createSchedule(_options: {
    scheduleId: string;
    action: {
      workflowType: string;
      workflowId: string;
      taskQueue: string;
      args: unknown[];
    };
    spec: {
      cronExpression: string;
    };
    policies?: {
      overlap?: 'SKIP' | 'ALLOW_ALL' | 'BUFFER_ONE';
    };
  }): Promise<string> {
    this.logger.warn('Temporal schedule creation not yet implemented');
    return 'stub-schedule-id';
  }

  /**
   * Describe a schedule (stub implementation - not yet implemented)
   *
   * TODO: Implement Temporal schedule description
   */
  async describeSchedule(_scheduleId: string): Promise<unknown> {
    this.logger.warn('Temporal schedule description not yet implemented');
    return { scheduleId: _scheduleId, exists: false };
  }

  /**
   * Pause a schedule (stub implementation - not yet implemented)
   *
   * TODO: Implement Temporal schedule pause
   */
  async pauseSchedule(_scheduleId: string): Promise<void> {
    this.logger.warn('Temporal schedule pause not yet implemented');
  }

  /**
   * Resume a schedule (stub implementation - not yet implemented)
   *
   * TODO: Implement Temporal schedule resume
   */
  async resumeSchedule(_scheduleId: string): Promise<void> {
    this.logger.warn('Temporal schedule resume not yet implemented');
  }

  /**
   * Delete a schedule (stub implementation - not yet implemented)
   *
   * TODO: Implement Temporal schedule deletion
   */
  async deleteSchedule(_scheduleId: string): Promise<void> {
    this.logger.warn('Temporal schedule deletion not yet implemented');
  }
}
