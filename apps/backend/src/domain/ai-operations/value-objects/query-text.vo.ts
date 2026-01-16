import { SimpleValueObject } from '../../shared/base';

/**
 * Query Text Value Object
 */
export class QueryText extends SimpleValueObject<string> {
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 10000;

  protected validate(value: string): void {
    if (!value || value.trim().length < QueryText.MIN_LENGTH) {
      throw new Error(
        `Query must be at least ${QueryText.MIN_LENGTH} characters`,
      );
    }
    if (value.length > QueryText.MAX_LENGTH) {
      throw new Error(
        `Query cannot exceed ${QueryText.MAX_LENGTH} characters`,
      );
    }
  }

  static create(text: string): QueryText {
    return new QueryText(text.trim());
  }

  get wordCount(): number {
    return this.value.split(/\s+/).length;
  }
}
