import { DomainEvent } from '../../shared/base';

interface SubscriptionCancelledPayload {
  subscriptionId: string;
  userId: string;
  reason?: string;
  cancelledAt: Date;
  effectiveDate: Date;
}

/**
 * Event raised when a subscription is cancelled
 */
export class SubscriptionCancelledEvent extends DomainEvent {
  public readonly eventName = 'billing.subscription.cancelled';
  public readonly aggregateType = 'Subscription';

  constructor(private readonly payload: SubscriptionCancelledPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.subscriptionId;
  }

  toPayload(): Record<string, unknown> {
    return {
      subscriptionId: this.payload.subscriptionId,
      userId: this.payload.userId,
      reason: this.payload.reason,
      cancelledAt: this.payload.cancelledAt.toISOString(),
      effectiveDate: this.payload.effectiveDate.toISOString(),
    };
  }
}
