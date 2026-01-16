import { DomainEvent } from '../../shared/base';

interface QuerySubmittedPayload {
  queryId: string;
  userId: string;
  queryText: string;
  submittedAt: Date;
}

/**
 * Event raised when a legal query is submitted
 */
export class QuerySubmittedEvent extends DomainEvent {
  public readonly eventName = 'ai-operations.query.submitted';
  public readonly aggregateType = 'LegalQuery';

  constructor(private readonly payload: QuerySubmittedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.queryId;
  }

  toPayload(): Record<string, unknown> {
    return {
      queryId: this.payload.queryId,
      userId: this.payload.userId,
      queryText: this.payload.queryText,
      submittedAt: this.payload.submittedAt.toISOString(),
    };
  }
}
