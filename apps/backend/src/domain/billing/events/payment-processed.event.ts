import { DomainEvent } from '../../shared/base';

interface PaymentProcessedPayload {
  subscriptionId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
  processedAt: Date;
}

/**
 * Event raised when a payment is processed
 */
export class PaymentProcessedEvent extends DomainEvent {
  public readonly eventName = 'billing.payment.processed';
  public readonly aggregateType = 'Subscription';

  constructor(private readonly payload: PaymentProcessedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.subscriptionId;
  }

  toPayload(): Record<string, unknown> {
    return {
      subscriptionId: this.payload.subscriptionId,
      userId: this.payload.userId,
      amount: this.payload.amount,
      currency: this.payload.currency,
      paymentMethod: this.payload.paymentMethod,
      transactionId: this.payload.transactionId,
      processedAt: this.payload.processedAt.toISOString(),
    };
  }
}
