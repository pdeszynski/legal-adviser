import { DomainEvent } from '@legal/shared-kernel';
import { DemoRequestStatusEnum } from '../value-objects';

interface DemoRequestStatusChangedPayload {
  demoRequestId: string;
  email: string;
  oldStatus: DemoRequestStatusEnum;
  newStatus: DemoRequestStatusEnum;
  changedAt: Date;
}

/**
 * Event raised when a demo request status changes
 */
export class DemoRequestStatusChangedEvent extends DomainEvent {
  public readonly eventName = 'demo-request.status-changed';
  public readonly aggregateType = 'DemoRequest';

  constructor(private readonly payload: DemoRequestStatusChangedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.demoRequestId;
  }

  toPayload(): Record<string, unknown> {
    return {
      demoRequestId: this.payload.demoRequestId,
      email: this.payload.email,
      oldStatus: this.payload.oldStatus,
      newStatus: this.payload.newStatus,
      changedAt: this.payload.changedAt.toISOString(),
    };
  }
}
