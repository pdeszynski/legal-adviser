/**
 * Chat Cleanup Starter Service
 *
 * Service for starting the ChatCleanup Temporal workflow.
 * Handles manual and scheduled chat cleanup operations.
 *
 * Usage:
 * - Inject ChatCleanupStarter into your service
 * - Call startChatCleanup() to trigger a cleanup job
 * - The workflow runs asynchronously in Temporal
 */

import { Injectable, Logger } from '@nestjs/common';
import { TemporalService } from '../../temporal.service';
import { TEMPORAL_TASK_QUEUES } from '../../temporal.constants';
import {
  generateWorkflowId,
  type ChatCleanupInput,
  type ChatCleanupOutput,
  DEFAULT_RETENTION_POLICY,
} from './chat-cleanup.workflow';

/**
 * Start Chat Cleanup Request
 *
 * Input parameters for starting a chat cleanup workflow.
 */
export interface StartChatCleanupRequest {
  /** Retention policy configuration */
  retentionPolicy?: {
    archiveAfterDays?: number;
    deleteAfterDays?: number;
    notificationDaysBeforeDeletion?: number;
  };
  /** Whether to send notifications before deletion */
  sendNotifications?: boolean;
  /** Whether to perform dry run (no actual deletion) */
  dryRun?: boolean;
  /** Maximum number of sessions to process per batch */
  batchSize?: number;
  /** User ID for tracking */
  userId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Chat Cleanup Workflow Start Result
 *
 * Result returned after starting a chat cleanup workflow.
 */
export interface ChatCleanupWorkflowStartResult {
  /** Unique workflow ID */
  workflowId: string;
  /** First execution ID (run ID) */
  runId: string;
  /** Task queue the workflow was dispatched to */
  taskQueue: string;
  /** Workflow type/name */
  workflowType: string;
  /** Job ID for tracking */
  jobId: string;
}

/**
 * Chat Cleanup Starter Service
 *
 * Provides methods to start chat cleanup workflows in Temporal.
 *
 * Key Features:
 * - Asynchronous workflow execution (returns immediately)
 * - Configurable retention policy
 * - Dry run mode for testing
 * - Progress tracking via workflow queries
 */
@Injectable()
export class ChatCleanupStarter {
  private readonly logger = new Logger(ChatCleanupStarter.name);

  constructor(private readonly temporalService: TemporalService) {}

