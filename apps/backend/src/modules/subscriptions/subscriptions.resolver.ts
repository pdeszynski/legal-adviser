import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import {
  CreateUserSubscriptionInput,
  UpdateUserSubscriptionInput,
  CancelSubscriptionInput,
  CheckQuotaInput,
  CheckQuotaResponse,
  SubscriptionUsageStats,
  BillingInfo,
  PaymentHistoryItem,
} from './dto/subscription.dto';
import { Public } from '../auth/decorators/public.decorator';

/**
 * GraphQL Resolver for Subscription Management
 *
 * Handles user-facing operations for:
 * - Viewing subscription plans (public)
 * - User subscription lifecycle (authenticated)
 * - Feature access control (authenticated)
 * - Usage quota management (authenticated)
 * - Stripe payment integration (authenticated)
 *
 * Admin-only plan management operations are in SubscriptionsAdminResolver.
 */
@Resolver()
export class SubscriptionsResolver {
  constructor(private readonly service: SubscriptionsService) {}

  /**
   * Query: Get all active subscription plans (public catalog)
   */
  @Public()
  @Query(() => [SubscriptionPlan], {
    name: 'subscriptionPlans',
    description: 'Get all active subscription plans ordered by price',
  })
  async getActivePlans(): Promise<SubscriptionPlan[]> {
    return this.service.getActivePlans();
  }

  /**
   * Query: Get a subscription plan by ID (public catalog)
   */
  @Public()
  @Query(() => SubscriptionPlan, {
    name: 'subscriptionPlan',
    description: 'Get a subscription plan by ID',
    nullable: true,
  })
  async getPlan(@Args('id') id: string): Promise<SubscriptionPlan> {
    return this.service.getPlan(id);
  }

  /**
   * Query: Get current user's subscription
   */
  @Query(() => UserSubscription, {
    name: 'mySubscription',
    description: 'Get the current user subscription',
    nullable: true,
  })
  @UseGuards(GqlAuthGuard)
  async getMySubscription(
    @Context() context: { req: { user: { userId: string } } },
  ): Promise<UserSubscription | null> {
    const userId = context.req.user?.userId;
    if (!userId) {
      return null;
    }
    return this.service.getUserSubscription(userId);
  }

  /**
   * Query: Check if user can access a feature
   */
  @Query(() => Boolean, {
    name: 'canAccessFeature',
    description: 'Check if the current user can access a specific feature',
  })
  @UseGuards(GqlAuthGuard)
  async canAccessFeature(
    @Context() context: { req: { user: { userId: string } } },
    @Args('featureKey') featureKey: string,
  ): Promise<boolean> {
    const userId = context.req.user?.userId;
    if (!userId) {
      return false;
    }
    return this.service.canUserAccessFeature(userId, featureKey);
  }

  /**
   * Query: Check user's quota for a resource
   */
  @Query(() => CheckQuotaResponse, {
    name: 'checkQuota',
    description: 'Check the current user quota for a specific resource',
  })
  @UseGuards(GqlAuthGuard)
  async checkQuota(
    @Context() context: { req: { user: { userId: string } } },
    @Args('input') input: CheckQuotaInput,
  ): Promise<CheckQuotaResponse> {
    const userId = context.req.user?.userId;
    if (!userId) {
      return {
        allowed: false,
        remaining: 0,
        limit: 0,
        message: 'User not authenticated',
      };
    }
    return this.service.checkUserQuota(userId, input);
  }

  /**
   * Query: Get user's usage statistics
   */
  @Query(() => SubscriptionUsageStats, {
    name: 'myUsageStats',
    description: 'Get usage statistics for the current user subscription',
    nullable: true,
  })
  @UseGuards(GqlAuthGuard)
  async getMyUsageStats(
    @Context() context: { req: { user: { userId: string } } },
  ): Promise<SubscriptionUsageStats | null> {
    const userId = context.req.user?.userId;
    if (!userId) {
      return null;
    }
    return this.service.getUserUsageStats(userId);
  }

  /**
   * Mutation: Create a subscription for the current user
   */
  @Mutation(() => UserSubscription, {
    name: 'createMySubscription',
    description: 'Create a new subscription for the current user',
  })
  @UseGuards(GqlAuthGuard)
  async createUserSubscription(
    @Context() context: { req: { user: { userId: string } } },
    @Args('input') input: CreateUserSubscriptionInput,
  ): Promise<UserSubscription> {
    const userId = context.req.user?.userId;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.service.createUserSubscription(userId, input);
  }

  /**
   * Mutation: Upgrade or downgrade subscription
   */
  @Mutation(() => UserSubscription, {
    name: 'changeSubscriptionPlan',
    description: 'Upgrade or downgrade the current user subscription',
  })
  @UseGuards(GqlAuthGuard)
  async changePlan(
    @Context() context: { req: { user: { userId: string } } },
    @Args('newPlanId') newPlanId: string,
  ): Promise<UserSubscription> {
    const userId = context.req.user?.userId;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.service.changeUserPlan(userId, newPlanId);
  }

  /**
   * Mutation: Cancel the current user's subscription
   */
  @Mutation(() => UserSubscription, {
    name: 'cancelMySubscription',
    description: 'Cancel the current user subscription',
  })
  @UseGuards(GqlAuthGuard)
  async cancelSubscription(
    @Context() context: { req: { user: { userId: string } } },
    @Args('input') input: CancelSubscriptionInput,
  ): Promise<UserSubscription> {
    const userId = context.req.user?.userId;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.service.cancelUserSubscription(userId, input);
  }

  /**
   * Mutation: Resume a canceled subscription
   */
  @Mutation(() => UserSubscription, {
    name: 'resumeMySubscription',
    description: 'Resume a subscription that was scheduled for cancellation',
  })
  @UseGuards(GqlAuthGuard)
  async resumeSubscription(
    @Context() context: { req: { user: { userId: string } } },
  ): Promise<UserSubscription> {
    const userId = context.req.user?.userId;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.service.resumeSubscription(userId);
  }

  /**
   * Mutation: Record usage for quota tracking
   * This is typically called internally by other services
   */
  @Mutation(() => Boolean, {
    name: 'recordUsage',
    description: 'Record usage for quota tracking',
  })
  @UseGuards(GqlAuthGuard)
  async recordUsage(
    @Context() context: { req: { user: { userId: string } } },
    @Args('quotaKey') quotaKey: string,
    @Args('amount', { nullable: true }) amount?: number,
  ): Promise<boolean> {
    const userId = context.req.user?.userId;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    await this.service.recordUsage(userId, quotaKey, amount ?? 1);
    return true;
  }

  /**
   * Query: Get billing information for the current user
   */
  @Query(() => BillingInfo, {
    name: 'myBillingInfo',
    description:
      'Get billing information including subscription status and payment history',
    nullable: true,
  })
  @UseGuards(GqlAuthGuard)
  async getMyBillingInfo(
    @Context() context: { req: { user: { userId: string } } },
  ): Promise<BillingInfo | null> {
    const userId = context.req.user?.userId;
    if (!userId) {
      return null;
    }
    return this.service.getBillingInfo(userId);
  }

  /**
   * Query: Get payment history for the current user
   */
  @Query(() => [PaymentHistoryItem], {
    name: 'myPaymentHistory',
    description: 'Get payment history for the current user',
  })
  @UseGuards(GqlAuthGuard)
  async getMyPaymentHistory(
    @Context() context: { req: { user: { userId: string } } },
  ): Promise<PaymentHistoryItem[]> {
    const userId = context.req.user?.userId;
    if (!userId) {
      return [];
    }
    return this.service.getPaymentHistory(userId);
  }
}
