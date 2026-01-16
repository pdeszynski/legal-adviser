import { DomainEvent } from '../../shared/base';

interface SubscriptionActivatedPayload {
  subscriptionId: string;
  userId: string;
  planType: string;
  activatedAt: Date;
}

/**
 * Event raised when a subscription is activated
 */
export class SubscriptionActivatedEvent extends DomainEvent {
  public readonly eventName = 'billing.subscription.activated';
  public readonly aggregateType = 'Subscription';

  constructor(private readonly payload: SubscriptionActivatedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.subscriptionId;
  }

  toPayload(): Record<string, unknown> {
    return {
      subscriptionId: this.payload.subscriptionId,
      userId: this.payload.userId,
      planType: this.payload.planType,
      activatedAt: this.payload.activatedAt.toISOString(),
    };
  }
}
