import { Injectable, Inject } from '@nestjs/common';
import { IUseCase, NotFoundError } from '../../common';
import { SubscriptionDto } from '../dto';
import type { ISubscriptionRepository } from '../../../domain/billing/repositories';

/**
 * Input for getting a subscription by ID
 */
export interface GetSubscriptionInput {
  readonly subscriptionId: string;
}

/**
 * Use Case: Get a subscription by ID
 *
 * This use case retrieves a single subscription by its unique identifier.
 */
@Injectable()
export class GetSubscriptionUseCase implements IUseCase<
  GetSubscriptionInput,
  SubscriptionDto
> {
  constructor(
    @Inject('ISubscriptionRepository')
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(request: GetSubscriptionInput): Promise<SubscriptionDto> {
    const subscription = await this.subscriptionRepository.findById(
      request.subscriptionId,
    );

    if (!subscription) {
      throw new NotFoundError('Subscription', request.subscriptionId);
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
