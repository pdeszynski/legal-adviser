/**
 * Webhook Delivery Starter Service
 *
 * Service for starting the WebhookDelivery Temporal workflow.
 * This replaces the Bull-based WebhookDeliveryProducer.
 *
 * Usage:
 * - Inject WebhookDeliveryStarter into your service
 * - Call startWebhookDelivery() to deliver a webhook
 * - The workflow runs asynchronously in Temporal
 */

import { Injectable, Logger } from '@nestjs/common';
import { TemporalService } from '../../temporal.service';
import { TEMPORAL_TASK_QUEUES } from '../../temporal.constants';
import {
  generateWorkflowId,
  type WebhookDeliveryInput,
} from './webhook-delivery.workflow';

/**
 * Start Webhook Delivery Request
 *
 * Input parameters for starting a webhook delivery workflow.
 */
export interface StartWebhookDeliveryRequest {
  /** Webhook ID */
  webhookId: string;
  /** Delivery ID (optional, will be generated if not provided) */
  deliveryId?: string;
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
  timeoutMs?: number;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** User ID for tracking */
  userId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Webhook Delivery Workflow Start Result
 *
 * Result returned after starting a webhook delivery workflow.
 */
export interface WebhookDeliveryWorkflowStartResult {
  /** Unique workflow ID */
  workflowId: string;
  /** First execution ID (run ID) */
  runId: string;
  /** Task queue the workflow was dispatched to */
  taskQueue: string;
  /** Workflow type/name */
  workflowType: string;
}

/**
 * Webhook Delivery Starter Service
 *
 * Provides methods to start webhook delivery workflows in Temporal.
 * Replaces the Bull-based WebhookDeliveryProducer.
 *
 * Key Features:
 * - Idempotent workflow execution based on delivery ID
 * - Asynchronous workflow execution (returns immediately)
 * - Automatic retry with exponential backoff
 * - Rate limiting handling
 * - Dead-letter queue for permanently failing webhooks
 */
@Injectable()
export class WebhookDeliveryStarter {
  private readonly logger = new Logger(WebhookDeliveryStarter.name);

  constructor(private readonly temporalService: TemporalService) {}

  /**
   * Start a webhook delivery workflow
   *
   * This method starts a new Temporal workflow for webhook delivery.
   * The workflow runs asynchronously and returns immediately with a workflow ID.
   *
   * Idempotency:
   * - The workflow ID is derived from the delivery ID
   * - Starting a workflow for the same delivery ID will not create duplicate work
   *
   * @param request - Webhook delivery request parameters
   * @returns Workflow start result with workflow ID and run ID
   */
  async startWebhookDelivery(
    request: StartWebhookDeliveryRequest,
  ): Promise<WebhookDeliveryWorkflowStartResult> {
    const {
      webhookId,
      deliveryId = this.generateDeliveryId(),
      event,
      payload,
      url,
      secret,
      headers,
      timeoutMs = 30000, // Default 30 seconds
      maxRetries = 3, // Default 3 retries
      userId,
      // Metadata is currently unused but kept for future use
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      metadata,
    } = request;

    const workflowId = generateWorkflowId(deliveryId);

    this.logger.log(
      `Starting webhook delivery workflow ${workflowId} for webhook ${webhookId} to ${url}`,
    );

    // Prepare workflow input
    const workflowInput: WebhookDeliveryInput = {
      deliveryId,
      webhookId,
      event,
      payload,
      url,
      secret,
      headers,
      timeoutMs,
      maxRetries,
      initialRetryIntervalMs: 1000, // 1 second
      maxRetryIntervalMs: 60000, // 60 seconds max
      userId,
    };

    try {
      // Start the workflow in Temporal
      const result = await this.temporalService.startWorkflow(
        'webhookDelivery',
        [workflowInput],
        {
          workflowId,
          taskQueue: TEMPORAL_TASK_QUEUES.DEFAULT,
          workflowExecutionTimeout: '10m', // 10 minutes max for all retries
          workflowTaskTimeout: '30s',
          // Don't retry the workflow itself (activities handle retries)
          retryMaximumAttempts: 1,
        },
      );

      this.logger.log(
        `Webhook delivery workflow ${workflowId} started (run ID: ${result.runId})`,
      );

      return {
        workflowId: result.workflowId,
        runId: result.runId,
        taskQueue: result.taskQueue,
        workflowType: result.workflowType,
      };
    } catch (error) {
      this.logger.error(
        `Failed to start webhook delivery workflow for webhook ${webhookId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get the status of a webhook delivery workflow
   *
   * Queries the Temporal workflow for its current status.
   * Returns null if the workflow doesn't exist.
   *
   * @param deliveryId - Delivery ID to query
   * @returns Workflow status or null if not found
   */
  async getWorkflowStatus(deliveryId: string): Promise<{
    workflowId: string;
    status: string;
    isRunning: boolean;
  } | null> {
    const workflowId = generateWorkflowId(deliveryId);

    try {
      const result = await this.temporalService.describeWorkflow(workflowId);

      const status = (result as { status?: { name: string } }).status?.name;

      return {
        workflowId,
        status: status ?? 'UNKNOWN',
        isRunning: status === 'RUNNING',
      };
    } catch {
      this.logger.debug(`Workflow ${workflowId} not found or not yet started`);
      return null;
    }
  }

  /**
   * Cancel a running webhook delivery workflow
   *
   * Cancels the workflow if it's currently running.
   * Does nothing if the workflow is not running or doesn't exist.
   *
   * @param deliveryId - Delivery ID to cancel
   * @returns True if cancelled, false otherwise
   */
  async cancelWorkflow(deliveryId: string): Promise<boolean> {
    const workflowId = generateWorkflowId(deliveryId);

    try {
      await this.temporalService.cancelWorkflow(workflowId);
      this.logger.log(`Cancelled webhook delivery workflow ${workflowId}`);
      return true;
    } catch (error) {
      this.logger.debug(
        `Could not cancel workflow ${workflowId}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return false;
    }
  }

  /**
   * Get the result of a completed webhook delivery workflow
   *
   * Returns the workflow output if the workflow completed successfully.
   * Returns null if the workflow is still running or doesn't exist.
   *
   * @param deliveryId - Delivery ID to get result for
   * @returns Workflow result or null if not completed
   */
  async getWorkflowResult(deliveryId: string): Promise<{
    deliveryId: string;
    webhookId: string;
    status: 'DELIVERED' | 'FAILED' | 'RATE_LIMITED';
    statusCode?: number;
    response?: string;
    attempts: unknown[];
    totalTimeMs: number;
    completedAt: string;
    errorMessage?: string;
    deadLetterId?: string;
  } | null> {
    const workflowId = generateWorkflowId(deliveryId);

    try {
      const result = await this.temporalService.getWorkflowResult(workflowId);

      return result as {
        deliveryId: string;
        webhookId: string;
        status: 'DELIVERED' | 'FAILED' | 'RATE_LIMITED';
        statusCode?: number;
        response?: string;
        attempts: unknown[];
        totalTimeMs: number;
        completedAt: string;
        errorMessage?: string;
        deadLetterId?: string;
      };
    } catch (error) {
      this.logger.debug(
        `Could not get result for workflow ${workflowId}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return null;
    }
  }

  /**
   * Generate a unique delivery ID
   *
   * @returns Unique delivery ID
   */
  private generateDeliveryId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `webhook-delivery-${timestamp}-${random}`;
  }
}
