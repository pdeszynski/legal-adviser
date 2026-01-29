/**
 * Webhook Delivery Workflow
 *
 * Temporal workflow for delivering webhook notifications to external endpoints.
 * Replaces the Bull-based webhook delivery queue.
 *
 * Features:
 * - HTTP POST delivery to webhook URLs
 * - Signature verification (HMAC)
 * - Retry with exponential backoff
 * - Timeout handling
 * - Dead-letter queue for permanently failing webhooks
 */

import { proxyActivities, sleep } from '@temporalio/workflow';

/**
 * Webhook Delivery Workflow Input
 */
export interface WebhookDeliveryInput {
  /** Unique delivery ID */
  deliveryId: string;
  /** Webhook ID */
  webhookId: string;
  /** Event type */
  event: string;
  /** Event payload */
  payload: Record<string, unknown>;
  /** Webhook URL */
  url: string;
  /** Webhook secret for signature */
  secret: string;
  /** Additional HTTP headers */
  headers?: Record<string, string> | null;
  /** Request timeout in milliseconds */
  timeoutMs: number;
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial retry interval in milliseconds */
  initialRetryIntervalMs: number;
  /** Maximum retry interval in milliseconds */
  maxRetryIntervalMs: number;
  /** User ID for tracking */
  userId?: string;
}

/**
 * Webhook Delivery Attempt Result
 */
export interface WebhookDeliveryAttempt {
  /** Attempt number (1-indexed) */
  attemptNumber: number;
  /** Timestamp of the attempt */
  timestamp: string;
  /** HTTP status code received */
  statusCode?: number;
  /** Response body */
  response?: string;
  /** Error message if failed */
  error?: string;
  /** Time taken in milliseconds */
  durationMs: number;
}

/**
 * Webhook Delivery Workflow Output
 */
export interface WebhookDeliveryOutput {
  /** Delivery ID */
  deliveryId: string;
  /** Webhook ID */
  webhookId: string;
  /** Delivery status */
  status: 'DELIVERED' | 'FAILED' | 'RATE_LIMITED';
  /** Final HTTP status code */
  statusCode?: number;
  /** Response body */
  response?: string;
  /** Delivery attempts */
  attempts: WebhookDeliveryAttempt[];
  /** Total time in milliseconds */
  totalTimeMs: number;
  /** Timestamp of completion */
  completedAt: string;
  /** Error message if failed */
  errorMessage?: string;
  /** Dead letter ID if permanently failed */
  deadLetterId?: string;
}

/**
 * Activities interface for proxy
 */
interface WebhookDeliveryActivities {
  attemptDelivery(input: {
    deliveryId: string;
    webhookId: string;
    url: string;
    payload: Record<string, unknown>;
    secret: string;
    headers?: Record<string, string> | null;
    timeoutMs: number;
    attemptNumber: number;
  }): Promise<{
    success: boolean;
    statusCode: number;
    response?: string;
    error?: string;
    durationMs: number;
    isRateLimited: boolean;
  }>;

  recordSuccess(input: {
    deliveryId: string;
    webhookId: string;
    statusCode: number;
    response?: string;
    attempts: WebhookDeliveryAttempt[];
    totalTimeMs: number;
  }): Promise<void>;

  recordFailure(input: {
    deliveryId: string;
    webhookId: string;
    errorMessage: string;
    attempts: WebhookDeliveryAttempt[];
    totalTimeMs: number;
    moveToDeadLetter: boolean;
  }): Promise<{ deadLetterId?: string }>;

  isWebhookActive(webhookId: string): Promise<boolean>;
}

/**
 * Generate a unique workflow ID for webhook delivery
 *
 * @param deliveryId - Delivery ID
 * @returns Unique workflow ID
 */
export function generateWorkflowId(deliveryId: string): string {
  return `webhook-delivery-${deliveryId}`;
}

/**
 * Workflow export for Temporal registration
 */
export const workflowInfo = {
  name: 'webhookDelivery',
  taskQueue: 'webhook-workflows',
} as const;

/**
 * Calculate exponential backoff delay
 *
 * @param attemptNumber - Attempt number (1-indexed)
 * @param initialIntervalMs - Initial retry interval
 * @param maxIntervalMs - Maximum retry interval
 * @returns Delay in milliseconds
 */
function calculateBackoff(
  attemptNumber: number,
  initialIntervalMs: number,
  maxIntervalMs: number,
): number {
  // Exponential backoff: initial * 2^(attempt-1)
  const delay = initialIntervalMs * Math.pow(2, attemptNumber - 1);
  return Math.min(delay, maxIntervalMs);
}

/**
 * Webhook Delivery Workflow
 *
 * Main workflow for delivering webhook notifications.
 *
 * @param input - Webhook delivery input parameters
 * @returns Webhook delivery result
 */
