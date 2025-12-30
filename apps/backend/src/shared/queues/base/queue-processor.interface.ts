import { Job } from 'bull';
import { BaseJobData } from './base-job.interface';

/**
 * Queue Processor Interface
 *
 * All queue processors should implement this interface to ensure consistent
 * processing patterns across the application.
 *
 * Processors handle the actual work of processing jobs from queues.
 */
export interface QueueProcessor<T extends BaseJobData = BaseJobData> {
  /**
   * Process a job from the queue
   *
   * @param job - The job to process
   * @returns The result of processing the job
   */
  process(job: Job<T>): Promise<any>;
}

/**
 * Processor Options
 *
 * Configuration options for queue processors
 */
export interface ProcessorOptions {
  /**
   * Number of concurrent jobs this processor can handle
   * Default: 1
   */
  concurrency?: number;

  /**
   * Whether to remove the job from the queue after completion
   * Default: true
   */
  removeOnComplete?: boolean | number;

  /**
   * Whether to remove the job from the queue after failure
   * Default: true
   */
  removeOnFail?: boolean | number;

  /**
   * Number of attempts before marking as failed
   * Default: 3
   */
  attempts?: number;

  /**
   * Delay between retry attempts (milliseconds)
   * Default: 0
   */
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
}
