import { DomainEvent } from '../../shared/base';

interface QueryFailedPayload {
  queryId: string;
  userId: string;
  errorMessage: string;
  errorCode?: string;
  failedAt: Date;
}

/**
 * Event raised when a legal query processing fails
 */
export class QueryFailedEvent extends DomainEvent {
  public readonly eventName = 'ai-operations.query.failed';
  public readonly aggregateType = 'LegalQuery';

  constructor(private readonly payload: QueryFailedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.queryId;
  }

  toPayload(): Record<string, unknown> {
    return {
      queryId: this.payload.queryId,
      userId: this.payload.userId,
      errorMessage: this.payload.errorMessage,
      errorCode: this.payload.errorCode,
      failedAt: this.payload.failedAt.toISOString(),
    };
  }
}
