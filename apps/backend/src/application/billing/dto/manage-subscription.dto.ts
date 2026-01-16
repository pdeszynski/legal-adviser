import {
  PlanTypeEnum,
  CurrencyEnum,
} from '../../../domain/billing/value-objects';

/**
 * Input DTO for activating a subscription.
 */
export interface ActivateSubscriptionDto {
  readonly subscriptionId: string;
}

/**
 * Input DTO for cancelling a subscription.
 */
export interface CancelSubscriptionDto {
  readonly subscriptionId: string;
  readonly reason?: string;
}

/**
 * Input DTO for upgrading a subscription plan.
 */
export interface UpgradeSubscriptionDto {
  readonly subscriptionId: string;
  readonly newPlanType: PlanTypeEnum;
}

/**
 * Input DTO for processing a payment.
 */
export interface ProcessPaymentDto {
  readonly subscriptionId: string;
  readonly amount: number;
  readonly currency: CurrencyEnum;
  readonly paymentMethod: string;
  readonly transactionId: string;
}

/**
 * Input DTO for recording usage.
 */
export interface RecordUsageDto {
  readonly subscriptionId: string;
  readonly usageType: 'query' | 'document';
}
