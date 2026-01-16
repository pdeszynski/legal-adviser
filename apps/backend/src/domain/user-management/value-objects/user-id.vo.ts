import { SimpleValueObject } from '../../shared/base';

/**
 * User ID Value Object
 */
export class UserId extends SimpleValueObject<string> {
  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }
  }

  static create(id: string): UserId {
    return new UserId(id);
  }
}
