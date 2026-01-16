import { SimpleValueObject } from '../../shared/base';

/**
 * Query ID Value Object
 */
export class QueryId extends SimpleValueObject<string> {
  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Query ID cannot be empty');
    }
  }

  static create(id: string): QueryId {
    return new QueryId(id);
  }
}
