/**
 * Base Job Interface
 *
 * All job data interfaces should extend this base interface to ensure consistent structure
 * and metadata across queue jobs.
 *
 * Job Naming Convention: `domain.entity.action`
 * Examples:
 * - document.generate
 * - document.export.pdf
 * - email.send.welcome
 * - notification.push.document-ready
 */
export interface BaseJobData {
  /**
   * Unique identifier for this job instance
   */
  jobId?: string;

  /**
   * Timestamp when the job was created
   */
  createdAt?: Date;

  /**
   * User ID who initiated the job (if applicable)
   */
  userId?: string;

  /**
   * Additional metadata for the job
   */
  metadata?: Record<string, any>;
}

/**
 * Job Options
 *
 * Configuration options for queue jobs
 */
export interface JobOptions {
  /**
   * Job priority (higher = processed first)
   * Default: 0
   */
  priority?: number;

  /**
   * Delay before processing (milliseconds)
   * Default: 0
   */
  delay?: number;

  /**
   * Number of attempts before marking as failed
   * Default: 3
   */
  attempts?: number;

  /**
   * Time to live for the job (milliseconds)
   * If job is not completed within this time, it will be removed
   */
  ttl?: number;

  /**
   * Remove job after completion
   * Default: true
   */
  removeOnComplete?: boolean | number;

  /**
   * Remove job after failure
   * Default: true
   */
  removeOnFail?: boolean | number;

  /**
   * Job ID (if you want to specify a custom ID)
   */
  jobId?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

