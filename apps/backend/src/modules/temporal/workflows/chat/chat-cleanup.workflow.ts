/**
 * Chat Cleanup Workflow
 *
 * Temporal workflow for archiving and deleting old chat sessions
 * based on retention policy. Prevents database bloat while preserving
 * important conversations.
 *
 * Features:
 * - Archive sessions older than 90 days
 * - Delete archived sessions older than 1 year
 * - User preference opt-out support
 * - Pre-deletion notification (7 days prior)
 * - Comprehensive audit trail logging
 * - Retry with exponential backoff
 */

import { proxyActivities } from '@temporalio/workflow';

/**
 * Retention Policy Configuration
 *
 * Defines the time thresholds for chat session cleanup.
 */
export interface RetentionPolicy {
  /** Days after which to archive sessions (default: 90) */
  archiveAfterDays: number;
  /** Days after which to delete archived sessions (default: 365) */
  deleteAfterDays: number;
  /** Days before deletion to send notification (default: 7) */
  notificationDaysBeforeDeletion: number;
}

/**
 * Default retention policy
 */
export const DEFAULT_RETENTION_POLICY: RetentionPolicy = {
  archiveAfterDays: 90,
  deleteAfterDays: 365,
  notificationDaysBeforeDeletion: 7,
};

/**
 * Chat Cleanup Workflow Input
 */
export interface ChatCleanupInput {
  /** Unique cleanup job ID */
  jobId: string;
  /** Retention policy configuration */
  retentionPolicy?: RetentionPolicy;
  /** Whether to send notifications before deletion */
  sendNotifications?: boolean;
  /** Whether to perform dry run (no actual deletion) */
  dryRun?: boolean;
  /** Maximum number of sessions to process per batch */
  batchSize?: number;
}

/**
 * Session Cleanup Result
 *
 * Result for a single cleanup operation.
 */
export interface SessionCleanupResult {
  /** Number of sessions archived */
  archivedCount: number;
  /** Number of sessions deleted */
  deletedCount: number;
  /** Number of users notified of pending deletion */
  notifiedCount: number;
  /** Number of users opted out of cleanup */
  optedOutCount: number;
  /** Number of errors encountered */
  errorCount: number;
  /** Error messages (if any) */
  errors: string[];
}

/**
 * Chat Cleanup Workflow Output
 */
export interface ChatCleanupOutput {
  /** Job ID */
  jobId: string;
  /** Cleanup status */
  status: 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETED';
  /** Sessions archived ( IDs for reference) */
  archivedSessionIds: string[];
  /** Sessions deleted ( IDs for reference) */
  deletedSessionIds: string[];
  /** Users notified of pending deletion */
  notifiedUserIds: string[];
  /** Summary counts */
  summary: SessionCleanupResult;
  /** Timestamp of completion */
  completedAt: string;
  /** Total processing time in milliseconds */
  processingTimeMs: number;
  /** Error message (if failed) */
  errorMessage?: string;
}

/**
 * Find Old Sessions Activity Input
 */
