/**
 * Email Sending Workflow
 *
 * Orchestrates the sending of individual emails with retry logic,
 * rate limiting, delivery status logging, and dead-letter queue handling.
 *
 * Workflow Steps:
 * 1. Check rate limits for recipient email
 * 2. Render email template with provided data
 * 3. Log notification as QUEUED
 * 4. Send email via provider (SendGrid)
 * 5. Log delivery status (SENT or FAILED)
 * 6. On permanent failure: add to dead-letter queue
 *
 * Error Handling:
 * - Transient errors (network, rate limiting): retry with exponential backoff
 * - Permanent errors (invalid email, bounced): add to dead-letter queue
 * - Maximum retries: 3 attempts with increasing backoff
 * - Rate limiting: wait and retry if limit exceeded
 *
 * Idempotency:
 * - Workflow ID is generated from a unique email ID for idempotency
 * - Re-running the workflow with the same ID will not duplicate emails
 */

import type {
  RenderEmailTemplateInput,
  RenderEmailTemplateOutput,
  CheckRateLimitInput,
  CheckRateLimitOutput,
  SendEmailViaProviderInput,
  SendEmailViaProviderOutput,
  LogDeliveryStatusInput,
  LogDeliveryStatusOutput,
  AddToDeadLetterQueueInput,
  AddToDeadLetterQueueOutput,
} from '../../activities/notification/email-sending.activities';

/**
 * Email Sending Workflow Input
 *
 * Input parameters for the email sending workflow.
 */
export interface EmailSendingInput {
  /** Unique identifier for this email (for idempotency) */
  emailId: string;
  /** Recipient email address */
  to: string;
  /** Email subject line */
  subject: string;
  /** Email template type */
  template: string;
  /** Template data for variable substitution */
  templateData?: Record<string, unknown>;
  /** User ID associated with this email */
  userId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial retry interval in milliseconds */
  initialRetryIntervalMs?: number;
  /** Maximum retry interval in milliseconds */
  maxRetryIntervalMs?: number;
}

/**
 * Email Sending Workflow Output
 *
 * Output returned after workflow completion.
 */
export interface EmailSendingOutput {
  /** Email ID that was processed */
  emailId: string;
  /** Final delivery status */
  status: 'SENT' | 'FAILED' | 'RATE_LIMITED';
  /** Message ID from email provider (if sent) */
  messageId?: string;
  /** Number of retry attempts made */
  retryCount: number;
  /** Timestamp of completion */
  completedAt: string;
  /** Error message (if failed) */
  errorMessage?: string;
  /** Dead-letter queue entry ID (if added to DLQ) */
  deadLetterId?: string;
}

/**
 * Activity interfaces for type safety
 *
 * These interfaces define the activity signatures that the workflow calls.
 * The actual activity implementations are in the activities directory.
 */
export interface EmailSendingActivities {
  renderEmailTemplate(
    input: RenderEmailTemplateInput,
  ): Promise<RenderEmailTemplateOutput>;
  checkRateLimit(input: CheckRateLimitInput): Promise<CheckRateLimitOutput>;
  sendEmailViaProvider(
    input: SendEmailViaProviderInput,
  ): Promise<SendEmailViaProviderOutput>;
  logDeliveryStatus(
    input: LogDeliveryStatusInput,
  ): Promise<LogDeliveryStatusOutput>;
  addToDeadLetterQueue(
    input: AddToDeadLetterQueueInput,
  ): Promise<AddToDeadLetterQueueOutput>;
}

/**
 * Generate workflow ID from email ID
 *
 * This ensures idempotency - re-running the workflow with the same
 * email ID will not create duplicate work.
 *
 * @param emailId - The email ID
 * @returns A deterministic workflow ID
 */
export function generateWorkflowId(emailId: string): string {
  return `email-sending-${emailId}`;
}

/**
 * Check if an error is retryable
 *
 * Transient errors like rate limiting, network issues should be retried.
 * Permanent errors like invalid email should fail immediately.
 *
 * @param errorMessage - The error message to check
 * @returns True if the error is retryable
 */
