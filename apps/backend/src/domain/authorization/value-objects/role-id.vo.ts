import { SimpleValueObject } from '../../shared/base';

/**
 * Validates if a string is a valid UUID v4 format
 */
function isValidUUID(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Role ID Value Object
 * Strongly typed identifier for Role entities
 */
export class RoleId extends SimpleValueObject<string> {
  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Role ID cannot be empty');
    }

    if (!isValidUUID(value)) {
      throw new Error(`Role ID must be a valid UUID v4 format, got: ${value}`);
    }
  }

  static generate(): RoleId {
    return new RoleId(crypto.randomUUID());
  }

  static fromString(id: string): RoleId {
    return new RoleId(id);
  }
}
