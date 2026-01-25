import { DomainEvent } from '@legal/shared-kernel';

interface DemoRequestSubmittedPayload {
  demoRequestId: string;
  fullName: string;
  email: string;
  company?: string;
  companySize?: string;
  industry?: string;
  submittedAt: Date;
}

/**
 * Event raised when a new demo request is submitted
 */
export class DemoRequestSubmittedEvent extends DomainEvent {
  public readonly eventName = 'demo-request.submitted';
  public readonly aggregateType = 'DemoRequest';

  constructor(private readonly payload: DemoRequestSubmittedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.demoRequestId;
  }

  toPayload(): Record<string, unknown> {
    return {
      demoRequestId: this.payload.demoRequestId,
      fullName: this.payload.fullName,
      email: this.payload.email,
      company: this.payload.company,
      companySize: this.payload.companySize,
      industry: this.payload.industry,
      submittedAt: this.payload.submittedAt.toISOString(),
    };
  }
}
