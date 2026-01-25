/**
 * Email Sending Starter Service
 *
 * Service for starting the EmailSending and BulkEmailSending Temporal workflows.
 * This replaces the Bull-based EmailSendProducer.
 *
 * Usage:
 * - Inject EmailSendingStarter into your service
 * - Call queueEmail() to send a single email
 * - Call queueBulkEmails() to send multiple emails
 * - The workflows run asynchronously in Temporal
 */

import { Injectable, Logger } from '@nestjs/common';
import { TemporalService } from '../../temporal.service';
import { TEMPORAL_TASK_QUEUES } from '../../temporal.constants';
import {
  generateWorkflowId,
  type EmailSendingInput,
} from './email-sending.workflow';
import {
  generateBulkWorkflowId,
  type BulkEmailSendingInput,
} from './bulk-email-sending.workflow';
import { EmailTemplateType } from '../../../../modules/notifications/dto/send-email.input';

/**
 * Queue Email Request
 *
 * Input parameters for queueing a single email.
 */
export interface QueueEmailRequest {
  /** Recipient email address */
  to: string;
  /** Email subject line */
  subject: string;
  /** Email template type */
  template: EmailTemplateType;
  /** Template data for variable substitution */
  templateData?: Record<string, unknown>;
  /** User ID associated with this email */
  userId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Unique ID for this email (optional, will be generated if not provided) */
  emailId?: string;
}

/**
 * Queue Bulk Emails Request
 *
 * Input parameters for queueing multiple emails.
 */
export interface QueueBulkEmailsRequest {
  /** Array of email requests */
  emails: QueueEmailRequest[];
  /** Maximum number of parallel sends */
  maxParallel?: number;
  /** Delay between batches in milliseconds */
  batchDelayMs?: number;
  /** Unique ID for this bulk job (optional, will be generated if not provided) */
  bulkEmailId?: string;
}

/**
 * Email Workflow Start Result
 *
 * Result returned after starting an email workflow.
 */
export interface EmailWorkflowStartResult {
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
 * Bulk Email Workflow Start Result
 *
 * Result returned after starting a bulk email workflow.
 */
export interface BulkEmailWorkflowStartResult {
  /** Unique workflow ID */
  workflowId: string;
  /** First execution ID (run ID) */
  runId: string;
  /** Task queue the workflow was dispatched to */
  taskQueue: string;
  /** Workflow type/name */
  workflowType: string;
  /** Number of emails queued */
  emailCount: number;
}

/**
 * Email Sending Starter Service
 *
 * Provides methods to start email sending workflows in Temporal.
 * Replaces the Bull-based EmailSendProducer.
 *
 * Key Features:
 * - Idempotent workflow execution based on email ID
 * - Asynchronous workflow execution (returns immediately)
 * - Automatic retry with exponential backoff
 * - Rate limiting per recipient
 * - Dead-letter queue for permanently failing emails
 * - Bulk email support with parallel execution limits
 */
@Injectable()
export class EmailSendingStarter {
  private readonly logger = new Logger(EmailSendingStarter.name);

  constructor(private readonly temporalService: TemporalService) {}

  /**
   * Queue a single email for sending
   *
   * This method starts a new Temporal workflow for email sending.
   * The workflow runs asynchronously and returns immediately with a workflow ID.
   *
   * Idempotency:
   * - The workflow ID is derived from the email ID (or generated)
   * - Starting a workflow for the same email ID will not create duplicate work
   *
   * @param request - Email queue request
   * @returns Workflow start result
   */
  async queueEmail(
    request: QueueEmailRequest,
  ): Promise<EmailWorkflowStartResult> {
    const {
      to,
      subject,
      template,
      templateData,
      userId,
      metadata,
      emailId = this.generateEmailId(),
    } = request;

    const workflowId = generateWorkflowId(emailId);

    this.logger.log(
      `Queueing email workflow ${workflowId} for ${to}: ${subject}`,
    );

    // Prepare workflow input
    const workflowInput: EmailSendingInput = {
      emailId,
      to,
      subject,
      template,
      templateData,
      userId,
      metadata,
      maxRetries: 3,
      initialRetryIntervalMs: 1000,
      maxRetryIntervalMs: 60000,
    };

    try {
      // Start the workflow in Temporal
      const result = await this.temporalService.startWorkflow(
        'emailSending',
        [workflowInput],
        {
          workflowId,
          taskQueue: TEMPORAL_TASK_QUEUES.NOTIFICATION_WORKFLOWS,
          workflowExecutionTimeout: '10m', // 10 minutes max
          workflowTaskTimeout: '30s',
          // Retry policy for the entire workflow
          retryInitialInterval: 1000,
          retryMaximumInterval: 60000,
          retryMaximumAttempts: 1, // Don't retry the workflow itself (activities retry)
        },
      );

      this.logger.log(
        `Email workflow ${workflowId} queued (run ID: ${result.runId})`,
      );

      return {
        workflowId: result.workflowId,
        runId: result.runId,
        taskQueue: result.taskQueue,
        workflowType: result.workflowType,
      };
    } catch (error) {
      this.logger.error(`Failed to queue email workflow for ${to}:`, error);
      throw error;
    }
  }

