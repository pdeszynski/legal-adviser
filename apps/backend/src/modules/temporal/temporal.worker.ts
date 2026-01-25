/**
 * Temporal Worker Service
 *
 * Manages Temporal worker pools for processing workflows and activities.
 * Workers are started as part of the application lifecycle.
 */

import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  Optional,
} from '@nestjs/common';
import {
  TEMPORAL_MODULE_OPTIONS,
  TEMPORAL_WORKER_DEFAULTS,
} from './temporal.constants';
import type {
  TemporalModuleOptions,
  WorkerPoolOptions,
} from './temporal.interfaces';
import { TemporalMetricsService } from './temporal-metrics.service';
import { TemporalObservabilityService } from './temporal-observability.service';

/**
 * Worker Pool Entry
 *
 * Represents a single worker in the pool.
 */
interface WorkerEntry {
  /** Worker instance */
  worker: unknown;
  /** Task queue this worker processes */
  taskQueue: string;
  /** Whether the worker is running */
  running: boolean;
}

/**
 * Temporal Worker Service
 *
 * Creates and manages Temporal workers for processing workflows.
 * Supports multiple task queues and configurable worker pools.
 *
 * Note: The temporalio SDK uses ESM-only exports. This service uses dynamic imports
 * to work around TypeScript/CommonJS compatibility issues.
 */
