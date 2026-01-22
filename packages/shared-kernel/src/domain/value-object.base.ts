/**
 * Value Object base class for Domain-Driven Design
 * Value Objects are immutable and compared by their attributes, not identity
 */
export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (this === other) {
      return true;
    }
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }

  /**
   * Returns a shallow copy of the props
   */
  toValue(): T {
    return { ...this.props };
  }
}

/**
 * Simple Value Object for primitive-like values
 */
export abstract class SimpleValueObject<T> {
  protected readonly value: T;

  constructor(value: T) {
    this.validate(value);
    this.value = value;
  }

  protected abstract validate(value: T): void;

  equals(other: SimpleValueObject<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (this === other) {
      return true;
    }
    return this.value === other.value;
  }

  toValue(): T {
    return this.value;
  }

  toString(): string {
    return String(this.value);
  }
}
