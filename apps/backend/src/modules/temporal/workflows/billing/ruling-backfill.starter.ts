/**
 * Ruling Backfill Starter Service
 *
 * Service for starting the RulingBackfill Temporal workflow.
 * Handles backfilling of historical ruling data from external sources.
 *
 * Usage:
 * - Inject RulingBackfillStarter into your service
 * - Call startRulingBackfill() to trigger a backfill job
 * - The workflow runs asynchronously in Temporal
 */

import { Injectable, Logger } from '@nestjs/common';
import { TemporalService } from '../../temporal.service';
import { TEMPORAL_TASK_QUEUES } from '../../temporal.constants';
import {
  generateBackfillWorkflowId,
  type RulingBackfillInput,
  type RulingBackfillOutput,
  type RulingSource,
} from './ruling-backfill.workflow';
import type { CourtType } from '../../../documents/entities/legal-ruling.entity';

/**
 * Start Ruling Backfill Request
 *
 * Input parameters for starting a ruling backfill workflow.
 */
export interface StartRulingBackfillRequest {
  /** Data source to backfill from */
  source: RulingSource;
  /** Start date for backfill */
  dateFrom: Date;
  /** End date for backfill */
  dateTo: Date;
  /** Number of days per chunk (default: 30) */
  daysPerChunk?: number;
  /** Filter by court type */
  courtType?: CourtType;
  /** Batch size for processing (default: 100) */
  batchSize?: number;
  /** Whether to update existing rulings (default: true) */
  updateExisting?: boolean;
  /** User ID for tracking */
  userId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Ruling Backfill Workflow Start Result
 *
 * Result returned after starting a ruling backfill workflow.
 */
export interface RulingBackfillWorkflowStartResult {
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
 * Ruling Backfill Starter Service
 *
 * Provides methods to start ruling backfill workflows in Temporal.
 *
 * Key Features:
 * - Asynchronous workflow execution (returns immediately)
 * - Support for both SAOS and ISAP sources
 * - Configurable date range with chunking
 * - Resume capability for failed backfills
 * - Progress tracking
 */
@Injectable()
export class RulingBackfillStarter {
  private readonly logger = new Logger(RulingBackfillStarter.name);

  constructor(private readonly temporalService: TemporalService) {}

