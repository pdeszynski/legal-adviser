/**
 * Ruling Indexing Workflow
 *
 * Temporal workflow for indexing legal rulings from external sources.
 * Replaces the Bull-based ruling indexing queue.
 *
 * Features:
 * - Batch indexing from SAOS and ISAP sources
 * - Configurable date range filtering
 * - Court type filtering
 * - Progress tracking
 * - Retry with exponential backoff
 * - Completion notification
 */

import { proxyActivities, workflowInfo } from '@temporalio/workflow';
import { CourtType } from '../../../documents/entities/legal-ruling.entity';

/**
 * Ruling Indexing Source
 */
export enum RulingSource {
  SAOS = 'SAOS',
  ISAP = 'ISAP',
}

/**
 * Ruling Indexing Workflow Input
 */
export interface RulingIndexingInput {
  /** Unique indexing job ID */
  jobId: string;
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
}

/**
 * Ruling Indexing Batch Result
 */
export interface RulingIndexingBatchResult {
  /** Batch number */
  batchNumber: number;
  /** Number of rulings processed */
  processed: number;
  /** Number of rulings indexed successfully */
  indexed: number;
  /** Number of rulings skipped */
  skipped: number;
  /** Number of rulings that failed */
  failed: number;
  /** Processing time in milliseconds */
  processingTimeMs: number;
}

/**
 * Ruling Indexing Workflow Output
 */
export interface RulingIndexingOutput {
  /** Job ID */
  jobId: string;
  /** Data source */
  source: RulingSource;
  /** Indexing status */
  status: 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETED';
  /** Total number of rulings processed */
  totalProcessed: number;
  /** Total number of rulings indexed */
  totalIndexed: number;
  /** Total number of rulings skipped (already exists, no update) */
  totalSkipped: number;
  /** Total number of rulings that failed */
  totalFailed: number;
  /** Batch processing results */
  batchResults: RulingIndexingBatchResult[];
  /** Error message (if failed) */
  errorMessage?: string;
  /** Timestamp of completion */
  completedAt: string;
  /** Total time in milliseconds */
  indexingTimeMs: number;
}

/**
 * Activities interface for proxy
 */
interface RulingIndexingActivities {
  initializeIndexing(input: {
    jobId: string;
    source: RulingSource;
    dateFrom?: Date;
    dateTo?: Date;
    courtType?: CourtType;
    userId?: string;
  }): Promise<{
    totalAvailable: number;
    estimatedBatches: number;
  }>;

  processIndexingBatch(input: {
    jobId: string;
    source: RulingSource;
    batchNumber: number;
    offset: number;
    batchSize: number;
    dateFrom?: Date;
    dateTo?: Date;
    courtType?: CourtType;
    updateExisting?: boolean;
  }): Promise<RulingIndexingBatchResult>;

  completeIndexing(input: {
    jobId: string;
    source: RulingSource;
    totalIndexed: number;
    totalFailed: number;
    userId?: string;
  }): Promise<void>;

  failIndexing(input: {
    jobId: string;
    source: RulingSource;
    errorMessage: string;
    userId?: string;
  }): Promise<void>;
}

/**
 * Generate a unique workflow ID for ruling indexing
 *
 * @param source - Data source
 * @returns Unique workflow ID
 */
export function generateWorkflowId(source: RulingSource): string {
  const timestamp = Date.now();
  return `ruling-indexing-${source.toLowerCase()}-${timestamp}`;
}

/**
 * Get workflow information
 *
 * @returns Current workflow info
 */
export function workflowInfoGetter() {
  return workflowInfo;
}

/**
 * Workflow export for Temporal registration
 */
export const definedWorkflowInfo = {
  name: 'rulingIndexing',
  taskQueue: 'billing-workflows',
} as const;

/**
 * Ruling Indexing Workflow
 *
 * Main workflow for indexing legal rulings from external sources.
 *
 * @param input - Ruling indexing input parameters
 * @returns Ruling indexing result
 */
