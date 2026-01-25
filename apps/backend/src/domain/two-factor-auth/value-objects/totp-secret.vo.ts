import { SimpleValueObject } from '../../shared/base';

/**
 * TOTP Secret Value Object
 *
 * Represents the encrypted TOTP secret used for two-factor authentication.
 * The secret should always be stored encrypted at rest.
 */
export class TotpSecret extends SimpleValueObject<string> {
  private static readonly BASE32_REGEX = /^[A-Z2-7]+=*$/i;
  private static readonly MIN_LENGTH = 16;
  private static readonly MAX_LENGTH = 64;

  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('TOTP secret cannot be empty');
    }
    if (value.length < TotpSecret.MIN_LENGTH) {
      throw new Error(
        `TOTP secret must be at least ${TotpSecret.MIN_LENGTH} characters`,
      );
    }
    if (value.length > TotpSecret.MAX_LENGTH) {
      throw new Error(
        `TOTP secret cannot exceed ${TotpSecret.MAX_LENGTH} characters`,
      );
    }
  }

  static create(encryptedSecret: string): TotpSecret {
    return new TotpSecret(encryptedSecret);
  }

  /**
   * Create from raw (unencrypted) secret.
   * This should only be used during setup before encryption.
   */
  static fromRaw(rawSecret: string): TotpSecret {
    if (!rawSecret || rawSecret.trim().length === 0) {
      throw new Error('Raw TOTP secret cannot be empty');
    }
    if (!TotpSecret.BASE32_REGEX.test(rawSecret)) {
      throw new Error('TOTP secret must be a valid base32 string');
    }
    if (rawSecret.length < TotpSecret.MIN_LENGTH) {
      throw new Error(
        `TOTP secret must be at least ${TotpSecret.MIN_LENGTH} characters`,
      );
    }
    return new TotpSecret(rawSecret);
  }
}
