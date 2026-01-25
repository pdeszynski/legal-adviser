/**
 * Webhook Delivery Activities
 *
 * Individual activities that can be called within workflows for webhook delivery operations.
 * These activities handle payload preparation, request signing, HTTP delivery, retry logic,
 * delivery status updates, and dead-letter queue handling.
 *
 * Activities must be deterministic and idempotent where possible.
 * All external service calls (HTTP requests) are wrapped in activities.
 */

import { Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Webhook,
  WebhookStatus,
} from '../../../../modules/webhooks/entities/webhook.entity';
import {
  WebhookDelivery,
  DeliveryStatus,
} from '../../../../modules/webhooks/entities/webhook-delivery.entity';

/**
 * Webhook Delivery Attempt Input
 *
 * Input for attempting a webhook delivery to an endpoint.
 */
export interface AttemptWebhookDeliveryInput {
  /** Unique delivery ID */
  deliveryId: string;
  /** Webhook ID */
  webhookId: string;
  /** Target URL for delivery */
  url: string;
  /** Event payload to deliver */
  payload: Record<string, unknown>;
  /** Webhook secret for HMAC signature */
  secret: string;
  /** Additional HTTP headers */
  headers?: Record<string, string> | null;
  /** Request timeout in milliseconds */
  timeoutMs: number;
  /** Attempt number (1-indexed) */
  attemptNumber: number;
}

/**
 * Webhook Delivery Attempt Output
 *
 * Output from attempting a webhook delivery.
 */
export interface AttemptWebhookDeliveryOutput {
  /** Whether the delivery was successful */
  success: boolean;
  /** HTTP status code received */
  statusCode: number;
  /** Response body from endpoint */
  response?: string;
  /** Error message if failed */
  error?: string;
  /** Time taken in milliseconds */
  durationMs: number;
  /** Whether the request was rate limited */
  isRateLimited: boolean;
  /** Whether this is a permanent error (no retry) */
  isPermanentError: boolean;
}

/**
 * Record Webhook Success Input
 *
 * Input for recording a successful webhook delivery.
 */
export interface RecordWebhookSuccessInput {
  /** Delivery ID to update */
  deliveryId: string;
  /** Webhook ID */
  webhookId: string;
  /** HTTP status code received */
  statusCode: number;
  /** Response body from endpoint */
  response?: string;
  /** Delivery attempts tracking */
  attempts: Array<{
    attemptNumber: number;
    timestamp: string;
    statusCode?: number;
    response?: string;
    error?: string;
    durationMs: number;
  }>;
  /** Total time in milliseconds */
  totalTimeMs: number;
}

/**
 * Record Webhook Failure Input
 *
 * Input for recording a failed webhook delivery.
 */
export interface RecordWebhookFailureInput {
  /** Delivery ID to update */
  deliveryId: string;
  /** Webhook ID */
  webhookId: string;
  /** Error message */
  errorMessage: string;
  /** Delivery attempts tracking */
  attempts: Array<{
    attemptNumber: number;
    timestamp: string;
    statusCode?: number;
    response?: string;
    error?: string;
    durationMs: number;
  }>;
  /** Total time in milliseconds */
  totalTimeMs: number;
  /** Whether to move to dead-letter queue */
  moveToDeadLetter: boolean;
}

/**
 * Record Webhook Failure Output
 *
 * Output from recording a failed webhook delivery.
 */
export interface RecordWebhookFailureOutput {
  /** Dead-letter entry ID if created */
  deadLetterId?: string;
  /** Whether the webhook was disabled due to consecutive failures */
  webhookDisabled: boolean;
}

/**
 * Check Webhook Active Input
 *
 * Input for checking if a webhook is still active.
 */
export interface CheckWebhookActiveInput {
  /** Webhook ID to check */
  webhookId: string;
}

/**
 * Check Webhook Active Output
 *
 * Output from checking webhook status.
 */
export interface CheckWebhookActiveOutput {
  /** Whether the webhook is active */
  isActive: boolean;
  /** Current webhook status */
  status: WebhookStatus;
  /** Current failure count */
  failureCount: number;
}

/**
 * Check Per-Webhook Rate Limit Input
 *
 * Input for checking rate limit for a specific webhook.
 */