export async function rulingIndexing(
  input: RulingIndexingInput,
): Promise<RulingIndexingOutput> {
  const startTime = Date.now();
  const {
    jobId,
    source,
    dateFrom,
    dateTo,
    courtType,
    batchSize = 100,
    updateExisting = true,
    userId,
  } = input;

  // Log: Workflow started
  // eslint-disable-next-line no-console
  console.log(
    `[DEBUG] rulingIndexing workflow started: ${JSON.stringify({
      jobId,
      source,
      dateFrom: dateFrom?.toISOString?.() ?? dateFrom,
      dateTo: dateTo?.toISOString?.() ?? dateTo,
      courtType,
      batchSize,
      updateExisting,
      userId,
    })}`,
  );

  // Create activity proxies with retry policy
  const activities = proxyActivities<RulingIndexingActivities>({
    startToCloseTimeout: '4h', // Long-running workflow for large batches
    retry: {
      initialInterval: 2000,
      backoffCoefficient: 2.0,
      maximumInterval: 60000,
      maximumAttempts: 5,
      nonRetryableErrorTypes: ['ValidationError', 'AuthenticationError'],
    },
  });

  const batchResults: RulingIndexingBatchResult[] = [];
  let totalProcessed = 0;
  let totalIndexed = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let hasFailures = false;

  try {
    // Step 1: Initialize the indexing job
    const initResult = await activities.initializeIndexing({
      jobId,
      source,
      dateFrom,
      dateTo,
      courtType,
      userId,
    });

    const { totalAvailable } = initResult;

    // Log: Initialization complete
    // eslint-disable-next-line no-console
    console.log(
      `[DEBUG] rulingIndexing initialization complete: totalAvailable=${totalAvailable}, estimatedBatches=${initResult.estimatedBatches}`,
    );

    // Step 2: Process batches
    let batchNumber = 1;
    let offset = 0;

    // eslint-disable-next-line no-console
    console.log(
      `[DEBUG] rulingIndexing starting batch loop: will loop while offset < totalAvailable`,
    );

    while (offset < totalAvailable) {
      const currentBatchSize = Math.min(batchSize, totalAvailable - offset);

      const batchResult = await activities.processIndexingBatch({
        jobId,
        source,
        batchNumber,
        offset,
        batchSize: currentBatchSize,
        dateFrom,
        dateTo,
        courtType,
        updateExisting,
      });

      batchResults.push(batchResult);
      totalProcessed += batchResult.processed;
      totalIndexed += batchResult.indexed;
      totalSkipped += batchResult.skipped;
      totalFailed += batchResult.failed;

      if (batchResult.failed > 0) {
        hasFailures = true;
      }

      offset += currentBatchSize;
      batchNumber++;

      // Log: Batch loop iteration
      // eslint-disable-next-line no-console
      console.log(
        `[DEBUG] rulingIndexing batch ${batchNumber - 1} complete: indexed=${batchResult.indexed}, skipped=${batchResult.skipped}, failed=${batchResult.failed}, new offset=${offset}, totalAvailable=${totalAvailable}`,
      );
    }

    // Log: Batch loop complete
    // eslint-disable-next-line no-console
    console.log(
      `[DEBUG] rulingIndexing batch loop complete: offset=${offset}, totalAvailable=${totalAvailable}`,
    );

    // Step 3: Complete the indexing job
    await activities.completeIndexing({
      jobId,
      source,
      totalIndexed,
      totalFailed,
      userId,
    });

    return {
      jobId,
      source,
      status: hasFailures ? 'PARTIALLY_COMPLETED' : 'COMPLETED',
      totalProcessed,
      totalIndexed,
      totalSkipped,
      totalFailed,
      batchResults,
      completedAt: new Date().toISOString(),
      indexingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // Mark the indexing job as failed
    try {
      await activities.failIndexing({
        jobId,
        source,
        errorMessage,
        userId,
      });
    } catch (failError) {
      // eslint-disable-next-line no-console
      console.error('Failed to mark indexing job as failed:', failError);
    }

    return {
      jobId,
      source,
      status: 'FAILED',
      totalProcessed,
      totalIndexed,
      totalSkipped,
      totalFailed,
      batchResults,
      errorMessage,
      completedAt: new Date().toISOString(),
      indexingTimeMs: Date.now() - startTime,
    };
  }
}
