import { Field, InputType, ObjectType, ID, Int } from '@nestjs/graphql';
import {
  PlanTier,
  BillingInterval,
  type PlanFeatures,
} from '../entities/subscription-plan.entity';
import { SubscriptionStatus } from '../entities/user-subscription.entity';

/**
 * Input for creating a new subscription plan
 */
@InputType('CreateSubscriptionPlanInput')
export class CreateSubscriptionPlanInput {
  @Field(() => PlanTier)
  tier: PlanTier;

  @Field(() => String)
  name: string;

  @Field(() => Int)
  price: number;

  @Field(() => String)
  features: string; // JSON string of PlanFeatures

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => BillingInterval, {
    nullable: true,
    defaultValue: BillingInterval.MONTHLY,
  })
  billingInterval?: BillingInterval;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  yearlyDiscount?: number;

  @Field(() => Int, { nullable: true })
  maxUsers?: number | null;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  trialDays?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  displayOrder?: number;

  @Field(() => String, { nullable: true })
  stripePriceId?: string | null;

  @Field(() => String, { nullable: true })
  stripeYearlyPriceId?: string | null;
}

/**
 * Input for updating a subscription plan
 */
@InputType('UpdateSubscriptionPlanInput')
export class UpdateSubscriptionPlanInput {
  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field(() => Int, { nullable: true })
  price?: number | null;

  @Field(() => String, { nullable: true })
  features?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => BillingInterval, { nullable: true })
  billingInterval?: BillingInterval | null;

  @Field(() => Int, { nullable: true })
  yearlyDiscount?: number | null;

  @Field(() => Int, { nullable: true })
  maxUsers?: number | null;

  @Field(() => Int, { nullable: true })
  trialDays?: number | null;

  @Field(() => Boolean, { nullable: true })
  isActive?: boolean | null;

  @Field(() => Int, { nullable: true })
  displayOrder?: number | null;

  @Field(() => String, { nullable: true })
  stripePriceId?: string | null;

  @Field(() => String, { nullable: true })
  stripeYearlyPriceId?: string | null;
}

/**
 * Input for creating a user subscription
 */
@InputType('CreateUserSubscriptionInput')
export class CreateUserSubscriptionInput {
  @Field(() => ID)
  planId: string;

  @Field(() => String, { nullable: true })
  stripeSubscriptionId?: string | null;

  @Field(() => String, { nullable: true })
  stripeCustomerId?: string | null;
}

/**
 * Input for updating a user subscription
 */
@InputType('UpdateUserSubscriptionInput')
export class UpdateUserSubscriptionInput {
  @Field(() => SubscriptionStatus, { nullable: true })
  status?: SubscriptionStatus | null;

  @Field(() => String, { nullable: true })
  currentPeriodStart?: string | null;

  @Field(() => String, { nullable: true })
  currentPeriodEnd?: string | null;

  @Field(() => Boolean, { nullable: true })
  cancelAtPeriodEnd?: boolean | null;

  @Field(() => String, { nullable: true })
  stripeSubscriptionId?: string | null;

  @Field(() => String, { nullable: true })
  stripeCustomerId?: string | null;
}

/**
 * Input for canceling a subscription
 */
@InputType('CancelSubscriptionInput')
export class CancelSubscriptionInput {
  @Field(() => Boolean, { defaultValue: false })
  immediately: boolean;
}

/**
 * Input for checking subscription quota
 */
@InputType('CheckQuotaInput')
export class CheckQuotaInput {
  @Field(() => String)
  quotaKey: string;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  amount?: number;
}

/**
 * Response for quota check
 */
@ObjectType('CheckQuotaResponse')
export class CheckQuotaResponse {
  @Field(() => Boolean)
  allowed: boolean;

  @Field(() => Int)
  remaining: number;

  @Field(() => Int)
  limit: number;

  @Field(() => String, { nullable: true })
  message: string | null;
}

/**
 * Input for recording usage
 */
@InputType('RecordUsageInput')
export class RecordUsageInput {
  @Field(() => String)
  quotaKey: string;

