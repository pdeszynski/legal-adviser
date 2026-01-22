import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  FilterableField,
  IDField,
  QueryOptions,
} from '@ptc-org/nestjs-query-graphql';
import {
  ObjectType,
  ID,
  Field,
  GraphQLISODateTime,
  Int,
} from '@nestjs/graphql';

/**
 * Subscription Plan Tiers
 * Defines the available subscription tiers
 */
export enum PlanTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

/**
 * Billing Interval
 */
export enum BillingInterval {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

/**
 * Subscription Feature Flags
 * JSON object stored as JSONB in PostgreSQL
 */
export interface PlanFeatures {
  // AI features
  aiDocumentGeneration: boolean;
  aiQuestionAnswering: boolean;
  aiRulingSearch: boolean;
  advancedCaseAnalysis: boolean;

  // Document features
  documentTemplates: number; // max number of templates
  documentCollaboration: boolean;
  documentVersioning: boolean;
  pdfExport: boolean;

  // Search features
  semanticSearch: boolean;
  advancedSearchFilters: boolean;

  // Notification features
  emailNotifications: boolean;
  realTimeNotifications: boolean;

  // API access
  apiAccess: boolean;
  apiKeysLimit: number; // max number of API keys

  // Support
  prioritySupport: boolean;
  dedicatedSupport: boolean;

  // Storage
  storageLimit: number; // in MB

  // Usage quotas
  monthlyAiQuota: number; // max AI operations per month
  monthlyQueryQuota: number; // max queries per month
}

/**
 * SubscriptionPlan Entity
 *
 * Represents a subscription plan with its tiers, features, quotas, and pricing.
 * Plans are defined by administrators and assigned to users.
 *
 * Aggregate Root: SubscriptionPlan
 * Invariants:
 *   - tier must be unique
 *   - price must be non-negative
 *   - all quotas must be non-negative
 *   - features must be a valid PlanFeatures object
 *
 * Uses nestjs-query decorators for auto-generated CRUD resolvers.
 */
@Entity('subscription_plans')
@ObjectType('SubscriptionPlan')
@QueryOptions({ enableTotalCount: true })
@Index(['tier'])
@Index(['isActive'])
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  /**
   * Plan tier (e.g., FREE, BASIC, PROFESSIONAL, ENTERPRISE)
   */
  @Column({
    type: 'enum',
    enum: PlanTier,
    unique: true,
  })
  @FilterableField(() => PlanTier)
  tier: PlanTier;

  /**
   * Human-readable name for the plan
   * e.g., "Free Plan", "Basic Plan", "Professional Plan"
   */
  @Column({ type: 'varchar', length: 255 })
  @FilterableField()
  name: string;

  /**
   * Detailed description of the plan
   */
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  description: string | null;

  /**
   * Price per billing interval in USD
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @FilterableField()
  price: number;

  /**
   * Billing interval (monthly or yearly)
   */
  @Column({
    type: 'enum',
    enum: BillingInterval,
    default: BillingInterval.MONTHLY,
  })
  @FilterableField(() => BillingInterval)
  billingInterval: BillingInterval;

  /**
   * Discount percentage for yearly billing (e.g., 20 for 20% off)
   */
  @Column({ type: 'int', default: 0 })
  @FilterableField()
  yearlyDiscount: number;

  /**
   * Features and quotas included in the plan
   * Stored as JSONB for flexible querying
   * Exposed as JSON string in GraphQL
   */
  @Column({ type: 'jsonb', default: '{}' })
  @Field(() => String)
  features: string;

  /**
   * Maximum number of users allowed for this plan
   * null = unlimited
   */
  @Column({ type: 'int', nullable: true })
  @FilterableField()
  maxUsers: number | null;

  /**
   * Trial period in days (0 = no trial)
   */
  @Column({ type: 'int', default: 0 })
  @FilterableField()
  trialDays: number;

  /**
   * Whether the plan is currently active and available for new subscriptions
   */
  @Column({ type: 'boolean', default: true })
  @FilterableField()
  isActive: boolean;

  /**
   * Display order for listing plans
   * Lower values appear first
   */
  @Column({ type: 'int', default: 0 })
  @FilterableField()
  displayOrder: number;

  /**
   * Stripe price ID for monthly billing
   * Used for integration with payment processor
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true })
  stripePriceId: string | null;

  /**
   * Stripe price ID for yearly billing
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true })
  stripeYearlyPriceId: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  updatedAt: Date;

  /**
   * Get the effective price for the billing interval
   * Applies discount for yearly billing
   */
  getEffectivePrice(): number {
    if (
      this.billingInterval === BillingInterval.YEARLY &&
      this.yearlyDiscount > 0
    ) {
      const discount = (this.price * 12 * this.yearlyDiscount) / 100;
      return Math.max(0, Number(this.price) * 12 - discount);
    }
    return Number(this.price);
  }

