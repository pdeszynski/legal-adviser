import { AggregateRoot } from '../../shared/base';
import {
  SubscriptionPlan,
  PlanTypeEnum,
  BillingPeriodEnum,
  SubscriptionStatus,
  SubscriptionStatusEnum,
  UsageQuota,
  Money,
  CurrencyEnum,
} from '../value-objects';
import {
  SubscriptionCreatedEvent,
  SubscriptionActivatedEvent,
  SubscriptionCancelledEvent,
  PaymentProcessedEvent,
  QuotaExceededEvent,
} from '../events';

interface SubscriptionProps {
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  usageQuota: UsageQuota;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt?: Date;
  cancelReason?: string;
}

/**
 * Subscription Aggregate Root
 * Manages billing subscriptions, plans, and usage quotas
 */
export class SubscriptionAggregate extends AggregateRoot<string> {
  private _userId: string;
  private _plan: SubscriptionPlan;
  private _status: SubscriptionStatus;
  private _usageQuota: UsageQuota;
  private _currentPeriodStart: Date;
  private _currentPeriodEnd: Date;
  private _cancelledAt?: Date;
  private _cancelReason?: string;

  private constructor(id: string, props: SubscriptionProps) {
    super(id);
    this._userId = props.userId;
    this._plan = props.plan;
    this._status = props.status;
    this._usageQuota = props.usageQuota;
    this._currentPeriodStart = props.currentPeriodStart;
    this._currentPeriodEnd = props.currentPeriodEnd;
    this._cancelledAt = props.cancelledAt;
    this._cancelReason = props.cancelReason;
  }

  // Getters
  get userId(): string {
    return this._userId;
  }

  get plan(): SubscriptionPlan {
    return this._plan;
  }

  get status(): SubscriptionStatus {
    return this._status;
  }

  get usageQuota(): UsageQuota {
    return this._usageQuota;
  }

  get currentPeriodStart(): Date {
    return this._currentPeriodStart;
  }

  get currentPeriodEnd(): Date {
    return this._currentPeriodEnd;
  }

  get cancelledAt(): Date | undefined {
    return this._cancelledAt;
  }

  get cancelReason(): string | undefined {
    return this._cancelReason;
  }

  // Factory methods
  static createTrial(id: string, userId: string): SubscriptionAggregate {
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial

    const plan = SubscriptionPlan.basic();

    const subscription = new SubscriptionAggregate(id, {
      userId,
      plan,
      status: SubscriptionStatus.trial(),
      usageQuota: UsageQuota.newPeriod(
        plan.queryLimit,
        plan.documentLimit,
        now,
        trialEnd,
      ),
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
    });

    subscription.addDomainEvent(
      new SubscriptionCreatedEvent({
        subscriptionId: id,
        userId,
        planType: plan.planType,
        status: SubscriptionStatusEnum.TRIAL,
        createdAt: subscription.createdAt,
      }),
    );

    return subscription;
  }

