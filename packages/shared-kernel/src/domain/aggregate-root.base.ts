import { Entity } from './entity.base';
import { DomainEvent } from './domain-event.base';

/**
 * Aggregate Root base class for Domain-Driven Design
 * Aggregates are clusters of entities and value objects with a root entity
 * All external access should go through the aggregate root
 */
export abstract class AggregateRoot<TId> extends Entity<TId> {
  private _domainEvents: DomainEvent[] = [];
  private _version: number = 0;

  constructor(id: TId) {
    super(id);
  }

  get version(): number {
    return this._version;
  }

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return [...this._domainEvents];
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  protected incrementVersion(): void {
    this._version++;
    this.touch();
  }
}
