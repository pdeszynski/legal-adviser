import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  FilterableField,
  IDField,
  QueryOptions,
  Relation,
} from '@ptc-org/nestjs-query-graphql';
import {
  ObjectType,
  ID,
  Field,
  GraphQLISODateTime,
  Int,
  registerEnumType,
} from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { SubscriptionPlan, PlanTier } from './subscription-plan.entity';

/**
 * Subscription Status
 */
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIALING = 'TRIALING',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

registerEnumType(SubscriptionStatus, {
  name: 'SubscriptionStatus',
  description: 'Subscription status',
});

/**
 * UserSubscription Entity
 *
 * Represents a user's subscription to a plan.
 * Tracks subscription status, billing cycle, usage, and renewal.
 *
 * Aggregate Root: UserSubscription
 * Invariants:
 *   - one active subscription per user at a time
 *   - trialEndDate must be after startDate when in trialing status
 *   - currentPeriodEnd must be after currentPeriodStart
 *   - cancelAtPeriodEnd can only be true if status is ACTIVE or TRIALING
 *
 * Uses nestjs-query decorators for auto-generated CRUD resolvers.
 */
@Entity('user_subscriptions')
@ObjectType('UserSubscription')
@QueryOptions({ enableTotalCount: true })
@Relation('user', () => User)
@Relation('plan', () => SubscriptionPlan)
@Index(['userId'])
@Index(['planId'])
@Index(['status'])
@Index(['currentPeriodEnd'])
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  /**
   * Reference to the user who owns this subscription
   */
  @Column({ type: 'uuid' })
  @FilterableField()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Reference to the subscription plan
   */
  @Column({ type: 'uuid' })
  @FilterableField()
  planId: string;

  @ManyToOne(() => SubscriptionPlan, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'planId' })
  plan: SubscriptionPlan;

  /**
   * Current status of the subscription
   */
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIALING,
  })
  @FilterableField(() => SubscriptionStatus)
  status: SubscriptionStatus;

  /**
   * When the subscription started
   */
  @Column({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  startDate: Date;

  /**
   * When the trial ends (null if not on trial)
   */
  @Column({ type: 'timestamp', nullable: true })
  @Field(() => GraphQLISODateTime, { nullable: true })
  trialEndDate: Date | null;

  /**
   * Start of the current billing period
   */
  @Column({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  currentPeriodStart: Date;

  /**
   * End of the current billing period
   */
  @Column({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  currentPeriodEnd: Date;

  /**
   * Whether the subscription will be canceled at the end of the current period
   */
  @Column({ type: 'boolean', default: false })
  @FilterableField()
  cancelAtPeriodEnd: boolean;

  /**
   * When the subscription was canceled
   */
  @Column({ type: 'timestamp', nullable: true })
  @Field(() => GraphQLISODateTime, { nullable: true })
  canceledAt: Date | null;

  /**
   * Stripe subscription ID for payment processing
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true })
  stripeSubscriptionId: string | null;

  /**
   * Stripe customer ID
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true })
  stripeCustomerId: string | null;

  /**
   * Current usage counters for quota enforcement
   * Stored as JSONB for flexible querying
   * Exposed as JSON string in GraphQL
   */
  @Column({ type: 'jsonb', default: '{}' })
  @Field(() => String)
  usage: string;

  /**
   * Last payment date
   */
  @Column({ type: 'timestamp', nullable: true })
  @Field(() => GraphQLISODateTime, { nullable: true })
  lastPaymentAt: Date | null;

  /**
   * Last payment amount in USD
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @Field(() => Int, { nullable: true })
  lastPaymentAmount: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  updatedAt: Date;

  /**
   * Check if the subscription is currently active
   * Active if status is ACTIVE or TRIALING and not past the end date
   */
  isActive(): boolean {
    if (
      this.status !== SubscriptionStatus.ACTIVE &&
      this.status !== SubscriptionStatus.TRIALING
    ) {
      return false;
    }

    const now = new Date();
    if (this.currentPeriodEnd < now) {
      return false;
    }

    return true;
  }

  /**
   * Check if the subscription is on trial
   */
  isTrialing(): boolean {
    if (this.status !== SubscriptionStatus.TRIALING) {
      return false;
    }

    if (!this.trialEndDate) {
      return false;
    }

    return this.trialEndDate > new Date();
  }

  /**
   * Check if the subscription will be canceled at the end of the period
   */
  willCancel(): boolean {
    return this.cancelAtPeriodEnd;
  }

  /**
   * Get the days remaining in the current billing period
   */
  getDaysRemaining(): number {
    const now = new Date();
    const end = new Date(this.currentPeriodEnd);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * Check if the user has exceeded their quota for a specific resource
   */
  hasExceededQuota(quotaKey: string): boolean {
    try {
      const usage =
        typeof this.usage === 'string' ? JSON.parse(this.usage) : this.usage;

      if (!this.plan) {
        return false; // Should not happen, but handle gracefully
      }

      const planFeatures =
        typeof this.plan.features === 'string'
          ? JSON.parse(this.plan.features)
          : this.plan.features;

      const quota = planFeatures[quotaKey];
      if (quota === -1) {
        return false; // Unlimited
      }

      const currentUsage = usage[quotaKey] || 0;
      return currentUsage >= quota;
    } catch {
      return false;
    }
  }

  /**
   * Get the remaining quota for a specific resource
   */
  getRemainingQuota(quotaKey: string): number {
    try {
      const usage =
        typeof this.usage === 'string' ? JSON.parse(this.usage) : this.usage;

      if (!this.plan) {
        return 0;
      }

      const planFeatures =
        typeof this.plan.features === 'string'
          ? JSON.parse(this.plan.features)
          : this.plan.features;

      const quota = planFeatures[quotaKey];
      if (quota === -1) {
        return -1; // Unlimited
      }

      const currentUsage = usage[quotaKey] || 0;
      return Math.max(0, quota - currentUsage);
    } catch {
      return 0;
    }
  }

  /**
   * Record usage for a specific resource
   */
  recordUsage(quotaKey: string, amount: number = 1): void {
    try {
      const usage =
        typeof this.usage === 'string' ? JSON.parse(this.usage) : this.usage;
      usage[quotaKey] = (usage[quotaKey] || 0) + amount;
      this.usage = JSON.stringify(usage);
    } catch {
      // If parsing fails, start with a new usage object
      this.usage = JSON.stringify({ [quotaKey]: amount });
    }
  }

  /**
   * Reset usage for the current billing period
   */
  resetUsage(): void {
    this.usage = '{}';
  }

  /**
   * Cancel the subscription at the end of the current period
   */
  cancelAtEndOfPeriod(): void {
    this.cancelAtPeriodEnd = true;
  }

  /**
   * Cancel the subscription immediately
   */
  cancelImmediately(): void {
    this.status = SubscriptionStatus.CANCELED;
    this.canceledAt = new Date();
    this.cancelAtPeriodEnd = false;
  }

  /**
   * Create a new user subscription
   */
  static create(
    userId: string,
    planId: string,
    startDate: Date,
    trialEndDate: Date | null,
    options?: {
      stripeSubscriptionId?: string | null;
      stripeCustomerId?: string | null;
    },
  ): UserSubscription {
    const subscription = new UserSubscription();
    subscription.userId = userId;
    subscription.planId = planId;
    subscription.startDate = startDate;
    subscription.currentPeriodStart = startDate;
    subscription.trialEndDate = trialEndDate;

    // Set period end to 1 month from start (or trial end if on trial)
    subscription.currentPeriodEnd = trialEndDate
      ? new Date(trialEndDate)
      : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    subscription.status = trialEndDate
      ? SubscriptionStatus.TRIALING
      : SubscriptionStatus.ACTIVE;
    subscription.cancelAtPeriodEnd = false;
    subscription.usage = '{}';
    subscription.stripeSubscriptionId = options?.stripeSubscriptionId ?? null;
    subscription.stripeCustomerId = options?.stripeCustomerId ?? null;

    return subscription;
  }
}
