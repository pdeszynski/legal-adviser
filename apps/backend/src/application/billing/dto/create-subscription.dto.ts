import {
  PlanTypeEnum,
  BillingPeriodEnum,
} from '../../../domain/billing/value-objects';

/**
 * Input DTO for creating a subscription (trial).
 */
export interface CreateTrialSubscriptionDto {
  readonly userId: string;
}

/**
 * Input DTO for creating a subscription with a specific plan.
 */
export interface CreateSubscriptionDto {
  readonly userId: string;
  readonly planType: PlanTypeEnum;
  readonly billingPeriod?: BillingPeriodEnum;
}

/**
 * Output DTO representing a created subscription.
 */
export interface CreateSubscriptionResultDto {
  readonly id: string;
  readonly userId: string;
  readonly planType: PlanTypeEnum;
  readonly planName: string;
  readonly status: string;
  readonly currentPeriodEnd: Date;
  readonly createdAt: Date;
}
