import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import { randomUUID } from 'crypto';
import { QUEUE_NAMES } from '../../../shared/queues/base/queue-names';
import type { JobOptions } from '../../../shared/queues/base';
import { CourtType } from '../entities/legal-ruling.entity';
import {
  RulingIndexingJobData,
  RulingIndexingJobResult,
  DEFAULT_RULING_INDEXING_JOB_OPTIONS,
} from './ruling-index.job';

/**
 * Ruling Indexing Job Request
 *
 * Input parameters for queueing a ruling indexing job.
 */
export interface QueueRulingIndexingRequest {
  source: 'SAOS' | 'ISAP';
  dateFrom?: Date;
  dateTo?: Date;
  courtType?: CourtType;
  batchSize?: number;
  updateExisting?: boolean;
  userId?: string;
}

/**
 * Ruling Indexing Producer Service
 *
 * Provides methods to add ruling indexing jobs to the queue.
 * Acts as the producer side of the Bull queue pattern.
 *
 * Usage:
 * - Use `queueRulingIndexing()` to add a job to the queue
 * - Use `getJobStatus()` to check the status of a queued job
 * - Use `removeJob()` to cancel a pending job
 */
@Injectable()
export class RulingIndexingProducer {
  private readonly logger = new Logger(RulingIndexingProducer.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.RULING.INDEX)
    private readonly rulingIndexQueue: Queue<RulingIndexingJobData>,
  ) {}

  /**
   * Queue a ruling indexing job
   *
   * @param request - The ruling indexing request parameters
   * @param options - Optional job configuration overrides
   * @returns The created Bull job
   */
  async queueRulingIndexing(
    request: QueueRulingIndexingRequest,
    options?: Partial<JobOptions>,
  ): Promise<Job<RulingIndexingJobData>> {
    const jobId = options?.jobId || randomUUID();

    const jobData: RulingIndexingJobData = {
      jobId,
      source: request.source,
      dateFrom: request.dateFrom,
      dateTo: request.dateTo,
      courtType: request.courtType,
      batchSize: request.batchSize,
      updateExisting: request.updateExisting,
      userId: request.userId,
      createdAt: new Date(),
      metadata: {
        source: 'ruling-indexing-producer',
      },
    };

    const jobOptions = {
      ...DEFAULT_RULING_INDEXING_JOB_OPTIONS,
      ...options,
      jobId,
    };

    this.logger.log(
      `Queueing ruling indexing job ${jobId} for source ${request.source}`,
    );

    const job = await this.rulingIndexQueue.add(jobData, {
      ...jobOptions,
      backoff: {
        type: 'exponential',
        delay: 10000, // 10 seconds initial delay
      },
    });

    this.logger.debug(`Ruling indexing job ${job.id} queued successfully`);

    return job;
  }

  /**
   * Queue a daily sync job for all sources
   *
   * Creates separate jobs for SAOS and ISAP with recent date range.
   *
   * @param daysBack - Number of days back to sync (default: 1 day)
   * @param options - Optional job configuration overrides
   * @returns Array of created Bull jobs
   */
  async queueDailySync(
    daysBack: number = 1,
    options?: Partial<JobOptions>,
  ): Promise<Job<RulingIndexingJobData>[]> {
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysBack);

    this.logger.log(
      `Queueing daily sync jobs for last ${daysBack} day(s) from ${dateFrom.toISOString()} to ${dateTo.toISOString()}`,
    );

    const jobs: Promise<Job<RulingIndexingJobData>>[] = [
      this.queueRulingIndexing(
        {
          source: 'SAOS',
          dateFrom,
          dateTo,
          batchSize: 100,
          updateExisting: true,
        },
        options,
      ),
      this.queueRulingIndexing(
        {
          source: 'ISAP',
          dateFrom,
          dateTo,
          batchSize: 100,
          updateExisting: true,
        },
        options,
      ),
    ];

    return Promise.all(jobs);
  }

  /**
   * Get the status of a queued job
   *
   * @param jobId - The ID of the job to check
   * @returns The job if found, null otherwise
   */
  async getJobStatus(
    jobId: string,
  ): Promise<Job<RulingIndexingJobData> | null> {
    return this.rulingIndexQueue.getJob(jobId);
  }

  /**
   * Get the result of a completed job
   *
   * @param jobId - The ID of the job
   * @returns The job result if completed, null otherwise
   */
  async getJobResult(jobId: string): Promise<RulingIndexingJobResult | null> {
    const job = await this.getJobStatus(jobId);
    if (!job) return null;

    const state = await job.getState();
    if (state !== 'completed') return null;

    return job.returnvalue as RulingIndexingJobResult;
  }

  /**
   * Remove a pending or delayed job from the queue
   *
   * @param jobId - The ID of the job to remove
   * @returns True if the job was removed, false otherwise
   */
  async removeJob(jobId: string): Promise<boolean> {
    const job = await this.getJobStatus(jobId);
    if (!job) return false;

    const state = await job.getState();
    if (state === 'completed' || state === 'failed') {
      this.logger.warn(
        `Cannot remove job ${jobId} - already in state: ${state}`,
      );
      return false;
    }

    await job.remove();
    this.logger.log(`Job ${jobId} removed from queue`);
    return true;
  }

  /**
   * Get queue statistics
   *
   * @returns Queue job counts by state
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }> {
    const [waiting, active, completed, failed, delayed, paused] =
      await Promise.all([
        this.rulingIndexQueue.getWaitingCount(),
        this.rulingIndexQueue.getActiveCount(),
        this.rulingIndexQueue.getCompletedCount(),
        this.rulingIndexQueue.getFailedCount(),
        this.rulingIndexQueue.getDelayedCount(),
        this.rulingIndexQueue.getPausedCount(),
      ]);

    return { waiting, active, completed, failed, delayed, paused };
  }

  /**
   * Clean old jobs from the queue
   *
   * @param grace - Time in milliseconds to keep completed/failed jobs
   * @param status - The job status to clean ('completed' | 'failed')
   * @returns Number of jobs cleaned
   */
  async cleanOldJobs(
    grace: number = 7 * 24 * 60 * 60 * 1000, // 7 days default
    status: 'completed' | 'failed' = 'completed',
  ): Promise<number> {
    const cleaned = await this.rulingIndexQueue.clean(grace, status);
    this.logger.log(`Cleaned ${cleaned.length} ${status} jobs from queue`);
    return cleaned.length;
  }

  /**
   * Pause the queue
   */
  async pauseQueue(): Promise<void> {
    await this.rulingIndexQueue.pause();
    this.logger.log('Ruling indexing queue paused');
  }

  /**
   * Resume the queue
   */
  async resumeQueue(): Promise<void> {
    await this.rulingIndexQueue.resume();
    this.logger.log('Ruling indexing queue resumed');
  }
}
