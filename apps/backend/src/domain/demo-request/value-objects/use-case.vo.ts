import { SimpleValueObject } from '@legal/shared-kernel';

/**
 * Use Case Value Object for Demo Request
 *
 * Represents the description of how the user plans to use the platform.
 */
export class UseCase extends SimpleValueObject<string> {
  private static readonly MIN_LENGTH = 10;
  private static readonly MAX_LENGTH = 5000;

  protected validate(value: string): void {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < UseCase.MIN_LENGTH) {
      throw new Error(
        `Use case must be at least ${UseCase.MIN_LENGTH} characters long`,
      );
    }
    if (trimmed.length > UseCase.MAX_LENGTH) {
      throw new Error(
        `Use case cannot exceed ${UseCase.MAX_LENGTH} characters`,
      );
    }
  }

  static create(text: string): UseCase {
    return new UseCase(text.trim());
  }
}
