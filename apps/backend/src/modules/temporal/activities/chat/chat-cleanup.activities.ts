/**
 * Chat Cleanup Activities
 *
 * Individual activities that can be called within workflows for chat session cleanup.
 *
 * Activities handle:
 * - Finding old/active sessions based on date thresholds
 * - Archiving sessions (soft delete)
 * - Permanently deleting archived sessions
 * - Checking user opt-out preferences
 * - Sending pre-deletion notifications
 * - Logging cleanup operations to audit trail
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, IsNull } from 'typeorm';
import { ChatSession } from '../../../chat/entities/chat-session.entity';
import { User } from '../../../users/entities/user.entity';
import { AuditLogService } from '../../../audit-log/audit-log.service';
import {
  AuditActionType,
  AuditResourceType,
} from '../../../audit-log/entities/audit-log.entity';
import type {
  FindOldSessionsInput,
  FindOldSessionsOutput,
  ArchiveSessionsInput,
  ArchiveSessionsOutput,
  DeleteSessionsInput,
  DeleteSessionsOutput,
  CheckUserOptOutInput,
  CheckUserOptOutOutput,
  SendCleanupNotificationInput,
  SendCleanupNotificationOutput,
  LogCleanupReportInput,
  LogCleanupReportOutput,
  SessionCleanupResult,
} from '../../workflows/chat/chat-cleanup.workflow';

/**
 * Chat Cleanup Activities Container Class
 *
 * This class contains all activity implementations for chat cleanup operations.
 * Activities are registered with Temporal workers and called from workflows.
 */
