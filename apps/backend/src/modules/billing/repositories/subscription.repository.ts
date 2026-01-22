import { Injectable } from '@nestjs/common';
import { ISubscriptionRepository } from '../../../domain/billing/repositories/subscription.repository.interface';
import { SubscriptionAggregate } from '../../../domain/billing/aggregates/subscription.aggregate';
import {
  PlanTypeEnum,
  BillingPeriodEnum,
  SubscriptionStatusEnum,
  CurrencyEnum,
} from '../../../domain/billing/value-objects';

/**
 * In-memory subscription repository implementation
 *
 * This is a temporary implementation for quota enforcement.
 * In production, this should be replaced with a proper TypeORM repository
 * that persists subscriptions to the database.
 *
 * Current behavior:
 * - Returns a trial subscription for any user
 * - Each user gets their own subscription instance
 * - Subscriptions are stored in memory and lost on restart
 *
 * TODO: Replace with TypeORM implementation when subscription entity is created
 */
@Injectable()
export class SubscriptionRepository implements ISubscriptionRepository {
  private readonly subscriptions = new Map<string, SubscriptionAggregate>();

  async findByUserId(userId: string): Promise<SubscriptionAggregate | null> {
    // Return existing subscription or create new trial
    let subscription = this.subscriptions.get(userId);

    if (!subscription) {
      // Create a trial subscription for the user
      const subscriptionId = `sub-${userId}`;
      subscription = SubscriptionAggregate.createTrial(subscriptionId, userId);
      this.subscriptions.set(userId, subscription);
    }

    return subscription;
  }

  async findById(id: string): Promise<SubscriptionAggregate | null> {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.id === id) {
        return subscription;
      }
    }
    return null;
  }

  async save(subscription: SubscriptionAggregate): Promise<void> {
    const userId = subscription.userId;
    this.subscriptions.set(userId, subscription);
  }

  async delete(id: string): Promise<void> {
    for (const [userId, subscription] of this.subscriptions.entries()) {
      if (subscription.id === id) {
        this.subscriptions.delete(userId);
        break;
      }
    }
  }

  async findByStatus(
    status: SubscriptionStatusEnum,
  ): Promise<SubscriptionAggregate[]> {
    return Array.from(this.subscriptions.values()).filter(
      (s) => s.status.toValue() === status,
    );
  }

  async findByPlanType(
    planType: PlanTypeEnum,
  ): Promise<SubscriptionAggregate[]> {
    return Array.from(this.subscriptions.values()).filter(
      (s) => s.plan.planType === planType,
    );
  }

  async findActiveSubscriptions(): Promise<SubscriptionAggregate[]> {
    return Array.from(this.subscriptions.values()).filter((s) =>
      s.status.isUsable(),
    );
  }

  async findExpiringSoon(withinDays: number): Promise<SubscriptionAggregate[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + withinDays);

    return Array.from(this.subscriptions.values()).filter((s) => {
      const endDate = s.currentPeriodEnd;
      return endDate <= cutoffDate && s.status.isUsable();
    });
  }

  async findPastDue(): Promise<SubscriptionAggregate[]> {
    return this.findByStatus(SubscriptionStatusEnum.PAST_DUE);
  }

  /**
   * Utility method for testing: clear all subscriptions
   */
  clear(): void {
    this.subscriptions.clear();
  }

  /**
   * Utility method for testing: set a specific subscription for a user
   */
  setSubscription(userId: string, subscription: SubscriptionAggregate): void {
    this.subscriptions.set(userId, subscription);
  }
}
