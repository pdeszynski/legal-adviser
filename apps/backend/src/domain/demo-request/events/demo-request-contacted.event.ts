import { DomainEvent } from '@legal/shared-kernel';

interface DemoRequestContactedPayload {
  demoRequestId: string;
  email: string;
  contactedAt: Date;
}

/**
 * Event raised when a demo request is marked as contacted
 */
export class DemoRequestContactedEvent extends DomainEvent {
  public readonly eventName = 'demo-request.contacted';
  public readonly aggregateType = 'DemoRequest';

  constructor(private readonly payload: DemoRequestContactedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.demoRequestId;
  }

  toPayload(): Record<string, unknown> {
    return {
      demoRequestId: this.payload.demoRequestId,
      email: this.payload.email,
      contactedAt: this.payload.contactedAt.toISOString(),
    };
  }
}
