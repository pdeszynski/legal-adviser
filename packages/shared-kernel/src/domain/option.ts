/**
 * Option type for handling nullable/optional values
 * Provides a type-safe alternative to null/undefined
 */
export class Option<T> {
  private readonly _value: T | null;

  private constructor(value: T | null) {
    this._value = value;
  }

  get isSome(): boolean {
    return this._value !== null;
  }

  get isNone(): boolean {
    return this._value === null;
  }

  static some<T>(value: T): Option<T> {
    return new Option(value);
  }

  static none<T>(): Option<T> {
    return new Option<T>(null);
  }

  static fromNullable<T>(value: T | null | undefined): Option<T> {
    return value === null || value === undefined
      ? Option.none<T>()
      : Option.some(value);
  }

  unwrap(): T {
    if (this.isNone) {
      throw new Error('Cannot unwrap none value');
    }
    return this._value as T;
  }

  unwrapOr(defaultValue: T): T {
    return this.isSome ? (this._value as T) : defaultValue;
  }

  unwrapOrElse(fn: () => T): T {
    return this.isSome ? (this._value as T) : fn();
  }

  map<U>(fn: (value: T) => U): Option<U> {
    return this.isSome ? Option.some(fn(this._value as T)) : Option.none<U>();
  }

  flatMap<U>(fn: (value: T) => Option<U>): Option<U> {
    return this.isSome ? fn(this._value as T) : Option.none<U>();
  }

  filter(predicate: (value: T) => boolean): Option<T> {
    return this.isSome && predicate(this._value as T) ? this : Option.none<T>();
  }

  match<U>(patterns: {
    some: (value: T) => U;
    none: () => U;
  }): U {
    return this.isSome ? patterns.some(this._value as T) : patterns.none();
  }

  toArray(): T[] {
    return this.isSome ? [this._value as T] : [];
  }
}
