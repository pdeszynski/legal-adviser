import { SimpleValueObject } from '../../shared/base';

/**
 * Backup Code Value Object
 *
 * Represents a hashed backup code for account recovery when TOTP is unavailable.
 * Backup codes should be hashed using bcrypt before storage.
 */
export class BackupCode extends SimpleValueObject<string> {
  private static readonly HASH_PREFIX = '$2';
  private static readonly MIN_LENGTH = 60; // bcrypt hash length

  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Backup code cannot be empty');
    }
    if (value.length < BackupCode.MIN_LENGTH) {
      throw new Error('Backup code hash appears invalid (too short)');
    }
  }

  static create(hashedCode: string): BackupCode {
    return new BackupCode(hashedCode);
  }

  /**
   * Check if a string appears to be a valid bcrypt hash.
   */
  static isValidHash(hash: string): boolean {
    return hash.startsWith(BackupCode.HASH_PREFIX);
  }
}

/**
 * Backup Codes Value Object
 *
 * Represents a collection of backup codes for a user.
 */
export class BackupCodes {
  private readonly codes: BackupCode[];

  private constructor(codes: BackupCode[]) {
    this.codes = Object.freeze([...codes]) as BackupCode[];
  }

  static create(hashedCodes: string[]): BackupCodes {
    const codes = hashedCodes.map((code) => BackupCode.create(code));
    return new BackupCodes(codes);
  }

  static empty(): BackupCodes {
    return new BackupCodes([]);
  }

  getValues(): readonly string[] {
    return this.codes.map((code) => code.toValue());
  }

  count(): number {
    return this.codes.length;
  }

  isEmpty(): boolean {
    return this.codes.length === 0;
  }

  /**
   * Check if a given hash matches any of the stored backup codes.
   */
  contains(hash: string): boolean {
    return this.codes.some((code) => code.toValue() === hash);
  }

  /**
   * Remove a used backup code from the collection.
   * Returns a new BackupCodes instance with the code removed.
   */
  removeUsed(hash: string): BackupCodes {
    const remaining = this.codes.filter((code) => code.toValue() !== hash);
    return new BackupCodes(remaining);
  }
}
