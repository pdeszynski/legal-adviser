import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventStore } from './entities/event-store.entity';
import { EventDispatcherService } from './event-dispatcher.service';
import { DomainEventBus } from './domain-event-bus.service';

/**
 * Event Dispatcher Module
 *
 * Provides the infrastructure for domain event processing:
 * - Event Store (Outbox pattern) for reliable event delivery
 * - Event Dispatcher for publishing events from the outbox to message queues
 * - Domain Event Bus for high-level event publishing API
 *
 * ## Usage
 *
 * Import this module in AppModule to enable domain event processing:
 *
 * ```typescript
 * @Module({
 *   imports: [EventDispatcherModule],
 * })
 * export class AppModule {}
 * ```
 *
 * Then inject DomainEventBus in your services:
 *
 * ```typescript
 * constructor(private domainEventBus: DomainEventBus) {}
 *
 * async someMethod() {
 *   await this.domainEventBus.publish(new MyDomainEvent(...));
 * }
 * ```
 */
@Module({
  imports: [
    // Enable task scheduling for periodic event processing
    ScheduleModule.forRoot(),
    // Event store entity for outbox pattern
    TypeOrmModule.forFeature([EventStore]),
  ],
  providers: [EventDispatcherService, DomainEventBus],
  exports: [DomainEventBus, EventDispatcherService],
})
export class EventDispatcherModule {}
