/**
 * Ruling Indexing Starter Service
 *
 * Service for starting the RulingIndexing Temporal workflow.
 * This replaces the Bull-based RulingIndexingProducer.
 *
 * Usage:
 * - Inject RulingIndexingStarter into your service
 * - Call startRulingIndexing() to trigger a ruling indexing job
 * - The workflow runs asynchronously in Temporal
 */

import { Injectable, Logger } from '@nestjs/common';
import { TemporalService } from '../../temporal.service';
import { TEMPORAL_TASK_QUEUES } from '../../temporal.constants';
import {
  generateWorkflowId,
  type RulingIndexingInput,
  RulingSource,
} from './ruling-indexing.workflow';
import type { CourtType } from '../../../documents/entities/legal-ruling.entity';

/**
 * Start Ruling Indexing Request
 *
 * Input parameters for starting a ruling indexing workflow.
 */
export interface StartRulingIndexingRequest {
  /** Data source to index from */
  source: RulingSource;
  /** Start date for filtering */
  dateFrom?: Date;
  /** End date for filtering */
  dateTo?: Date;
  /** Filter by court type */
  courtType?: CourtType;
  /** Batch size for processing */
  batchSize?: number;
  /** Whether to update existing rulings */
  updateExisting?: boolean;
  /** User ID for tracking */
  userId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Ruling Indexing Workflow Start Result
 *
 * Result returned after starting a ruling indexing workflow.
 */
export interface RulingIndexingWorkflowStartResult {
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
 * Daily Sync Result
 *
 * Result returned after starting daily sync jobs.
 */
export interface DailySyncResult {
  /** SAOS workflow result */
  saos: RulingIndexingWorkflowStartResult;
  /** ISAP workflow result */
  isap: RulingIndexingWorkflowStartResult;
}

/**
 * Ruling Indexing Starter Service
 *
 * Provides methods to start ruling indexing workflows in Temporal.
 * Replaces the Bull-based RulingIndexingProducer.
 *
 * Key Features:
 * - Asynchronous workflow execution (returns immediately)
 * - Support for both SAOS and ISAP sources
 * - Configurable date range and filtering
 * - Batch processing with progress tracking
 * - Retry policy with exponential backoff
 */
@Injectable()
export class RulingIndexingStarter {
  private readonly logger = new Logger(RulingIndexingStarter.name);

  constructor(private readonly temporalService: TemporalService) {}

