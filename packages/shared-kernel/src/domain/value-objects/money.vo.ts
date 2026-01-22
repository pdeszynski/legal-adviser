import { ValueObject } from '../value-object.base';

interface MoneyProps {
  amount: number;
  currency: string;
}

/**
 * Money Value Object
 * Represents monetary values with currency
 */
export class Money extends ValueObject<MoneyProps> {
  private static readonly DEFAULT_CURRENCY = 'PLN';

  constructor(amount: number, currency: string = Money.DEFAULT_CURRENCY) {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
    if (currency.length !== 3) {
      throw new Error('Currency must be a 3-letter code');
    }
    super({ amount, currency: currency.toUpperCase() });
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract different currencies');
    }
    if (this.amount < other.amount) {
      throw new Error('Result would be negative');
    }
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Factor cannot be negative');
    }
    return new Money(this.amount * factor, this.currency);
  }

  isGreaterThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new Error('Cannot compare different currencies');
    }
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new Error('Cannot compare different currencies');
    }
    return this.amount < other.amount;
  }

  format(): string {
    return `${this.amount.toFixed(2)} ${this.currency}`;
  }

  static zero(currency: string = Money.DEFAULT_CURRENCY): Money {
    return new Money(0, currency);
  }
}
