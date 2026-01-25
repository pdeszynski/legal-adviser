import { SimpleValueObject } from '@legal/shared-kernel';

/**
 * Email Value Object for Demo Request
 *
 * Represents the submitter's email address with validation.
 */
export class DemoRequestEmail extends SimpleValueObject<string> {
  private static readonly EMAIL_REGEX =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  protected validate(value: string): void {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error('Email cannot be empty');
    }
    if (!DemoRequestEmail.EMAIL_REGEX.test(trimmed)) {
      throw new Error('Invalid email format');
    }
  }

  static create(email: string): DemoRequestEmail {
    return new DemoRequestEmail(email.toLowerCase().trim());
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }

  getLocalPart(): string {
    return this.value.split('@')[0];
  }
}
