import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { IUseCase } from '../../common';
import { CreateTrialSubscriptionDto, CreateSubscriptionResultDto } from '../dto';
import { SubscriptionAggregate } from '../../../domain/billing/aggregates';
import type { ISubscriptionRepository } from '../../../domain/billing/repositories';

/**
 * Use Case: Create a trial subscription
 *
 * This use case orchestrates creating a new trial subscription for a user:
 * 1. Creates the domain aggregate with trial status
 * 2. Persists the aggregate via repository
 * 3. Publishes domain events
 */
@Injectable()
export class CreateTrialSubscriptionUseCase
  implements IUseCase<CreateTrialSubscriptionDto, CreateSubscriptionResultDto>
{
  constructor(
    @Inject('ISubscriptionRepository')
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    request: CreateTrialSubscriptionDto,
  ): Promise<CreateSubscriptionResultDto> {
    // Generate unique ID for the subscription
    const subscriptionId = uuidv4();

    // Create the domain aggregate (business rules are enforced here)
    const subscription = SubscriptionAggregate.createTrial(
      subscriptionId,
      request.userId,
    );

    // Persist the aggregate
    await this.subscriptionRepository.save(subscription);

    // Publish domain events
    const domainEvents = subscription.clearDomainEvents();
    for (const event of domainEvents) {
      this.eventEmitter.emit(event.eventName, event);
    }

    // Return result DTO
    return {
      id: subscription.id,
      userId: subscription.userId,
      planType: subscription.plan.planType,
      planName: subscription.plan.name,
      status: subscription.status.toValue(),
      currentPeriodEnd: subscription.currentPeriodEnd,
      createdAt: subscription.createdAt,
    };
  }
}