function isRetryableError(errorMessage: string): boolean {
  const retryablePatterns = [
    'rate limit',
    'timeout',
    'network',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'too many requests',
    '429', // HTTP 429 Too Many Requests
    '503', // HTTP 503 Service Unavailable
    '502', // HTTP 502 Bad Gateway
  ];

  const lowerMessage = errorMessage.toLowerCase();
  return retryablePatterns.some((pattern) =>
    lowerMessage.includes(pattern.toLowerCase()),
  );
}

/**
 * Calculate retry delay with exponential backoff
 *
 * @param attempt - Current retry attempt (0-indexed)
 * @param initialIntervalMs - Initial interval in milliseconds
 * @param maxIntervalMs - Maximum interval in milliseconds
 * @returns Delay in milliseconds
 */
function calculateRetryDelay(
  attempt: number,
  initialIntervalMs: number,
  maxIntervalMs: number,
): number {
  const delay = initialIntervalMs * Math.pow(2, attempt);
  return Math.min(delay, maxIntervalMs);
}

/**
 * Sleep utility for retry delays
 *
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Email Sending Workflow
 *
 * Main workflow function that orchestrates email sending with retry logic.
 *
 * This workflow is designed to be:
 * - Deterministic: Same inputs produce same outputs
 * - Idempotent: Can be safely re-run with the same email ID
 * - Durable: Survives worker restarts and server failures
 * - Observable: Logs all state transitions
 *
 * Activities are called with retry policies:
 * - renderEmailTemplate: No retry (fast fail on template errors)
 * - checkRateLimit: No retry (rate limit is current state)
 * - sendEmailViaProvider: Manual retry in workflow (custom logic)
 * - logDeliveryStatus: Retry up to 3 times (database is transient-safe)
 * - addToDeadLetterQueue: Retry up to 3 times (audit trail is critical)
 *
 * @param input - Workflow input parameters
 * @param activities - Activity implementations (injected by Temporal)
 * @returns Workflow output with delivery result
 */
