import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventStore } from './entities/event-store.entity';

/**
 * Event Dispatcher Service
 *
 * Processes pending events from the event store (outbox) and publishes
 * them to the event emitter. This ensures reliable event delivery with
 * the transactional outbox pattern.
 *
 * ## How It Works
 *
 * 1. Application saves entity + event to event store in one transaction
 * 2. Event dispatcher picks up pending events (via cron)
 * 3. Events are published via EventEmitter2 for processing
 * 4. On success, event status is updated to PUBLISHED
 * 5. On failure, event status is FAILED and scheduled for retry
 *
 * ## Retry Strategy
 *
 * - Max attempts: 3
 * - Backoff: Exponential (2s, 4s, 8s)
 * - After max attempts: Event stays in FAILED state for manual inspection
 *
 * ## Cleanup
 *
 * Old published events should be periodically cleaned up to prevent
 * the event store table from growing indefinitely.
 */
@Injectable()
export class EventDispatcherService {
  private readonly logger = new Logger(EventDispatcherService.name);
  private readonly MAX_ATTEMPTS = 3;
  private readonly BATCH_SIZE = 50;
  private readonly RETRY_DELAYS = [2000, 4000, 8000]; // 2s, 4s, 8s

  constructor(
    @InjectRepository(EventStore)
    private readonly eventStoreRepository: Repository<EventStore>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Process pending events from the outbox
   *
   * Runs every 5 seconds to pick up new events and retry failed events.
   *
   * This is the main entry point for the event dispatcher.
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async processPendingEvents(): Promise<void> {
    try {
      // Find events ready to be processed
      const pendingEvents = await this.eventStoreRepository.find({
        where: [
          { status: 'PENDING', nextRetryAt: null as any },
          {
            status: 'FAILED',
            nextRetryAt: LessThan(new Date()),
          },
        ],
        order: { occurredAt: 'ASC' },
        take: this.BATCH_SIZE,
      });

      if (pendingEvents.length === 0) {
        return;
      }

      this.logger.debug(
        `Processing ${pendingEvents.length} pending events from outbox`,
      );

      // Process events in parallel (but within batch size limit)
      await Promise.allSettled(
        pendingEvents.map((event) => this.publishEvent(event)),
      );
    } catch (error) {
      this.logger.error('Error processing pending events', error);
    }
  }

  /**
   * Publish a single event via EventEmitter2
   *
   * @param eventStore - The event store record to publish
   */
  private async publishEvent(eventStore: EventStore): Promise<void> {
    try {
      // Emit event via EventEmitter2
      this.eventEmitter.emit(eventStore.eventName, {
        eventId: eventStore.eventId,
        eventName: eventStore.eventName,
        occurredAt: eventStore.occurredAt.toISOString(),
        eventVersion: eventStore.eventVersion,
        payload: eventStore.payload,
      });

      // Update event store status
      eventStore.status = 'PUBLISHED';
      eventStore.publishedAt = new Date();
      eventStore.attempts += 1;
      eventStore.nextRetryAt = null;
      eventStore.errorMessage = null;

      await this.eventStoreRepository.save(eventStore);

      this.logger.debug(
        `Event published: ${eventStore.eventName} (${eventStore.eventId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish event: ${eventStore.eventName} (${eventStore.eventId})`,
        error,
      );

      // Update event store with failure information
      eventStore.status = 'FAILED';
      eventStore.attempts += 1;
      eventStore.errorMessage =
        error instanceof Error ? error.message : String(error);

      // Schedule retry if we haven't exceeded max attempts
      if (eventStore.attempts < this.MAX_ATTEMPTS) {
        const retryDelay = this.RETRY_DELAYS[eventStore.attempts - 1] || 8000;
        eventStore.nextRetryAt = new Date(Date.now() + retryDelay);
        this.logger.debug(
          `Scheduling retry ${eventStore.attempts}/${this.MAX_ATTEMPTS} for event ${eventStore.eventId} at ${eventStore.nextRetryAt}`,
        );
      } else {
        eventStore.nextRetryAt = null;
        this.logger.error(
          `Event ${eventStore.eventId} exceeded max retry attempts, marking as permanently failed`,
        );
      }

      await this.eventStoreRepository.save(eventStore);
    }
  }

  /**
   * Clean up old published events
   *
   * Runs daily at 2 AM to remove old published events from the event store.
   * Keeps events for 30 days by default for audit purposes.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldEvents(): Promise<void> {
    const retentionDays = 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const result = await this.eventStoreRepository.delete({
        status: 'PUBLISHED',
        publishedAt: LessThan(cutoffDate),
      });

      this.logger.log(
        `Cleaned up ${result.affected || 0} old published events (older than ${retentionDays} days)`,
      );
    } catch (error) {
      this.logger.error('Error cleaning up old events', error);
    }
  }

  /**
   * Get statistics about the event store
   *
   * Useful for monitoring and health checks.
   */
  async getStats(): Promise<{
    pending: number;
    published: number;
    failed: number;
  }> {
    const [pending, published, failed] = await Promise.all([
      this.eventStoreRepository.count({ where: { status: 'PENDING' } }),
      this.eventStoreRepository.count({ where: { status: 'PUBLISHED' } }),
      this.eventStoreRepository.count({ where: { status: 'FAILED' } }),
    ]);

    return { pending, published, failed };
  }
}
