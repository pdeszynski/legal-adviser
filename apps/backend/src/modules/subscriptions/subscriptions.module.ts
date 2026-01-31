import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
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
 * Bounded Context: Subscriptions
 * - Aggregates: SubscriptionPlan, UserSubscription, Payment
 * - Services: SubscriptionsService
 * - Resolvers: SubscriptionsResolver (user operations), SubscriptionsAdminResolver (admin operations)
 *
 * Features:
 * - CRUD for subscription plans via nestjs-query auto-generated resolvers
 * - User subscription management
 * - Feature access control based on plan
 *
 * Exports:
 * - SubscriptionsService: For managing subscriptions
 * - FeatureAccessGuard: For protecting features based on subscription plan
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionPlan, UserSubscription, Payment]),
    // nestjs-query for auto-generated CRUD resolvers (admin only)
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([SubscriptionPlan])],
      resolvers: [
        {
          DTOClass: SubscriptionPlan,
          EntityClass: SubscriptionPlan,
          enableTotalCount: true,
          enableAggregate: true,
          guards: [], // Guards applied at resolver level
          read: {
            many: { name: 'subscriptionPlans' },
            one: { name: 'subscriptionPlan' },
          },
          create: {
            one: { name: 'createOneSubscriptionPlan' },
          },
          update: {
            one: { name: 'updateOneSubscriptionPlan' },
          },
          delete: {
            one: { name: 'deleteOneSubscriptionPlan' },
          },
        },
      ],
    }),
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
