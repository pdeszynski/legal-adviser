import { BaseJobData, JobOptions } from '../../../shared/queues/base';
import { CourtType } from '../entities/legal-ruling.entity';

/**
 * Ruling indexing job data
 *
 * Contains parameters for indexing legal rulings from external sources.
 */
export interface RulingIndexingJobData extends BaseJobData {
  /**
   * Source to index from
   */
  source: 'SAOS' | 'ISAP';

  /**
   * Optional date range for filtering rulings
   */
  dateFrom?: Date;

  /**
   * Optional end date for filtering rulings
   */
  dateTo?: Date;

  /**
   * Optional court type filter
   */
  courtType?: CourtType;

  /**
   * Maximum number of rulings to fetch in this job
   * Default: 100
   */
  batchSize?: number;

  /**
   * Whether to update existing rulings or only add new ones
   * Default: false (only add new)
   */
  updateExisting?: boolean;
}

/**
 * Ruling Indexing Job Result
 *
 * Result returned when a ruling indexing job completes successfully.
 */
export interface RulingIndexingJobResult {
  /**
   * Source that was indexed
   */
  source: 'SAOS' | 'ISAP';

  /**
   * Number of rulings processed
   */
  processedCount: number;

  /**
   * Number of new rulings added
   */
  addedCount: number;

  /**
   * Number of existing rulings updated
   */
  updatedCount: number;

  /**
   * Number of rulings skipped (duplicates)
   */
  skippedCount: number;

  /**
   * Number of rulings that failed to process
   */
  failedCount: number;

  /**
   * Processing time in milliseconds
   */
  processingTimeMs: number;

  /**
   * List of signatures that were processed
   */
  processedSignatures: string[];

  /**
   * List of errors encountered during processing
   */
  errors: Array<{
    signature: string;
    error: string;
  }>;
}

/**
 * Default job options for ruling indexing
 */
export const DEFAULT_RULING_INDEXING_JOB_OPTIONS: JobOptions = {
  attempts: 3,
  removeOnComplete: 50, // Keep last 50 completed jobs
  removeOnFail: 100, // Keep last 100 failed jobs for debugging
};
