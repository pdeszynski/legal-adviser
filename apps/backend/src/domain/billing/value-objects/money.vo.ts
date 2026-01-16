import { ValueObject } from '../../shared/base';

/**
 * Supported currencies
 */
export enum CurrencyEnum {
  PLN = 'PLN',
  EUR = 'EUR',
  USD = 'USD',
}

interface MoneyProps {
  amount: number;
  currency: CurrencyEnum;
}

/**
 * Money Value Object
 * Represents monetary values with currency
 */
export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): CurrencyEnum {
    return this.props.currency;
  }

  get isZero(): boolean {
    return this.props.amount === 0;
  }

  get isPositive(): boolean {
    return this.props.amount > 0;
  }

  static create(amount: number, currency: CurrencyEnum): Money {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }

    // Round to 2 decimal places
    const roundedAmount = Math.round(amount * 100) / 100;

    return new Money({
      amount: roundedAmount,
      currency,
    });
  }

  static zero(currency: CurrencyEnum): Money {
    return new Money({ amount: 0, currency });
  }

  static pln(amount: number): Money {
    return Money.create(amount, CurrencyEnum.PLN);
  }

  static eur(amount: number): Money {
    return Money.create(amount, CurrencyEnum.EUR);
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return Money.create(this.props.amount + other.amount, this.props.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this.props.amount - other.amount;
    if (result < 0) {
      throw new Error('Result cannot be negative');
    }
    return Money.create(result, this.props.currency);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Factor cannot be negative');
    }
    return Money.create(this.props.amount * factor, this.props.currency);
  }

  private ensureSameCurrency(other: Money): void {
    if (this.props.currency !== other.currency) {
      throw new Error('Cannot operate on different currencies');
    }
  }

  format(): string {
    return `${this.props.amount.toFixed(2)} ${this.props.currency}`;
  }
}