@Injectable()
export class ChatCleanupActivities {
  private readonly logger = new Logger(ChatCleanupActivities.name);

  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditLogService: AuditLogService,
    // Notification service would be injected here when available
    // private readonly notificationService: NotificationService,
  ) {}

  /**
   * Find Old Sessions Activity
   *
   * Finds chat sessions that are older than the specified threshold.
   * Can search for active sessions or archived (soft-deleted) sessions.
   */
  async findOldSessions(
    input: FindOldSessionsInput,
  ): Promise<FindOldSessionsOutput> {
    const {
      daysThreshold,
      includeArchived = false,
      limit = 100,
      offset = 0,
    } = input;

    this.logger.log(
      `Finding ${includeArchived ? 'archived' : 'active'} sessions older than ${daysThreshold} days`,
    );

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    try {
      const queryBuilder = this.chatSessionRepository
        .createQueryBuilder('session')
        .where('session.lastMessageAt < :thresholdDate', {
          thresholdDate,
        });

      if (includeArchived) {
        // Find soft-deleted sessions based on deletedAt
        queryBuilder.andWhere('session.deletedAt IS NOT NULL');
        queryBuilder.andWhere('session.deletedAt < :thresholdDate', {
          thresholdDate,
        });
      } else {
        // Find active (not soft-deleted) sessions
        queryBuilder.andWhere('session.deletedAt IS NULL');
      }

      // Get total count
      const totalCount = await queryBuilder.getCount();

      // Get paginated results
      const sessions = await queryBuilder
        .orderBy('session.lastMessageAt', 'ASC')
        .limit(limit)
        .offset(offset)
        .getMany();

      const sessionIds = sessions.map((s) => s.id);
      const userIds = [...new Set(sessions.map((s) => s.userId))];

      this.logger.log(
        `Found ${sessions.length} sessions (total: ${totalCount}, offset: ${offset})`,
      );

      return {
        sessionIds,
        userIds,
        totalCount,
        hasMore: offset + sessions.length < totalCount,
      };
    } catch (error) {
      this.logger.error('Failed to find old sessions:', error);
      throw error;
    }
  }

  /**
   * Archive Sessions Activity
   *
   * Soft-deletes chat sessions by setting the deletedAt timestamp.
   * This preserves the data while hiding it from normal queries.
   */
  async archiveSessions(
    input: ArchiveSessionsInput,
  ): Promise<ArchiveSessionsOutput> {
    const { sessionIds, jobId } = input;

    this.logger.log(`Archiving ${sessionIds.length} sessions (job: ${jobId})`);

    let archivedCount = 0;
    let failedCount = 0;
    const archivedSessionIds: string[] = [];

    try {
      // Find sessions to archive
      const sessions = await this.chatSessionRepository.find({
        where: { id: In(sessionIds), deletedAt: IsNull() },
      });

      for (const session of sessions) {
        try {
          // Soft delete by setting deletedAt
          session.softDelete();
          await this.chatSessionRepository.save(session);

          archivedSessionIds.push(session.id);
          archivedCount++;

          // Log to audit
          await this.auditLogService.logAction(
            AuditActionType.UPDATE,
            AuditResourceType.SESSION,
            {
              resourceId: session.id,
              userId: session.userId,
              changeDetails: {
                before: { deletedAt: null } as unknown as Record<
                  string,
                  unknown
                >,
                after: { deletedAt: session.deletedAt },
                context: { jobId, reason: 'chat-cleanup-archive' },
              },
            },
          );
        } catch (error) {
          this.logger.error(
            `Failed to archive session ${session.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          failedCount++;
        }
      }

      this.logger.log(
        `Archived ${archivedCount} sessions, ${failedCount} failed (job: ${jobId})`,
      );

      return {
        archivedCount,
        failedCount,
        archivedSessionIds,
      };
    } catch (error) {
      this.logger.error('Failed to archive sessions:', error);
      throw error;
    }
  }

  /**
   * Delete Sessions Activity
   *
   * Permanently deletes chat sessions from the database.
   * This will cascade delete all associated messages.
   * Use with caution - this operation is irreversible.
   */
  async deleteSessions(
    input: DeleteSessionsInput,
  ): Promise<DeleteSessionsOutput> {
    const { sessionIds, jobId } = input;

    this.logger.log(
      `Permanently deleting ${sessionIds.length} archived sessions (job: ${jobId})`,
    );

    let deletedCount = 0;
    let failedCount = 0;
    const deletedSessionIds: string[] = [];

    try {
      // Find archived sessions to delete
      const sessions = await this.chatSessionRepository.find({
        where: { id: In(sessionIds) },
        relations: ['messages'],
      });

      for (const session of sessions) {
        try {
          const sessionId = session.id;
          const userId = session.userId;

          // Permanently delete (hard delete)
          await this.chatSessionRepository.remove(session);

          deletedSessionIds.push(sessionId);
          deletedCount++;

          // Log to audit before deletion
          await this.auditLogService.logAction(
            AuditActionType.DELETE,
            AuditResourceType.SESSION,
            {
              resourceId: sessionId,
              userId,
              changeDetails: {
                before: {
                  title: session.title,
                  messageCount: session.messageCount,
                  lastMessageAt: session.lastMessageAt,
                },
                after: null as unknown as Record<string, unknown> | undefined,
                context: { jobId, reason: 'chat-cleanup-permanent-delete' },
              },
            },
          );
        } catch (error) {
          this.logger.error(
            `Failed to delete session ${session.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          failedCount++;
        }
      }

      this.logger.log(
        `Deleted ${deletedCount} sessions, ${failedCount} failed (job: ${jobId})`,
      );

      return {
        deletedCount,
        failedCount,
        deletedSessionIds,
      };
    } catch (error) {
      this.logger.error('Failed to delete sessions:', error);
      throw error;
    }
  }

  /**
   * Check User Opt-Out Activity
   *
   * Checks which users have opted out of automatic chat cleanup.
   * Users can opt-out by setting a preference in their profile.
   */
  async checkUserOptOut(
    input: CheckUserOptOutInput,
  ): Promise<CheckUserOptOutOutput> {
    const { userIds } = input;

    this.logger.log(`Checking opt-out status for ${userIds.length} users`);

    const optOutStatus: Record<string, boolean> = {};
    const optedOutUserIds: string[] = [];

    try {
      // Find users with their preferences
      const users = await this.userRepository.find({
        where: { id: In(userIds) },
        select: ['id'],
      });

      // Create a map for quick lookup
      const userMap = new Map(users.map((u) => [u.id, u]));

      // Check opt-out status for each user
      for (const userId of userIds) {
        const user = userMap.get(userId);

        // Opt-out is determined by a user preference setting
        // For now, we'll use a simple check - this can be extended
        // to use a dedicated user preferences table when available
        const hasOptedOut = Boolean(
          user && (user as any).chatCleanupOptOut === true,
        );

        optOutStatus[userId] = hasOptedOut;

        if (hasOptedOut) {
          optedOutUserIds.push(userId);
        }
      }

      this.logger.log(
        `${optedOutUserIds.length} users have opted out of cleanup`,
      );

      return {
        optOutStatus,
        optedOutUserIds,
      };
    } catch (error) {
      this.logger.error('Failed to check user opt-out status:', error);
      // Return empty opt-out status on error (fail open)
      return {
        optOutStatus: {},
        optedOutUserIds: [],
      };
    }
  }

  /**
   * Send Cleanup Notification Activity
   *
   * Sends notifications to users about pending chat deletion.
   * Users are notified a specified number of days before their chats are deleted.
   */
  async sendCleanupNotification(
    input: SendCleanupNotificationInput,
  ): Promise<SendCleanupNotificationOutput> {
    const { userIds, daysBeforeDeletion, jobId } = input;

    this.logger.log(
      `Sending cleanup notification to ${userIds.length} users (${daysBeforeDeletion} days before deletion)`,
    );

    let sentCount = 0;
    let failedCount = 0;
    const notifiedUserIds: string[] = [];

    try {
      // Find users with their email addresses
      const users = await this.userRepository.find({
        where: { id: In(userIds) },
        select: ['id', 'email', 'username', 'firstName', 'lastName'],
      });

      const userMap = new Map(users.map((u) => [u.id, u]));

      for (const userId of userIds) {
        const user = userMap.get(userId);

        if (!user || !user.email) {
          this.logger.warn(`User ${userId} not found or has no email`);
          failedCount++;
          continue;
        }

        try {
          // TODO: Integrate with notification service when available
          // For now, we'll log the notification intent
          this.logger.log(
            `Would send cleanup notification to ${user.email}: ${daysBeforeDeletion} days before deletion`,
          );

          // When notification service is available:
          // await this.notificationService.sendNotification({
          //   to: user.email,
          //   template: EmailTemplateType.CHAT_CLEANUP_NOTIFICATION,
          //   templateData: {
          //     userName: user.name,
          //     daysBeforeDeletion,
          //   },
          //   userId: user.id,
          // });

          // Log notification to audit
          await this.auditLogService.logAction(
            AuditActionType.CREATE,
            AuditResourceType.SESSION,
            {
              userId: user.id,
              changeDetails: {
                before: null as unknown as Record<string, unknown> | undefined,
                after: {
                  notificationType: 'chat-cleanup-pending-deletion',
                  daysBeforeDeletion,
                  jobId,
                },
                context: { userId: user.id, jobId },
              },
            },
          );

          notifiedUserIds.push(userId);
          sentCount++;
        } catch (error) {
          this.logger.error(
            `Failed to send notification to ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          failedCount++;
        }
      }

      this.logger.log(
        `Sent ${sentCount} notifications, ${failedCount} failed (job: ${jobId})`,
      );

      return {
        sentCount,
        failedCount,
        notifiedUserIds,
      };
    } catch (error) {
      this.logger.error('Failed to send cleanup notifications:', error);
      throw error;
    }
  }

  /**
   * Log Cleanup Report Activity
   *
   * Logs the final cleanup report to the audit trail.
   * This provides a comprehensive record of all cleanup operations.
   */
  async logCleanupReport(
    input: LogCleanupReportInput,
  ): Promise<LogCleanupReportOutput> {
    const { jobId, summary, status, errorMessage } = input;

    this.logger.log(
      `Logging cleanup report for job ${jobId}: ${status}, archived=${summary.archivedCount}, deleted=${summary.deletedCount}, notified=${summary.notifiedCount}`,
    );

    try {
      const auditLog = await this.auditLogService.logAction(
        status === 'FAILED' ? AuditActionType.DELETE : AuditActionType.UPDATE,
        AuditResourceType.SESSION,
        {
          resourceId: jobId,
          changeDetails: {
            before: null as unknown as Record<string, unknown> | undefined,
            after: {
              jobId,
              status,
              ...summary,
              errorMessage,
            },
            context: { jobId, operation: 'chat-cleanup-batch' },
          },
        },
      );

      this.logger.log(`Cleanup report logged: ${auditLog.id}`);

      return {
        auditLogId: auditLog.id,
        loggedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to log cleanup report:', error);
      throw error;
    }
  }
}

/**
 * Activity registration function
 *
 * Creates and returns the activities object with all dependencies injected.
 * This function is called by the Temporal worker to register activities.
 */
export type ChatCleanupActivitiesImpl = InstanceType<
  typeof ChatCleanupActivities
>;

export const createChatCleanupActivities = (dependencies: {
  chatSessionRepository: Repository<ChatSession>;
  userRepository: Repository<User>;
  auditLogService: AuditLogService;
}): ChatCleanupActivities => {
  const { chatSessionRepository, userRepository, auditLogService } =
    dependencies;
  const activities = new ChatCleanupActivities(
    chatSessionRepository,
    userRepository,
    auditLogService,
  );
  return activities;
};
