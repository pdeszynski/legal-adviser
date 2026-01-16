import { IntegrationEvent } from '../../shared/base';

interface QuotaExceededPayload {
  subscriptionId: string;
  userId: string;
  quotaType: 'queries' | 'documents';
  currentUsage: number;
  limit: number;
  exceededAt: Date;
}

/**
 * Integration event raised when usage quota is exceeded
 * This event is important for cross-context communication
 */
export class QuotaExceededEvent extends IntegrationEvent {
  public readonly eventName = 'billing.quota.exceeded';
  public readonly aggregateType = 'Subscription';
  public readonly sourceContext = 'billing';
  public readonly targetContexts = ['user-management', 'ai-operations'];

  constructor(private readonly payload: QuotaExceededPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.subscriptionId;
  }

  toPayload(): Record<string, unknown> {
    return {
      subscriptionId: this.payload.subscriptionId,
      userId: this.payload.userId,
      quotaType: this.payload.quotaType,
      currentUsage: this.payload.currentUsage,
      limit: this.payload.limit,
      exceededAt: this.payload.exceededAt.toISOString(),
    };
  }
}