  static createWithPlan(
    id: string,
    userId: string,
    planType: PlanTypeEnum,
    billingPeriod: BillingPeriodEnum = BillingPeriodEnum.MONTHLY,
  ): SubscriptionAggregate {
    const now = new Date();
    const periodEnd = new Date(now);

    if (billingPeriod === BillingPeriodEnum.MONTHLY) {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    let plan: SubscriptionPlan;
    switch (planType) {
      case PlanTypeEnum.FREE:
        plan = SubscriptionPlan.free();
        break;
      case PlanTypeEnum.BASIC:
        plan = SubscriptionPlan.basic(billingPeriod);
        break;
      case PlanTypeEnum.PROFESSIONAL:
        plan = SubscriptionPlan.professional(billingPeriod);
        break;
      case PlanTypeEnum.ENTERPRISE:
        plan = SubscriptionPlan.enterprise();
        break;
      default:
        plan = SubscriptionPlan.free();
    }

    const subscription = new SubscriptionAggregate(id, {
      userId,
      plan,
      status:
        planType === PlanTypeEnum.FREE
          ? SubscriptionStatus.active()
          : SubscriptionStatus.trial(),
      usageQuota: UsageQuota.newPeriod(
        plan.queryLimit,
        plan.documentLimit,
        now,
        periodEnd,
      ),
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });

    subscription.addDomainEvent(
      new SubscriptionCreatedEvent({
        subscriptionId: id,
        userId,
        planType,
        status: subscription._status.toValue(),
        createdAt: subscription.createdAt,
      }),
    );

    return subscription;
  }

  // Reconstitute from persistence
  static reconstitute(
    id: string,
    userId: string,
    planType: PlanTypeEnum,
    planName: string,
    priceAmount: number,
    priceCurrency: CurrencyEnum,
    billingPeriod: BillingPeriodEnum,
    queryLimit: number,
    documentLimit: number,
    features: string[],
    status: SubscriptionStatusEnum,
    queriesUsed: number,
    documentsUsed: number,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    createdAt: Date,
    updatedAt: Date,
    cancelledAt?: Date,
    cancelReason?: string,
  ): SubscriptionAggregate {
    const plan = SubscriptionPlan.create(
      planType,
      planName,
      Money.create(priceAmount, priceCurrency),
      billingPeriod,
      queryLimit,
      documentLimit,
      features,
    );

    const subscription = new SubscriptionAggregate(id, {
      userId,
      plan,
      status: SubscriptionStatus.create(status),
      usageQuota: UsageQuota.create(
        queriesUsed,
        queryLimit,
        documentsUsed,
        documentLimit,
        currentPeriodStart,
        currentPeriodEnd,
      ),
      currentPeriodStart,
      currentPeriodEnd,
      cancelledAt,
      cancelReason,
    });

    subscription._createdAt = createdAt;
    subscription._updatedAt = updatedAt;

    return subscription;
  }

  // Business methods
  activate(): void {
    if (!this._status.canTransitionTo(SubscriptionStatusEnum.ACTIVE)) {
      throw new Error('Cannot activate subscription in current status');
    }

    this._status = SubscriptionStatus.active();
    this.incrementVersion();

    this.addDomainEvent(
      new SubscriptionActivatedEvent({
        subscriptionId: this.id,
        userId: this._userId,
        planType: this._plan.planType,
        activatedAt: this.updatedAt,
      }),
    );
  }

  cancel(reason?: string): void {
    if (!this._status.canTransitionTo(SubscriptionStatusEnum.CANCELLED)) {
      throw new Error('Cannot cancel subscription in current status');
    }

    this._status = SubscriptionStatus.create(SubscriptionStatusEnum.CANCELLED);
    this._cancelledAt = new Date();
    this._cancelReason = reason;
    this.incrementVersion();

    this.addDomainEvent(
      new SubscriptionCancelledEvent({
        subscriptionId: this.id,
        userId: this._userId,
        reason,
        cancelledAt: this._cancelledAt,
        effectiveDate: this._currentPeriodEnd,
      }),
    );
  }

  markPastDue(): void {
    if (!this._status.canTransitionTo(SubscriptionStatusEnum.PAST_DUE)) {
      throw new Error('Cannot mark subscription as past due in current status');
    }

    this._status = SubscriptionStatus.create(SubscriptionStatusEnum.PAST_DUE);
    this.incrementVersion();
  }

  processPayment(
    amount: Money,
    paymentMethod: string,
    transactionId: string,
  ): void {
    // Reactivate if past due
    if (this._status.isPastDue()) {
      this._status = SubscriptionStatus.active();
    }

    this.incrementVersion();

    this.addDomainEvent(
      new PaymentProcessedEvent({
        subscriptionId: this.id,
        userId: this._userId,
        amount: amount.amount,
        currency: amount.currency,
        paymentMethod,
        transactionId,
        processedAt: this.updatedAt,
      }),
    );
  }

  useQuery(): void {
    if (!this._status.isUsable()) {
      throw new Error('Subscription is not active');
    }

    if (!this._usageQuota.canUseQuery()) {
      this.addDomainEvent(
        new QuotaExceededEvent({
          subscriptionId: this.id,
          userId: this._userId,
          quotaType: 'queries',
          currentUsage: this._usageQuota.queriesUsed,
          limit: this._usageQuota.queriesLimit,
          exceededAt: new Date(),
        }),
      );
      throw new Error('Query quota exceeded');
    }

    this._usageQuota = this._usageQuota.incrementQueries();
    this.touch();
  }

  useDocument(): void {
    if (!this._status.isUsable()) {
      throw new Error('Subscription is not active');
    }

    if (!this._usageQuota.canUseDocument()) {
      this.addDomainEvent(
        new QuotaExceededEvent({
          subscriptionId: this.id,
          userId: this._userId,
          quotaType: 'documents',
          currentUsage: this._usageQuota.documentsUsed,
          limit: this._usageQuota.documentsLimit,
          exceededAt: new Date(),
        }),
      );
      throw new Error('Document quota exceeded');
    }

    this._usageQuota = this._usageQuota.incrementDocuments();
    this.touch();
  }

  renewPeriod(): void {
    const now = new Date();
    const periodEnd = new Date(now);

    if (this._plan.billingPeriod === BillingPeriodEnum.MONTHLY) {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    this._currentPeriodStart = now;
    this._currentPeriodEnd = periodEnd;
    this._usageQuota = UsageQuota.newPeriod(
      this._plan.queryLimit,
      this._plan.documentLimit,
      now,
      periodEnd,
    );
    this.incrementVersion();
  }

  upgradePlan(newPlanType: PlanTypeEnum): void {
    let newPlan: SubscriptionPlan;
    switch (newPlanType) {
      case PlanTypeEnum.BASIC:
        newPlan = SubscriptionPlan.basic(this._plan.billingPeriod);
        break;
      case PlanTypeEnum.PROFESSIONAL:
        newPlan = SubscriptionPlan.professional(this._plan.billingPeriod);
        break;
      case PlanTypeEnum.ENTERPRISE:
        newPlan = SubscriptionPlan.enterprise();
        break;
      default:
        throw new Error('Cannot upgrade to this plan type');
    }

    this._plan = newPlan;
    // Update quotas with new limits while preserving usage
    this._usageQuota = UsageQuota.create(
      this._usageQuota.queriesUsed,
      newPlan.queryLimit,
      this._usageQuota.documentsUsed,
      newPlan.documentLimit,
      this._currentPeriodStart,
      this._currentPeriodEnd,
    );
    this.incrementVersion();
  }

  canUseFeature(feature: string): boolean {
    return this._status.isUsable() && this._plan.features.includes(feature);
  }
}
