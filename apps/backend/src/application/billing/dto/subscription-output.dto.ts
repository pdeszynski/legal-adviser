import {
  SubscriptionStatusEnum,
  PlanTypeEnum,
  BillingPeriodEnum,
  CurrencyEnum,
} from '../../../domain/billing/value-objects';

/**
 * Plan details DTO
 */
export interface PlanDto {
  readonly planType: PlanTypeEnum;
  readonly name: string;
  readonly price: number;
  readonly currency: CurrencyEnum;
  readonly billingPeriod: BillingPeriodEnum;
  readonly queryLimit: number;
  readonly documentLimit: number;
  readonly features: string[];
}

/**
 * Usage quota DTO
 */
export interface UsageQuotaDto {
  readonly queriesUsed: number;
  readonly queriesLimit: number;
  readonly queriesRemaining: number;
  readonly queriesPercentUsed: number;
  readonly documentsUsed: number;
  readonly documentsLimit: number;
  readonly documentsRemaining: number;
  readonly documentsPercentUsed: number;
  readonly periodStart: Date;
  readonly periodEnd: Date;
}

/**
 * Standard output DTO representing a subscription.
 */
export interface SubscriptionDto {
  readonly id: string;
  readonly userId: string;
  readonly plan: PlanDto;
  readonly status: SubscriptionStatusEnum;
  readonly usageQuota: UsageQuotaDto;
  readonly currentPeriodStart: Date;
  readonly currentPeriodEnd: Date;
  readonly cancelledAt?: Date;
  readonly cancelReason?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Summary DTO for subscription lists.
 */
export interface SubscriptionSummaryDto {
  readonly id: string;
  readonly userId: string;
  readonly planType: PlanTypeEnum;
  readonly planName: string;
  readonly status: SubscriptionStatusEnum;
  readonly currentPeriodEnd: Date;
  readonly createdAt: Date;
}

/**
 * Paginated result for subscription queries.
 */
export interface PaginatedSubscriptionsDto {
  readonly items: SubscriptionSummaryDto[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}