  /**
   * Check if the plan supports a specific feature
   */
  supportsFeature(featureKey: keyof PlanFeatures): boolean {
    try {
      const features: PlanFeatures =
        typeof this.features === 'string'
          ? JSON.parse(this.features)
          : this.features;
      return features[featureKey] as boolean;
    } catch {
      return false;
    }
  }

  /**
   * Get the quota for a specific resource
   */
  getQuota(quotaKey: keyof PlanFeatures): number {
    try {
      const features: PlanFeatures =
        typeof this.features === 'string'
          ? JSON.parse(this.features)
          : this.features;
      return features[quotaKey] as number;
    } catch {
      return 0;
    }
  }

  /**
   * Create a new subscription plan
   */
  static create(
    tier: PlanTier,
    name: string,
    price: number,
    features: PlanFeatures,
    options?: {
      description?: string | null;
      billingInterval?: BillingInterval;
      yearlyDiscount?: number;
      maxUsers?: number | null;
      trialDays?: number;
      displayOrder?: number;
      stripePriceId?: string | null;
      stripeYearlyPriceId?: string | null;
    },
  ): SubscriptionPlan {
    const plan = new SubscriptionPlan();
    plan.tier = tier;
    plan.name = name;
    plan.price = price;
    plan.features = JSON.stringify(features);
    plan.description = options?.description ?? null;
    plan.billingInterval = options?.billingInterval ?? BillingInterval.MONTHLY;
    plan.yearlyDiscount = options?.yearlyDiscount ?? 0;
    plan.maxUsers = options?.maxUsers ?? null;
    plan.trialDays = options?.trialDays ?? 0;
    plan.displayOrder = options?.displayOrder ?? 0;
    plan.stripePriceId = options?.stripePriceId ?? null;
    plan.stripeYearlyPriceId = options?.stripeYearlyPriceId ?? null;
    plan.isActive = true;
    return plan;
  }

  /**
   * Get default features for each tier
   */
  static getDefaultFeatures(tier: PlanTier): PlanFeatures {
    switch (tier) {
      case PlanTier.FREE:
        return {
          aiDocumentGeneration: false,
          aiQuestionAnswering: false,
          aiRulingSearch: false,
          advancedCaseAnalysis: false,
          documentTemplates: 0,
          documentCollaboration: false,
          documentVersioning: false,
          pdfExport: false,
          semanticSearch: false,
          advancedSearchFilters: false,
          emailNotifications: false,
          realTimeNotifications: false,
          apiAccess: false,
          apiKeysLimit: 0,
          prioritySupport: false,
          dedicatedSupport: false,
          storageLimit: 100, // 100 MB
          monthlyAiQuota: 0,
          monthlyQueryQuota: 10,
        };

      case PlanTier.BASIC:
        return {
          aiDocumentGeneration: false,
          aiQuestionAnswering: true,
          aiRulingSearch: true,
          advancedCaseAnalysis: false,
          documentTemplates: 5,
          documentCollaboration: false,
          documentVersioning: true,
          pdfExport: true,
          semanticSearch: true,
          advancedSearchFilters: false,
          emailNotifications: true,
          realTimeNotifications: false,
          apiAccess: false,
          apiKeysLimit: 0,
          prioritySupport: false,
          dedicatedSupport: false,
          storageLimit: 1024, // 1 GB
          monthlyAiQuota: 50,
          monthlyQueryQuota: 100,
        };

      case PlanTier.PROFESSIONAL:
        return {
          aiDocumentGeneration: true,
          aiQuestionAnswering: true,
          aiRulingSearch: true,
          advancedCaseAnalysis: true,
          documentTemplates: 25,
          documentCollaboration: true,
          documentVersioning: true,
          pdfExport: true,
          semanticSearch: true,
          advancedSearchFilters: true,
          emailNotifications: true,
          realTimeNotifications: true,
          apiAccess: true,
          apiKeysLimit: 3,
          prioritySupport: true,
          dedicatedSupport: false,
          storageLimit: 10240, // 10 GB
          monthlyAiQuota: 500,
          monthlyQueryQuota: 1000,
        };

      case PlanTier.ENTERPRISE:
        return {
          aiDocumentGeneration: true,
          aiQuestionAnswering: true,
          aiRulingSearch: true,
          advancedCaseAnalysis: true,
          documentTemplates: -1, // unlimited
          documentCollaboration: true,
          documentVersioning: true,
          pdfExport: true,
          semanticSearch: true,
          advancedSearchFilters: true,
          emailNotifications: true,
          realTimeNotifications: true,
          apiAccess: true,
          apiKeysLimit: -1, // unlimited
          prioritySupport: true,
          dedicatedSupport: true,
          storageLimit: -1, // unlimited
          monthlyAiQuota: -1, // unlimited
          monthlyQueryQuota: -1, // unlimited
        };

      default:
        return this.getDefaultFeatures(PlanTier.FREE);
    }
  }
}
