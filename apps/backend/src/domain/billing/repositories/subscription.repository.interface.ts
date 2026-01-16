import { IRepository } from '../../shared/base';
import { SubscriptionAggregate } from '../aggregates';
import { SubscriptionStatusEnum, PlanTypeEnum } from '../value-objects';

/**
 * Repository interface for Subscription aggregate
 */
export interface ISubscriptionRepository
  extends IRepository<SubscriptionAggregate, string> {
  findByUserId(userId: string): Promise<SubscriptionAggregate | null>;
  findByStatus(
    status: SubscriptionStatusEnum,
  ): Promise<SubscriptionAggregate[]>;
  findByPlanType(planType: PlanTypeEnum): Promise<SubscriptionAggregate[]>;
  findActiveSubscriptions(): Promise<SubscriptionAggregate[]>;
  findExpiringSoon(withinDays: number): Promise<SubscriptionAggregate[]>;
  findPastDue(): Promise<SubscriptionAggregate[]>;
}