  /**
   * Start a ruling backfill workflow
   *
   * This method starts a new Temporal workflow for ruling backfill.
   * The workflow runs asynchronously and returns immediately with a workflow ID.
   *
   * @param request - Ruling backfill request parameters
   * @returns Workflow start result with workflow ID and run ID
   */
  async startRulingBackfill(
    request: StartRulingBackfillRequest,
  ): Promise<RulingBackfillWorkflowStartResult> {
    const {
      source,
      dateFrom,
      dateTo,
      daysPerChunk,
      courtType,
      batchSize,
      updateExisting,
      userId,
      // Metadata is currently unused but kept for future use
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      metadata,
    } = request;

    const workflowId = generateBackfillWorkflowId(source, dateFrom, dateTo);

    this.logger.log(
      `Starting ruling backfill workflow ${workflowId} for source ${source} ` +
        `from ${dateFrom.toISOString()} to ${dateTo.toISOString()}`,
    );

    // Prepare workflow input
    const workflowInput: RulingBackfillInput = {
      jobId: this.generateJobId(source, dateFrom, dateTo),
      source,
      dateFrom,
      dateTo,
      daysPerChunk,
      courtType,
      batchSize,
      updateExisting,
      userId,
    };

    try {
      // Start the workflow in Temporal
      const result = await this.temporalService.startWorkflow(
        'rulingBackfill',
        [workflowInput],
        {
          workflowId,
          taskQueue: TEMPORAL_TASK_QUEUES.BILLING_WORKFLOWS,
          workflowExecutionTimeout: '24h', // 24 hours max for backfill
          workflowTaskTimeout: '60s',
          // Retry policy for the entire workflow
          retryInitialInterval: 5000, // 5 seconds
          retryMaximumInterval: 300000, // 5 minutes
          retryMaximumAttempts: 1, // Limited retries - backfill should be manually restarted if needed
        },
      );

      this.logger.log(
        `Ruling backfill workflow ${workflowId} started (run ID: ${result.runId})`,
      );

      return {
        workflowId: result.workflowId,
        runId: result.runId,
        taskQueue: result.taskQueue,
        workflowType: result.workflowType,
      };
    } catch (error) {
      this.logger.error(
        `Failed to start ruling backfill workflow for source ${source}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Start a quick backfill for recent data (last N days)
   *
   * Convenience method for backfilling recent data.
   *
   * @param source - Data source
   * @param daysBack - Number of days back to backfill
   * @param options - Additional options
   * @returns Workflow start result
   */
  async startRecentBackfill(
    source: RulingSource,
    daysBack: number,
    options?: {
      courtType?: CourtType;
      batchSize?: number;
      updateExisting?: boolean;
      userId?: string;
    },
  ): Promise<RulingBackfillWorkflowStartResult> {
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysBack);

    return this.startRulingBackfill({
      source,
      dateFrom,
      dateTo,
      daysPerChunk: Math.max(1, Math.ceil(daysBack / 10)), // ~10 chunks
      courtType: options?.courtType,
      batchSize: options?.batchSize,
      updateExisting: options?.updateExisting,
      userId: options?.userId,
    });
  }

  /**
   * Resume a failed backfill workflow
   *
   * Resumes a backfill from a specific chunk index.
   *
   * @param source - Data source
   * @param dateFrom - Start date
   * @param dateTo - End date
   * @param resumeFromChunk - Chunk index to resume from
   * @param options - Additional options
   * @returns Workflow start result
   */
  async resumeBackfill(
    source: RulingSource,
    dateFrom: Date,
    dateTo: Date,
    resumeFromChunk: number,
    options?: {
      courtType?: CourtType;
      batchSize?: number;
      updateExisting?: boolean;
      userId?: string;
    },
  ): Promise<RulingBackfillWorkflowStartResult> {
    const workflowId = generateBackfillWorkflowId(source, dateFrom, dateTo);

    this.logger.log(
      `Resuming ruling backfill workflow ${workflowId} from chunk ${resumeFromChunk}`,
    );

    const workflowInput: RulingBackfillInput = {
      jobId: this.generateJobId(source, dateFrom, dateTo),
      source,
      dateFrom,
      dateTo,
      courtType: options?.courtType,
      batchSize: options?.batchSize,
      updateExisting: options?.updateExisting,
      userId: options?.userId,
      resumeFromChunk,
    };

    try {
      // Start a new workflow with resume flag
      const result = await this.temporalService.startWorkflow(
        'rulingBackfill',
        [workflowInput],
        {
          workflowId: `${workflowId}-resume-${Date.now()}`, // New workflow ID for resume
          taskQueue: TEMPORAL_TASK_QUEUES.BILLING_WORKFLOWS,
          workflowExecutionTimeout: '24h',
          workflowTaskTimeout: '60s',
          retryMaximumAttempts: 1,
        },
      );

      this.logger.log(
        `Ruling backfill workflow resumed (run ID: ${result.runId})`,
      );

      return {
        workflowId: result.workflowId,
        runId: result.runId,
        taskQueue: result.taskQueue,
        workflowType: result.workflowType,
      };
    } catch (error) {
      this.logger.error(
        `Failed to resume ruling backfill workflow for source ${source}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get the status of a ruling backfill workflow
   *
   * Queries the Temporal workflow for its current status.
   * Returns null if the workflow doesn't exist.
   *
   * @param source - Data source
   * @param dateFrom - Start date
   * @param dateTo - End date
   * @returns Workflow status or null if not found
   */
  async getWorkflowStatus(
    source: RulingSource,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<{
    workflowId: string;
    status: string;
    isRunning: boolean;
  } | null> {
    const workflowId = generateBackfillWorkflowId(source, dateFrom, dateTo);

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
   * Get the result of a completed ruling backfill workflow
   *
   * Returns the workflow output if the workflow completed successfully.
   * Returns null if the workflow is still running or doesn't exist.
   *
   * @param source - Data source
   * @param dateFrom - Start date
   * @param dateTo - End date
   * @returns Workflow result or null if not completed
   */
  async getWorkflowResult(
    source: RulingSource,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<RulingBackfillOutput | null> {
    const workflowId = generateBackfillWorkflowId(source, dateFrom, dateTo);

    try {
      const result = await this.temporalService.getWorkflowResult(workflowId);

      return result as RulingBackfillOutput;
    } catch (error) {
      this.logger.debug(
        `Could not get result for workflow ${workflowId}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return null;
    }
  }

  /**
   * Cancel a running ruling backfill workflow
   *
   * Cancels the workflow if it's currently running.
   * Does nothing if the workflow is not running or doesn't exist.
   *
   * @param source - Data source
   * @param dateFrom - Start date
   * @param dateTo - End date
   * @returns True if cancelled, false otherwise
   */
  async cancelWorkflow(
    source: RulingSource,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<boolean> {
    const workflowId = generateBackfillWorkflowId(source, dateFrom, dateTo);

    try {
      await this.temporalService.cancelWorkflow(workflowId);
      this.logger.log(`Cancelled ruling backfill workflow ${workflowId}`);
      return true;
    } catch (error) {
      this.logger.debug(
        `Could not cancel workflow ${workflowId}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return false;
    }
  }

  /**
   * Generate a unique job ID
   *
   * @param source - Data source
   * @param dateFrom - Start date
   * @param dateTo - End date
   * @returns Unique job ID
   */
  private generateJobId(
    source: RulingSource,
    dateFrom: Date,
    dateTo: Date,
  ): string {
    const fromStr = dateFrom.toISOString().split('T')[0];
    const toStr = dateTo.toISOString().split('T')[0];
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `ruling-backfill-${source.toLowerCase()}-${fromStr}-${toStr}-${timestamp}-${random}`;
  }
}
