import { ValueObject } from '../../shared/base';
import { Money, CurrencyEnum } from './money.vo';

/**
 * Subscription plan types
 */
export enum PlanTypeEnum {
  FREE = 'free',
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

/**
 * Billing period
 */
export enum BillingPeriodEnum {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

interface SubscriptionPlanProps {
  planType: PlanTypeEnum;
  name: string;
  price: Money;
  billingPeriod: BillingPeriodEnum;
  queryLimit: number; // -1 for unlimited
  documentLimit: number; // -1 for unlimited
  features: string[];
}

/**
 * Subscription Plan Value Object
 */
export class SubscriptionPlan extends ValueObject<SubscriptionPlanProps> {
  private constructor(props: SubscriptionPlanProps) {
    super(props);
  }

  get planType(): PlanTypeEnum {
    return this.props.planType;
  }

  get name(): string {
    return this.props.name;
  }

  get price(): Money {
    return this.props.price;
  }

  get billingPeriod(): BillingPeriodEnum {
    return this.props.billingPeriod;
  }

  get queryLimit(): number {
    return this.props.queryLimit;
  }

  get documentLimit(): number {
    return this.props.documentLimit;
  }

  get features(): string[] {
    return [...this.props.features];
  }

  get isUnlimitedQueries(): boolean {
    return this.props.queryLimit === -1;
  }

  get isUnlimitedDocuments(): boolean {
    return this.props.documentLimit === -1;
  }

  static create(
    planType: PlanTypeEnum,
    name: string,
    price: Money,
    billingPeriod: BillingPeriodEnum,
    queryLimit: number,
    documentLimit: number,
    features: string[],
  ): SubscriptionPlan {
    return new SubscriptionPlan({
      planType,
      name,
      price,
      billingPeriod,
      queryLimit,
      documentLimit,
      features,
    });
  }

  // Predefined plans
  static free(): SubscriptionPlan {
    return SubscriptionPlan.create(
      PlanTypeEnum.FREE,
      'Darmowy',
      Money.zero(CurrencyEnum.PLN),
      BillingPeriodEnum.MONTHLY,
      10,
      5,
      ['basic_queries', 'email_support'],
    );
  }

  static basic(billingPeriod: BillingPeriodEnum = BillingPeriodEnum.MONTHLY): SubscriptionPlan {
    const price =
      billingPeriod === BillingPeriodEnum.MONTHLY
        ? Money.pln(49)
        : Money.pln(490);

    return SubscriptionPlan.create(
      PlanTypeEnum.BASIC,
      'Podstawowy',
      price,
      billingPeriod,
      100,
      50,
      ['basic_queries', 'document_analysis', 'email_support'],
    );
  }

  static professional(
    billingPeriod: BillingPeriodEnum = BillingPeriodEnum.MONTHLY,
  ): SubscriptionPlan {
    const price =
      billingPeriod === BillingPeriodEnum.MONTHLY
        ? Money.pln(149)
        : Money.pln(1490);

    return SubscriptionPlan.create(
      PlanTypeEnum.PROFESSIONAL,
      'Profesjonalny',
      price,
      billingPeriod,
      500,
      200,
      [
        'advanced_queries',
        'document_analysis',
        'priority_support',
        'api_access',
      ],
    );
  }

  static enterprise(): SubscriptionPlan {
    return SubscriptionPlan.create(
      PlanTypeEnum.ENTERPRISE,
      'Enterprise',
      Money.pln(499),
      BillingPeriodEnum.MONTHLY,
      -1, // unlimited
      -1, // unlimited
      [
        'unlimited_queries',
        'unlimited_documents',
        'dedicated_support',
        'api_access',
        'custom_integrations',
        'sla_guarantee',
      ],
    );
  }
}