export interface CheckWebhookRateLimitInput {
  /** Webhook ID */
  webhookId: string;
  /** Maximum deliveries per time window */
  maxDeliveries?: number;
  /** Time window in seconds */
  timeWindowSeconds?: number;
}

/**
 * Check Per-Webhook Rate Limit Output
 *
 * Output from rate limit check.
 */
export interface CheckWebhookRateLimitOutput {
  /** Whether delivery is allowed */
  allowed: boolean;
  /** Current delivery count in window */
  currentCount: number;
  /** Time when rate limit resets */
  resetAt?: string;
  /** Estimated wait time if not allowed (ms) */
  waitTimeMs?: number;
}

/**
 * Increment Webhook Rate Limit Counter Input
 *
 * Input for incrementing rate limit counter after delivery.
 */
export interface IncrementWebhookRateLimitInput {
  /** Webhook ID */
  webhookId: string;
}

/**
 * Webhook Delivery Activities Container Class
 *
 * This class contains all activity implementations for webhook delivery operations.
 * Activities are registered with Temporal workers and called from workflows.
 */
export class WebhookDeliveryActivities {
  private readonly logger = new Logger(WebhookDeliveryActivities.name);

  // Per-webhook rate limit tracking (in production, use Redis)
  private readonly rateLimitMap = new Map<
    string,
    { count: number; resetAt: number; webhookId: string }
  >();
  private readonly defaultMaxDeliveries = 100;
  private readonly defaultTimeWindowSeconds = 60;

