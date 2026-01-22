import { v4 as uuidv4 } from 'uuid';

/**
 * Domain Event base class for Domain-Driven Design
 * Domain Events represent something that happened in the domain
 */
export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;
  public readonly eventVersion: number;
  public abstract readonly eventName: string;
  public abstract readonly aggregateId: string;
  public abstract readonly aggregateType: string;

  constructor(eventVersion: number = 1) {
    this.eventId = uuidv4();
    this.occurredAt = new Date();
    this.eventVersion = eventVersion;
  }

  abstract toPayload(): Record<string, unknown>;
}

/**
 * Integration Event for cross-bounded context communication
 */
export abstract class IntegrationEvent extends DomainEvent {
  public abstract readonly sourceContext: string;
  public abstract readonly targetContexts: string[];
}