export async function emailSending(
  input: EmailSendingInput,
  activities: EmailSendingActivities,
): Promise<EmailSendingOutput> {
  const {
    emailId,
    to,
    subject,
    template,
    templateData,
    userId,
    metadata,
    maxRetries = 3,
    initialRetryIntervalMs = 1000,
    maxRetryIntervalMs = 60000,
  } = input;

  // Track retry count and first failure time
  let retryCount = 0;
  let firstFailedAt: string | undefined;
  let lastError: string | undefined;
  let notificationId: string | undefined;

  // Step 1: Check rate limits before processing
  try {
    const rateLimitResult = await activities.checkRateLimit({
      to,
    });

    if (!rateLimitResult.allowed && rateLimitResult.waitTimeMs) {
      // Wait for rate limit to reset
      await sleep(rateLimitResult.waitTimeMs);

      // Re-check after waiting
      const recheckResult = await activities.checkRateLimit({ to });
      if (!recheckResult.allowed) {
        // Rate limit still exceeded - log and return rate-limited status
        await activities.logDeliveryStatus({
          to,
          subject,
          template: template as any,
          templateData,
          userId,
          metadata,
          status: 'FAILED' as any,
          errorMessage: 'Rate limit exceeded',
        });

        return {
          emailId,
          status: 'RATE_LIMITED',
          retryCount,
          completedAt: new Date().toISOString(),
          errorMessage: 'Rate limit exceeded',
        };
      }
    }
  } catch (error) {
    // Rate limit check failed - log but continue with sending
    const errorMessage =
      error instanceof Error ? error.message : 'Rate limit check failed';
    lastError = errorMessage;
  }

  // Step 2: Render email template
  let renderedHtml: string;
  let renderedText: string;

  try {
    const rendered = await activities.renderEmailTemplate({
      template: template as any,
      templateData,
    });

    renderedHtml = rendered.html;
    renderedText = rendered.text;
  } catch (error) {
    // Template rendering failed - this is a permanent error
    const errorMessage =
      error instanceof Error ? error.message : 'Template rendering failed';

    // Log as failed
    try {
      await activities.logDeliveryStatus({
        to,
        subject,
        template: template as any,
        templateData,
        userId,
        metadata,
        status: 'FAILED' as any,
        errorMessage,
      });
    } catch {
      // Ignore logging errors
    }

    return {
      emailId,
      status: 'FAILED',
      retryCount,
      completedAt: new Date().toISOString(),
      errorMessage,
    };
  }

  // Step 3: Log notification as QUEUED
  try {
    const queuedResult = await activities.logDeliveryStatus({
      to,
      subject,
      template: template as any,
      templateData,
      userId,
      metadata,
      status: 'QUEUED' as any,
    });

    notificationId = queuedResult.notificationId;
  } catch (error) {
    // Failed to create notification record - this is critical
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create notification';

    return {
      emailId,
      status: 'FAILED',
      retryCount,
      completedAt: new Date().toISOString(),
      errorMessage: `Failed to create notification record: ${errorMessage}`,
    };
  }

  // Step 4: Send email with retry loop
  while (retryCount <= maxRetries) {
    try {
      const sendResult = await activities.sendEmailViaProvider({
        to,
        subject,
        html: renderedHtml,
        text: renderedText,
      });

      if (sendResult.success) {
        // Email sent successfully
        await activities.logDeliveryStatus({
          notificationId,
          to,
          subject,
          template: template as any,
          templateData,
          userId,
          metadata,
          status: 'SENT' as any,
          messageId: sendResult.messageId,
        });

        return {
          emailId,
          status: 'SENT',
          messageId: sendResult.messageId,
          retryCount,
          completedAt: new Date().toISOString(),
        };
      }

      // Sending failed
      lastError = sendResult.error || 'Unknown error';

      // Check if error is retryable
      if (!isRetryableError(lastError)) {
        // Permanent error - don't retry
        break;
      }

      // Increment retry count and continue loop
      retryCount++;
      if (retryCount <= maxRetries) {
        // Track first failure time for DLQ
        if (!firstFailedAt) {
          firstFailedAt = new Date().toISOString();
        }

        // Calculate delay and wait
        const delay = calculateRetryDelay(
          retryCount - 1,
          initialRetryIntervalMs,
          maxRetryIntervalMs,
        );
        await sleep(delay);
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';

      // Check if error is retryable
      if (!isRetryableError(lastError)) {
        break;
      }

      retryCount++;
      if (retryCount <= maxRetries) {
        if (!firstFailedAt) {
          firstFailedAt = new Date().toISOString();
        }

        const delay = calculateRetryDelay(
          retryCount - 1,
          initialRetryIntervalMs,
          maxRetryIntervalMs,
        );
        await sleep(delay);
      }
    }
  }

  // Step 5: All retries exhausted or permanent error
  // Log as failed and add to dead-letter queue
  await activities.logDeliveryStatus({
    notificationId,
    to,
    subject,
    template: template as any,
    templateData,
    userId,
    metadata,
    status: 'FAILED' as any,
    errorMessage: lastError,
  });

  // Add to dead-letter queue
  let deadLetterId: string | undefined;
  try {
    const dlqResult = await activities.addToDeadLetterQueue({
      notificationId,
      to,
      subject,
      template: template as any,
      templateData,
      retryCount,
      errorMessage: lastError || 'Unknown error',
      userId,
      metadata,
      firstFailedAt: firstFailedAt || new Date().toISOString(),
    });

    deadLetterId = dlqResult.deadLetterId;
  } catch (error) {
    // Failed to add to DLQ - log but don't fail the workflow
    const dlqError =
      error instanceof Error ? error.message : 'Failed to add to DLQ';
    lastError = `${lastError} | DLQ error: ${dlqError}`;
  }

  return {
    emailId,
    status: 'FAILED',
    retryCount,
    completedAt: new Date().toISOString(),
    errorMessage: lastError,
    deadLetterId,
  };
}

/**
 * Workflow export for Temporal registration
 *
 * The workflow function and its metadata for registration with Temporal.
 */
export const workflowInfo = {
  name: 'emailSending',
  taskQueue: 'notification-workflows',
} as const;
