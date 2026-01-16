import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import { randomUUID } from 'crypto';
import { QUEUE_NAMES } from '../../../shared/queues/base/queue-names';
import type { JobOptions } from '../../../shared/queues/base';
import type { DocumentType } from '../entities/legal-document.entity';
import {
  DocumentGenerationJobData,
  DocumentGenerationJobResult,
  DEFAULT_DOCUMENT_GENERATION_JOB_OPTIONS,
} from './document-generation.job';

/**
 * Document Generation Job Request
 *
 * Input parameters for queueing a document generation job.
 */
export interface QueueDocumentGenerationRequest {
  documentId: string;
  sessionId: string;
  documentType: DocumentType;
  description: string;
  context?: Record<string, unknown>;
  userId?: string;
}

/**
 * Document Generation Producer Service
 *
 * Provides methods to add document generation jobs to the queue.
 * Acts as the producer side of the Bull queue pattern.
 *
 * Usage:
 * - Use `queueDocumentGeneration()` to add a job to the queue
 * - Use `getJobStatus()` to check the status of a queued job
 * - Use `removeJob()` to cancel a pending job
 */
@Injectable()
export class DocumentGenerationProducer {
  private readonly logger = new Logger(DocumentGenerationProducer.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.DOCUMENT.GENERATION)
    private readonly documentGenerationQueue: Queue<DocumentGenerationJobData>,
  ) {}

  /**
   * Queue a document generation job
   *
   * @param request - The document generation request parameters
   * @param options - Optional job configuration overrides
   * @returns The created Bull job
   */
  async queueDocumentGeneration(
    request: QueueDocumentGenerationRequest,
    options?: Partial<JobOptions>,
  ): Promise<Job<DocumentGenerationJobData>> {
    const jobId = options?.jobId || randomUUID();

    const jobData: DocumentGenerationJobData = {
      jobId,
      documentId: request.documentId,
      sessionId: request.sessionId,
      documentType: request.documentType,
      description: request.description,
      context: request.context,
      userId: request.userId,
      createdAt: new Date(),
      metadata: {
        source: 'document-generation-producer',
      },
    };

    const jobOptions = {
      ...DEFAULT_DOCUMENT_GENERATION_JOB_OPTIONS,
      ...options,
      jobId,
    };

    this.logger.log(
      `Queueing document generation job ${jobId} for document ${request.documentId}`,
    );

    const job = await this.documentGenerationQueue.add(jobData, {
      ...jobOptions,
      backoff: {
        type: 'exponential',
        delay: 5000, // 5 seconds initial delay
      },
    });

    this.logger.debug(`Document generation job ${job.id} queued successfully`);

    return job;
  }

  /**
   * Get the status of a queued job
   *
   * @param jobId - The ID of the job to check
   * @returns The job if found, null otherwise
   */
  async getJobStatus(
    jobId: string,
  ): Promise<Job<DocumentGenerationJobData> | null> {
    return this.documentGenerationQueue.getJob(jobId);
  }

  /**
   * Get the result of a completed job
   *
   * @param jobId - The ID of the job
   * @returns The job result if completed, null otherwise
   */
  async getJobResult(
    jobId: string,
  ): Promise<DocumentGenerationJobResult | null> {
    const job = await this.getJobStatus(jobId);
    if (!job) return null;

    const state = await job.getState();
    if (state !== 'completed') return null;

    return job.returnvalue as DocumentGenerationJobResult;
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
        this.documentGenerationQueue.getWaitingCount(),
        this.documentGenerationQueue.getActiveCount(),
        this.documentGenerationQueue.getCompletedCount(),
        this.documentGenerationQueue.getFailedCount(),
        this.documentGenerationQueue.getDelayedCount(),
        this.documentGenerationQueue.getPausedCount(),
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
    grace: number = 24 * 60 * 60 * 1000, // 24 hours default
    status: 'completed' | 'failed' = 'completed',
  ): Promise<number> {
    const cleaned = await this.documentGenerationQueue.clean(grace, status);
    this.logger.log(`Cleaned ${cleaned.length} ${status} jobs from queue`);
    return cleaned.length;
  }

  /**
   * Pause the queue
   */
  async pauseQueue(): Promise<void> {
    await this.documentGenerationQueue.pause();
    this.logger.log('Document generation queue paused');
  }

  /**
   * Resume the queue
   */
  async resumeQueue(): Promise<void> {
    await this.documentGenerationQueue.resume();
    this.logger.log('Document generation queue resumed');
  }
}
