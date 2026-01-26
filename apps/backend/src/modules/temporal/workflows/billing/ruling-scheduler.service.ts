/**
 * Ruling Indexing Scheduler Service
 *
 * Service for managing scheduled ruling indexing workflows.
 * Uses Temporal's built-in schedule functionality for cron-like execution.
 *
 * Features:
 * - Nightly sync of recent rulings from SAOS/ISAP
 * - Configurable cron schedules
 * - Schedule management (create, list, pause, resume, delete)
 * - Backoff for missed schedules
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TemporalService } from '../../temporal.service';
import { RulingIndexingStarter } from './ruling-indexing.starter';
import { RulingBackfillStarter } from './ruling-backfill.starter';
import { RulingSource } from './ruling-indexing.workflow';

/**
 * Schedule Configuration
 *
 * Configuration for a ruling indexing schedule.
 */
export interface RulingIndexingSchedule {
  /** Unique schedule ID */
  scheduleId: string;
  /** Data source to sync */
  source: RulingSource;
  /** Cron expression for execution schedule */
  cronExpression: string;
  /** Number of days back to sync */
  daysBack: number;
  /** Whether the schedule is paused */
  paused: boolean;
  /** Description of the schedule */
  description?: string;
}

/**
 * Schedule Creation Options
 *
 * Options for creating a new schedule.
 */
export interface CreateScheduleOptions {
  /** Data source to sync */
  source: RulingSource;
  /** Cron expression (default: nightly at 2 AM) */
  cronExpression?: string;
  /** Number of days back to sync (default: 1) */
  daysBack?: number;
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
  /** Action to execute */
  action: string;
  /** Cron expression */
  cronExpression: string;
  /** Whether the schedule is paused */
  paused: boolean;
  /** Last run time */
  lastRunAt?: string;
  /** Next run time */
  nextRunAt?: string;
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
  /** Nightly at 2:00 AM */
  NIGHTLY_2AM: '0 2 * * *',
  /** Nightly at 3:00 AM */
  NIGHTLY_3AM: '0 3 * * *',
  /** Daily at midnight */
  DAILY_MIDNIGHT: '0 0 * * *',
  /** Weekly on Sunday at 3:00 AM */
  WEEKLY_SUNDAY_3AM: '0 3 * * 0',
  /** Hourly */
  HOURLY: '0 * * * *',
} as const;

/**
 * Ruling Indexing Scheduler Service
 *
 * Manages scheduled ruling indexing workflows using Temporal schedules.
 *
 * Key Features:
 * - Create schedules with custom cron expressions
 * - Pause/resume schedules
 * - Delete schedules
 * - List all schedules
 * - Get schedule status
 */
