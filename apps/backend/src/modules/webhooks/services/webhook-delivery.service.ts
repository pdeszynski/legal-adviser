import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import { Webhook, WebhookEvent } from '../entities/webhook.entity';
import {
  WebhookDelivery,
  DeliveryStatus,
} from '../entities/webhook-delivery.entity';
import { WebhookDeliveryProducer } from '../queues/webhook-delivery.producer';

/**
 * Webhook Payload Interface
 */
export interface WebhookPayload extends Record<string, unknown> {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
  webhookId: string;
}

/**
 * Webhook Delivery Service
 *
 * Handles webhook delivery logic including:
 * - Finding webhooks subscribed to events
 * - Creating delivery log entries
 * - Queueing webhook delivery jobs
 * - Testing webhooks
 *
 * Bounded Context: Webhooks
 * - Aggregates: Webhook, WebhookDelivery
 * - Services: WebhookDeliveryService
 */
@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
    @InjectRepository(WebhookDelivery)
    private readonly deliveryRepository: Repository<WebhookDelivery>,
    private readonly deliveryProducer: WebhookDeliveryProducer,
  ) {}

  /**
   * Trigger webhooks for an event
   *
   * Finds all active webhooks subscribed to the event and queues delivery jobs.
   *
   * @param event - The event type
   * @param payload - The event payload
   * @returns Number of webhooks triggered
   */
  async triggerWebhook(
    event: WebhookEvent | string,
    payload: Record<string, unknown>,
  ): Promise<number> {
    this.logger.debug(`Triggering webhooks for event: ${event}`);

    // Find active webhooks subscribed to this event
    const webhooks = await this.webhookRepository
      .createQueryBuilder('webhook')
      .where('webhook.status = :status', { status: 'active' })
      .andWhere(':event = ANY(webhook.events)', { event })
      .getMany();

    this.logger.debug(
      `Found ${webhooks.length} active webhooks for event ${event}`,
    );

    // Queue delivery jobs for each webhook
    let triggeredCount = 0;
    for (const webhook of webhooks) {
      try {
        await this.queueDelivery(webhook, event, payload);
        triggeredCount++;
      } catch (error) {
        this.logger.error(
          `Failed to queue webhook ${webhook.id} for event ${event}:`,
          error,
        );
      }
    }

    this.logger.log(`Triggered ${triggeredCount} webhooks for event ${event}`);

    return triggeredCount;
  }

  /**
   * Trigger webhooks for multiple events
   *
   * @param events - Array of event types
   * @param payload - The event payload
   * @returns Total number of webhooks triggered
   */
  async triggerWebhooksForEvents(
    events: (WebhookEvent | string)[],
    payload: Record<string, unknown>,
  ): Promise<number> {
    let totalCount = 0;

    for (const event of events) {
      const count = await this.triggerWebhook(event, payload);
      totalCount += count;
    }

    return totalCount;
  }

  /**
   * Queue a webhook delivery
   *
   * Creates a delivery log entry and queues the delivery job.
   *
   * @param webhook - The webhook to deliver to
   * @param event - The event type
   * @param payload - The event payload
   */
  async queueDelivery(
    webhook: Webhook,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<WebhookDelivery> {
    // Create webhook payload with metadata
    const webhookPayload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data: payload,
      webhookId: webhook.id,
    };

    // Create delivery log entry
    const delivery = WebhookDelivery.create(webhook.id, event, webhookPayload);

    const savedDelivery = await this.deliveryRepository.save(delivery);

    // Queue the delivery job
    await this.deliveryProducer.queueWebhookDelivery({
      webhookId: webhook.id,
      deliveryId: savedDelivery.id,
      event,
      payload: webhookPayload,
      url: webhook.url,
      secret: webhook.secret,
      headers: webhook.headers,
      timeoutMs: webhook.timeoutMs,
      maxRetries: webhook.maxRetries,
      userId: webhook.userId,
    });

    this.logger.debug(
      `Queued webhook delivery ${savedDelivery.id} to ${webhook.url}`,
    );

    return savedDelivery;
  }

  /**
   * Test a webhook
   *
   * Sends a test event to the webhook endpoint synchronously.
   *
   * @param webhookId - The ID of the webhook to test
   * @param event - Optional event type (default: 'test.event')
   * @param customPayload - Optional custom payload
   * @returns Test result
   */
  async testWebhook(
    webhookId: string,
    event: string = 'test.event',
    customPayload?: Record<string, unknown>,
  ): Promise<{
    success: boolean;
    statusCode: number | null;
    response: string | null;
    error: string | null;
    durationMs: number;
  }> {
    const webhook = await this.webhookRepository.findOne({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data: customPayload || { test: true, message: 'This is a test webhook' },
      webhookId: webhook.id,
    };

    const startTime = Date.now();

    try {
      const result = await this.sendWebhookRequest(
        webhook.url,
        webhook.secret,
        payload,
        webhook.headers,
        webhook.timeoutMs,
      );

      const durationMs = Date.now() - startTime;

      if (result.success) {
        this.logger.log(
          `Webhook test ${webhookId} succeeded: ${result.statusCode}`,
        );
      } else {
        this.logger.warn(`Webhook test ${webhookId} failed: ${result.error}`);
      }

      return {
        ...result,
        durationMs,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Webhook test ${webhookId} threw error: ${errorMessage}`,
      );

      return {
        success: false,
        statusCode: null,
        response: null,
        error: errorMessage,
        durationMs,
      };
    }
  }

  /**
   * Get webhook delivery statistics
   *
   * @param webhookId - Optional webhook ID to filter by
   * @returns Delivery statistics
   */
  async getDeliveryStats(webhookId?: string): Promise<{
    total: number;
    success: number;
    failed: number;
    pending: number;
    retrying: number;
  }> {
    const whereClause = webhookId ? { webhookId } : {};

    const [total, success, failed, pending, retrying] = await Promise.all([
      this.deliveryRepository.count({ where: whereClause }),
      this.deliveryRepository.count({
        where: { ...whereClause, status: DeliveryStatus.SUCCESS },
      }),
      this.deliveryRepository.count({
        where: { ...whereClause, status: DeliveryStatus.FAILED },
      }),
      this.deliveryRepository.count({
        where: { ...whereClause, status: DeliveryStatus.PENDING },
      }),
      this.deliveryRepository.count({
        where: { ...whereClause, status: DeliveryStatus.RETRYING },
      }),
    ]);

    return { total, success, failed, pending, retrying };
  }

  /**
   * Get recent deliveries for a webhook
   *
   * @param webhookId - The webhook ID
   * @param limit - Maximum number of deliveries to return
   * @returns Array of recent deliveries
   */
  async getRecentDeliveries(
    webhookId: string,
    limit: number = 50,
  ): Promise<WebhookDelivery[]> {
    return this.deliveryRepository.find({
      where: { webhookId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
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
}