  @Field(() => Int, { defaultValue: 1 })
  amount?: number;
}

/**
 * Plan comparison for features
 */
@ObjectType('PlanFeatureComparison')
export class PlanFeatureComparison {
  @Field(() => PlanTier)
  tier: PlanTier;

  @Field(() => String)
  name: string;

  @Field(() => Int)
  price: number;

  @Field(() => Boolean)
  available: boolean;

  @Field(() => String)
  features: string;
}

/**
 * Subscription usage stats
 */
@ObjectType('SubscriptionUsageStats')
export class SubscriptionUsageStats {
  @Field(() => ID)
  subscriptionId: string;

  @Field(() => PlanTier)
  planTier: string;

  @Field(() => String)
  usage: string;

  @Field(() => String)
  periodStart: Date;

  @Field(() => String)
  periodEnd: Date;

  @Field(() => Int)
  daysRemaining: number;
}

/**
 * Input for creating Stripe checkout session
 */
@InputType('CreateCheckoutSessionInput')
export class CreateCheckoutSessionInput {
  @Field(() => ID)
  planId: string;

  @Field(() => String)
  successUrl: string;

  @Field(() => String)
  cancelUrl: string;
}

/**
 * Response for checkout session creation
 */
@ObjectType('CheckoutSessionResponse')
export class CheckoutSessionResponse {
  @Field(() => String)
  sessionId: string;

  @Field(() => String)
  url: string;
}

/**
 * Response for portal session creation
 */
@ObjectType('PortalSessionResponse')
export class PortalSessionResponse {
  @Field(() => String)
  url: string;
}

/**
 * Input for updating subscription via Stripe
 */
@InputType('UpdateStripeSubscriptionInput')
export class UpdateStripeSubscriptionInput {
  @Field(() => ID)
  newPlanId: string;
}

/**
 * Payment method information
 */
@ObjectType('PaymentMethodInfo')
export class PaymentMethodInfo {
  @Field(() => String)
  id: string;

  @Field(() => String)
  brand: string; // e.g., "visa", "mastercard"

  @Field(() => String)
  last4: string; // Last 4 digits

  @Field(() => String)
  expiryMonth: string;

  @Field(() => String)
  expiryYear: string;

  @Field(() => Boolean)
  isDefault: boolean;
}

/**
 * Payment history item
 */
@ObjectType('PaymentHistoryItem')
export class PaymentHistoryItem {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  amount: string;

  @Field(() => String)
  currency: string;

  @Field(() => PaymentStatus)
  status: PaymentStatus;

  @Field(() => PaymentMethod)
  method: PaymentMethod;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => String, { nullable: true })
  invoiceId: string | null;

  @Field(() => String)
  createdAt: Date;

  @Field(() => String, { nullable: true })
  refundedAt: Date | null;

  @Field(() => String, { nullable: true })
  refundAmount: string | null;
}

/**
 * Billing information response
 */
@ObjectType('BillingInfo')
export class BillingInfo {
  @Field(() => ID)
  subscriptionId: string;

  @Field(() => PlanTier)
  planTier: string;

  @Field(() => String)
  planName: string;

  @Field(() => SubscriptionStatus)
  status: SubscriptionStatus;

  @Field(() => String)
  currentPeriodStart: Date;

  @Field(() => String)
  currentPeriodEnd: Date;

  @Field(() => Int)
  daysRemaining: number;

  @Field(() => Boolean)
  cancelAtPeriodEnd: boolean;

  @Field(() => String)
  usage: string;

  @Field(() => [PaymentHistoryItem])
  paymentHistory: PaymentHistoryItem[];

  @Field(() => [PaymentMethodInfo], { nullable: true })
  paymentMethods: PaymentMethodInfo[] | null;

  @Field(() => String, { nullable: true })
  nextBillingAmount: string | null;
}

/**
 * Enum for PaymentStatus
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

/**
 * Enum for PaymentMethod
 */
export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  OTHER = 'OTHER',
}
