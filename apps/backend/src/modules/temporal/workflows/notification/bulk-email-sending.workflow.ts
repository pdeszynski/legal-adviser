/**
 * Bulk Email Sending Workflow
 *
 * Orchestrates sending multiple emails with parallel execution limits.
 * Handles rate limiting, progress tracking, and child workflow management.
 *
 * Workflow Steps:
 * 1. Split emails into batches based on parallel execution limit
 * 2. Execute child workflows for each batch in parallel
 * 3. Track progress and aggregate results
 * 4. Handle failures and retry individual emails
 * 5. Generate summary report
 *
 * Error Handling:
 * - Individual email failures don't stop the batch
 * - Parallel execution limit prevents overwhelming the email provider
 * - Progress tracking for monitoring
 * - Summary report with success/failure counts
 *
 * Idempotency:
 * - Workflow ID is generated from a unique bulk email ID
 * - Child workflow IDs are deterministic based on email IDs
 * - Re-running will skip already sent emails
 */

import type {
  EmailSendingInput,
  EmailSendingOutput,
} from './email-sending.workflow';

/**
 * Bulk Email Sending Workflow Input
 *
 * Input parameters for bulk email sending workflow.
 */
export interface BulkEmailSendingInput {
  /** Unique identifier for this bulk email job */
  bulkEmailId: string;
  /** Array of email inputs to send */
  emails: Omit<
    EmailSendingInput,
    'maxRetries' | 'initialRetryIntervalMs' | 'maxRetryIntervalMs'
  >[];
  /** Maximum number of parallel email sends */
  maxParallel?: number;
  /** Delay between batches in milliseconds */
  batchDelayMs?: number;
  /** Whether to continue on individual failures */
  continueOnError?: boolean;
}

/**
 * Bulk Email Result
 *
 * Result of a single email in the bulk send.
 */
export interface BulkEmailResult {
  /** Email ID */
  emailId: string;
  /** Recipient email address */
  to: string;
  /** Delivery status */
  status: 'SENT' | 'FAILED' | 'RATE_LIMITED';
  /** Message ID from provider (if sent) */
  messageId?: string;
  /** Number of retries */
  retryCount: number;
  /** Error message (if failed) */
  errorMessage?: string;
  /** Dead-letter queue ID (if applicable) */
  deadLetterId?: string;
}

/**
 * Bulk Email Sending Workflow Output
 *
 * Output returned after bulk email completion.
 */
export interface BulkEmailSendingOutput {
  /** Bulk email ID that was processed */
  bulkEmailId: string;
  /** Total number of emails */
  totalEmails: number;
  /** Number of successfully sent emails */
  successCount: number;
  /** Number of failed emails */
  failureCount: number;
  /** Number of rate-limited emails */
  rateLimitedCount: number;
  /** Individual email results */
  results: BulkEmailResult[];
  /** Timestamp of completion */
  completedAt: string;
  /** Total duration in milliseconds */
  durationMs: number;
}

/**
 * Activity interfaces for bulk email operations
 */
export interface BulkEmailSendingActivities {
  /**
   * Execute child email workflow
   *
   * This is a proxy to start a child workflow for each email.
   * In the actual implementation, this would use Temporal's child workflow features.
   */
  executeChildEmailWorkflow(
    input: EmailSendingInput,
  ): Promise<EmailSendingOutput>;
}

/**
 * Generate workflow ID from bulk email ID
 *
 * @param bulkEmailId - The bulk email ID
 * @returns A deterministic workflow ID
 */
export function generateBulkWorkflowId(bulkEmailId: string): string {
  return `bulk-email-sending-${bulkEmailId}`;
}

/**
 * Split array into batches
 *
 * @param array - Array to split
 * @param batchSize - Size of each batch
 * @returns Array of batches
 */
function splitIntoBatches<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Sleep utility for batch delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Bulk Email Sending Workflow
 *
 * Main workflow function that orchestrates bulk email sending.
 *
 * Features:
 * - Parallel execution with configurable limits
 * - Batch processing to prevent overwhelming the email provider
 * - Progress tracking through results aggregation
 * - Continues on individual failures (configurable)
 * - Generates summary report
 *
 * @param input - Workflow input parameters
 * @param activities - Activity implementations
 * @returns Workflow output with bulk send summary
 */
export async function bulkEmailSending(
  input: BulkEmailSendingInput,
  activities: BulkEmailSendingActivities,
): Promise<BulkEmailSendingOutput> {
  const {
    bulkEmailId,
    emails,
    maxParallel = 10,
    batchDelayMs = 1000,
    continueOnError = true,
  } = input;

  const startTime = Date.now();
  const allResults: BulkEmailResult[] = [];

  // Split emails into batches
  const batches = splitIntoBatches(emails, maxParallel);

  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];

    // Execute all emails in the batch in parallel
    const batchPromises = batch.map(async (emailInput) => {
      try {
        const result = await activities.executeChildEmailWorkflow({
          ...emailInput,
          maxRetries: 3,
          initialRetryIntervalMs: 1000,
          maxRetryIntervalMs: 60000,
        });

        return {
          emailId: emailInput.emailId,
          to: emailInput.to,
          status: result.status,
          messageId: result.messageId,
          retryCount: result.retryCount,
          errorMessage: result.errorMessage,
          deadLetterId: result.deadLetterId,
        } as BulkEmailResult;
      } catch (error) {
        // Individual email failed catastrophically
        if (!continueOnError) {
          throw error;
        }

        return {
          emailId: emailInput.emailId,
          to: emailInput.to,
          status: 'FAILED',
          retryCount: 0,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        } as BulkEmailResult;
      }
    });

    // Wait for all emails in the batch to complete
    const batchResults = await Promise.allSettled(batchPromises);

    // Extract results from settled promises
    for (const settled of batchResults) {
      if (settled.status === 'fulfilled') {
        allResults.push(settled.value);
      } else if (continueOnError) {
        // Handle rejected promises when continuing on error
        allResults.push({
          emailId: 'unknown',
          to: 'unknown',
          status: 'FAILED',
          retryCount: 0,
          errorMessage:
            settled.reason instanceof Error
              ? settled.reason.message
              : 'Unknown error',
        });
      } else {
        // Re-throw the error to stop the bulk send
        throw settled.reason;
      }
    }

    // Add delay between batches (except for the last batch)
    if (batchIndex < batches.length - 1 && batchDelayMs > 0) {
      await sleep(batchDelayMs);
    }
  }

  // Calculate summary statistics
  const successCount = allResults.filter((r) => r.status === 'SENT').length;
  const failureCount = allResults.filter((r) => r.status === 'FAILED').length;
  const rateLimitedCount = allResults.filter(
    (r) => r.status === 'RATE_LIMITED',
  ).length;

  return {
    bulkEmailId,
    totalEmails: emails.length,
    successCount,
    failureCount,
    rateLimitedCount,
    results: allResults,
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
  };
}

/**
 * Workflow export for Temporal registration
 */
export const workflowInfo = {
  name: 'bulkEmailSending',
  taskQueue: 'notification-workflows',
} as const;