  /**
   * Queue multiple emails for sending
   *
   * This method starts a new Temporal workflow for bulk email sending.
   * The workflow runs asynchronously and returns immediately with a workflow ID.
   *
   * @param request - Bulk email queue request
   * @returns Workflow start result
   */
  async queueBulkEmails(
    request: QueueBulkEmailsRequest,
  ): Promise<BulkEmailWorkflowStartResult> {
    const {
      emails,
      maxParallel = 10,
      batchDelayMs = 1000,
      bulkEmailId = this.generateBulkEmailId(),
    } = request;

    const workflowId = generateBulkWorkflowId(bulkEmailId);

    this.logger.log(
      `Queueing bulk email workflow ${workflowId} for ${emails.length} emails`,
    );

    // Prepare workflow input - convert QueueEmailRequest to EmailSendingInput
    const workflowEmails: Omit<
      EmailSendingInput,
      'maxRetries' | 'initialRetryIntervalMs' | 'maxRetryIntervalMs'
    >[] = emails.map((email) => ({
      emailId: email.emailId || this.generateEmailId(),
      to: email.to,
      subject: email.subject,
      template: email.template,
      templateData: email.templateData,
      userId: email.userId,
      metadata: email.metadata,
    }));

    const workflowInput: BulkEmailSendingInput = {
      bulkEmailId,
      emails: workflowEmails,
      maxParallel,
      batchDelayMs,
      continueOnError: true,
    };

    try {
      // Start the workflow in Temporal
      const result = await this.temporalService.startWorkflow(
        'bulkEmailSending',
        [workflowInput],
        {
          workflowId,
          taskQueue: TEMPORAL_TASK_QUEUES.NOTIFICATION_WORKFLOWS,
          workflowExecutionTimeout: '60m', // 60 minutes for bulk
          workflowTaskTimeout: '30s',
          // Don't retry the workflow itself
          retryMaximumAttempts: 1,
        },
      );

      this.logger.log(
        `Bulk email workflow ${workflowId} queued (run ID: ${result.runId})`,
      );

      return {
        workflowId: result.workflowId,
        runId: result.runId,
        taskQueue: result.taskQueue,
        workflowType: result.workflowType,
        emailCount: emails.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to queue bulk email workflow for ${emails.length} emails:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get the status of an email workflow
   *
   * Queries the Temporal workflow for its current status.
   *
   * @param emailId - Email ID to query
   * @returns Workflow status or null if not found
   */
  async getWorkflowStatus(emailId: string): Promise<{
    workflowId: string;
    status: string;
    isRunning: boolean;
  } | null> {
    const workflowId = generateWorkflowId(emailId);

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
   * Get the result of a completed email workflow
   *
   * Returns the workflow output if the workflow completed successfully.
   *
   * @param emailId - Email ID to get result for
   * @returns Workflow result or null if not completed
   */
  async getWorkflowResult(emailId: string): Promise<{
    emailId: string;
    status: 'SENT' | 'FAILED' | 'RATE_LIMITED';
    messageId?: string;
    retryCount: number;
    completedAt: string;
    errorMessage?: string;
    deadLetterId?: string;
  } | null> {
    const workflowId = generateWorkflowId(emailId);

    try {
      const result = await this.temporalService.getWorkflowResult(workflowId);

      return result as {
        emailId: string;
        status: 'SENT' | 'FAILED' | 'RATE_LIMITED';
        messageId?: string;
        retryCount: number;
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
   * Cancel a running email workflow
   *
   * Cancels the workflow if it's currently running.
   *
   * @param emailId - Email ID to cancel
   * @returns True if cancelled, false otherwise
   */
  async cancelWorkflow(emailId: string): Promise<boolean> {
    const workflowId = generateWorkflowId(emailId);

    try {
      await this.temporalService.cancelWorkflow(workflowId);
      this.logger.log(`Cancelled email workflow ${workflowId}`);
      return true;
    } catch (error) {
      this.logger.debug(
        `Could not cancel workflow ${workflowId}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return false;
    }
  }

  /**
   * Get queue statistics (aggregate of recent workflows)
   *
   * Note: This is a simplified implementation. In production, you would
   * query Temporal's history for accurate statistics.
   *
   * @returns Queue statistics
   */
  async getQueueStats(): Promise<{
    active: number;
    completed: number;
    failed: number;
  }> {
    // In production, this would query Temporal for actual statistics
    // For now, return placeholder data
    this.logger.warn('Queue stats not fully implemented for Temporal');
    return {
      active: 0,
      completed: 0,
      failed: 0,
    };
  }

  /**
   * Generate a unique email ID
   *
   * @returns A unique email ID
   */
  private generateEmailId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `email-${timestamp}-${random}`;
  }

  /**
   * Generate a unique bulk email ID
   *
   * @returns A unique bulk email ID
   */
  private generateBulkEmailId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `bulk-email-${timestamp}-${random}`;
  }
}
