/**
 * Chat Cleanup Scheduler Service
 *
 * Service for managing scheduled chat cleanup workflows.
 * Uses Temporal's built-in schedule functionality for cron-like execution.
 *
 * Features:
 * - Weekly scheduled cleanup (Sunday 2 AM)
 * - Configurable retention policy
 * - Schedule management (create, list, pause, resume, delete)
 * - Manual trigger capability
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TemporalService } from '../../temporal.service';
import { ChatCleanupStarter } from './chat-cleanup.starter';
import {
  DEFAULT_RETENTION_POLICY,
  type RetentionPolicy,
} from './chat-cleanup.workflow';

/**
 * Chat Cleanup Schedule Configuration
 *
 * Configuration for a chat cleanup schedule.
 */
export interface ChatCleanupSchedule {
  /** Unique schedule ID */
  scheduleId: string;
  /** Cron expression for execution schedule */
  cronExpression: string;
  /** Retention policy for this schedule */
  retentionPolicy: RetentionPolicy;
  /** Whether the schedule is paused */
  paused: boolean;
  /** Whether to send notifications before deletion */
  sendNotifications: boolean;
  /** Description of the schedule */
  description?: string;
}

/**
 * Schedule Creation Options
 *
 * Options for creating a new schedule.
 */
export interface CreateCleanupScheduleOptions {
  /** Cron expression (default: weekly Sunday at 2 AM) */
  cronExpression?: string;
  /** Archive sessions older than this many days */
  archiveAfterDays?: number;
  /** Delete archived sessions older than this many days */
  deleteAfterDays?: number;
  /** Days before deletion to notify users */
  notificationDaysBeforeDeletion?: number;
  /** Whether to send notifications */
  sendNotifications?: boolean;
  /** Description of the schedule */
  description?: string;
}

/**
 * Schedule Info
 *
 * Information about a schedule.
 */
export interface ScheduleInfo {
  /** Schedule ID */
  scheduleId: string;
  /** Action description */
  action: string;
  /** Cron expression */
  cronExpression: string;
  /** Whether the schedule is paused */
  paused: boolean;
  /** Last run time */
  lastRunAt?: Date;
  /** Next run time */
  nextRunAt?: Date;
  /** Number of successful runs */
  successfulRuns: number;
  /** Number of failed runs */
  failedRuns: number;
  /** Description */
  description?: string;
}

/**
 * Default cron expressions for common schedules
 */
export const DEFAULT_CRON_EXPRESSIONS = {
  /** Weekly on Sunday at 2:00 AM */
  WEEKLY_SUNDAY_2AM: '0 2 * * 0',
  /** Weekly on Sunday at 3:00 AM */
  WEEKLY_SUNDAY_3AM: '0 3 * * 0',
  /** Daily at 2:00 AM */
  DAILY_2AM: '0 2 * * *',
  /** Daily at 3:00 AM */
  DAILY_3AM: '0 3 * * *',
  /** Monthly on the 1st at 2:00 AM */
  MONTHLY_1ST_2AM: '0 2 1 * *',
} as const;

/**
 * Default schedule ID for chat cleanup
 */
export const CHAT_CLEANUP_SCHEDULE_ID = 'chat-cleanup-weekly';

/**
 * Chat Cleanup Scheduler Service
 *
 * Manages scheduled chat cleanup workflows using Temporal schedules.
 *
 * Key Features:
 * - Create schedules with custom cron expressions
 * - Pause/resume schedules
 * - Delete schedules
 * - List all schedules
 * - Get schedule status
 * - Manual trigger
 */