@Injectable()
export class TemporalWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TemporalWorkerService.name);
  private readonly workers: Map<string, WorkerEntry> = new Map();
  private Worker: new (...args: unknown[]) => unknown = null as unknown as new (
    ...args: unknown[]
  ) => unknown;
  private stuckActivityCheckInterval?: NodeJS.Timeout;

  constructor(
    @Inject(TEMPORAL_MODULE_OPTIONS)
    private readonly options: TemporalModuleOptions,
    @Optional()
    private readonly metricsService?: TemporalMetricsService,
    @Optional()
    private readonly observabilityService?: TemporalObservabilityService,
  ) {}

  /**
   * Start workers on module initialization
   *
   * By default, workers are not auto-started.
   * Workers should be explicitly started when needed.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Temporal Worker Service initialized');

    // Start stuck activity detection check (every 5 minutes)
    this.startStuckActivityDetection();
  }

  /**
   * Stop all workers on module destruction
   */
  async onModuleDestroy(): Promise<void> {
    // Stop stuck activity detection
    if (this.stuckActivityCheckInterval) {
      clearInterval(this.stuckActivityCheckInterval);
    }

    await this.stopAllWorkers();
  }

  /**
   * Initialize Worker class (lazy loading)
   */
  private async initializeWorker(): Promise<
    new (...args: unknown[]) => unknown
  > {
    if (this.Worker) {
      return this.Worker;
    }

    try {
      // Dynamic import to handle ESM-only temporalio package
      // @ts-expect-error - temporalio uses ESM-only exports, types not available at compile time
      const workerModule = await import('@temporalio/worker');
      this.Worker = workerModule.Worker as new (...args: unknown[]) => unknown;
      return this.Worker;
    } catch (error) {
      this.logger.error('Failed to load Temporal Worker SDK', error);
      throw error;
    }
  }

  /**
   * Start a single worker
   *
   * @param taskQueue - Task queue name
   * @param workflowsPath - Path to workflows directory
   * @param activitiesPath - Path to activities directory
   * @param workerOptions - Optional worker configuration overrides
   * @returns Started worker instance
   */
  async startWorker(
    taskQueue: string,
    workflowsPath: string,
    activitiesPath?: string,
    workerOptions?: Record<string, unknown>,
  ): Promise<unknown> {
    if (this.workers.has(taskQueue)) {
      throw new Error(`Worker for task queue '${taskQueue}' already exists`);
    }

    const startTime = Date.now();

    try {
      const Worker = await this.initializeWorker();

      const workerOptionsFull = {
        taskQueue,
        workflowsPath,
        activitiesPath,
        maxConcurrentWorkflowTasks:
          workerOptions?.maxConcurrentWorkflowTasks ||
          TEMPORAL_WORKER_DEFAULTS.MAX_CONCURRENT_WORKFLOW_TASKS,
        maxConcurrentActivities:
          workerOptions?.maxConcurrentActivities ||
          TEMPORAL_WORKER_DEFAULTS.MAX_CONCURRENT_ACTIVITIES,
        maxConcurrentLocalActivities:
          workerOptions?.maxConcurrentLocalActivities ||
          TEMPORAL_WORKER_DEFAULTS.MAX_CONCURRENT_LOCAL_ACTIVITIES,
        ...workerOptions,
      };

      const worker = new Worker(workerOptionsFull);

      // Start the worker in the background
      // Note: worker.run() is blocking, so in production you'd want to handle this differently
      void (async () => {
        try {
          await (worker as { run: () => Promise<void> }).run();
        } catch (error) {
          this.logger.error(
            `Worker for task queue '${taskQueue}' failed`,
            error,
          );

          // Record worker failure in metrics
          this.metricsService?.recordWorkflowFailed({
            workflowType: 'worker',
            taskQueue,
            durationMs: Date.now() - startTime,
            failureReason: 'Worker process failed',
          });
        }
      })();

      this.workers.set(taskQueue, {
        worker,
        taskQueue,
        running: true,
      });

      const startupDuration = Date.now() - startTime;
      this.logger.log(
        `Started worker for task queue '${taskQueue}' (workflows: ${workflowsPath}) in ${startupDuration}ms`,
      );

      // Initialize metrics for this worker
      this.metricsService?.updateActiveWorkflows(taskQueue, 0);
      this.metricsService?.updateTaskQueueBacklog(taskQueue, 0);

      return worker;
    } catch (error) {
      const startupDuration = Date.now() - startTime;
      this.logger.error(
        `Failed to start worker for task queue '${taskQueue}' after ${startupDuration}ms`,
        error,
      );
      throw error;
    }
  }

  /**
   * Start a worker pool
   *
   * @param options - Worker pool configuration
   * @returns Array of started worker instances
   */
  async startWorkerPool(options: WorkerPoolOptions): Promise<unknown[]> {
    const workerCount = options.workerCount || 1;
    const taskQueue = options.taskQueue || this.options.taskQueue;
    const workers: unknown[] = [];

    for (let i = 0; i < workerCount; i++) {
      // Each worker in the pool gets a unique task queue suffix if count > 1
      const queueName =
        workerCount > 1 ? `${taskQueue}-worker-${i}` : taskQueue;

      const worker = await this.startWorker(
        queueName,
        options.workflowsPath || './workflows',
        options.activitiesPath,
        {
          maxConcurrentWorkflowTasks: options.maxConcurrentWorkflowTasks,
          maxConcurrentActivities: options.maxConcurrentActivities,
          maxConcurrentLocalActivities: options.maxConcurrentLocalActivities,
        },
      );

      workers.push(worker);
    }

    this.logger.log(`Started worker pool with ${workerCount} workers`);

    return workers;
  }

  /**
   * Stop a specific worker
   *
   * @param taskQueue - Task queue of the worker to stop
   */
  async stopWorker(taskQueue: string): Promise<void> {
    const entry = this.workers.get(taskQueue);

    if (!entry) {
      this.logger.warn(`No worker found for task queue '${taskQueue}'`);
      return;
    }

    try {
      // Mark as not running
      entry.running = false;
      this.workers.delete(taskQueue);

      this.logger.log(`Stopped worker for task queue '${taskQueue}'`);
    } catch (error) {
      this.logger.error(
        `Failed to stop worker for task queue '${taskQueue}'`,
        error,
      );
    }
  }

  /**
   * Stop all workers
   */
  async stopAllWorkers(): Promise<void> {
    const stopPromises = Array.from(this.workers.keys()).map((taskQueue) =>
      this.stopWorker(taskQueue),
    );

    await Promise.allSettled(stopPromises);

    this.logger.log(`Stopped all workers`);
  }

  /**
   * Get status of all workers
   *
   * @returns Array of worker status entries
   */
  getWorkerStatus(): Array<{
    taskQueue: string;
    running: boolean;
  }> {
    return Array.from(this.workers.values()).map((entry) => ({
      taskQueue: entry.taskQueue,
      running: entry.running,
    }));
  }

  /**
   * Check if a worker is running for a given task queue
   *
   * @param taskQueue - Task queue to check
   * @returns True if worker is running
   */
  isWorkerRunning(taskQueue: string): boolean {
    const entry = this.workers.get(taskQueue);
    return entry?.running ?? false;
  }

  /**
   * Start stuck activity detection
   *
   * Runs periodic checks for activities that have been running too long.
   */
  private startStuckActivityDetection(): void {
    const checkIntervalMs = parseInt(
      process.env.TEMPORAL_STUCK_ACTIVITY_CHECK_INTERVAL || '300000',
      10,
    );

    this.stuckActivityCheckInterval = setInterval(() => {
      const stuckActivities =
        this.observabilityService?.checkForStuckActivities();

      if (stuckActivities && stuckActivities.length > 0) {
        this.logger.warn(`Detected ${stuckActivities.length} stuck activities`);

        // Update metrics for stuck activities
        for (const stuck of stuckActivities) {
          this.metricsService?.recordActivityFailed({
            activityType: stuck.activityType,
            workflowType: stuck.workflowType,
            taskQueue: stuck.taskQueue,
            failureReason: 'Stuck activity',
          });
        }
      }
    }, checkIntervalMs);

    this.logger.log(
      `Started stuck activity detection (interval: ${checkIntervalMs}ms)`,
    );
  }

  /**
   * Get observability health metrics
   *
   * Returns metrics about active workflows and stuck activity detection.
   */
  getObservabilityHealthMetrics(): {
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
