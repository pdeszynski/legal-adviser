import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SubscriptionPlan,
  PlanTier,
  type PlanFeatures,
} from './entities/subscription-plan.entity';
import {
  UserSubscription,
  SubscriptionStatus,
} from './entities/user-subscription.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import {
  CreateSubscriptionPlanInput,
  UpdateSubscriptionPlanInput,
  CreateUserSubscriptionInput,
  CancelSubscriptionInput,
  CheckQuotaInput,
  CheckQuotaResponse,
  SubscriptionUsageStats,
  BillingInfo,
  PaymentHistoryItem,
  PaymentMethodInfo,
} from './dto/subscription.dto';

/**
 * Subscription Management Service
 *
 * Handles business logic for managing subscription plans and user subscriptions.
 * Implements plan upgrades, downgrades, and feature access control.
 */
@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription)
    private readonly subscriptionRepository: Repository<UserSubscription>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  /**
   * Get all active subscription plans ordered by display order
   */
  async getActivePlans(): Promise<SubscriptionPlan[]> {
    return this.planRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', price: 'ASC' },
    });
  }

  /**
   * Get a subscription plan by ID
   */
  async getPlan(id: string): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Subscription plan ${id} not found`);
    }
    return plan;
  }

  /**
   * Get a subscription plan by tier
   */
  async getPlanByTier(tier: PlanTier): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.findOne({ where: { tier } });
    if (!plan) {
      throw new NotFoundException(`Subscription plan ${tier} not found`);
    }
    return plan;
  }

  /**
   * Create a new subscription plan
   */
  async createPlan(
    input: CreateSubscriptionPlanInput,
  ): Promise<SubscriptionPlan> {
    // Check if tier already exists
    const existing = await this.planRepository.findOne({
      where: { tier: input.tier },
    });
    if (existing) {
      throw new BadRequestException(
        `Subscription plan ${input.tier} already exists`,
      );
    }

    const plan = SubscriptionPlan.create(
      input.tier,
      input.name,
      input.price,
      JSON.parse(input.features) as PlanFeatures,
      {
        description: input.description,
        billingInterval: input.billingInterval,
        yearlyDiscount: input.yearlyDiscount,
        maxUsers: input.maxUsers,
        trialDays: input.trialDays,
        displayOrder: input.displayOrder,
        stripePriceId: input.stripePriceId,
        stripeYearlyPriceId: input.stripeYearlyPriceId,
      },
    );

    return this.planRepository.save(plan);
  }

  /**
   * Update a subscription plan
   */
  async updatePlan(
    id: string,
    input: UpdateSubscriptionPlanInput,
  ): Promise<SubscriptionPlan> {
    const plan = await this.getPlan(id);

    if (input.name !== undefined && input.name !== null) plan.name = input.name;
    if (input.price !== undefined && input.price !== null)
      plan.price = input.price;
    if (input.features !== undefined && input.features !== null)
      plan.features = input.features;
    if (input.description !== undefined) plan.description = input.description;
    if (input.billingInterval !== undefined && input.billingInterval !== null)
      plan.billingInterval = input.billingInterval;
    if (input.yearlyDiscount !== undefined && input.yearlyDiscount !== null)
      plan.yearlyDiscount = input.yearlyDiscount;
    if (input.maxUsers !== undefined) plan.maxUsers = input.maxUsers;
    if (input.trialDays !== undefined && input.trialDays !== null)
      plan.trialDays = input.trialDays;
    if (input.isActive !== undefined && input.isActive !== null)
      plan.isActive = input.isActive;
    if (input.displayOrder !== undefined && input.displayOrder !== null)
      plan.displayOrder = input.displayOrder;
    if (input.stripePriceId !== undefined)
      plan.stripePriceId = input.stripePriceId;
    if (input.stripeYearlyPriceId !== undefined)
      plan.stripeYearlyPriceId = input.stripeYearlyPriceId;

    return this.planRepository.save(plan);
  }

  /**
   * Delete a subscription plan
   */
  async deletePlan(id: string): Promise<void> {
    const plan = await this.getPlan(id);

    // Check if there are active subscriptions
    const activeSubscriptions = await this.subscriptionRepository.count({
      where: { planId: id, status: SubscriptionStatus.ACTIVE },
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestException(
        'Cannot delete plan with active subscriptions',
      );
    }

    await this.planRepository.remove(plan);
  }

  /**
   * Get user's active subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId },
      relations: ['plan'],
    });

    return subscription;
  }

  /**
   * Create a new subscription for a user
   */
  async createUserSubscription(
    userId: string,
    input: CreateUserSubscriptionInput,
  ): Promise<UserSubscription> {
    // Check if user already has an active subscription
    const existing = await this.subscriptionRepository.findOne({
      where: { userId },
    });

    if (existing && existing.isActive()) {
      throw new BadRequestException('User already has an active subscription');
    }

    // Get the plan
    const plan = await this.getPlan(input.planId);

    // Calculate trial end date
    const trialEndDate =
      plan.trialDays > 0
        ? new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000)
        : null;

    const subscription = UserSubscription.create(
      userId,
      input.planId,
      new Date(),
      trialEndDate,
      {
        stripeSubscriptionId: input.stripeSubscriptionId,
        stripeCustomerId: input.stripeCustomerId,
      },
    );

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Upgrade or downgrade a user's subscription
   */
  async changeUserPlan(
    userId: string,
    newPlanId: string,
  ): Promise<UserSubscription> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      throw new NotFoundException('User subscription not found');
    }

    if (!subscription.isActive()) {
      throw new BadRequestException(
        'Cannot change plan for inactive subscription',
      );
    }

    const newPlan = await this.getPlan(newPlanId);
    const currentPlan = await this.getPlan(subscription.planId);

    // Check if this is an upgrade or downgrade
    const planOrder = [
      PlanTier.FREE,
      PlanTier.BASIC,
      PlanTier.PROFESSIONAL,
      PlanTier.ENTERPRISE,
    ];
    const currentIndex = planOrder.indexOf(currentPlan.tier);
    const newIndex = planOrder.indexOf(newPlan.tier);

    if (currentIndex === newIndex) {
      throw new BadRequestException('User already has this plan');
    }

    // Update subscription
    subscription.planId = newPlanId;
    subscription.plan = newPlan;

    // Reset usage if upgrading
    if (newIndex > currentIndex) {
      subscription.resetUsage();
    }

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Cancel a user's subscription
   */
  async cancelUserSubscription(
    userId: string,
    input: CancelSubscriptionInput,
  ): Promise<UserSubscription> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      throw new NotFoundException('User subscription not found');
    }

    if (!subscription.isActive()) {
      throw new BadRequestException('Cannot cancel inactive subscription');
    }

    if (input.immediately) {
      subscription.cancelImmediately();
    } else {
      subscription.cancelAtEndOfPeriod();
    }

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Check if a user has access to a feature
   */
  async canUserAccessFeature(
    userId: string,
    featureKey: string,
  ): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription || !subscription.isActive() || !subscription.plan) {
      return false;
    }

    return subscription.plan.supportsFeature(featureKey as keyof PlanFeatures);
  }

  /**
   * Check user's quota for a specific resource
   */
  async checkUserQuota(
    userId: string,
    input: CheckQuotaInput,
  ): Promise<CheckQuotaResponse> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription || !subscription.isActive() || !subscription.plan) {
      return {
        allowed: false,
        remaining: 0,
        limit: 0,
        message: 'No active subscription',
      };
    }

    const quota = subscription.plan.getQuota(
      input.quotaKey as keyof PlanFeatures,
    );

    if (quota === -1) {
      return {
        allowed: true,
        remaining: -1,
        limit: -1,
        message: 'Unlimited',
      };
    }

    const remaining = subscription.getRemainingQuota(input.quotaKey);
    const allowed = remaining >= (input.amount || 1);

    return {
      allowed,
      remaining,
      limit: quota,
      message: allowed
        ? null
        : `Quota exceeded for ${input.quotaKey}. ${remaining}/${quota} remaining.`,
    };
  }

  /**
   * Record usage for a user
   */
  async recordUsage(
    userId: string,
    quotaKey: string,
    amount: number = 1,
  ): Promise<void> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      throw new NotFoundException('User subscription not found');
    }

    subscription.recordUsage(quotaKey, amount);
    await this.subscriptionRepository.save(subscription);
  }

  /**
   * Get usage statistics for a user's subscription
   */
  async getUserUsageStats(userId: string): Promise<SubscriptionUsageStats> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription || !subscription.plan) {
      throw new NotFoundException('User subscription not found');
    }

    return {
      subscriptionId: subscription.id,
      planTier: subscription.plan.tier,
      usage: subscription.usage,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      daysRemaining: subscription.getDaysRemaining(),
    };
  }

  /**
   * Resume a canceled subscription
   */
  async resumeSubscription(userId: string): Promise<UserSubscription> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      throw new NotFoundException('User subscription not found');
    }

    if (!subscription.cancelAtPeriodEnd) {
      throw new BadRequestException(
        'Subscription is not scheduled for cancellation',
      );
    }

    subscription.cancelAtPeriodEnd = false;
    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Get billing information including payment history
   */
  async getBillingInfo(userId: string): Promise<BillingInfo> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId },
      relations: ['plan'],
    });

    if (!subscription || !subscription.plan) {
      throw new NotFoundException('User subscription not found');
    }

    // Get payment history
    const payments = await this.paymentRepository.find({
      where: { subscriptionId: subscription.id },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const paymentHistory: PaymentHistoryItem[] = payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount.toString(),
      currency: payment.currency,
      status: payment.status as any,
      method: payment.method as any,
      description: payment.description,
      invoiceId: payment.stripeInvoiceId,
      createdAt: payment.createdAt as any,
      refundedAt: payment.refundedAt as any,
      refundAmount: payment.refundAmount?.toString() ?? null,
    }));

    // Calculate next billing amount
    const nextBillingAmount =
      subscription.status === SubscriptionStatus.ACTIVE
        ? subscription.plan.price.toString()
        : null;

    return {
      subscriptionId: subscription.id,
      planTier: subscription.plan.tier as any,
      planName: subscription.plan.name,
      status: subscription.status as any,
      currentPeriodStart: subscription.currentPeriodStart as any,
      currentPeriodEnd: subscription.currentPeriodEnd as any,
      daysRemaining: subscription.getDaysRemaining(),
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      usage: subscription.usage,
      paymentHistory,
      paymentMethods: [], // TODO: Implement when payment methods are managed
      nextBillingAmount,
    };
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(userId: string): Promise<PaymentHistoryItem[]> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId },
    });

    if (!subscription) {
      return [];
    }

    const payments = await this.paymentRepository.find({
      where: { subscriptionId: subscription.id },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount.toString(),
      currency: payment.currency,
      status: payment.status as any,
      method: payment.method as any,
      description: payment.description,
      invoiceId: payment.stripeInvoiceId,
      createdAt: payment.createdAt as any,
      refundedAt: payment.refundedAt as any,
      refundAmount: payment.refundAmount?.toString() ?? null,
    }));
  }

  /**
   * Create a payment record
   */
  async createPayment(
    userId: string,
    subscriptionId: string,
    amount: number,
    options?: {
      currency?: string;
      method?: any;
      stripePaymentIntentId?: string | null;
      stripeInvoiceId?: string | null;
      description?: string | null;
    },
  ): Promise<Payment> {
    const payment = Payment.create(userId, subscriptionId, amount, options);

    return this.paymentRepository.save(payment);
  }
}
