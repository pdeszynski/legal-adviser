/**
 * Webhook Replay Workflow
 *
 * Temporal workflow for replaying failed webhook deliveries.
 * Finds failed webhooks and redelivers them with updated payloads.
 *
 * Features:
 * - Batch replay of multiple failed webhooks
 * - Filter by date range, event type, or webhook ID
 * - Configurable delay between replays
 * - Update payload before redelivery
 */

import { proxies, sleep } from '@temporalio/workflow';

/**
 * Webhook Replay Workflow Input
 */
export interface WebhookReplayInput {
  /** Optional webhook ID to filter by */
  webhookId?: string;
  /** Optional event type to filter by */
  event?: string;
  /** Start date for filtering failed deliveries (ISO string) */
  startDate?: string;
  /** End date for filtering failed deliveries (ISO string) */
  endDate?: string;
  /** Maximum number of deliveries to replay */
  maxDeliveries?: number;
  /** Delay between replays in milliseconds */
  delayBetweenReplaysMs?: number;
  /** Whether to update the payload before redelivery */
  updatePayload?: boolean;
  /** New payload data (if updatePayload is true) */
  newPayloadData?: Record<string, unknown>;
}

/**
 * Webhook Replay Workflow Output
 */
export interface WebhookReplayOutput {
  /** Number of deliveries successfully replayed */
  successCount: number;
  /** Number of deliveries that failed to replay */
  failureCount: number;
  /** Number of deliveries skipped (webhook disabled, etc.) */
  skippedCount: number;
  /** Total number of deliveries processed */
  totalCount: number;
  /** Details of replayed deliveries */
  replayedDeliveries: Array<{
    deliveryId: string;
    webhookId: string;
    status: 'REPLAYED' | 'FAILED' | 'SKIPPED';
    error?: string;
  }>;
  /** Timestamp of completion */
  completedAt: string;
  /** Total time in milliseconds */
  totalTimeMs: number;
}

/**
 * Activities interface for proxy
 */
interface WebhookReplayActivities {
  findFailedDeliveries(input: {
    webhookId?: string;
    event?: string;
    startDate?: string;
    endDate?: string;
    maxDeliveries?: number;
  }): Promise<
    Array<{
      id: string;
      webhookId: string;
      event: string;
      payload: Record<string, unknown>;
      url: string;
      secret: string;
      headers?: Record<string, string> | null;
      timeoutMs: number;
      maxRetries: number;
      createdAt: string;
    }>
  >;

  isWebhookActive(webhookId: string): Promise<boolean>;

  replayDelivery(input: {
    originalDeliveryId: string;
    webhookId: string;
    event: string;
    payload: Record<string, unknown>;
    url: string;
    secret: string;
    headers?: Record<string, string> | null;
    timeoutMs: number;
    maxRetries: number;
  }): Promise<{
    newDeliveryId: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Generate a unique workflow ID for webhook replay
 *
 * @param webhookId - Optional webhook ID
 * @returns Unique workflow ID
 */
export function generateReplayWorkflowId(webhookId?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  if (webhookId) {
    return `webhook-replay-${webhookId}-${timestamp}-${random}`;
  }
  return `webhook-replay-${timestamp}-${random}`;
}

/**
 * Webhook Replay Workflow
 *
 * Main workflow for replaying failed webhook deliveries.
 *
 * @param input - Webhook replay input parameters
 * @returns Webhook replay result
 */
export async function webhookReplay(
  input: WebhookReplayInput,
): Promise<WebhookReplayOutput> {
  const startTime = Date.now();
  const {
    webhookId,
    event,
    startDate,
    endDate,
    maxDeliveries = 100,
    delayBetweenReplaysMs = 1000,
    updatePayload = false,
    newPayloadData,
  } = input;

  // Create activity proxies
  const activities = proxies.activities<WebhookReplayActivities>({
    startToCloseTimeout: '5m',
    retry: {
      maximumAttempts: 1,
    },
  });

  const output: WebhookReplayOutput = {
    successCount: 0,
    failureCount: 0,
    skippedCount: 0,
    totalCount: 0,
    replayedDeliveries: [],
    completedAt: new Date().toISOString(),
    totalTimeMs: 0,
  };

  try {
    // Find failed deliveries to replay
    const failedDeliveries = await activities.findFailedDeliveries({
      webhookId,
      event,
      startDate,
      endDate,
      maxDeliveries,
    });

    output.totalCount = failedDeliveries.length;

    if (failedDeliveries.length === 0) {
      output.completedAt = new Date().toISOString();
      output.totalTimeMs = Date.now() - startTime;
      return output;
    }

    // Replay each delivery
    for (const delivery of failedDeliveries) {
      const { id: deliveryId, webhookId: whId, payload } = delivery;

      // Check if webhook is still active
      const isActive = await activities.isWebhookActive(whId);
      if (!isActive) {
        output.skippedCount++;
        output.replayedDeliveries.push({
          deliveryId,
          webhookId: whId,
          status: 'SKIPPED',
          error: 'Webhook is inactive or disabled',
        });
        continue;
      }

      // Update payload if requested
      const replayPayload =
        updatePayload && newPayloadData
          ? {
              ...payload,
              data: {
                ...(payload.data as Record<string, unknown>),
                ...newPayloadData,
              },
            }
          : payload;

      // Replay the delivery
      const result = await activities.replayDelivery({
        originalDeliveryId: deliveryId,
        webhookId: whId,
        event: delivery.event,
        payload: replayPayload,
        url: delivery.url,
        secret: delivery.secret,
        headers: delivery.headers,
        timeoutMs: delivery.timeoutMs,
        maxRetries: delivery.maxRetries,
      });

      if (result.success) {
        output.successCount++;
        output.replayedDeliveries.push({
          deliveryId,
          webhookId: whId,
          status: 'REPLAYED',
        });
      } else {
        output.failureCount++;
        output.replayedDeliveries.push({
          deliveryId,
          webhookId: whId,
          status: 'FAILED',
          error: result.error,
        });
      }

      // Add delay between replays to avoid overwhelming endpoints
      if (delayBetweenReplaysMs > 0) {
        await sleep(delayBetweenReplaysMs);
      }
    }

    output.completedAt = new Date().toISOString();
    output.totalTimeMs = Date.now() - startTime;

    return output;
  } catch (error) {
    output.completedAt = new Date().toISOString();
    output.totalTimeMs = Date.now() - startTime;
    output.replayedDeliveries.push({
      deliveryId: 'workflow',
      webhookId: webhookId || 'unknown',
      status: 'FAILED',
      error: error instanceof Error ? error.message : 'Unknown workflow error',
    });
    return output;
  }
}
