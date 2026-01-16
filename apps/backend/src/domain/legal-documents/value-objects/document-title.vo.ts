import { SimpleValueObject } from '../../shared/base';

/**
 * Document Title Value Object
 */
export class DocumentTitle extends SimpleValueObject<string> {
  private static readonly MAX_LENGTH = 255;
  private static readonly MIN_LENGTH = 1;

  protected validate(value: string): void {
    if (!value || value.trim().length < DocumentTitle.MIN_LENGTH) {
      throw new Error(
        `Document title must be at least ${DocumentTitle.MIN_LENGTH} character(s)`,
      );
    }
    if (value.length > DocumentTitle.MAX_LENGTH) {
      throw new Error(
        `Document title cannot exceed ${DocumentTitle.MAX_LENGTH} characters`,
      );
    }
  }

  static create(title: string): DocumentTitle {
    return new DocumentTitle(title.trim());
  }
}
