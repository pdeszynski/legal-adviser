import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RequireAdmin, RoleGuard } from '../auth/guards/role.guard';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import {
  CreateSubscriptionPlanInput,
  UpdateSubscriptionPlanInput,
} from './dto/subscription.dto';

/**
 * Subscriptions Admin Resolver
 *
 * Admin-only operations for subscription plan management.
 * All methods require both authentication and admin role.
 *
 * User-facing operations (mySubscription, changeSubscriptionPlan, etc.)
 * remain in the main SubscriptionsResolver.
 *
 * @example
 * @UseGuards(GqlAuthGuard, RoleGuard)
 * @RequireAdmin()
 */
@Resolver(() => SubscriptionPlan)
@UseGuards(GqlAuthGuard, RoleGuard)
@RequireAdmin()
export class SubscriptionsAdminResolver {
  constructor(private readonly service: SubscriptionsService) {}

  /**
   * Mutation: Create a subscription plan (admin only)
   */
  @Mutation(() => SubscriptionPlan, {
    name: 'createSubscriptionPlan',
    description: 'Create a new subscription plan (admin only)',
  })
  async createPlan(
    @Args('input') input: CreateSubscriptionPlanInput,
  ): Promise<SubscriptionPlan> {
    return this.service.createPlan(input);
  }

  /**
   * Mutation: Update a subscription plan (admin only)
   */
  @Mutation(() => SubscriptionPlan, {
    name: 'updateSubscriptionPlan',
    description: 'Update an existing subscription plan (admin only)',
  })
  async updatePlan(
    @Args('id') id: string,
    @Args('input') input: UpdateSubscriptionPlanInput,
  ): Promise<SubscriptionPlan> {
    return this.service.updatePlan(id, input);
  }

  /**
   * Mutation: Delete a subscription plan (admin only)
   */
  @Mutation(() => Boolean, {
    name: 'deleteSubscriptionPlan',
    description: 'Delete a subscription plan (admin only)',
  })
  async deletePlan(@Args('id') id: string): Promise<boolean> {
    await this.service.deletePlan(id);
    return true;
  }
}
