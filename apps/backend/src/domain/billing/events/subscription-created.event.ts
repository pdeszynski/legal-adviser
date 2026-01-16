import { DomainEvent } from '../../shared/base';

interface SubscriptionCreatedPayload {
  subscriptionId: string;
  userId: string;
  planType: string;
  status: string;
  createdAt: Date;
}

/**
 * Event raised when a subscription is created
 */
export class SubscriptionCreatedEvent extends DomainEvent {
  public readonly eventName = 'billing.subscription.created';
  public readonly aggregateType = 'Subscription';

  constructor(private readonly payload: SubscriptionCreatedPayload) {
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
      status: this.payload.status,
      createdAt: this.payload.createdAt.toISOString(),
    };
  }
}
