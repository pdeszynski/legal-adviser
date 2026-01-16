import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUseCase, NotFoundError } from '../../common';
import { ProcessPaymentDto, SubscriptionDto } from '../dto';
import { Money } from '../../../domain/billing/value-objects';
import type { ISubscriptionRepository } from '../../../domain/billing/repositories';

/**
 * Use Case: Process a payment for a subscription
 *
 * This use case orchestrates processing a payment:
 * 1. Loads the subscription aggregate
 * 2. Records the payment
 * 3. Persists the updated aggregate
 * 4. Publishes domain events
 */
@Injectable()
export class ProcessPaymentUseCase
  implements IUseCase<ProcessPaymentDto, SubscriptionDto>
{
  constructor(
    @Inject('ISubscriptionRepository')
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: ProcessPaymentDto): Promise<SubscriptionDto> {
    const subscription = await this.subscriptionRepository.findById(
      request.subscriptionId,
    );

    if (!subscription) {
      throw new NotFoundError('Subscription', request.subscriptionId);
    }

    // Create money value object
    const amount = Money.create(request.amount, request.currency);

    // Process the payment (business rules enforced in aggregate)
    subscription.processPayment(
      amount,
      request.paymentMethod,
      request.transactionId,
    );

    // Persist the updated aggregate
    await this.subscriptionRepository.save(subscription);

    // Publish domain events
    const domainEvents = subscription.clearDomainEvents();
    for (const event of domainEvents) {
      this.eventEmitter.emit(event.eventName, event);
    }

    return {
      id: subscription.id,
      userId: subscription.userId,
      plan: {
        planType: subscription.plan.planType,
        name: subscription.plan.name,
        price: subscription.plan.price.amount,
        currency: subscription.plan.price.currency,
        billingPeriod: subscription.plan.billingPeriod,
        queryLimit: subscription.plan.queryLimit,
        documentLimit: subscription.plan.documentLimit,
        features: subscription.plan.features,
      },
      status: subscription.status.toValue(),
      usageQuota: {
        queriesUsed: subscription.usageQuota.queriesUsed,
        queriesLimit: subscription.usageQuota.queriesLimit,
        queriesRemaining: subscription.usageQuota.queriesRemaining,
        queriesPercentUsed: subscription.usageQuota.queriesPercentUsed,
        documentsUsed: subscription.usageQuota.documentsUsed,
        documentsLimit: subscription.usageQuota.documentsLimit,
        documentsRemaining: subscription.usageQuota.documentsRemaining,
        documentsPercentUsed: subscription.usageQuota.documentsPercentUsed,
        periodStart: subscription.usageQuota.periodStart,
        periodEnd: subscription.usageQuota.periodEnd,
      },
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelledAt: subscription.cancelledAt,
      cancelReason: subscription.cancelReason,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }
}
