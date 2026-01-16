import { DomainEvent } from '../../shared/base';

interface QueryProcessedPayload {
  queryId: string;
  userId: string;
  tokensUsed: number;
  confidence: number;
  processingTimeMs: number;
  processedAt: Date;
}

/**
 * Event raised when a legal query has been processed
 */
export class QueryProcessedEvent extends DomainEvent {
  public readonly eventName = 'ai-operations.query.processed';
  public readonly aggregateType = 'LegalQuery';

  constructor(private readonly payload: QueryProcessedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.queryId;
  }

  toPayload(): Record<string, unknown> {
    return {
      queryId: this.payload.queryId,
      userId: this.payload.userId,
      tokensUsed: this.payload.tokensUsed,
      confidence: this.payload.confidence,
      processingTimeMs: this.payload.processingTimeMs,
      processedAt: this.payload.processedAt.toISOString(),
    };
  }
}
