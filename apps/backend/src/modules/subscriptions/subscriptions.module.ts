import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsResolver } from './subscriptions.resolver';
import { SubscriptionsAdminResolver } from './subscriptions-admin.resolver';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { Payment } from './entities/payment.entity';
import { FeatureAccessGuard } from './guards/feature-access.guard';

/**
 * Subscriptions Module
 *
 * Manages subscription plans, user subscriptions, and feature access control.
 *
 * Exports:
 * - SubscriptionsService: For managing subscriptions
 * - FeatureAccessGuard: For protecting features based on subscription plan
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionPlan, UserSubscription, Payment]),
  ],
  providers: [
    SubscriptionsService,
    SubscriptionsResolver,
    SubscriptionsAdminResolver,
    FeatureAccessGuard,
  ],
  exports: [SubscriptionsService, FeatureAccessGuard],
})
export class SubscriptionsModule {}
