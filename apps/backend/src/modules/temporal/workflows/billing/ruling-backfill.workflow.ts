/**
 * Ruling Backfill Workflow
 *
 * Temporal workflow for backfilling historical legal rulings from external sources.
 * Processes data in date-range chunks to avoid overwhelming the system.
 *
 * Features:
 * - Processes historical data in date-range chunks
 * - Configurable date range and chunk size
 * - Progress tracking and resume capability
 * - Error handling per chunk
 * - Idempotency keys to prevent duplicate processing
 */

import { proxyActivities } from '@temporalio/workflow';
import { CourtType } from '../../../documents/entities/legal-ruling.entity';
import { RulingSource } from './ruling-indexing.workflow';

// Re-export RulingSource for use in this module
export { RulingSource };

/**
 * Ruling Backfill Workflow Input
 */
export interface RulingBackfillInput {
  /** Unique backfill job ID */
  jobId: string;
  /** Data source to backfill from */
  source: RulingSource;
  /** Start date for backfill */
  dateFrom: Date;
  /** End date for backfill */
  dateTo: Date;
  /** Number of days per chunk */
  daysPerChunk?: number;
  /** Filter by court type */
  courtType?: CourtType;
  /** Batch size for processing */
  batchSize?: number;
  /** Whether to update existing rulings */
  updateExisting?: boolean;
  /** User ID for tracking */
  userId?: string;
  /** Resume from a specific chunk index (for recovery) */
  resumeFromChunk?: number;
}

/**
 * Ruling Backfill Chunk Result
 */
export interface RulingBackfillChunkResult {
  /** Chunk index */
  chunkIndex: number;
  /** Chunk date range */
  dateRange: {
    from: string;
    to: string;
  };
  /** Number of rulings indexed */
  indexed: number;
  /** Number of rulings skipped */
  skipped: number;
  /** Number of rulings that failed */
  failed: number;
  /** Whether this chunk completed successfully */
  success: boolean;
  /** Error message if failed */
  errorMessage?: string;
}

/**
 * Ruling Backfill Workflow Output
 */
export interface RulingBackfillOutput {
  /** Job ID */
  jobId: string;
  /** Data source */
  source: RulingSource;
  /** Backfill status */
  status: 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETED';
  /** Total number of chunks processed */
  totalChunksProcessed: number;
  /** Total number of chunks */
  totalChunks: number;
  /** Total number of rulings indexed */
  totalIndexed: number;
  /** Total number of rulings skipped */
  totalSkipped: number;
  /** Total number of rulings that failed */
  totalFailed: number;
  /** Chunk processing results */
  chunkResults: RulingBackfillChunkResult[];
  /** Error message (if failed) */
  errorMessage?: string;
  /** Timestamp of completion */
  completedAt: string;
  /** Total time in milliseconds */
  backfillTimeMs: number;
}

/**
 * Activities interface for proxy
 */
interface BackfillActivities {
  processBackfillChunk(input: {
    jobId: string;
    source: RulingSource;
    chunkIndex: number;
    dateFrom: Date;
    dateTo: Date;
    courtType?: CourtType;
    batchSize?: number;
    updateExisting?: boolean;
    idempotencyKey: string;
  }): Promise<{
    indexed: number;
    skipped: number;
    failed: number;
  }>;
}

/**
 * Generate a unique workflow ID for ruling backfill
 *
 * @param source - Data source
 * @param dateFrom - Start date
 * @param dateTo - End date
 * @returns Unique workflow ID
 */
export function generateBackfillWorkflowId(
  source: RulingSource,
  dateFrom: Date,
  dateTo: Date,
): string {
  const fromStr = dateFrom.toISOString().split('T')[0];
  const toStr = dateTo.toISOString().split('T')[0];
  return `ruling-backfill-${source.toLowerCase()}-${fromStr}-${toStr}`;
}

/**
 * Calculate date chunks for backfill
 *
 * @param dateFrom - Start date
 * @param dateTo - End date
 * @param daysPerChunk - Number of days per chunk
 * @returns Array of date ranges
 */
