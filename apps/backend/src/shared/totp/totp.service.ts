import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as otplib from 'otplib';
import QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import {
  GenerateSecretResponse,
  QRCodeResponse,
  VerifyTokenResponse,
  GenerateBackupCodesResponse,
  TOTPConfigOptions,
  BackupCode,
} from './totp.types';

/**
 * Default TOTP configuration
 */
const DEFAULT_TOTP_CONFIG: Required<TOTPConfigOptions> = {
  appName: 'Legal AI Platform',
  algorithm: 'sha1',
  digits: 6,
  period: 30,
  window: 1,
};

/**
 * TOTP Service
 *
 * Application service for Time-based One-Time Password operations.
 * Provides TOTP secret generation, QR code generation, token verification,
 * and backup code generation for two-factor authentication.
 *
 * Features:
 * - RFC 6238 compliant TOTP generation
 * - QR code generation for easy authenticator app setup
 * - Backup codes for account recovery
 * - Configurable security parameters
 *
 * @example
 * ```typescript
 * // Generate a new secret for a user
 * const { secret, otpauthUrl } = await totpService.generateSecret('user@example.com');
 *
 * // Generate QR code for scanning
 * const { dataUrl } = await totpService.generateQRCode(secret, 'user@example.com');
 *
 * // Verify a token
 * const { valid } = await totpService.verifyToken(secret, '123456');
 *
 * // Generate backup codes
 * const { codes } = await totpService.generateBackupCodes();
 * ```
 */
@Injectable()
export class TotpService {
  private readonly logger = new Logger(TotpService.name);
  private readonly config: Required<TOTPConfigOptions>;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      appName:
        this.configService.get<string>('TOTP_APP_NAME') ||
        DEFAULT_TOTP_CONFIG.appName,
      algorithm:
        this.configService.get<'sha1' | 'sha256' | 'sha512'>(
          'TOTP_ALGORITHM',
        ) || DEFAULT_TOTP_CONFIG.algorithm,
      digits:
        this.configService.get<number>('TOTP_DIGITS') ||
        DEFAULT_TOTP_CONFIG.digits,
      period:
        this.configService.get<number>('TOTP_PERIOD') ||
        DEFAULT_TOTP_CONFIG.period,
      window:
        this.configService.get<number>('TOTP_WINDOW') ||
        DEFAULT_TOTP_CONFIG.window,
    } as Required<TOTPConfigOptions>;

    this.configureOtplib();
    this.logger.log(
      `TOTP Service initialized with ${this.config.digits}-digit tokens, ` +
        `${this.config.period}s period, ${this.config.algorithm} algorithm`,
    );
  }

  /**
   * Configure otplib with our settings
   */
  private configureOtplib(): void {
    // Type cast needed because otplib types may not match exactly
    otplib.authenticator.options = {
      algorithm: this.config.algorithm as any,
      digits: this.config.digits,
      period: this.config.period,
      window: this.config.window,
    };
  }

  /**
   * Generate a new TOTP secret for a user
   *
   * @param userEmail - User's email for inclusion in OTP auth URI
   * @returns Secret key and OTP auth URL
   */
  generateSecret(userEmail: string): GenerateSecretResponse {
    const secret = otplib.authenticator.generateSecret();

    const otpauthUrl = otplib.authenticator.keyuri(
      userEmail,
      this.config.appName,
      secret,
    );

    this.logger.debug(`Generated new TOTP secret for ${userEmail}`);

    return { secret, otpauthUrl };
  }

  /**
   * Generate a QR code image for TOTP setup
   *
   * @param secret - The TOTP secret
   * @param userEmail - User's email for the OTP auth URI
   * @returns QR code as base64 data URL
   */
  async generateQRCode(
    secret: string,
    userEmail: string,
  ): Promise<QRCodeResponse> {
    const otpauthUrl = otplib.authenticator.keyuri(
      userEmail,
      this.config.appName,
      secret,
    );

    try {
      const dataUrl = await QRCode.toDataURL(otpauthUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      this.logger.debug(`Generated QR code for ${userEmail}`);

      return { dataUrl, otpauthUrl };
    } catch (error) {
      this.logger.error('Failed to generate QR code', error);
      throw new Error('QR code generation failed');
    }
  }

  /**
   * Verify a TOTP token against a secret
   *
   * @param secret - The stored TOTP secret
   * @param token - The 6-digit (or 8-digit) token from authenticator app
   * @returns Verification result with validity status
   */
  verifyToken(secret: string, token: string): VerifyTokenResponse {
    // Validate token format first
    if (!this.isValidTokenFormat(token)) {
      return { valid: false };
    }

    try {
      const isValid = otplib.authenticator.check(token, secret);

      this.logger.debug(`Token verification: ${isValid ? 'valid' : 'invalid'}`);

      return { valid: isValid };
    } catch (error) {
      this.logger.error('Token verification error', error);
      return { valid: false };
    }
  }

  /**
   * Validate token format before verification
   * Prevents unnecessary processing of invalid tokens
   *
   * @param token - Token to validate
   * @returns True if token format is valid
   */
  private isValidTokenFormat(token: string): boolean {
    // Token should be digits only and match configured length
    const digitCount = this.config.digits;
    return /^\d+$/.test(token) && token.length === digitCount;
  }

  /**
   * Generate 10 backup codes for account recovery
   * Backup codes are one-time use alternatives to TOTP
   *
   * @returns Array of 10 backup codes (formatted and raw)
   */
  generateBackupCodes(): GenerateBackupCodesResponse {
    const BACKUP_CODE_COUNT = 10;
    const CODE_BYTES = 20; // 160 bits for each code
    const CODE_GROUPS = 4;
    const GROUP_SIZE = 4;

    const codes: string[] = [];
    const backupCodes: Omit<BackupCode, 'used'>[] = [];

    for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
      // Generate random bytes and convert to hex
      const rawCode = randomBytes(CODE_BYTES).toString('hex').toUpperCase();

      // Format code as XXXX-XXXX-XXXX-XXXX for readability
      const formattedCode =
        rawCode
          .substring(0, CODE_GROUPS * GROUP_SIZE)
          .match(new RegExp(`.{1,${GROUP_SIZE}}`, 'g'))
          ?.join('-') || rawCode;

      codes.push(formattedCode);
      backupCodes.push({ code: formattedCode });
    }

    this.logger.debug(`Generated ${BACKUP_CODE_COUNT} backup codes`);

    return { codes, backupCodes };
  }

  /**
   * Verify a backup code
   * Backup codes are one-time use, so this only validates format
   * Actual usage tracking should be handled at the application layer
   *
   * @param backupCode - The backup code to verify
   * @returns True if backup code format is valid
   */
  verifyBackupCode(backupCode: string): boolean {
    // Expected format: XXXX-XXXX-XXXX-XXXX (16 hex chars, 3 dashes)
    const backupCodeRegex = /^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/;

    return backupCodeRegex.test(backupCode.toUpperCase());
  }

  /**
   * Generate a current TOTP token for testing purposes
   * WARNING: Only use this for testing, never in production
   *
   * @param secret - The TOTP secret
   * @returns Current valid token
   */
  generateCurrentToken(secret: string): string {
    return otplib.authenticator.generate(secret);
  }

  /**
   * Get the remaining time in seconds until the next token
   * Useful for UI countdown timers
   *
   * @returns Seconds remaining in current time window
   */
  getTimeRemaining(): number {
    const now = Math.floor(Date.now() / 1000);
    const period = this.config.period;
    return period - (now % period);
  }
}
