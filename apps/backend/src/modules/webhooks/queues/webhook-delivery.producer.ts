import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import { randomUUID } from 'crypto';
import { QUEUE_NAMES } from '../../../shared/queues/base/queue-names';
import type { JobOptions } from '../../../shared/queues/base';
import {
  WebhookDeliveryJobData,
  WebhookDeliveryJobResult,
  DEFAULT_WEBHOOK_DELIVERY_JOB_OPTIONS,
} from './webhook-delivery.job';

/**
 * Queue Webhook Delivery Request
 */
export interface QueueWebhookDeliveryRequest {
  webhookId: string;
  deliveryId: string;
  event: string;
  payload: Record<string, unknown>;
  url: string;
  secret: string;
  headers?: Record<string, string> | null;
  timeoutMs: number;
  maxRetries: number;
  userId?: string;
}

/**
 * Webhook Delivery Producer Service
 *
 * Provides methods to add webhook delivery jobs to the queue.
 * Acts as the producer side of the Bull queue pattern.
 *
 * Usage:
 * - Use `queueWebhookDelivery()` to add a job to the queue
 * - Use `getJobStatus()` to check the status of a queued job
 * - Use `getJobResult()` to get the result of a completed job
 */
@Injectable()
export class WebhookDeliveryProducer {
  private readonly logger = new Logger(WebhookDeliveryProducer.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.WEBHOOK.DELIVER)
    private readonly webhookDeliveryQueue: Queue<WebhookDeliveryJobData>,
  ) {}

  /**
   * Queue a webhook delivery job
   *
   * @param request - The webhook delivery request parameters
   * @param options - Optional job configuration overrides
   * @returns The created Bull job
   */
  async queueWebhookDelivery(
    request: QueueWebhookDeliveryRequest,
    options?: Partial<JobOptions>,
  ): Promise<Job<WebhookDeliveryJobData>> {
    const jobId = options?.jobId || randomUUID();

    const jobData: WebhookDeliveryJobData = {
      jobId,
      webhookId: request.webhookId,
      deliveryId: request.deliveryId,
      event: request.event,
      payload: request.payload,
      attemptNumber: 1,
      maxRetries: request.maxRetries,
      url: request.url,
      secret: request.secret,
      headers: request.headers,
      timeoutMs: request.timeoutMs,
      createdAt: new Date(),
      metadata: {
        source: 'webhook-delivery-producer',
        userId: request.userId,
      },
    };

    const jobOptions = {
      ...DEFAULT_WEBHOOK_DELIVERY_JOB_OPTIONS,
      ...options,
      jobId,
      timeout: request.timeoutMs,
    };

    this.logger.debug(
      `Queueing webhook delivery job ${jobId} to ${request.url}`,
    );

    const job = await this.webhookDeliveryQueue.add(jobData, jobOptions);

    this.logger.debug(`Webhook delivery job ${job.id} queued successfully`);

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
  ): Promise<Job<WebhookDeliveryJobData> | null> {
    return this.webhookDeliveryQueue.getJob(jobId);
  }

  /**
   * Get the result of a completed job
   *
   * @param jobId - The ID of the job
   * @returns The job result if completed, null otherwise
   */
  async getJobResult(jobId: string): Promise<WebhookDeliveryJobResult | null> {
    const job = await this.getJobStatus(jobId);
    if (!job) return null;

    const state = await job.getState();
    if (state !== 'completed') return null;

    return job.returnvalue as WebhookDeliveryJobResult;
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
        this.webhookDeliveryQueue.getWaitingCount(),
        this.webhookDeliveryQueue.getActiveCount(),
        this.webhookDeliveryQueue.getCompletedCount(),
        this.webhookDeliveryQueue.getFailedCount(),
        this.webhookDeliveryQueue.getDelayedCount(),
        this.webhookDeliveryQueue.getPausedCount(),
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
    const cleaned = await this.webhookDeliveryQueue.clean(grace, status);
    this.logger.log(`Cleaned ${cleaned.length} ${status} jobs from queue`);
    return cleaned.length;
  }

  /**
   * Pause the queue
   */
  async pauseQueue(): Promise<void> {
    await this.webhookDeliveryQueue.pause();
    this.logger.log('Webhook delivery queue paused');
  }

  /**
   * Resume the queue
   */
  async resumeQueue(): Promise<void> {
    await this.webhookDeliveryQueue.resume();
    this.logger.log('Webhook delivery queue resumed');
  }
}