@Injectable()
export class ChatCleanupSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(ChatCleanupSchedulerService.name);
  private readonly schedules: Map<string, ChatCleanupSchedule> = new Map();
  private readonly initPromise: Promise<void>;

  constructor(
    private readonly temporalService: TemporalService,
    private readonly chatCleanupStarter: ChatCleanupStarter,
  ) {
    this.initPromise = this.onModuleInit();
  }

  /**
   * NestJS lifecycle hook - called when the module is initialized
   *
   * Creates the default weekly cleanup schedule.
   * Skips creation if it already exists.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing default chat cleanup schedule...');

    try {
      const defaultSchedule: CreateCleanupScheduleOptions = {
        cronExpression: DEFAULT_CRON_EXPRESSIONS.WEEKLY_SUNDAY_2AM,
        archiveAfterDays: DEFAULT_RETENTION_POLICY.archiveAfterDays,
        deleteAfterDays: DEFAULT_RETENTION_POLICY.deleteAfterDays,
        notificationDaysBeforeDeletion:
          DEFAULT_RETENTION_POLICY.notificationDaysBeforeDeletion,
        sendNotifications: true,
        description:
          'Weekly chat cleanup: archive sessions older than 90 days, delete archived sessions older than 1 year',
      };

      // Check if schedule already exists
      const existing = await this.temporalService.describeSchedule(
        CHAT_CLEANUP_SCHEDULE_ID,
      );

      if (existing.exists) {
        this.logger.log(
          `Chat cleanup schedule ${CHAT_CLEANUP_SCHEDULE_ID} already exists, loading into cache`,
        );

        this.schedules.set(CHAT_CLEANUP_SCHEDULE_ID, {
          scheduleId: CHAT_CLEANUP_SCHEDULE_ID,
          cronExpression: DEFAULT_CRON_EXPRESSIONS.WEEKLY_SUNDAY_2AM,
          retentionPolicy: DEFAULT_RETENTION_POLICY,
          paused: existing.paused ?? false,
          sendNotifications: true,
          description: defaultSchedule.description,
        });
      } else {
        // Create new default schedule
        await this.createSchedule(defaultSchedule);
      }

      this.logger.log(
        `Initialized ${this.schedules.size} chat cleanup schedule(s)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize default chat cleanup schedule: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  /**
   * Create a new schedule
   *
   * Creates a Temporal schedule for chat cleanup.
   *
   * @param options - Schedule creation options
   * @returns Schedule ID
   */
  async createSchedule(
    options: CreateCleanupScheduleOptions = {},
  ): Promise<string> {
    const {
      cronExpression = DEFAULT_CRON_EXPRESSIONS.WEEKLY_SUNDAY_2AM,
      archiveAfterDays = DEFAULT_RETENTION_POLICY.archiveAfterDays,
      deleteAfterDays = DEFAULT_RETENTION_POLICY.deleteAfterDays,
      notificationDaysBeforeDeletion = DEFAULT_RETENTION_POLICY.notificationDaysBeforeDeletion,
      sendNotifications = true,
      description,
    } = options;

    const scheduleId = CHAT_CLEANUP_SCHEDULE_ID;

    // Check if schedule already exists in local cache
    if (this.schedules.has(scheduleId)) {
      this.logger.warn(`Schedule ${scheduleId} already exists in cache`);
      return scheduleId;
    }

    this.logger.log(
      `Creating schedule ${scheduleId} with cron: ${cronExpression}`,
    );

    const retentionPolicy: RetentionPolicy = {
      archiveAfterDays,
      deleteAfterDays,
      notificationDaysBeforeDeletion,
    };

    // Create the schedule in Temporal
    try {
      await this.temporalService.createSchedule({
        scheduleId,
        action: {
          type: 'startWorkflow',
          workflowType: 'chatCleanup',
          workflowId: `scheduled-chat-cleanup-${Date.now()}`,
          taskQueue: 'legal-ai-task-queue',
          args: [
            {
              jobId: `scheduled-${Date.now()}`,
              retentionPolicy,
              sendNotifications,
              dryRun: false,
              batchSize: 100,
            },
          ],
        },
        spec: {
          cronExpressions: [{ expression: cronExpression }],
        },
        policies: {
          overlap: 'SKIP',
        },
        memo: {
          description: description || 'Chat cleanup schedule',
        },
      });

      const schedule: ChatCleanupSchedule = {
        scheduleId,
        cronExpression,
        retentionPolicy,
        paused: false,
        sendNotifications,
        description,
      };

      this.schedules.set(scheduleId, schedule);

      this.logger.log(`Schedule ${scheduleId} created successfully`);

      return scheduleId;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // If schedule already exists in Temporal, just log and add to cache
      if (errorMessage.includes('already exists')) {
        this.logger.log(
          `Schedule ${scheduleId} already exists in Temporal, adding to cache`,
        );

        const existing =
          await this.temporalService.describeSchedule(scheduleId);

        const schedule: ChatCleanupSchedule = {
          scheduleId,
          cronExpression,
          retentionPolicy,
          paused: existing.paused ?? false,
          sendNotifications,
          description,
        };

        this.schedules.set(scheduleId, schedule);

        return scheduleId;
      }

      this.logger.error(
        `Failed to create schedule ${scheduleId}: ${errorMessage}`,
        error,
      );
      throw error;
    }
  }

  /**
   * List all schedules
   *
   * @returns Array of schedule info
   */
  async listSchedules(): Promise<ScheduleInfo[]> {
    const scheduleInfos: ScheduleInfo[] = [];

    for (const [scheduleId, schedule] of this.schedules.entries()) {
      try {
        const description =
          await this.temporalService.describeSchedule(scheduleId);

        scheduleInfos.push({
          scheduleId,
          action: 'chatCleanup',
          cronExpression: schedule.cronExpression,
          paused: schedule.paused,
          lastRunAt: (description as any)?.lastRunAt,
          nextRunAt: (description as any)?.nextRunAt,
          successfulRuns: (description as any)?.successfulActions || 0,
          failedRuns: (description as any)?.failedActions || 0,
          description: schedule.description,
        });
      } catch {
        // Schedule might not exist in Temporal yet
        scheduleInfos.push({
          scheduleId,
          action: 'chatCleanup',
          cronExpression: schedule.cronExpression,
          paused: schedule.paused,
          successfulRuns: 0,
          failedRuns: 0,
          description: schedule.description,
        });
      }
    }

    return scheduleInfos;
  }

  /**
   * Get schedule info
   *
   * @returns Schedule info or null if not found
   */
  async getScheduleInfo(
    scheduleId: string = CHAT_CLEANUP_SCHEDULE_ID,
  ): Promise<ScheduleInfo | null> {
    const schedule = this.schedules.get(scheduleId);

    if (!schedule) {
      return null;
    }

    try {
      const description =
        await this.temporalService.describeSchedule(scheduleId);

      return {
        scheduleId,
        action: 'chatCleanup',
        cronExpression: schedule.cronExpression,
        paused: schedule.paused,
        lastRunAt: (description as any)?.lastRunAt,
        nextRunAt: (description as any)?.nextRunAt,
        successfulRuns: (description as any)?.successfulActions || 0,
        failedRuns: (description as any)?.failedActions || 0,
        description: schedule.description,
      };
    } catch {
      return {
        scheduleId,
        action: 'chatCleanup',
        cronExpression: schedule.cronExpression,
        paused: schedule.paused,
        successfulRuns: 0,
        failedRuns: 0,
        description: schedule.description,
      };
    }
  }

  /**
   * Pause a schedule
   *
   * @param scheduleId - Schedule ID to pause (default: main cleanup schedule)
   * @returns True if paused, false otherwise
   */
  async pauseSchedule(
    scheduleId: string = CHAT_CLEANUP_SCHEDULE_ID,
  ): Promise<boolean> {
    const schedule = this.schedules.get(scheduleId);

    if (!schedule) {
      this.logger.warn(`Schedule ${scheduleId} not found`);
      return false;
    }

    if (schedule.paused) {
      this.logger.debug(`Schedule ${scheduleId} is already paused`);
      return true;
    }

    try {
      await this.temporalService.pauseSchedule(scheduleId);
      schedule.paused = true;
      this.logger.log(`Schedule ${scheduleId} paused`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to pause schedule ${scheduleId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Resume a paused schedule
   *
   * @param scheduleId - Schedule ID to resume (default: main cleanup schedule)
   * @returns True if resumed, false otherwise
   */
  async resumeSchedule(
    scheduleId: string = CHAT_CLEANUP_SCHEDULE_ID,
  ): Promise<boolean> {
    const schedule = this.schedules.get(scheduleId);

    if (!schedule) {
      this.logger.warn(`Schedule ${scheduleId} not found`);
      return false;
    }

    if (!schedule.paused) {
      this.logger.debug(`Schedule ${scheduleId} is not paused`);
      return true;
    }

    try {
      await this.temporalService.resumeSchedule(scheduleId);
      schedule.paused = false;
      this.logger.log(`Schedule ${scheduleId} resumed`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to resume schedule ${scheduleId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Delete a schedule
   *
   * @param scheduleId - Schedule ID to delete (default: main cleanup schedule)
   * @returns True if deleted, false otherwise
   */
  async deleteSchedule(
    scheduleId: string = CHAT_CLEANUP_SCHEDULE_ID,
  ): Promise<boolean> {
    const schedule = this.schedules.get(scheduleId);

    if (!schedule) {
      this.logger.warn(`Schedule ${scheduleId} not found`);
      return false;
    }

    try {
      await this.temporalService.deleteSchedule(scheduleId);
      this.schedules.delete(scheduleId);
      this.logger.log(`Schedule ${scheduleId} deleted`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to delete schedule ${scheduleId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Trigger a schedule immediately
   *
   * Manually triggers the cleanup workflow without waiting for the cron.
   *
   * @param scheduleId - Schedule ID to trigger (default: main cleanup schedule)
   * @returns Workflow start result or null
   */
  async triggerSchedule(
    scheduleId: string = CHAT_CLEANUP_SCHEDULE_ID,
  ): Promise<{
    workflowId: string;
    runId: string;
  } | null> {
    const schedule = this.schedules.get(scheduleId);

    if (!schedule) {
      this.logger.warn(`Schedule ${scheduleId} not found`);
      return null;
    }

    this.logger.log(`Triggering schedule ${scheduleId} immediately`);

    try {
      const result = await this.chatCleanupStarter.startChatCleanup({
        retentionPolicy: schedule.retentionPolicy,
        sendNotifications: schedule.sendNotifications,
      });

      return {
        workflowId: result.workflowId,
        runId: result.runId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to trigger schedule ${scheduleId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  /**
   * Update retention policy for a schedule
   *
   * @param retentionPolicy - New retention policy
   * @param scheduleId - Schedule ID to update (default: main cleanup schedule)
   * @returns True if updated, false otherwise
   */
  async updateRetentionPolicy(
    retentionPolicy: Partial<RetentionPolicy>,
    scheduleId: string = CHAT_CLEANUP_SCHEDULE_ID,
  ): Promise<boolean> {
    const schedule = this.schedules.get(scheduleId);

    if (!schedule) {
      this.logger.warn(`Schedule ${scheduleId} not found`);
      return false;
    }

    // Update the local cache
    schedule.retentionPolicy = {
      ...schedule.retentionPolicy,
      ...retentionPolicy,
    };

    // Note: Temporal schedules require recreation to update args
    // In production, you might want to delete and recreate the schedule
    this.logger.log(
      `Updated retention policy for schedule ${scheduleId}: ${JSON.stringify(retentionPolicy)}`,
    );

    return true;
  }
}
