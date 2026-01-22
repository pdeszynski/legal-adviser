import { Module, Global } from '@nestjs/common';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { QuotaGuard } from './guards/quota.guard';

/**
 * Billing Module
 *
 * Provides subscription and quota enforcement functionality.
 *
 * This module is @Global() to make the QuotaGuard available
 * to all modules that need to enforce quota limits (queries, documents, etc.).
 *
 * Exports:
 * - SubscriptionRepository: For accessing and managing user subscriptions
 * - QuotaGuard: For protecting AI operations with quota checks
 *
 * TODO: Replace in-memory repository with TypeORM implementation
 */
@Global()
@Module({
  providers: [SubscriptionRepository, QuotaGuard],
  exports: [SubscriptionRepository, QuotaGuard],
})
export class BillingModule {}
