import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IUseCase,
  NotFoundError,
  BusinessRuleViolationError,
} from '../../common';
import { CancelSubscriptionDto, SubscriptionDto } from '../dto';
import type { ISubscriptionRepository } from '../../../domain/billing/repositories';

/**
 * Use Case: Cancel a subscription
 *
 * This use case orchestrates cancelling a subscription:
 * 1. Loads the subscription aggregate
 * 2. Calls the cancellation business method
 * 3. Persists the updated aggregate
 * 4. Publishes domain events
 */
@Injectable()
export class CancelSubscriptionUseCase implements IUseCase<
  CancelSubscriptionDto,
  SubscriptionDto
> {
  constructor(
    @Inject('ISubscriptionRepository')
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: CancelSubscriptionDto): Promise<SubscriptionDto> {
    const subscription = await this.subscriptionRepository.findById(
      request.subscriptionId,
    );

    if (!subscription) {
      throw new NotFoundError('Subscription', request.subscriptionId);
    }

    // Call the domain method (business rules enforced in aggregate)
    try {
      subscription.cancel(request.reason);
    } catch (error) {
      throw new BusinessRuleViolationError(
        error instanceof Error ? error.message : 'Cannot cancel subscription',
        { subscriptionId: request.subscriptionId },
      );
    }

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
