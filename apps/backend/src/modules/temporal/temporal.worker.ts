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
  /** Worker ID for tracking */
  workerId: string;
  /** When the worker was started */
  startedAt: Date;
  /** Workflows path */
  workflowsPath: string;
  /** Activities path */
  activitiesPath?: string;
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
  private stuckActivityCheckInterval?: NodeJS.Timeout;
  private heartbeatInterval?: NodeJS.Timeout;
  private workerInitialized = false;

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
   * Logs comprehensive connection and configuration information.
   * Starts periodic heartbeat logging to verify worker health.
   * In development mode, automatically starts workers for convenience.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('=== Temporal Worker Service Initialization ===');
    this.logger.log(`Temporal Cluster URL: ${this.options.clusterUrl}`);
    this.logger.log(`Temporal Namespace: ${this.options.namespace}`);
    this.logger.log(`Default Task Queue: ${this.options.taskQueue}`);
    this.logger.log(`TLS Enabled: ${this.options.tlsEnabled}`);
    this.logger.log(`Client Timeout: ${this.options.clientTimeout}ms`);

    // Start stuck activity detection check (every 5 minutes)
    this.startStuckActivityDetection();

    // Start heartbeat logging (every 60 seconds)
    this.startHeartbeat();

    // Attempt to initialize Worker SDK to verify it's available
    try {
      await this.initializeWorkerModule();
      this.workerInitialized = true;
      this.logger.log('✓ Temporal Worker SDK loaded successfully');
    } catch (error) {
      this.logger.error('✗ Failed to load Temporal Worker SDK', error);
      this.logger.error(
        'This will prevent workers from starting. Check @temporalio/worker is installed.',
      );
      throw error;
    }

    // Auto-start workers in development mode
    const isDevelopment =
      process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    const autoStartWorkers =
      process.env.TEMPORAL_AUTO_START_WORKERS !== 'false';

    if (isDevelopment && autoStartWorkers) {
      this.logger.log(
        'Development mode detected: Auto-starting Temporal workers...',
      );
      await this.autoStartDevWorkers();
    } else {
      this.logger.log('Worker is ready. Call startWorker() to begin polling.');
    }

    this.logger.log('=== Temporal Worker Service Initialization Complete ===');
  }

  /**
   * Auto-start workers in development mode
   *
   * Automatically starts workers for all configured task queues in development.
   * Uses compiled JavaScript paths for workflows and activities.
   */
  private async autoStartDevWorkers(): Promise<void> {
    const path = await import('node:path');

    // Determine the base path for compiled workflows/activities
    // NestJS builds to dist/src/, not dist/ directly
    const basePath = path.join(process.cwd(), 'dist/src/modules/temporal');

    const workflowsPath = path.join(basePath, 'workflows');
    const activitiesPath = path.join(basePath, 'activities');

    this.logger.log(`Auto-start configuration:`);
    this.logger.log(`  Workflows path: ${workflowsPath}`);
    this.logger.log(`  Activities path: ${activitiesPath}`);
    this.logger.log(`  Task queue: ${this.options.taskQueue}`);

    // Check if compiled files exist
    const fs = await import('node:fs/promises');
    try {
      await fs.access(workflowsPath);
    } catch {
      this.logger.warn(`Workflows directory not found at ${workflowsPath}`);
      this.logger.warn(
        `Workers will not auto-start. Please run: npm run build`,
      );
      this.logger.warn(`Or run the standalone worker: npm run temporal:worker`);
      return;
    }

    // Start the worker with a small delay to ensure Temporal server is ready
    // In dev mode with docker compose, there might be a race condition
    const waitForServer = process.env.TEMPORAL_WAIT_FOR_SERVER !== 'false';
    if (waitForServer) {
      const maxRetries = 10;
      const retryDelay = 2000; // 2 seconds

      for (let i = 0; i < maxRetries; i++) {
        try {
          this.logger.log(
            `Checking Temporal server connection (attempt ${i + 1}/${maxRetries})...`,
          );
          // Try to create a test connection
          await this.createTestConnection();
          this.logger.log('✓ Temporal server is reachable');
          break;
        } catch {
          if (i < maxRetries - 1) {
            this.logger.log(
              `Temporal server not ready, retrying in ${retryDelay}ms...`,
            );
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          } else {
            this.logger.warn(
              'Could not connect to Temporal server. Workers will start anyway and will retry connection.',
            );
          }
        }
      }
    }

    try {
      await this.startWorker(
        this.options.taskQueue,
        workflowsPath,
        activitiesPath,
      );
      this.logger.log('✓ Development worker started successfully');
    } catch (error) {
      this.logger.error(
        'Failed to auto-start worker in development mode',
        error,
      );
      this.logger.error(
        'You can start workers manually with: npm run temporal:worker',
      );
    }
  }

  /**
   * Create a test connection to verify Temporal server is reachable
   */
  private async createTestConnection(): Promise<void> {
    const clientModule = await import('@temporalio/client');
    const { Connection } = clientModule;

    const connection = await Connection.connect({
      address: this.options.clusterUrl,
    });

    // Close the connection immediately after testing
    await connection.close();
  }

  /**
   * Stop all workers on module destruction
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('=== Temporal Worker Service Shutdown ===');

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.logger.debug('Stopped heartbeat logging');
    }

    // Stop stuck activity detection
    if (this.stuckActivityCheckInterval) {
      clearInterval(this.stuckActivityCheckInterval);
      this.logger.debug('Stopped stuck activity detection');
    }

    await this.stopAllWorkers();

    this.logger.log('=== Temporal Worker Service Shutdown Complete ===');
  }

  /**
   * Start heartbeat logging
   *
   * Logs periodic status updates to verify workers are still polling.
   */
  private startHeartbeat(): void {
    const heartbeatIntervalMs = parseInt(
      process.env.TEMPORAL_HEARTBEAT_INTERVAL || '60000',
      10,
    ); // Default 60 seconds

    this.heartbeatInterval = setInterval(() => {
      const activeWorkers = Array.from(this.workers.values()).filter(
        (w) => w.running,
      );

      if (activeWorkers.length === 0) {
        this.logger.warn(
          'Heartbeat: No active workers running. Workflows may not be processed.',
        );
      } else {
        const workerInfo = activeWorkers.map((w) => ({
          workerId: w.workerId,
          taskQueue: w.taskQueue,
          uptime: `${Math.floor((Date.now() - w.startedAt.getTime()) / 1000)}s`,
        }));

        this.logger.log(
          `Heartbeat: ${activeWorkers.length} worker(s) polling | ${JSON.stringify(
            workerInfo,
          )}`,
        );
      }
    }, heartbeatIntervalMs);

    this.logger.log(
      `Started heartbeat logging (interval: ${heartbeatIntervalMs}ms)`,
    );
  }

  /**
   * Initialize Worker module (lazy loading)
   */
  private async initializeWorkerModule(): Promise<typeof import('@temporalio/worker')> {
    try {
      // Dynamic import to handle ESM-only temporalio package
      const workerModule = await import('@temporalio/worker');
      return workerModule;
    } catch (error) {
      this.logger.error('Failed to load Temporal Worker SDK', error);
      throw error;
    }
  }

  /**
   * Log discovered workflows and activities from file paths
   *
   * Scans the provided directories for workflow and activity files
   * and logs their names for registration verification.
   *
   * @param workflowsPath - Path to workflows directory
   * @param activitiesPath - Path to activities directory
   */
  private async logDiscoveredWorkflowsAndActivities(
    workflowsPath: string,
    activitiesPath?: string,
  ): Promise<void> {
    try {
      // Import fs promises
      const path = await import('node:path');

      // Log discovered workflows
      this.logger.log(`Discovered Workflows (from: ${workflowsPath}):`);
      try {
        const workflowFiles = await this.recursiveFindFiles(workflowsPath, [
          '.workflow.ts',
          '.workflow.js',
        ]);
        if (workflowFiles.length === 0) {
          this.logger.warn('  No workflow files found');
        } else {
          for (const file of workflowFiles) {
            // Extract workflow name from file path
            const relativePath = path.relative(workflowsPath, file);
            const workflowName = path
              .basename(file, path.extname(file))
              .replace(/\.workflow$/, '');
            this.logger.log(`  - ${workflowName} (${relativePath})`);
          }
        }
      } catch (err) {
        this.logger.warn(
          `  Could not scan workflows directory: ${(err as Error).message}`,
        );
      }

      // Log discovered activities
      if (activitiesPath) {
        this.logger.log(`Discovered Activities (from: ${activitiesPath}):`);
        try {
          const activityFiles = await this.recursiveFindFiles(activitiesPath, [
            '.activities.ts',
            '.activities.js',
          ]);
          if (activityFiles.length === 0) {
            this.logger.warn('  No activity files found');
          } else {
            for (const file of activityFiles) {
              const relativePath = path.relative(activitiesPath, file);
              const activityName = path
                .basename(file, path.extname(file))
                .replace(/\.activities$/, '');
              this.logger.log(`  - ${activityName} (${relativePath})`);
            }
          }
        } catch (err) {
          this.logger.warn(
            `  Could not scan activities directory: ${(err as Error).message}`,
          );
        }
      } else {
        this.logger.log(
          'Activities: Embedded in workflows (no separate activities path)',
        );
      }
    } catch (error) {
      this.logger.warn('Could not scan for workflows/activities', error);
    }
  }

  /**
   * Recursively find files matching extensions in a directory
   *
   * @param dir - Directory to search
   * @param extensions - File extensions to match
   * @returns Array of absolute file paths
   */
  private async recursiveFindFiles(
    dir: string,
    extensions: string[],
  ): Promise<string[]> {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const results: string[] = [];

    async function scan(currentDir: string): Promise<void> {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);

          if (entry.isDirectory()) {
            // Skip node_modules and hidden directories
            if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
              await scan(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (extensions.includes(ext)) {
              results.push(fullPath);
            }
          }
        }
      } catch {
        // Directory may not exist or be readable
      }
    }

    await scan(dir);
    return results;
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
    const workerId = `worker-${taskQueue}-${Date.now()}`;

    this.logger.log(`=== Starting Temporal Worker ===`);
    this.logger.log(`Worker ID: ${workerId}`);
    this.logger.log(`Task Queue: ${taskQueue}`);
    this.logger.log(`Workflows Path: ${workflowsPath}`);
    this.logger.log(
      `Activities Path: ${activitiesPath || 'none (embedded in workflows)'}`,
    );
    this.logger.log(`Target Cluster: ${this.options.clusterUrl}`);
    this.logger.log(`Namespace: ${this.options.namespace}`);

    // Log discovered workflows and activities
    await this.logDiscoveredWorkflowsAndActivities(
      workflowsPath,
      activitiesPath,
    );

    try {
      const workerModule = await this.initializeWorkerModule();
      const { Worker, NativeConnection } = workerModule;

      // Create connection to Temporal server
      this.logger.log(`Connecting to Temporal server at ${this.options.clusterUrl}...`);
      const connection = await NativeConnection.connect({
        address: this.options.clusterUrl,
      });
      this.logger.log('✓ Connected to Temporal server');

      const maxConcurrentWorkflowTaskExecutions =
        (workerOptions?.maxConcurrentWorkflowTasks as number) ||
        TEMPORAL_WORKER_DEFAULTS.MAX_CONCURRENT_WORKFLOW_TASKS;
      const maxConcurrentActivityTaskExecutions =
        (workerOptions?.maxConcurrentActivities as number) ||
        TEMPORAL_WORKER_DEFAULTS.MAX_CONCURRENT_ACTIVITIES;
      const maxConcurrentLocalActivityExecutions =
        (workerOptions?.maxConcurrentLocalActivities as number) ||
        TEMPORAL_WORKER_DEFAULTS.MAX_CONCURRENT_LOCAL_ACTIVITIES;

      const workerOptionsFull = {
        connection,
        namespace: this.options.namespace,
        taskQueue,
        workflowsPath,
        maxConcurrentWorkflowTaskExecutions,
        maxConcurrentActivityTaskExecutions,
        maxConcurrentLocalActivityExecutions,
      };

      this.logger.debug(
        `Worker Options: ${JSON.stringify({
          maxConcurrentWorkflowTaskExecutions:
            workerOptionsFull.maxConcurrentWorkflowTaskExecutions,
          maxConcurrentActivityTaskExecutions: workerOptionsFull.maxConcurrentActivityTaskExecutions,
          maxConcurrentLocalActivityExecutions:
            workerOptionsFull.maxConcurrentLocalActivityExecutions,
        })}`,
      );

      const worker = await Worker.create(workerOptionsFull);

      this.logger.log(
        `✓ Worker instance created, connecting to Temporal server...`,
      );

      // Start the worker in the background
      // Note: worker.run() is blocking, so in production you'd want to handle this differently
      void (async () => {
        try {
          this.logger.log(
            `[${workerId}] Starting to poll task queue '${taskQueue}'...`,
          );
          await (worker as { run: () => Promise<void> }).run();
        } catch (error) {
          this.logger.error(
            `[${workerId}] Worker for task queue '${taskQueue}' failed`,
            error,
          );

          // Update worker entry to reflect failure
          const entry = this.workers.get(taskQueue);
          if (entry) {
            entry.running = false;
          }

          // Record worker failure in metrics
          this.metricsService?.recordWorkflowFailed({
            workflowType: 'worker',
            taskQueue,
            durationMs: Date.now() - startTime,
            failureReason: 'Worker process failed',
          });
        }
      })();

      const startedAt = new Date();
      this.workers.set(taskQueue, {
        worker,
        taskQueue,
        running: true,
        workerId,
        startedAt,
        workflowsPath,
        activitiesPath,
      });

      const startupDuration = Date.now() - startTime;
      this.logger.log(`✓ Worker started successfully in ${startupDuration}ms`);
      this.logger.log(
        `[${workerId}] Now polling task queue '${taskQueue}' for workflows`,
      );
      this.logger.log(`=== Temporal Worker Start Complete ===`);

      // Initialize metrics for this worker
      this.metricsService?.updateActiveWorkflows(taskQueue, 0);
      this.metricsService?.updateTaskQueueBacklog(taskQueue, 0);

      return worker;
    } catch (error) {
      const startupDuration = Date.now() - startTime;
      this.logger.error(
        `✗ Failed to start worker for task queue '${taskQueue}' after ${startupDuration}ms`,
        error,
      );
      this.logger.error(`This may indicate:`);
      this.logger.error(
        `  - Temporal server is not running at ${this.options.clusterUrl}`,
      );
      this.logger.error(
        `  - Network connectivity issues to the Temporal cluster`,
      );
      this.logger.error(`  - Incorrect cluster URL or namespace configuration`);
      this.logger.error(`  - TLS configuration mismatch`);
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
      const uptime = Date.now() - entry.startedAt.getTime();

      // Mark as not running
      entry.running = false;
      this.workers.delete(taskQueue);

      this.logger.log(
        `Stopped worker [${entry.workerId}] for task queue '${taskQueue}' (uptime: ${Math.floor(uptime / 1000)}s)`,
      );
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
    const workerCount = this.workers.size;

    if (workerCount === 0) {
      this.logger.log('No workers to stop');
      return;
    }

    this.logger.log(`Stopping ${workerCount} worker(s)...`);

    const stopPromises = Array.from(this.workers.keys()).map((taskQueue) =>
      this.stopWorker(taskQueue),
    );

    await Promise.allSettled(stopPromises);

    this.logger.log(`Stopped all ${workerCount} worker(s)`);
  }

  /**
   * Get status of all workers
   *
   * @returns Array of worker status entries
   */
  getWorkerStatus(): Array<{
    taskQueue: string;
    running: boolean;
    workerId: string;
    uptimeSeconds: number;
  }> {
    return Array.from(this.workers.values()).map((entry) => ({
      taskQueue: entry.taskQueue,
      running: entry.running,
      workerId: entry.workerId,
      uptimeSeconds: Math.floor(
        (Date.now() - entry.startedAt.getTime()) / 1000,
      ),
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
