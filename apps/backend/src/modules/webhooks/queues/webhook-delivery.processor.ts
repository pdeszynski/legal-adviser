import { InjectQueue, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { Job, Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import { QUEUE_NAMES } from '../../../shared/queues/base/queue-names';
import { Webhook } from '../entities/webhook.entity';
import {
  WebhookDelivery,
  DeliveryStatus,
} from '../entities/webhook-delivery.entity';
import { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';
import type {
  WebhookDeliveryJobData,
  WebhookDeliveryJobResult,
} from './webhook-delivery.job';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Webhook Payload Interface
 */
interface WebhookPayload extends Record<string, unknown> {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
  webhookId: string;
}

/**
 * Webhook Delivery Queue Processor
 *
 * Handles asynchronous webhook delivery jobs.
 * Sends HTTP POST requests to webhook endpoints with retry logic.
 *
 * Processing Flow:
 * 1. Receive job with webhook details and payload
 * 2. Generate HMAC signature for payload verification
 * 3. Send HTTP POST request to webhook URL
 * 4. Update delivery log with result
 * 5. Emit webhook delivered or delivery_failed event
 *
 * Error Recovery:
 * - Jobs are retried up to maxRetries times with exponential backoff
 * - Failed deliveries are logged with error details
 * - Webhooks with repeated failures can be auto-disabled
 */
@Injectable()
export class WebhookDeliveryProcessor implements OnModuleInit {
  private readonly logger = new Logger(WebhookDeliveryProcessor.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.WEBHOOK.DELIVER)
    private readonly webhookDeliveryQueue: Queue<WebhookDeliveryJobData>,
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
    @InjectRepository(WebhookDelivery)
    private readonly deliveryRepository: Repository<WebhookDelivery>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    try {
      this.webhookDeliveryQueue.process(async (job) => {
        return this.process(job);
      });

      this.webhookDeliveryQueue.on('completed', (job, result) => {
        this.onCompleted(job, result as WebhookDeliveryJobResult);
      });

      this.webhookDeliveryQueue.on('failed', (job, err) => {
        this.onFailed(job, err);
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Cannot define the same handler twice')
      ) {
        this.logger.warn(
          'Queue handler already registered (duplicate module instantiation detected). Skipping registration.',
        );
      } else {
        throw error;
      }
    }
  }

  /**
   * Process a webhook delivery job
   *
   * Main entry point for processing webhook delivery jobs.
   * Coordinates the entire delivery workflow.
   */
  async process(
    job: Job<WebhookDeliveryJobData>,
  ): Promise<WebhookDeliveryJobResult> {
    const {
      webhookId,
      deliveryId,
      event,
      payload,
      attemptNumber,
      maxRetries,
      url,
      secret,
      headers,
      timeoutMs,
    } = job.data;

    const startTime = Date.now();

    this.logger.debug(
      `Processing webhook delivery job ${job.id} for webhook ${webhookId}`,
    );

    try {
      // Fetch delivery log
      const delivery = await this.deliveryRepository.findOne({
        where: { id: deliveryId },
      });

      if (!delivery) {
        throw new Error(`Delivery log ${deliveryId} not found`);
      }

      // Update attempt count
      delivery.incrementAttempts();

      // Send webhook request
      const result = await this.sendWebhookRequest(
        url,
        secret,
        payload as unknown as WebhookPayload,
        headers ?? null,
        timeoutMs,
      );

      const durationMs = Date.now() - startTime;

      if (result.success) {
        // Mark delivery as successful
        delivery.markAsSuccess(
          result.statusCode || 200,
          result.response || 'OK',
          durationMs,
        );

        // Update webhook success count
        const webhook = await this.webhookRepository.findOne({
          where: { id: webhookId },
        });

        if (webhook) {
          webhook.recordSuccess();
          await this.webhookRepository.save(webhook);
        }

        // Emit success event
        this.eventEmitter.emit(EVENT_PATTERNS.WEBHOOK.DELIVERED, {
          webhookId,
          deliveryId,
          event,
          statusCode: result.statusCode,
          durationMs,
        });

        this.logger.log(
          `Webhook delivery ${deliveryId} succeeded: ${result.statusCode}`,
        );

        return {
          deliveryId,
          webhookId,
          event,
          success: true,
          statusCode: result.statusCode ?? 200,
          responseBody: result.response,
          errorMessage: null,
          durationMs,
          attemptNumber,
          completedAt: new Date(),
          processingTimeMs: durationMs,
        };
      } else {
        // Mark delivery as failed
        delivery.markAsFailed(
          result.error || 'Unknown error',
          result.statusCode ?? undefined,
        );

        // Update webhook failure count
        const webhook = await this.webhookRepository.findOne({
          where: { id: webhookId },
        });

        if (webhook) {
          webhook.recordFailure();

          // Auto-disable webhook if too many failures
          if (webhook.failureCount >= 10) {
            webhook.disable();
            this.logger.warn(
              `Webhook ${webhookId} auto-disabled due to repeated failures`,
            );
          }

          await this.webhookRepository.save(webhook);
        }

        // Emit failure event
        this.eventEmitter.emit(EVENT_PATTERNS.WEBHOOK.DELIVERY_FAILED, {
          webhookId,
          deliveryId,
          event,
          error: result.error,
          statusCode: result.statusCode,
          attemptNumber,
        });

        this.logger.warn(
          `Webhook delivery ${deliveryId} failed: ${result.error}`,
        );

        return {
          deliveryId,
          webhookId,
          event,
          success: false,
          statusCode: result.statusCode ?? null,
          responseBody: result.response,
          errorMessage: result.error,
          durationMs,
          attemptNumber,
          completedAt: new Date(),
          processingTimeMs: durationMs,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const durationMs = Date.now() - startTime;

      this.logger.error(
        `Failed to process webhook delivery job ${job.id}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Throw to trigger retry
      throw error;
    } finally {
      // Save delivery log
      const delivery = await this.deliveryRepository.findOne({
        where: { id: deliveryId },
      });

      if (delivery) {
        await this.deliveryRepository.save(delivery);
      }
    }
  }

  /**
   * Send a webhook request
   *
   * @param url - The webhook URL
   * @param secret - The webhook secret for signing
   * @param payload - The payload to send
   * @param headers - Optional additional headers
   * @param timeout - Request timeout in milliseconds
   * @returns Request result
   */
  private async sendWebhookRequest(
    url: string,
    secret: string,
    payload: WebhookPayload,
    headers: Record<string, string> | null,
    timeout: number,
  ): Promise<{
    success: boolean;
    statusCode: number | null;
    response: string | null;
    error: string | null;
  }> {
    try {
      // Prepare headers
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'LegalAI-Webhook/1.0',
        ...(headers || {}),
      };

      // Generate signature
      const payloadString = JSON.stringify(payload);
      const signature = this.generateSignature(payloadString, secret);
      requestHeaders['X-Webhook-Signature'] = signature;
      requestHeaders['X-Webhook-Timestamp'] = payload.timestamp;
      requestHeaders['X-Webhook-ID'] = payload.webhookId;

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Send request
      const response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseBody = await response.text();
      const statusCode = response.status;

      if (response.ok || statusCode === 202) {
        // 2xx or 202 Accepted are considered successful
        return {
          success: true,
          statusCode,
          response: responseBody,
          error: null,
        };
      } else {
        return {
          success: false,
          statusCode,
          response: responseBody,
          error: `HTTP ${statusCode}: ${response.statusText}`,
        };
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            statusCode: null,
            response: null,
            error: 'Request timeout',
          };
        }
        return {
          success: false,
          statusCode: null,
          response: null,
          error: error.message,
        };
      }
      return {
        success: false,
        statusCode: null,
        response: null,
        error: 'Unknown error',
      };
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   *
   * @param payload - The payload string to sign
   * @param secret - The secret key
   * @returns Hex-encoded signature
   */
  private generateSignature(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Handle job completion event
   */
  onCompleted(
    job: Job<WebhookDeliveryJobData>,
    result: WebhookDeliveryJobResult,
  ): void {
    if (result.success) {
      this.logger.debug(
        `Job ${job.id} completed: ${result.event} delivered to ${job.data.url}`,
      );
    } else {
      this.logger.warn(
        `Job ${job.id} completed with failure: ${result.errorMessage}`,
      );
    }
  }

  /**
   * Handle job failure event
   */
  onFailed(job: Job<WebhookDeliveryJobData>, error: Error): void {
    this.logger.error(
      `Job ${job.id} failed for webhook ${job.data.webhookId}: ${error.message}`,
      error.stack,
    );
  }
}