export async function webhookDelivery(
  input: WebhookDeliveryInput,
): Promise<WebhookDeliveryOutput> {
  const startTime = Date.now();
  const {
    deliveryId,
    webhookId,
    // Event is currently unused but kept for future use
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    event,
    payload,
    url,
    secret,
    headers,
    timeoutMs,
    maxRetries,
    initialRetryIntervalMs,
    maxRetryIntervalMs,
    // UserId is currently unused but kept for future use
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userId,
  } = input;

  // Create activity proxies with retry policy
  const activities = proxyActivities<WebhookDeliveryActivities>({
    startToCloseTimeout: '5m',
    retry: {
      maximumAttempts: 1, // We handle retries in the workflow
    },
  });

  const attempts: WebhookDeliveryAttempt[] = [];
  let lastError: string | undefined;
  let statusCode: number | undefined;
  let response: string | undefined;
  let isRateLimited = false;

  // Check if webhook is still active before attempting delivery
  try {
    const isActive = await activities.isWebhookActive(webhookId);
    if (!isActive) {
      return {
        deliveryId,
        webhookId,
        status: 'FAILED',
        attempts,
        totalTimeMs: Date.now() - startTime,
        completedAt: new Date().toISOString(),
        errorMessage: 'Webhook is inactive or disabled',
      };
    }
  } catch (error) {
    // Continue anyway if we can't check status
    // eslint-disable-next-line no-console
    console.warn('Could not verify webhook status:', error);
  }

  // Attempt delivery with retries
  for (
    let attemptNumber = 1;
    attemptNumber <= maxRetries + 1;
    attemptNumber++
  ) {
    const attemptStartTime = Date.now();

    try {
      const result = await activities.attemptDelivery({
        deliveryId,
        webhookId,
        url,
        payload,
        secret,
        headers,
        timeoutMs,
        attemptNumber,
      });

      const attemptDuration = Date.now() - attemptStartTime;

      attempts.push({
        attemptNumber,
        timestamp: new Date().toISOString(),
        statusCode: result.statusCode,
        response: result.response,
        error: result.error,
        durationMs: attemptDuration,
      });

      if (result.success) {
        statusCode = result.statusCode;
        response = result.response;

        // Record successful delivery
        await activities.recordSuccess({
          deliveryId,
          webhookId,
          statusCode: result.statusCode,
          response: result.response,
          attempts,
          totalTimeMs: Date.now() - startTime,
        });

        return {
          deliveryId,
          webhookId,
          status: result.isRateLimited ? 'RATE_LIMITED' : 'DELIVERED',
          statusCode: result.statusCode,
          response: result.response,
          attempts,
          totalTimeMs: Date.now() - startTime,
          completedAt: new Date().toISOString(),
        };
      }

      // Check if rate limited
      if (result.isRateLimited) {
        isRateLimited = true;
        lastError = result.error || 'Rate limited by webhook endpoint';

        // For rate limiting, wait longer before retry
        const backoffDelay = Math.min(
          initialRetryIntervalMs * Math.pow(2, attemptNumber),
          60000, // Max 1 minute for rate limiting
        );
        await sleep(backoffDelay);
      } else {
        lastError = result.error || 'Delivery failed';
      }

      // If not the last attempt, wait before retrying
      if (attemptNumber <= maxRetries) {
        const backoffDelay = calculateBackoff(
          attemptNumber,
          initialRetryIntervalMs,
          maxRetryIntervalMs,
        );
        await sleep(backoffDelay);
      }
    } catch (error) {
      const attemptDuration = Date.now() - attemptStartTime;
      lastError = error instanceof Error ? error.message : 'Unknown error';

      attempts.push({
        attemptNumber,
        timestamp: new Date().toISOString(),
        error: lastError,
        durationMs: attemptDuration,
      });

      // If not the last attempt, wait before retrying
      if (attemptNumber <= maxRetries) {
        const backoffDelay = calculateBackoff(
          attemptNumber,
          initialRetryIntervalMs,
          maxRetryIntervalMs,
        );
        await sleep(backoffDelay);
      }
    }
  }

  // All attempts failed - record failure
  const moveToDeadLetter = maxRetries > 0; // Only move to dead letter if retries were configured
  const failResult = await activities.recordFailure({
    deliveryId,
    webhookId,
    errorMessage: lastError || 'Delivery failed after all retry attempts',
    attempts,
    totalTimeMs: Date.now() - startTime,
    moveToDeadLetter,
  });

  return {
    deliveryId,
    webhookId,
    status: isRateLimited ? 'RATE_LIMITED' : 'FAILED',
    statusCode,
    response,
    attempts,
    totalTimeMs: Date.now() - startTime,
    completedAt: new Date().toISOString(),
    errorMessage: lastError,
    deadLetterId: failResult.deadLetterId,
  };
}
