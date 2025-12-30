/**
 * Shared Events Module
 *
 * This module provides the event infrastructure for inter-module communication
 * in the modular monolith architecture.
 *
 * ## Usage:
 *
 * ### Creating Events
 * ```typescript
 * import { BaseEvent, EVENT_PATTERNS } from '@/shared/events';
 *
 * export class MyCustomEvent extends BaseEvent {
 *   public readonly eventName = EVENT_PATTERNS.DOMAIN.ACTION;
 *
 *   constructor(public readonly data: string) {
 *     super();
 *   }
 *
 *   protected getPayload() {
 *     return { data: this.data };
 *   }
 * }
 * ```
 *
 * ### Emitting Events
 * ```typescript
 * import { EventEmitter2 } from '@nestjs/event-emitter';
 *
 * class MyService {
 *   constructor(private eventEmitter: EventEmitter2) {}
 *
 *   async doSomething() {
 *     // ... do work ...
 *     this.eventEmitter.emit('domain.action', new MyCustomEvent('data'));
 *   }
 * }
 * ```
 *
 * ### Listening to Events
 * ```typescript
 * import { OnEvent } from '@nestjs/event-emitter';
 *
 * class MyListener {
 *   @OnEvent('domain.action')
 *   async handleEvent(event: MyCustomEvent) {
 *     // React to the event
 *   }
 * }
 * ```
 */

export * from './base';
export * from './examples';