function calculateDateChunks(
  dateFrom: Date,
  dateTo: Date,
  daysPerChunk: number,
): Array<{ from: Date; to: Date }> {
  const chunks: Array<{ from: Date; to: Date }> = [];
  let currentFrom = new Date(dateFrom);
  const endDate = new Date(dateTo);

  while (currentFrom < endDate) {
    const currentTo = new Date(currentFrom);
    currentTo.setDate(currentTo.getDate() + daysPerChunk);

    // Don't go past the end date
    if (currentTo > endDate) {
      chunks.push({
        from: new Date(currentFrom),
        to: endDate,
      });
      break;
    }

    chunks.push({
      from: new Date(currentFrom),
      to: currentTo,
    });

    // Move to next chunk
    currentFrom = new Date(currentTo);
  }

  return chunks;
}

/**
 * Ruling Backfill Workflow
 *
 * Main workflow for backfilling historical legal rulings from external sources.
 * Processes data in date-range chunks to avoid overwhelming the system.
 *
 * @param input - Ruling backfill input parameters
 * @returns Ruling backfill result
 */
export async function rulingBackfill(
  input: RulingBackfillInput,
): Promise<RulingBackfillOutput> {
  const startTime = Date.now();
  const {
    jobId,
    source,
    dateFrom,
    dateTo,
    daysPerChunk = 30, // Default: 30 days per chunk
    courtType,
    batchSize = 100,
    updateExisting = true,
    resumeFromChunk = 0,
    // userId is currently unused but kept for future use
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userId,
  } = input;

  // Create activity proxies with retry policy
  const activities = proxyActivities<BackfillActivities>({
    startToCloseTimeout: '24h', // Long-running workflow for backfill
    retry: {
      initialInterval: 5000,
      backoffCoefficient: 2.0,
      maximumInterval: 300000, // 5 minutes max
      maximumAttempts: 3,
      nonRetryableErrorTypes: ['ValidationError', 'AuthenticationError'],
    },
  });

  // Calculate date chunks
  const dateChunks = calculateDateChunks(dateFrom, dateTo, daysPerChunk);
  const totalChunks = dateChunks.length;

  const chunkResults: RulingBackfillChunkResult[] = [];
  let totalIndexed = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let hasFailures = false;
  let criticalFailure = false;
  let errorMessage: string | undefined;

  // Process each chunk
  for (let i = resumeFromChunk; i < dateChunks.length; i++) {
    const chunk = dateChunks[i];

    try {
      // Create idempotency key for this chunk
      const idempotencyKey = `${jobId}-chunk-${i}-${chunk.from.toISOString()}-${chunk.to.toISOString()}`;

      // Process the chunk
      const result = await activities.processBackfillChunk({
        jobId,
        source,
        chunkIndex: i,
        dateFrom: chunk.from,
        dateTo: chunk.to,
        courtType,
        batchSize,
        updateExisting,
        idempotencyKey,
      });

      chunkResults.push({
        chunkIndex: i,
        dateRange: {
          from: chunk.from.toISOString(),
          to: chunk.to.toISOString(),
        },
        indexed: result.indexed,
        skipped: result.skipped,
        failed: result.failed,
        success: result.failed === 0,
      });

      totalIndexed += result.indexed;
      totalSkipped += result.skipped;
      totalFailed += result.failed;

      if (result.failed > 0) {
        hasFailures = true;
      }
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : 'Unknown error';
      hasFailures = true;

      chunkResults.push({
        chunkIndex: i,
        dateRange: {
          from: chunk.from.toISOString(),
          to: chunk.to.toISOString(),
        },
        indexed: 0,
        skipped: 0,
        failed: 0,
        success: false,
        errorMessage: errMessage,
      });

      // Check if this is a critical failure that should stop the backfill
      if (
        errMessage.includes('AuthenticationError') ||
        errMessage.includes('ValidationError')
      ) {
        criticalFailure = true;
        errorMessage = errMessage;
        break;
      }
    }
  }

  return {
    jobId,
    source,
    status: criticalFailure
      ? 'FAILED'
      : hasFailures
        ? 'PARTIALLY_COMPLETED'
        : 'COMPLETED',
    totalChunksProcessed: chunkResults.length,
    totalChunks,
    totalIndexed,
    totalSkipped,
    totalFailed,
    chunkResults,
    errorMessage,
    completedAt: new Date().toISOString(),
    backfillTimeMs: Date.now() - startTime,
  };
}