@Injectable()
export class RulingIndexingSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(RulingIndexingSchedulerService.name);
  private readonly schedules: Map<string, RulingIndexingSchedule> = new Map();
  private readonly initPromise: Promise<void>;

  constructor(
    private readonly temporalService: TemporalService,
    private readonly rulingIndexingStarter: RulingIndexingStarter,
    private readonly rulingBackfillStarter: RulingBackfillStarter,
  ) {
    // Store initialization promise for potential await
    this.initPromise = this.onModuleInit();
  }

  /**
   * NestJS lifecycle hook - called when the module is initialized
   *
   * Creates default schedules for nightly sync.
   * Skips schedules that already exist to avoid conflicts.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing default ruling indexing schedules...');

    const defaultSchedules: CreateScheduleOptions[] = [
      {
        source: RulingSource.SAOS,
        cronExpression: DEFAULT_CRON_EXPRESSIONS.NIGHTLY_2AM,
        daysBack: 1,
        description: 'Nightly sync of SAOS rulings (last 1 day)',
      },
      {
        source: RulingSource.ISAP,
        cronExpression: DEFAULT_CRON_EXPRESSIONS.NIGHTLY_2AM,
        daysBack: 1,
        description: 'Nightly sync of ISAP rulings (last 1 day)',
      },
      {
        source: RulingSource.SAOS,
        cronExpression: DEFAULT_CRON_EXPRESSIONS.WEEKLY_SUNDAY_3AM,
        daysBack: 7,
        description: 'Weekly deep sync of SAOS rulings (last 7 days)',
      },
      {
        source: RulingSource.ISAP,
        cronExpression: DEFAULT_CRON_EXPRESSIONS.WEEKLY_SUNDAY_3AM,
        daysBack: 7,
        description: 'Weekly deep sync of ISAP rulings (last 7 days)',
      },
    ];

    for (const options of defaultSchedules) {
      try {
        const scheduleId = this.generateScheduleId(
          options.source,
          options.cronExpression || DEFAULT_CRON_EXPRESSIONS.NIGHTLY_2AM,
        );

        // Check if schedule already exists before trying to create it
        const existing = await this.temporalService.describeSchedule(scheduleId);

        if (existing.exists) {
          this.logger.log(
            `Schedule ${scheduleId} already exists, skipping creation`,
          );
          // Add to local cache
          this.schedules.set(scheduleId, {
            scheduleId,
            source: options.source,
            cronExpression:
              options.cronExpression || DEFAULT_CRON_EXPRESSIONS.NIGHTLY_2AM,
            daysBack: options.daysBack || 1,
            paused: existing.paused ?? false,
            description: options.description,
          });
        } else {
          // Create new schedule
          await this.createSchedule(options);
        }
      } catch (error) {
        // Log error but don't crash the application
        this.logger.error(
          `Failed to initialize schedule for ${options.source}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error,
        );
      }
    }

    this.logger.log(
      `Initialized ${this.schedules.size} ruling indexing schedules`,
    );
  }

  /**
   * Create a new schedule
   *
   * Creates a Temporal schedule for ruling indexing.
   * If the schedule already exists in Temporal, it will be loaded into the local cache.
   *
   * @param options - Schedule creation options
   * @returns Schedule ID
   */
  async createSchedule(options: CreateScheduleOptions): Promise<string> {
    const {
      source,
      cronExpression = DEFAULT_CRON_EXPRESSIONS.NIGHTLY_2AM,
      daysBack = 1,
      description,
    } = options;

    const scheduleId = this.generateScheduleId(source, cronExpression);

    // Check if schedule already exists in local cache
    if (this.schedules.has(scheduleId)) {
      this.logger.warn(`Schedule ${scheduleId} already exists in cache`);
      return scheduleId;
    }

    this.logger.log(
      `Creating schedule ${scheduleId} for source ${source} with cron: ${cronExpression}`,
    );

    // Create the schedule in Temporal
    try {
      await this.temporalService.createSchedule({
        scheduleId,
        action: {
          type: 'startWorkflow',
          workflowType: 'rulingIndexing',
          workflowId: `scheduled-${source.toLowerCase()}-${Date.now()}`,
          taskQueue: 'legal-ai-task-queue',
          args: [
            {
              jobId: `scheduled-${source.toLowerCase()}-${Date.now()}`,
              source,
              dateFrom: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000),
              dateTo: new Date(),
              batchSize: 100,
              updateExisting: true,
            },
          ],
        },
        spec: {
          cronExpressions: [{ expression: cronExpression }],
        },
        policies: {
          overlap: 'SKIP',
        },
      });

      const schedule: RulingIndexingSchedule = {
        scheduleId,
        source,
        cronExpression,
        daysBack,
        paused: false,
        description,
      };

      this.schedules.set(scheduleId, schedule);

      this.logger.log(`Schedule ${scheduleId} created successfully`);

      return scheduleId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // If schedule already exists in Temporal, just log and add to cache
      if (errorMessage.includes('already exists')) {
        this.logger.log(
          `Schedule ${scheduleId} already exists in Temporal, adding to cache`,
        );

        // Check if it's paused
        const existing = await this.temporalService.describeSchedule(scheduleId);

        const schedule: RulingIndexingSchedule = {
          scheduleId,
          source,
          cronExpression,
          daysBack,
          paused: existing.paused ?? false,
          description,
        };

        this.schedules.set(scheduleId, schedule);

        return scheduleId;
      }

      // For other errors, log and rethrow
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
          action: `rulingIndexing for ${schedule.source}`,
          cronExpression: schedule.cronExpression,
          paused: schedule.paused,
          lastRunAt: (description as any)?.lastRunAt,
          nextRunAt: (description as any)?.nextRunAt,
          successfulRuns: (description as any)?.successfulRuns || 0,
          failedRuns: (description as any)?.failedRuns || 0,
          description: schedule.description,
        });
      } catch {
        // Schedule might not exist in Temporal yet
        scheduleInfos.push({
          scheduleId,
          action: `rulingIndexing for ${schedule.source}`,
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
   * Pause a schedule
   *
   * @param scheduleId - Schedule ID to pause
   * @returns True if paused, false otherwise
   */
  async pauseSchedule(scheduleId: string): Promise<boolean> {
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
   * @param scheduleId - Schedule ID to resume
   * @returns True if resumed, false otherwise
   */
  async resumeSchedule(scheduleId: string): Promise<boolean> {
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
   * @param scheduleId - Schedule ID to delete
   * @returns True if deleted, false otherwise
   */
  async deleteSchedule(scheduleId: string): Promise<boolean> {
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
   * Manually triggers the workflow for a schedule without waiting for the cron.
   *
   * @param scheduleId - Schedule ID to trigger
   * @returns Workflow start result
   */
  async triggerSchedule(scheduleId: string): Promise<{
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
      const result = await this.rulingIndexingStarter.startRulingIndexing({
        source: schedule.source,
        dateFrom: new Date(
          Date.now() - schedule.daysBack * 24 * 60 * 60 * 1000,
        ),
        dateTo: new Date(),
        batchSize: 100,
        updateExisting: true,
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
   * Create a backfill schedule
   *
   * Creates a one-time backfill schedule for historical data.
   *
   * @param source - Data source
   * @param dateFrom - Start date
   * @param dateTo - End date
   * @param description - Schedule description
   * @returns Schedule ID
   */
  async createBackfillSchedule(
    source: RulingSource,
    dateFrom: Date,
    dateTo: Date,
    // description is currently unused but kept for future use

    _description?: string,
  ): Promise<string> {
    const fromStr = dateFrom.toISOString().split('T')[0];
    const toStr = dateTo.toISOString().split('T')[0];
    const scheduleId = `backfill-${source.toLowerCase()}-${fromStr}-${toStr}`;

    this.logger.log(
      `Creating backfill schedule ${scheduleId} from ${fromStr} to ${toStr}`,
    );

    try {
      await this.temporalService.createSchedule({
        scheduleId,
        action: {
          type: 'startWorkflow',
          workflowType: 'rulingBackfill',
          workflowId: scheduleId,
          taskQueue: 'legal-ai-task-queue',
          args: [
            {
              jobId: scheduleId,
              source,
              dateFrom,
              dateTo,
              daysPerChunk: 30,
              batchSize: 100,
              updateExisting: true,
            },
          ],
        },
        spec: {
          // Run once immediately
          cronExpressions: [{ expression: '0 * * * * *', comment: 'Run immediately' }],
        },
        policies: {
          overlap: 'SKIP',
        },
      });

      this.logger.log(`Backfill schedule ${scheduleId} created successfully`);

      return scheduleId;
    } catch (error) {
      this.logger.error(
        `Failed to create backfill schedule ${scheduleId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Generate a unique schedule ID
   *
   * @param source - Data source
   * @param cronExpression - Cron expression
   * @returns Unique schedule ID
   */
  private generateScheduleId(
    source: RulingSource,
    cronExpression: string,
  ): string {
    // Hash the cron expression to create a consistent ID
    const hash = cronExpression
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `ruling-indexing-${source.toLowerCase()}-${hash}`;
  }
}
