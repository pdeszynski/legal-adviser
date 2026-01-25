/**
 * Webhook Replay Starter Service
 *
 * Service for starting the WebhookReplay Temporal workflow.
 * Used to replay failed webhook deliveries in batches.
 *
 * Usage:
 * - Inject WebhookReplayStarter into your service
 * - Call startWebhookReplay() to replay failed webhooks
 * - The workflow runs asynchronously in Temporal
 */

import { Injectable, Logger } from '@nestjs/common';
import { TemporalService } from '../../temporal.service';
import { TEMPORAL_TASK_QUEUES } from '../../temporal.constants';
import {
  generateReplayWorkflowId,
  type WebhookReplayInput,
  type WebhookReplayOutput,
} from './webhook-replay.workflow';

/**
 * Start Webhook Replay Request
 *
 * Input parameters for starting a webhook replay workflow.
 */
export interface StartWebhookReplayRequest {
  /** Optional webhook ID to filter by */
  webhookId?: string;
  /** Optional event type to filter by */
  event?: string;
  /** Start date for filtering failed deliveries */
  startDate?: Date;
  /** End date for filtering failed deliveries */
  endDate?: Date;
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
 * Webhook Replay Workflow Start Result
 *
 * Result returned after starting a webhook replay workflow.
 */
export interface WebhookReplayWorkflowStartResult {
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
 * Webhook Replay Starter Service
 *
 * Provides methods to start webhook replay workflows in Temporal.
 *
 * Key Features:
 * - Replay failed webhooks by webhook ID or event type
 * - Filter by date range
 * - Update payloads before redelivery
 * - Asynchronous workflow execution
 */
@Injectable()
export class WebhookReplayStarter {
  private readonly logger = new Logger(WebhookReplayStarter.name);

  constructor(private readonly temporalService: TemporalService) {}

  /**
   * Start a webhook replay workflow
   *
   * This method starts a new Temporal workflow for replaying failed webhooks.
   * The workflow runs asynchronously and returns immediately with a workflow ID.
   *
   * @param request - Webhook replay request parameters
   * @returns Workflow start result with workflow ID and run ID
   */
  async startWebhookReplay(
    request: StartWebhookReplayRequest = {},
  ): Promise<WebhookReplayWorkflowStartResult> {
    const {
      webhookId,
      event,
      startDate,
      endDate,
      maxDeliveries = 100,
      delayBetweenReplaysMs = 1000,
      updatePayload = false,
      newPayloadData,
    } = request;

    const workflowId = generateReplayWorkflowId(webhookId);

    const filters: string[] = [];
    if (webhookId) filters.push(`webhook: ${webhookId}`);
    if (event) filters.push(`event: ${event}`);
    if (startDate) filters.push(`from: ${startDate.toISOString()}`);
    if (endDate) filters.push(`to: ${endDate.toISOString()}`);
    if (maxDeliveries) filters.push(`max: ${maxDeliveries}`);

    this.logger.log(
      `Starting webhook replay workflow ${workflowId}${filters.length ? ` with filters: ${filters.join(', ')}` : ''}`,
    );

    // Prepare workflow input
    const workflowInput: WebhookReplayInput = {
      webhookId,
      event,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      maxDeliveries,
      delayBetweenReplaysMs,
      updatePayload,
      newPayloadData,
    };

    try {
      // Start the workflow in Temporal
      const result = await this.temporalService.startWorkflow(
        'webhookReplay',
        [workflowInput],
        {
          workflowId,
          taskQueue: TEMPORAL_TASK_QUEUES.DEFAULT,
          workflowExecutionTimeout: '1h', // Replays can take longer
          workflowTaskTimeout: '30s',
          retryMaximumAttempts: 1,
        },
      );

      this.logger.log(
        `Webhook replay workflow ${workflowId} started (run ID: ${result.runId})`,
      );

      return {
        workflowId: result.workflowId,
        runId: result.runId,
        taskQueue: result.taskQueue,
        workflowType: result.workflowType,
      };
    } catch (error) {
      this.logger.error(
        `Failed to start webhook replay workflow: ${error instanceof Error ? error.message : 'Unknown'}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get the status of a webhook replay workflow
   *
   * Queries the Temporal workflow for its current status.
   * Returns null if the workflow doesn't exist.
   *
   * @param workflowId - Workflow ID to query
   * @returns Workflow status or null if not found
   */
  async getWorkflowStatus(workflowId: string): Promise<{
    workflowId: string;
    status: string;
    isRunning: boolean;
  } | null> {
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
   * Get the result of a completed webhook replay workflow
   *
   * Returns the workflow output if the workflow completed successfully.
   * Returns null if the workflow is still running or doesn't exist.
   *
   * @param workflowId - Workflow ID to get result for
   * @returns Workflow result or null if not completed
   */
  async getWorkflowResult(
    workflowId: string,
  ): Promise<WebhookReplayOutput | null> {
    try {
      const result = await this.temporalService.getWorkflowResult(workflowId);

      return result as WebhookReplayOutput;
    } catch (error) {
      this.logger.debug(
        `Could not get result for workflow ${workflowId}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return null;
    }
  }

  /**
   * Cancel a running webhook replay workflow
   *
   * Cancels the workflow if it's currently running.
   * Does nothing if the workflow is not running or doesn't exist.
   *
   * @param workflowId - Workflow ID to cancel
   * @returns True if cancelled, false otherwise
   */
  async cancelWorkflow(workflowId: string): Promise<boolean> {
    try {
      await this.temporalService.cancelWorkflow(workflowId);
      this.logger.log(`Cancelled webhook replay workflow ${workflowId}`);
      return true;
    } catch (error) {
      this.logger.debug(
        `Could not cancel workflow ${workflowId}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return false;
    }
  }
}
