/**
 * Shared Events Module
 *
 * This module provides the event infrastructure for inter-module communication
 * in the modular monolith architecture.
 *
 * ## Components:
 *
 * 1. **Base Event Classes** - DomainEvent, BaseEvent for defining events
 * 2. **Event Patterns** - EVENT_PATTERNS constants for consistent naming
 * 3. **Event Store** - Outbox pattern for reliable event delivery
 * 4. **Event Dispatcher** - Processes pending events and publishes to queues
 * 5. **Domain Event Bus** - High-level API for publishing domain events
 *
 * ## Usage:
 *
 * ### Creating Domain Events
 * ```typescript
 * import { DomainEvent } from '@/domain/shared/base';
 *
 * export class UserCreatedEvent extends DomainEvent {
 *   public readonly eventName = 'user.created';
 *   public readonly aggregateId: string;
 *   public readonly aggregateType = 'User';
 *
 *   constructor(userId: string, public readonly email: string) {
 *     super();
 *     this.aggregateId = userId;
 *   }
 *
 *   toPayload() {
 *     return { userId: this.aggregateId, email: this.email };
 *   }
 * }
 * ```
 *
 * ### Publishing Events (with Event Bus)
 * ```typescript
 * import { DomainEventBus } from '@/shared/events';
 *
 * class UserService {
 *   constructor(
 *     private userRepository: UserRepository,
 *     private domainEventBus: DomainEventBus,
 *   ) {}
 *
 *   async createUser(email: string) {
 *     const user = new User(email);
 *     await this.userRepository.save(user);
 *
 *     // Publish all domain events from the aggregate
 *     await this.domainEventBus.publishAggregateEvents(user);
 *   }
 * }
 * ```
 *
 * ### Listening to Events
 * ```typescript
 * import { OnEvent } from '@nestjs/event-emitter';
 *
 * class NotificationService {
 *   @OnEvent('user.created')
 *   async handleUserCreated(event: UserCreatedEvent) {
 *     await this.sendWelcomeEmail(event.email);
 *   }
 * }
 * ```
 */

export * from './base';
export * from './examples';
export * from './domain-event-bus.service';
export * from './event-dispatcher.service';
export * from './event-dispatcher.module';
export * from './entities/event-store.entity';
