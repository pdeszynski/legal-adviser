import { SimpleValueObject } from '../../shared/base';

/**
 * Subscription lifecycle status
 */
export enum SubscriptionStatusEnum {
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

/**
 * Subscription Status Value Object
 */
export class SubscriptionStatus extends SimpleValueObject<SubscriptionStatusEnum> {
  protected validate(value: SubscriptionStatusEnum): void {
    if (!Object.values(SubscriptionStatusEnum).includes(value)) {
      throw new Error(`Invalid subscription status: ${value}`);
    }
  }

  static create(status: SubscriptionStatusEnum): SubscriptionStatus {
    return new SubscriptionStatus(status);
  }

  static trial(): SubscriptionStatus {
    return new SubscriptionStatus(SubscriptionStatusEnum.TRIAL);
  }

  static active(): SubscriptionStatus {
    return new SubscriptionStatus(SubscriptionStatusEnum.ACTIVE);
  }

  isTrial(): boolean {
    return this.value === SubscriptionStatusEnum.TRIAL;
  }

  isActive(): boolean {
    return this.value === SubscriptionStatusEnum.ACTIVE;
  }

  isPastDue(): boolean {
    return this.value === SubscriptionStatusEnum.PAST_DUE;
  }

  isCancelled(): boolean {
    return this.value === SubscriptionStatusEnum.CANCELLED;
  }

  isUsable(): boolean {
    return [
      SubscriptionStatusEnum.TRIAL,
      SubscriptionStatusEnum.ACTIVE,
      SubscriptionStatusEnum.PAST_DUE,
    ].includes(this.value);
  }

  canTransitionTo(newStatus: SubscriptionStatusEnum): boolean {
    const transitions: Record<SubscriptionStatusEnum, SubscriptionStatusEnum[]> = {
      [SubscriptionStatusEnum.TRIAL]: [
        SubscriptionStatusEnum.ACTIVE,
        SubscriptionStatusEnum.EXPIRED,
      ],
      [SubscriptionStatusEnum.ACTIVE]: [
        SubscriptionStatusEnum.PAST_DUE,
        SubscriptionStatusEnum.CANCELLED,
      ],
      [SubscriptionStatusEnum.PAST_DUE]: [
        SubscriptionStatusEnum.ACTIVE,
        SubscriptionStatusEnum.CANCELLED,
        SubscriptionStatusEnum.EXPIRED,
      ],
      [SubscriptionStatusEnum.CANCELLED]: [SubscriptionStatusEnum.ACTIVE],
      [SubscriptionStatusEnum.EXPIRED]: [SubscriptionStatusEnum.ACTIVE],
    };

    return transitions[this.value]?.includes(newStatus) ?? false;
  }
}