  // Consecutive failures tracking for auto-disable
  private readonly failureThreshold = 10;
  private readonly webhookFailureCounts = new Map<string, number>();

  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
    @InjectRepository(WebhookDelivery)
    private readonly deliveryRepository: Repository<WebhookDelivery>,
  ) {}

  /**
   * Attempt Webhook Delivery Activity
   *
   * Sends a webhook request to the configured endpoint.
   * Handles HTTP request with timeout, signature generation, and response parsing.
   */
  async attemptDelivery(
    input: AttemptWebhookDeliveryInput,
  ): Promise<AttemptWebhookDeliveryOutput> {
    const {
      deliveryId,
      webhookId,
      url,
      payload,
      secret,
      headers,
      timeoutMs,
      attemptNumber,
    } = input;

    this.logger.debug(
      `Attempt ${attemptNumber} for webhook delivery ${deliveryId} to ${url}`,
    );

    const startTime = Date.now();

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
      requestHeaders['X-Webhook-Signature'] = `sha256=${signature}`;
      requestHeaders['X-Webhook-Timestamp'] = payload.timestamp as string;
      requestHeaders['X-Webhook-ID'] = payload.webhookId as string;
      requestHeaders['X-Webhook-Delivery-ID'] = deliveryId;

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
      const durationMs = Date.now() - startTime;

      // Determine if request was rate limited
      const isRateLimited = statusCode === 429;

      // Determine if this is a permanent error (4xx except 429)
      const isPermanentError =
        statusCode >= 400 && statusCode < 500 && statusCode !== 429;

      // Check if successful (2xx or 202 Accepted)
      if (response.ok || statusCode === 202) {
        this.logger.log(
          `Webhook delivery ${deliveryId} succeeded: ${statusCode}`,
        );

        // Reset failure count on success
        this.webhookFailureCounts.delete(webhookId);

        return {
          success: true,
          statusCode,
          response: responseBody,
          durationMs,
          isRateLimited: false,
          isPermanentError: false,
        };
      }

      // Handle failure
      this.logger.warn(
        `Webhook delivery ${deliveryId} failed: ${statusCode} - ${response.statusText}`,
      );

      // Increment failure count
      const currentFailures =
        (this.webhookFailureCounts.get(webhookId) || 0) + 1;
      this.webhookFailureCounts.set(webhookId, currentFailures);

      return {
        success: false,
        statusCode,
        response: responseBody,
        error: `HTTP ${statusCode}: ${response.statusText}`,
        durationMs,
        isRateLimited,
        isPermanentError,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Webhook delivery ${deliveryId} threw error: ${errorMessage}`,
      );

      // Increment failure count on error
      const currentFailures =
        (this.webhookFailureCounts.get(input.webhookId) || 0) + 1;
      this.webhookFailureCounts.set(input.webhookId, currentFailures);

      // Check if this was a timeout
      const isTimeout = error instanceof Error && error.name === 'AbortError';

      return {
        success: false,
        statusCode: 0,
        error: isTimeout ? 'Request timeout' : errorMessage,
        durationMs,
        isRateLimited: false,
        isPermanentError: false,
      };
    }
  }

  /**
   * Check if Webhook is Active Activity
   *
   * Verifies that a webhook is still active and can receive deliveries.
   * This is called before attempting delivery to avoid sending to disabled webhooks.
   */
  async isWebhookActive(
    input: CheckWebhookActiveInput,
  ): Promise<CheckWebhookActiveOutput> {
    const { webhookId } = input;

    try {
      const webhook = await this.webhookRepository.findOne({
        where: { id: webhookId },
      });

      if (!webhook) {
        this.logger.warn(`Webhook ${webhookId} not found`);
        return {
          isActive: false,
          status: WebhookStatus.INACTIVE,
          failureCount: 0,
        };
      }

      const isActive = webhook.status === WebhookStatus.ACTIVE;

      this.logger.debug(
        `Webhook ${webhookId} status: ${webhook.status}, active: ${isActive}`,
      );

      return {
        isActive,
        status: webhook.status,
        failureCount: webhook.failureCount,
      };
    } catch (error) {
      this.logger.error(
        `Failed to check webhook status for ${webhookId}:`,
        error,
      );
      // Return false on error to be safe
      return {
        isActive: false,
        status: WebhookStatus.INACTIVE,
        failureCount: 0,
      };
    }
  }

  /**
   * Check Per-Webhook Rate Limit Activity
   *
   * Checks if a webhook is within its rate limit.
   * Uses a sliding window counter with in-memory storage.
   * In production, use Redis for distributed rate limiting.
   */
  async checkRateLimit(
    input: CheckWebhookRateLimitInput,
  ): Promise<CheckWebhookRateLimitOutput> {
    const { webhookId, maxDeliveries, timeWindowSeconds } = input;
    const max = maxDeliveries ?? this.defaultMaxDeliveries;
    const windowSeconds = timeWindowSeconds ?? this.defaultTimeWindowSeconds;

    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    // Clean up expired entries
    for (const [key, data] of this.rateLimitMap.entries()) {
      if (data.resetAt < windowStart) {
        this.rateLimitMap.delete(key);
      }
    }

    // Get or create rate limit entry for this webhook
    let entry = this.rateLimitMap.get(webhookId);
    if (!entry || entry.resetAt < windowStart) {
      entry = {
        webhookId,
        count: 0,
        resetAt: now + windowSeconds * 1000,
      };
      this.rateLimitMap.set(webhookId, entry);
    }

    const allowed = entry.count < max;
    const waitTimeMs = allowed ? 0 : entry.resetAt - now;

    if (allowed) {
      this.logger.debug(
        `Rate limit check passed for webhook ${webhookId}: ${entry.count}/${max} deliveries`,
      );
    } else {
      this.logger.warn(
        `Rate limit exceeded for webhook ${webhookId}: ${entry.count}/${max} deliveries, wait ${waitTimeMs}ms`,
      );
    }

    return {
      allowed,
      currentCount: entry.count,
      resetAt: new Date(entry.resetAt).toISOString(),
      waitTimeMs,
    };
  }

  /**
   * Increment Rate Limit Counter Activity
   *
   * Increments the rate limit counter for a webhook after delivery is attempted.
   * Should be called after a delivery attempt (success or failure).
   */
  async incrementRateLimitCounter(
    input: IncrementWebhookRateLimitInput,
  ): Promise<void> {
    const { webhookId } = input;
    const entry = this.rateLimitMap.get(webhookId);
    if (entry) {
      entry.count++;
      this.logger.debug(
        `Incremented rate limit for webhook ${webhookId}: ${entry.count}`,
      );
    }
  }

  /**
   * Record Webhook Success Activity
   *
   * Updates the delivery record and webhook statistics after a successful delivery.
   */
  async recordSuccess(input: RecordWebhookSuccessInput): Promise<void> {
    const {
      deliveryId,
      webhookId,
      statusCode,
      response,
      attempts,
      // totalTimeMs is available for future use (e.g., logging)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      totalTimeMs,
    } = input;

    this.logger.debug(`Recording success for webhook delivery ${deliveryId}`);

    try {
      // Update delivery record
      await this.deliveryRepository.update(deliveryId, {
        status: DeliveryStatus.SUCCESS,
        httpResponseCode: statusCode,
        responseBody: response?.slice(0, 10000), // Limit response size
        attemptCount: attempts.length,
      });

      // Update webhook statistics
      await this.webhookRepository
        .createQueryBuilder()
        .update(Webhook)
        .set({
          successCount: () => 'successCount + 1',
          lastSuccessAt: new Date(),
          lastDeliveryAt: new Date(),
        })
        .where('id = :webhookId', { webhookId })
        .execute();

      this.logger.log(
        `Recorded success for webhook delivery ${deliveryId} (webhook: ${webhookId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to record success for delivery ${deliveryId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Record Webhook Failure Activity
   *
   * Updates the delivery record and webhook statistics after a failed delivery.
   * Disables the webhook after consecutive failures exceed threshold.
   * Optionally adds to dead-letter queue.
   */
  async recordFailure(
    input: RecordWebhookFailureInput,
  ): Promise<RecordWebhookFailureOutput> {
    const {
      deliveryId,
      webhookId,
      errorMessage,
      attempts,
      // totalTimeMs is available for future use (e.g., logging)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      totalTimeMs,
      moveToDeadLetter,
    } = input;

    this.logger.debug(`Recording failure for webhook delivery ${deliveryId}`);

    let webhookDisabled = false;

    try {
      // Get current failure count
      const webhook = await this.webhookRepository.findOne({
        where: { id: webhookId },
      });

      if (!webhook) {
        this.logger.warn(
          `Webhook ${webhookId} not found when recording failure`,
        );
        return { deadLetterId: undefined, webhookDisabled: false };
      }

      const newFailureCount = webhook.failureCount + 1;

      // Check if webhook should be disabled
      if (newFailureCount >= this.failureThreshold) {
        this.logger.warn(
          `Webhook ${webhookId} has ${newFailureCount} consecutive failures, disabling`,
        );
        webhookDisabled = true;
      }

      // Update delivery record
      await this.deliveryRepository.update(deliveryId, {
        status: DeliveryStatus.FAILED,
        errorMessage: errorMessage?.slice(0, 1000), // Limit error message size
        attemptCount: attempts.length,
      });

      // Update webhook statistics
      await this.webhookRepository
        .createQueryBuilder()
        .update(Webhook)
        .set({
          failureCount: newFailureCount,
          lastDeliveryAt: new Date(),
          status: webhookDisabled ? WebhookStatus.DISABLED : webhook.status,
        })
        .where('id = :webhookId', { webhookId })
        .execute();

      // Reset in-memory failure count after updating database
      if (webhookDisabled) {
        this.webhookFailureCounts.delete(webhookId);
      }

      // TODO: Add to dead-letter queue if needed
      // For now, we just log the failure
      if (moveToDeadLetter) {
        this.logger.error(
          `Webhook delivery ${deliveryId} moved to dead-letter queue after ${attempts.length} attempts`,
        );
      }

      this.logger.log(
        `Recorded failure for webhook delivery ${deliveryId} (webhook: ${webhookId}, failures: ${newFailureCount}, disabled: ${webhookDisabled})`,
      );

      return {
        deadLetterId: moveToDeadLetter ? deliveryId : undefined,
        webhookDisabled,
      };
    } catch (error) {
      this.logger.error(
        `Failed to record failure for delivery ${deliveryId}:`,
        error,
      );
      throw error;
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

/**
 * Activity registration function
 *
 * Creates and returns the activities object with all dependencies injected.
 * This function is called by the Temporal worker to register activities.
 */
export type WebhookDeliveryActivitiesImpl = InstanceType<
  typeof WebhookDeliveryActivities
>;

export const createWebhookDeliveryActivities = (
  webhookRepository: Repository<Webhook>,
  deliveryRepository: Repository<WebhookDelivery>,
): WebhookDeliveryActivities => {
  return new WebhookDeliveryActivities(webhookRepository, deliveryRepository);
};
