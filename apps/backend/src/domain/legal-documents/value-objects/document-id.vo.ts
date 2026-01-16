import { SimpleValueObject } from '../../shared/base';

/**
 * Document ID Value Object
 */
export class DocumentId extends SimpleValueObject<string> {
  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Document ID cannot be empty');
    }
  }

  static create(id: string): DocumentId {
    return new DocumentId(id);
  }
}