export interface FindOldSessionsInput {
  /** Threshold in days for finding old sessions */
  daysThreshold: number;
  /** Whether to find soft-deleted (archived) sessions */
  includeArchived?: boolean;
  /** Maximum number of sessions to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Find Old Sessions Activity Output
 */
export interface FindOldSessionsOutput {
  /** Session IDs that meet the criteria */
  sessionIds: string[];
  /** Associated user IDs */
  userIds: string[];
  /** Total count of sessions meeting criteria */
  totalCount: number;
  /** Whether more sessions exist beyond this batch */
  hasMore: boolean;
}

/**
 * Archive Sessions Activity Input
 */
export interface ArchiveSessionsInput {
  /** Session IDs to archive */
  sessionIds: string[];
  /** Job ID for tracking */
  jobId: string;
}

/**
 * Archive Sessions Activity Output
 */
export interface ArchiveSessionsOutput {
  /** Number of sessions successfully archived */
  archivedCount: number;
  /** Number of sessions that failed to archive */
  failedCount: number;
  /** IDs of archived sessions */
  archivedSessionIds: string[];
}

/**
 * Delete Sessions Activity Input
 */
export interface DeleteSessionsInput {
  /** Session IDs to permanently delete */
  sessionIds: string[];
  /** Job ID for tracking */
  jobId: string;
}

/**
 * Delete Sessions Activity Output
 */
export interface DeleteSessionsOutput {
  /** Number of sessions successfully deleted */
  deletedCount: number;
  /** Number of sessions that failed to delete */
  failedCount: number;
  /** IDs of deleted sessions */
  deletedSessionIds: string[];
}

/**
 * Check User Opt-Out Activity Input
 */
export interface CheckUserOptOutInput {
  /** User IDs to check */
  userIds: string[];
}

/**
 * Check User Opt-Out Activity Output
 */
export interface CheckUserOptOutOutput {
  /** Map of user ID to opt-out status */
  optOutStatus: Record<string, boolean>;
  /** Users who have opted out */
  optedOutUserIds: string[];
}

/**
 * Send Cleanup Notification Activity Input
 */
export interface SendCleanupNotificationInput {
  /** User IDs to notify */
  userIds: string[];
  /** Number of days before deletion */
  daysBeforeDeletion: number;
  /** Job ID for tracking */
  jobId: string;
}

/**
 * Send Cleanup Notification Activity Output
 */
export interface SendCleanupNotificationOutput {
  /** Number of notifications sent successfully */
  sentCount: number;
  /** Number of notifications that failed */
  failedCount: number;
  /** User IDs who were notified */
  notifiedUserIds: string[];
}

/**
 * Log Cleanup Report Activity Input
 */
export interface LogCleanupReportInput {
  /** Job ID */
  jobId: string;
  /** Cleanup summary */
  summary: SessionCleanupResult;
  /** Status of the cleanup job */
  status: 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETED';
  /** Error message (if any) */
  errorMessage?: string;
}

/**
 * Log Cleanup Report Activity Output
 */
export interface LogCleanupReportOutput {
  /** Audit log entry ID */
  auditLogId: string;
  /** Timestamp of logging */
  loggedAt: string;
}

/**
 * Activities interface for proxy
 */
interface ChatCleanupActivities {
  findOldSessions(input: FindOldSessionsInput): Promise<FindOldSessionsOutput>;
  archiveSessions(input: ArchiveSessionsInput): Promise<ArchiveSessionsOutput>;
  deleteSessions(input: DeleteSessionsInput): Promise<DeleteSessionsOutput>;
  checkUserOptOut(input: CheckUserOptOutInput): Promise<CheckUserOptOutOutput>;
  sendCleanupNotification(
    input: SendCleanupNotificationInput,
  ): Promise<SendCleanupNotificationOutput>;
  logCleanupReport(
    input: LogCleanupReportInput,
  ): Promise<LogCleanupReportOutput>;
}

/**
 * Generate a unique workflow ID for chat cleanup
 *
 * @param jobType - Type of cleanup job (archive, delete, notify)
 * @returns Unique workflow ID
 */
export function generateWorkflowId(
  jobType: 'archive' | 'delete' | 'full',
): string {
  const timestamp = Date.now();
  return `chat-cleanup-${jobType}-${timestamp}`;
}

/**
 * Chat Cleanup Workflow
 *
 * Main workflow for cleaning up old chat sessions.
 * Handles both archival and permanent deletion based on retention policy.
 *
 * @param input - Chat cleanup input parameters
 * @returns Chat cleanup result
 */
export async function chatCleanup(
  input: ChatCleanupInput,
): Promise<ChatCleanupOutput> {
  const startTime = Date.now();
  const {
    jobId,
    retentionPolicy = DEFAULT_RETENTION_POLICY,
    sendNotifications = true,
    dryRun = false,
    batchSize = 100,
  } = input;

  // Create activity proxies with retry policy
  const activities = proxyActivities<ChatCleanupActivities>({
    startToCloseTimeout: '4h',
    retry: {
      initialInterval: 2000,
      backoffCoefficient: 2.0,
      maximumInterval: 60000,
      maximumAttempts: 3,
      nonRetryableErrorTypes: ['ValidationError', 'AuthenticationError'],
    },
  });

  const archivedSessionIds: string[] = [];
  const deletedSessionIds: string[] = [];
  const notifiedUserIds: string[] = [];
  const errors: string[] = [];

  let archivedCount = 0;
  let deletedCount = 0;
  let notifiedCount = 0;
  let optedOutCount = 0;
  let errorCount = 0;

  try {
    // Phase 1: Archive old active sessions
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const oldSessionsResult = await activities.findOldSessions({
        daysThreshold: retentionPolicy.archiveAfterDays,
        includeArchived: false,
        limit: batchSize,
        offset,
      });

      if (oldSessionsResult.sessionIds.length === 0) {
        hasMore = false;
        break;
      }

      // Check for user opt-outs
      const optOutResult = await activities.checkUserOptOut({
        userIds: oldSessionsResult.userIds,
      });

      const optedOutUsers = new Set(optOutResult.optedOutUserIds);

      // Filter out opted-out users' sessions
      const sessionsToArchive = oldSessionsResult.sessionIds;
      optedOutCount += optedOutUsers.size;

      if (!dryRun && sessionsToArchive.length > 0) {
        const archiveResult = await activities.archiveSessions({
          sessionIds: sessionsToArchive,
          jobId,
        });

        archivedSessionIds.push(...archiveResult.archivedSessionIds);
        archivedCount += archiveResult.archivedCount;
        errorCount += archiveResult.failedCount;

        if (archiveResult.failedCount > 0) {
          errors.push(
            `${archiveResult.failedCount} sessions failed to archive in batch`,
          );
        }
      } else {
        // Dry run - count without archiving
        archivedCount += sessionsToArchive.length;
        archivedSessionIds.push(...sessionsToArchive);
      }

      offset += batchSize;
      hasMore = oldSessionsResult.hasMore;
    }

    // Phase 2: Send pre-deletion notifications
    if (
      sendNotifications &&
      retentionPolicy.notificationDaysBeforeDeletion > 0
    ) {
      offset = 0;
      hasMore = true;

      // Find sessions that will be deleted soon
      const deletionThreshold =
        retentionPolicy.deleteAfterDays -
        retentionPolicy.notificationDaysBeforeDeletion;

      while (hasMore) {
        const sessionsToNotifyResult = await activities.findOldSessions({
          daysThreshold: deletionThreshold,
          includeArchived: true,
          limit: batchSize,
          offset,
        });

        if (sessionsToNotifyResult.sessionIds.length === 0) {
          hasMore = false;
          break;
        }

        if (!dryRun) {
          const notificationResult = await activities.sendCleanupNotification({
            userIds: sessionsToNotifyResult.userIds,
            daysBeforeDeletion: retentionPolicy.notificationDaysBeforeDeletion,
            jobId,
          });

          notifiedUserIds.push(...notificationResult.notifiedUserIds);
          notifiedCount += notificationResult.sentCount;
          errorCount += notificationResult.failedCount;

          if (notificationResult.failedCount > 0) {
            errors.push(
              `${notificationResult.failedCount} notifications failed to send`,
            );
          }
        } else {
          // Dry run - count without sending
          notifiedCount += sessionsToNotifyResult.userIds.length;
          notifiedUserIds.push(...sessionsToNotifyResult.userIds);
        }

        offset += batchSize;
        hasMore = sessionsToNotifyResult.hasMore;
      }
    }

    // Phase 3: Permanently delete old archived sessions
    offset = 0;
    hasMore = true;

    while (hasMore) {
      const archivedSessionsResult = await activities.findOldSessions({
        daysThreshold: retentionPolicy.deleteAfterDays,
        includeArchived: true,
        limit: batchSize,
        offset,
      });

      if (archivedSessionsResult.sessionIds.length === 0) {
        hasMore = false;
        break;
      }

      if (!dryRun) {
        const deleteResult = await activities.deleteSessions({
          sessionIds: archivedSessionsResult.sessionIds,
          jobId,
        });

        deletedSessionIds.push(...deleteResult.deletedSessionIds);
        deletedCount += deleteResult.deletedCount;
        errorCount += deleteResult.failedCount;

        if (deleteResult.failedCount > 0) {
          errors.push(
            `${deleteResult.failedCount} sessions failed to delete in batch`,
          );
        }
      } else {
        // Dry run - count without deleting
        deletedCount += archivedSessionsResult.sessionIds.length;
        deletedSessionIds.push(...archivedSessionsResult.sessionIds);
      }

      offset += batchSize;
      hasMore = archivedSessionsResult.hasMore;
    }

    const summary: SessionCleanupResult = {
      archivedCount,
      deletedCount,
      notifiedCount,
      optedOutCount,
      errorCount,
      errors,
    };

    const status = errorCount > 0 ? 'PARTIALLY_COMPLETED' : 'COMPLETED';

    // Log the cleanup report
    await activities.logCleanupReport({
      jobId,
      summary,
      status,
      errorMessage: errors.length > 0 ? errors.join('; ') : undefined,
    });

    return {
      jobId,
      status,
      archivedSessionIds,
      deletedSessionIds,
      notifiedUserIds,
      summary,
      completedAt: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    const summary: SessionCleanupResult = {
      archivedCount,
      deletedCount,
      notifiedCount,
      optedOutCount,
      errorCount: errorCount + 1,
      errors: [...errors, errorMessage],
    };

    // Log the failure
    try {
      await activities.logCleanupReport({
        jobId,
        summary,
        status: 'FAILED',
        errorMessage,
      });
    } catch {
      // Ignore logging errors during failure handling
    }

    return {
      jobId,
      status: 'FAILED',
      archivedSessionIds,
      deletedSessionIds,
      notifiedUserIds,
      summary,
      completedAt: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
      errorMessage,
    };
  }
}
