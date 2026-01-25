import { SimpleValueObject } from '../../shared/base';

/**
 * User ID Value Object for Two-Factor Auth
 *
 * References the user who owns the two-factor authentication configuration.
 */
export class TwoFactorUserId extends SimpleValueObject<string> {
  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error('User ID must be a valid UUID');
    }
  }

  static create(id: string): TwoFactorUserId {
    return new TwoFactorUserId(id);
  }
}