  /**
   * Start a ruling indexing workflow
   *
   * This method starts a new Temporal workflow for ruling indexing.
   * The workflow runs asynchronously and returns immediately with a workflow ID.
   *
   * @param request - Ruling indexing request parameters
   * @returns Workflow start result with workflow ID and run ID
   */
  async startRulingIndexing(
    request: StartRulingIndexingRequest,
  ): Promise<RulingIndexingWorkflowStartResult> {
    const {
      source,
      dateFrom,
      dateTo,
      courtType,
      batchSize,
      updateExisting,
      userId,
      // Metadata is currently unused but kept for future use
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      metadata,
    } = request;

    const workflowId = generateWorkflowId(source);

    this.logger.log(
      `Starting ruling indexing workflow ${workflowId} for source ${source}`,
    );

    // Prepare workflow input
    const workflowInput: RulingIndexingInput = {
      jobId: this.generateJobId(source),
      source,
      dateFrom,
      dateTo,
      courtType,
      batchSize,
      updateExisting,
      userId,
    };

    try {
      // Start the workflow in Temporal
      const result = await this.temporalService.startWorkflow(
        'rulingIndexing',
        [workflowInput],
        {
          workflowId,
          taskQueue: TEMPORAL_TASK_QUEUES.DEFAULT,
          workflowExecutionTimeout: '4h', // 4 hours max for large batches
          workflowTaskTimeout: '30s',
          // Retry policy for the entire workflow
          retryInitialInterval: 2000, // 2 seconds
          retryMaximumInterval: 60000, // 60 seconds
          retryMaximumAttempts: 2, // Limited retries for the workflow itself
        },
      );

      this.logger.log(
        `Ruling indexing workflow ${workflowId} started (run ID: ${result.runId})`,
      );

      return {
        workflowId: result.workflowId,
        runId: result.runId,
        taskQueue: result.taskQueue,
        workflowType: result.workflowType,
      };
    } catch (error) {
      this.logger.error(
        `Failed to start ruling indexing workflow for source ${source}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Start daily sync jobs for all sources
   *
   * Creates separate workflows for SAOS and ISAP with recent date range.
   * This is equivalent to the queueDailySync method in the Bull producer.
   *
   * @param daysBack - Number of days back to sync (default: 1 day)
   * @returns Results from both workflow starts
   */
  async startDailySync(daysBack: number = 1): Promise<DailySyncResult> {
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysBack);

    this.logger.log(
      `Starting daily sync workflows for last ${daysBack} day(s) from ${dateFrom.toISOString()} to ${dateTo.toISOString()}`,
    );

    // Start both workflows in parallel
    const [saos, isap] = await Promise.all([
      this.startRulingIndexing({
        source: RulingSource.SAOS,
        dateFrom,
        dateTo,
        batchSize: 100,
        updateExisting: true,
      }),
      this.startRulingIndexing({
        source: RulingSource.ISAP,
        dateFrom,
        dateTo,
        batchSize: 100,
        updateExisting: true,
      }),
    ]);

    return { saos, isap };
  }

  /**
   * Get the status of a ruling indexing workflow
   *
   * Queries the Temporal workflow for its current status.
   * Returns null if the workflow doesn't exist.
   *
   * @param source - Data source
   * @returns Workflow status or null if not found
   */
  async getWorkflowStatus(source: RulingSource): Promise<{
    workflowId: string;
    status: string;
    isRunning: boolean;
  } | null> {
    const workflowId = generateWorkflowId(source);

    try {
      const result = await this.temporalService.describeWorkflow(workflowId);

      const status = (result as { status?: { name: string } }).status?.name;

      return {
        workflowId,
        status: status ?? 'UNKNOWN',
        isRunning: status === 'RUNNING',
      };
    } catch {
      this.logger.debug(`Workflow ${workflowId} not found or not yet started`);
      return null;
    }
  }

  /**
   * Cancel a running ruling indexing workflow
   *
   * Cancels the workflow if it's currently running.
   * Does nothing if the workflow is not running or doesn't exist.
   *
   * @param source - Data source
   * @returns True if cancelled, false otherwise
   */
  async cancelWorkflow(source: RulingSource): Promise<boolean> {
    const workflowId = generateWorkflowId(source);

    try {
      await this.temporalService.cancelWorkflow(workflowId);
      this.logger.log(`Cancelled ruling indexing workflow ${workflowId}`);
      return true;
    } catch (error) {
      this.logger.debug(
        `Could not cancel workflow ${workflowId}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return false;
    }
  }

  /**
   * Get the result of a completed ruling indexing workflow
   *
   * Returns the workflow output if the workflow completed successfully.
   * Returns null if the workflow is still running or doesn't exist.
   *
   * @param source - Data source
   * @returns Workflow result or null if not completed
   */
  async getWorkflowResult(source: RulingSource): Promise<{
    jobId: string;
    source: RulingSource;
    status: 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETED';
    totalProcessed: number;
    totalIndexed: number;
    totalSkipped: number;
    totalFailed: number;
    batchResults: unknown[];
    errorMessage?: string;
    indexingTimeMs: number;
    completedAt: string;
  } | null> {
    const workflowId = generateWorkflowId(source);

    try {
      const result = await this.temporalService.getWorkflowResult(workflowId);

      return result as {
        jobId: string;
        source: RulingSource;
        status: 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETED';
        totalProcessed: number;
        totalIndexed: number;
        totalSkipped: number;
        totalFailed: number;
        batchResults: unknown[];
        errorMessage?: string;
        indexingTimeMs: number;
        completedAt: string;
      };
    } catch (error) {
      this.logger.debug(
        `Could not get result for workflow ${workflowId}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return null;
    }
  }

  /**
   * Generate a unique job ID
   *
   * @param source - Data source
   * @returns Unique job ID
   */
  private generateJobId(source: RulingSource): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `ruling-indexing-${source.toLowerCase()}-${timestamp}-${random}`;
  }
}
