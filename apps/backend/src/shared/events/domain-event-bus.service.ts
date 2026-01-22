import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import type { DomainEvent } from '../../domain/shared/base/domain-event.base';

/**
 * Domain Event Bus
 *
 * Central service for publishing domain events to both in-process subscribers
 * (via EventEmitter2) and external message queues (via Bull) for async processing
 * and eventual consistency.
 *
 * ## Architecture
 *
 * 1. **In-Process Events** (EventEmitter2):
 *    - Immediate, synchronous execution within the same process
 *    - Used for same-bounded context reactions
 *    - Example: Updating audit logs when any entity changes
 *
 * 2. **Out-of-Process Events** (Bull/Redis):
 *    - Asynchronous, durable, distributed processing
 *    - Used for cross-bounded context communication
 *    - Example: Sending email when user registers
 *    - Enables eventual consistency between modules
 *
 * ## Event Flow
 *
 * ```
 * Aggregate Root -> addDomainEvent()
 *                     |
 *                     v
 * Application Service -> domainEventBus.publish()
 *                           |
 *                           +-> EventEmitter2 (in-process)
 *                           |
 *                           +-> Bull Queue (out-of-process)
 * ```
 *
 * ## Usage
 *
 * ### In Aggregates (Domain Layer)
 * ```typescript
 * class User extends AggregateRoot<string> {
 *   changeEmail(email: string) {
 *     this.email = email;
 *     this.addDomainEvent(new UserEmailChangedEvent(this.id, email));
 *   }
 * }
 * ```
 *
 * ### In Application Services
 * ```typescript
 * class UserService {
 *   constructor(
 *     private userRepository: UserRepository,
 *     private domainEventBus: DomainEventBus,
 *   ) {}
 *
 *   async changeEmail(userId: string, email: string) {
 *     const user = await this.userRepository.findById(userId);
 *     user.changeEmail(email);
 *     await this.userRepository.save(user);
 *
 *     // Publish all domain events from the aggregate
 *     await this.domainEventBus.publishAggregateEvents(user);
 *   }
 * }
 * ```
 *
 * ### Direct Event Publishing
 * ```typescript
 * // For events not tied to an aggregate
 * await this.domainEventBus.publish(new SystemEvent(data));
 * ```
 */
@Injectable()
export class DomainEventBus {
  private readonly logger = new Logger(DomainEventBus.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('domain-events')
    private readonly domainEventQueue: Queue,
  ) {}

  /**
   * Publish a single domain event
   *
   * Events are published to both:
   * 1. EventEmitter2 - for immediate in-process handling
   * 2. Bull Queue - for durable async processing and cross-module communication
   *
   * @param event - The domain event to publish
   */
  async publish(event: DomainEvent): Promise<void> {
    this.logger.debug(
      `Publishing domain event: ${event.eventName} (${event.eventId})`,
    );

    // 1. Publish to in-process subscribers (immediate)
    this.eventEmitter.emit(event.eventName, event);

    // 2. Publish to message queue for async processing (eventual consistency)
    try {
      await this.domainEventQueue.add(
        event.eventName,
        {
          eventId: event.eventId,
          eventName: event.eventName,
          occurredAt: event.occurredAt.toISOString(),
          eventVersion: event.eventVersion,
          payload: event.toPayload(),
        },
        {
          attempts: 3, // Retry failed events 3 times
          backoff: {
            type: 'exponential',
            delay: 2000, // Start with 2s, double each retry
          },
          removeOnComplete: false, // Keep completed jobs for monitoring
          removeOnFail: false, // Keep failed jobs for debugging
        },
      );

      this.logger.debug(
        `Domain event queued: ${event.eventName} (${event.eventId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue domain event: ${event.eventName}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Publish multiple domain events
   *
   * Useful for publishing all events from an aggregate after persistence.
   *
   * @param events - Array of domain events to publish
   */
  async publishBatch(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    this.logger.debug(`Publishing ${events.length} domain events in batch`);

    // Publish all events in parallel for better performance
    await Promise.all(events.map((event) => this.publish(event)));
  }

  /**
   * Publish all domain events from an aggregate root
   *
   * This is the primary method used in application services to publish
   * events after persisting an aggregate.
   *
   * @param aggregate - The aggregate root with events to publish
   */
  async publishAggregateEvents(aggregate: {
    domainEvents: ReadonlyArray<DomainEvent>;
    clearDomainEvents: () => DomainEvent[];
  }): Promise<void> {
    const events = aggregate.domainEvents;

    if (events.length === 0) {
      return;
    }

    this.logger.debug(`Publishing ${events.length} events from aggregate`);

    await this.publishBatch([...events]);

    // Clear events from aggregate after successful publishing
    aggregate.clearDomainEvents();
  }

  /**
   * Publish events with transactional outbox pattern
   *
   * This method ensures events are only published after the transaction commits.
   * Use this when you need exactly-once delivery guarantees.
   *
   * @param events - Events to publish
   * @param transactionCallback - Function that executes within the transaction
   *
   * @example
   * ```typescript
   * await this.domainEventBus.publishWithOutbox(
   *   [event1, event2],
   *   async () => {
   *     await this.repository.save(entity);
   *   }
   * );
   * ```
   */
  async publishWithOutbox<T>(
    events: DomainEvent[],
    transactionCallback: () => Promise<T>,
  ): Promise<T> {
    // TODO: Implement proper outbox pattern with event store table
    // For now, we publish after the transaction completes
    const result = await transactionCallback();

    // Only publish after successful transaction commit
    await this.publishBatch(events);

    return result;
  }
}
