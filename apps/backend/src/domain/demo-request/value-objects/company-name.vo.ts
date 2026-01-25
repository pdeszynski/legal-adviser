import { SimpleValueObject } from '@legal/shared-kernel';

/**
 * Company Name Value Object for Demo Request
 *
 * Represents the name of the company submitting the demo request.
 */
export class CompanyName extends SimpleValueObject<string> {
  private static readonly MIN_LENGTH = 2;
  private static readonly MAX_LENGTH = 255;

  protected validate(value: string): void {
    if (!value) return; // Company name is optional

    const trimmed = value.trim();
    if (trimmed.length > 0 && trimmed.length < CompanyName.MIN_LENGTH) {
      throw new Error('Company name must be at least 2 characters long');
    }
    if (trimmed.length > CompanyName.MAX_LENGTH) {
      throw new Error(
        `Company name cannot exceed ${CompanyName.MAX_LENGTH} characters`,
      );
    }
  }

  static create(name: string | null | undefined): CompanyName | null {
    if (!name || name.trim().length === 0) {
      return null;
    }
    return new CompanyName(name.trim());
  }
}
