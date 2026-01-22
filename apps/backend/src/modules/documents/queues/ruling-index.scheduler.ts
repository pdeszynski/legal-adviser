import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RulingIndexingProducer } from './ruling-index.producer';

/**
 * Ruling Indexing Scheduler
 *
 * Schedules automated ruling indexing jobs using @nestjs/schedule.
 * Runs periodic jobs to fetch and index new rulings from external sources.
 *
 * Scheduled Jobs:
 * - Daily sync: Runs every day at 2 AM to sync recent rulings
 *
 * Configuration:
 * - Schedule times can be configured via environment variables if needed
 * - Jobs are queued to the Bull queue for processing
 */
@Injectable()
export class RulingIndexingScheduler {
  private readonly logger = new Logger(RulingIndexingScheduler.name);

  constructor(
    private readonly rulingIndexingProducer: RulingIndexingProducer,
  ) {}

  /**
   * Daily sync job
   *
   * Runs every day at 2:00 AM to sync rulings from the last day.
   * This ensures the database stays up-to-date with latest court rulings.
   *
   * Cron schedule: 0 2 * * * (every day at 2:00 AM)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    name: 'daily-ruling-sync',
    timeZone: 'Europe/Warsaw',
  })
  async handleDailySync(): Promise<void> {
    this.logger.log('Starting daily ruling sync job...');

    try {
      const jobs = await this.rulingIndexingProducer.queueDailySync(
        1, // Sync last 1 day
        {
          // Job options
          jobId: `daily-sync-${Date.now()}`,
        },
      );

      this.logger.log(
        `Daily ruling sync queued successfully: ${jobs.length} jobs created`,
      );

      for (const job of jobs) {
        this.logger.debug(
          `Queued job: ${job.id} for source ${job.data.source}`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to queue daily ruling sync: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Weekly deep sync job
   *
   * Runs every Sunday at 3:00 AM to sync rulings from the last 7 days.
   * This ensures any missed rulings are captured during the week.
   *
   * Cron schedule: 0 3 * * 0 (every Sunday at 3:00 AM)
   */
  @Cron('0 3 * * 0', {
    name: 'weekly-ruling-sync',
    timeZone: 'Europe/Warsaw',
  })
  async handleWeeklySync(): Promise<void> {
    this.logger.log('Starting weekly ruling deep sync job...');

    try {
      const jobs = await this.rulingIndexingProducer.queueDailySync(
        7, // Sync last 7 days
        {
          jobId: `weekly-sync-${Date.now()}`,
        },
      );

      this.logger.log(
        `Weekly ruling sync queued successfully: ${jobs.length} jobs created`,
      );

      for (const job of jobs) {
        this.logger.debug(
          `Queued job: ${job.id} for source ${job.data.source}`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to queue weekly ruling sync: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Manual trigger for testing purposes
   *
   * This method can be called manually via API or CLI to trigger an immediate sync.
   *
   * @param daysBack - Number of days back to sync
   */
  async triggerManualSync(daysBack: number = 1): Promise<void> {
    this.logger.log(`Manual sync triggered for last ${daysBack} day(s)...`);

    try {
      const jobs = await this.rulingIndexingProducer.queueDailySync(daysBack, {
        jobId: `manual-sync-${Date.now()}`,
      });

      this.logger.log(
        `Manual ruling sync queued successfully: ${jobs.length} jobs created`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to queue manual ruling sync: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
