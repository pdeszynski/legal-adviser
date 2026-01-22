/**
 * Result pattern for handling operations that can fail
 * Provides a type-safe alternative to throwing exceptions
 */
export class Result<T, E = Error> {
  private readonly _value: T;
  private readonly _error: E;
  private readonly _isSuccess: boolean;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this._isSuccess = isSuccess;
    this._value = value!;
    this._error = error!;
  }

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  get isFailure(): boolean {
    return !this._isSuccess;
  }

  get value(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot get value from failed result');
    }
    return this._value;
  }

  get error(): E {
    if (this._isSuccess) {
      throw new Error('Cannot get error from successful result');
    }
    return this._error;
  }

  static success<T>(value: T): Result<T> {
    return new Result<T>(true, value);
  }

  static failure<T, E>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isFailure) {
      return Result.failure<U, E>(this.error);
    }
    try {
      return new Result<U, E>(true, fn(this.value));
    } catch (error) {
      return Result.failure<U, E>(error as E);
    }
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isFailure) {
      return Result.failure<U, E>(this.error);
    }
    return fn(this.value);
  }

  unwrapOr(defaultValue: T): T {
    return this.isSuccess ? this.value : defaultValue;
  }

  match<U>(patterns: {
    success: (value: T) => U;
    failure: (error: E) => U;
  }): U {
    return this.isSuccess ? patterns.success(this.value) : patterns.failure(this.error);
  }
}
