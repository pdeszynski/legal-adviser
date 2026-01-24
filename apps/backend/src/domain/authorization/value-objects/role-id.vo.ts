import { SimpleValueObject } from '../../shared/base';

/**
 * Role ID Value Object
 * Strongly typed identifier for Role entities
 */
export class RoleId extends SimpleValueObject<string> {
  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Role ID cannot be empty');
    }
  }

  static generate(): RoleId {
    return new RoleId(crypto.randomUUID());
  }

  static fromString(id: string): RoleId {
    return new RoleId(id);
  }
}