  /**
   * Start a chat cleanup workflow
   *
   * This method starts a new Temporal workflow for chat cleanup.
   * The workflow runs asynchronously and returns immediately with a workflow ID.
   *
   * @param request - Chat cleanup request parameters
   * @returns Workflow start result with workflow ID and run ID
   */
  async startChatCleanup(
    request: StartChatCleanupRequest = {},
  ): Promise<ChatCleanupWorkflowStartResult> {
    const {
      retentionPolicy,
      sendNotifications = true,
      dryRun = false,
      batchSize = 100,
      userId,
      metadata,
    } = request;

    const jobId = this.generateJobId();
    const workflowId = generateWorkflowId('full');

    this.logger.log(
      `Starting chat cleanup workflow ${workflowId} (job: ${jobId})`,
    );

    // Prepare workflow input
    const workflowInput: ChatCleanupInput = {
      jobId,
      retentionPolicy: retentionPolicy
        ? {
            archiveAfterDays:
              retentionPolicy.archiveAfterDays ??
              DEFAULT_RETENTION_POLICY.archiveAfterDays,
            deleteAfterDays:
              retentionPolicy.deleteAfterDays ??
              DEFAULT_RETENTION_POLICY.deleteAfterDays,
            notificationDaysBeforeDeletion:
              retentionPolicy.notificationDaysBeforeDeletion ??
              DEFAULT_RETENTION_POLICY.notificationDaysBeforeDeletion,
          }
        : DEFAULT_RETENTION_POLICY,
      sendNotifications,
      dryRun,
      batchSize,
    };

    try {
      // Start the workflow in Temporal
      const result = await this.temporalService.startWorkflow(
        'chatCleanup',
        [workflowInput],
        {
          workflowId,
          taskQueue: TEMPORAL_TASK_QUEUES.DEFAULT,
          workflowExecutionTimeout: '4h',
          workflowTaskTimeout: '30s',
          retryInitialInterval: 2000,
          retryMaximumInterval: 60000,
          retryMaximumAttempts: 2,
          metadata: {
            ...metadata,
            userId,
            jobId,
          },
        },
      );

      this.logger.log(
        `Chat cleanup workflow ${workflowId} started (run ID: ${result.runId})`,
      );

      return {
        workflowId: result.workflowId,
        runId: result.runId,
        taskQueue: result.taskQueue,
        workflowType: result.workflowType,
        jobId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to start chat cleanup workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Run a dry-run cleanup (no actual changes)
   *
   * Useful for testing and previewing what would be cleaned up.
   *
   * @param retentionPolicy - Optional custom retention policy
   * @returns Workflow start result
   */
  async dryRun(
    retentionPolicy?: StartChatCleanupRequest['retentionPolicy'],
  ): Promise<ChatCleanupWorkflowStartResult> {
    return this.startChatCleanup({
      dryRun: true,
      sendNotifications: false,
      retentionPolicy,
    });
  }

  /**
   * Archive old sessions without deletion
   *
   * Runs a cleanup job that only archives sessions older than
   * the threshold, without any deletion.
   *
   * @param daysThreshold - Days after which to archive (default: 90)
   * @returns Workflow start result
   */
  async archiveOldSessions(
    daysThreshold: number = DEFAULT_RETENTION_POLICY.archiveAfterDays,
  ): Promise<ChatCleanupWorkflowStartResult> {
    return this.startChatCleanup({
      retentionPolicy: {
        archiveAfterDays: daysThreshold,
        deleteAfterDays: 99999, // Effectively disable deletion
        notificationDaysBeforeDeletion: 0, // Disable notifications
      },
      sendNotifications: false,
    });
  }

  /**
   * Get the status of a chat cleanup workflow
   *
   * Queries the Temporal workflow for its current status.
   *
   * @param workflowId - Workflow ID to check
   * @returns Workflow status or null if not found
   */
  async getWorkflowStatus(workflowId: string): Promise<{
    workflowId: string;
    status: string;
    isRunning: boolean;
  } | null> {
    try {
      const description = (await this.temporalService.describeWorkflow(
        workflowId,
      )) as { status?: { name: string } };

      const status = description.status?.name;

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
   * Get the result of a completed chat cleanup workflow
   *
   * Returns the workflow output if the workflow completed successfully.
   *
   * @param workflowId - Workflow ID
   * @returns Workflow result or null if not completed
   */
  async getWorkflowResult(
    workflowId: string,
  ): Promise<ChatCleanupOutput | null> {
    try {
      const result = await this.temporalService.getWorkflowResult(workflowId);

      return result as ChatCleanupOutput;
    } catch (error) {
      this.logger.debug(
        `Could not get result for workflow ${workflowId}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return null;
    }
  }

  /**
   * Cancel a running chat cleanup workflow
   *
   * Cancels the workflow if it's currently running.
   *
   * @param workflowId - Workflow ID to cancel
   * @returns True if cancelled, false otherwise
   */
  async cancelWorkflow(workflowId: string): Promise<boolean> {
    try {
      await this.temporalService.cancelWorkflow(workflowId);
      this.logger.log(`Cancelled chat cleanup workflow ${workflowId}`);
      return true;
    } catch (error) {
      this.logger.debug(
        `Could not cancel workflow ${workflowId}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return false;
    }
  }

  /**
   * Generate a unique job ID
   *
   * @returns Unique job ID
   */
  private generateJobId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `chat-cleanup-${timestamp}-${random}`;
  }
}
