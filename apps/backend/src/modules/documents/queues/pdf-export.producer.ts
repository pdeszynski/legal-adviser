import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import { randomUUID } from 'crypto';
import { QUEUE_NAMES } from '../../../shared/queues/base/queue-names';
import type { JobOptions } from '../../../shared/queues/base';
import type { DocumentType } from '../entities/legal-document.entity';
import {
  PdfExportJobData,
  PdfExportJobResult,
  PdfExportOptions,
  DEFAULT_PDF_EXPORT_JOB_OPTIONS,
} from './pdf-export.job';

/**
 * PDF Export Job Request
 *
 * Input parameters for queueing a PDF export job.
 */
export interface QueuePdfExportRequest {
  documentId: string;
  sessionId: string;
  documentType: DocumentType;
  title: string;
  content: string;
  options?: PdfExportOptions;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * PDF Export Producer Service
 *
 * Provides methods to add PDF export jobs to the queue.
 * Acts as the producer side of the Bull queue pattern.
 *
 * Usage:
 * - Use `queuePdfExport()` to add a job to the queue
 * - Use `getJobStatus()` to check the status of a queued job
 * - Use `getJobResult()` to retrieve the PDF once completed
 * - Use `removeJob()` to cancel a pending job
 */
@Injectable()
export class PdfExportProducer {
  private readonly logger = new Logger(PdfExportProducer.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.DOCUMENT.EXPORT_PDF)
    private readonly pdfExportQueue: Queue<PdfExportJobData>,
  ) {}

  /**
   * Queue a PDF export job
   *
   * @param request - The PDF export request parameters
   * @param options - Optional job configuration overrides
   * @returns The created Bull job
   */
  async queuePdfExport(
    request: QueuePdfExportRequest,
    options?: Partial<JobOptions>,
  ): Promise<Job<PdfExportJobData>> {
    const jobId = options?.jobId || randomUUID();

    const jobData: PdfExportJobData = {
      jobId,
      documentId: request.documentId,
      sessionId: request.sessionId,
      documentType: request.documentType,
      title: request.title,
      content: request.content,
      options: request.options,
      userId: request.userId,
      createdAt: new Date(),
      metadata: {
        source: 'pdf-export-producer',
        ...request.metadata,
      },
    };

    const jobOptions = {
      ...DEFAULT_PDF_EXPORT_JOB_OPTIONS,
      ...options,
      jobId,
    };

    this.logger.log(
      `Queueing PDF export job ${jobId} for document ${request.documentId}`,
    );

    const job = await this.pdfExportQueue.add(jobData, {
      ...jobOptions,
      backoff: {
        type: 'exponential',
        delay: 3000, // 3 seconds initial delay
      },
    });

    this.logger.debug(`PDF export job ${job.id} queued successfully`);

    return job;
  }

  /**
   * Get the status of a queued job
   *
   * @param jobId - The ID of the job to check
   * @returns The job if found, null otherwise
   */
  async getJobStatus(jobId: string): Promise<Job<PdfExportJobData> | null> {
    return this.pdfExportQueue.getJob(jobId);
  }

  /**
   * Get the result of a completed job
   *
   * @param jobId - The ID of the job
   * @returns The job result if completed, null otherwise
   */
  async getJobResult(jobId: string): Promise<PdfExportJobResult | null> {
    const job = await this.getJobStatus(jobId);
    if (!job) return null;

    const state = await job.getState();
    if (state !== 'completed') return null;

    return job.returnvalue as PdfExportJobResult;
  }

  /**
   * Wait for a job to complete and return the result
   *
   * @param jobId - The ID of the job
   * @param timeout - Maximum time to wait in milliseconds
   * @returns The job result
   * @throws Error if job fails or times out
   */
  async waitForResult(
    jobId: string,
    timeout: number = 60000,
  ): Promise<PdfExportJobResult> {
    const job = await this.getJobStatus(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    return job.finished() as Promise<PdfExportJobResult>;
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
        this.pdfExportQueue.getWaitingCount(),
        this.pdfExportQueue.getActiveCount(),
        this.pdfExportQueue.getCompletedCount(),
        this.pdfExportQueue.getFailedCount(),
        this.pdfExportQueue.getDelayedCount(),
        this.pdfExportQueue.getPausedCount(),
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
    grace: number = 12 * 60 * 60 * 1000, // 12 hours default (shorter than generation jobs)
    status: 'completed' | 'failed' = 'completed',
  ): Promise<number> {
    const cleaned = await this.pdfExportQueue.clean(grace, status);
    this.logger.log(`Cleaned ${cleaned.length} ${status} jobs from queue`);
    return cleaned.length;
  }
}
