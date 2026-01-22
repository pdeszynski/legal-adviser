import { SimpleValueObject } from '../value-object.base';
import { v4 as uuidv4 } from 'uuid';

/**
 * UUID Value Object
 * Represents a valid UUID
 */
export class Uuid extends SimpleValueObject<string> {
  constructor(value?: string) {
    super(value || uuidv4());
  }

  protected validate(value: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error('Invalid UUID format');
    }
  }

  static generate(): Uuid {
    return new Uuid(uuidv4());
  }

  static isValid(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}
