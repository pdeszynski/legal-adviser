import { SimpleValueObject } from '@legal/shared-kernel';

/**
 * Full Name Value Object for Demo Request
 *
 * Represents the submitter's full name.
 */
export class DemoRequestFullName extends SimpleValueObject<string> {
  private static readonly MIN_LENGTH = 2;
  private static readonly MAX_LENGTH = 255;

  protected validate(value: string): void {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < DemoRequestFullName.MIN_LENGTH) {
      throw new Error('Full name must be at least 2 characters long');
    }
    if (trimmed.length > DemoRequestFullName.MAX_LENGTH) {
      throw new Error(
        `Full name cannot exceed ${DemoRequestFullName.MAX_LENGTH} characters`,
      );
    }
  }

  static create(name: string): DemoRequestFullName {
    return new DemoRequestFullName(name.trim());
  }

  get firstName(): string {
    return this.value.split(' ')[0];
  }

  get lastName(): string {
    const parts = this.value.split(' ');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }
}
