import { SimpleValueObject } from '../../shared/base';

/**
 * Subscription ID Value Object
 */
export class SubscriptionId extends SimpleValueObject<string> {
  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Subscription ID cannot be empty');
    }
  }

  static create(id: string): SubscriptionId {
    return new SubscriptionId(id);
  }
}
