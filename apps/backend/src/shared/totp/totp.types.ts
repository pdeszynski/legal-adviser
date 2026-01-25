/**
 * TOTP Service Types
 *
 * Type definitions for Time-based One-Time Password operations.
 */

/**
 * Response from generating a new TOTP secret
 */
export interface GenerateSecretResponse {
  /**
   * The base32-encoded secret key
   * Store this securely in the database
   */
  secret: string;

  /**
   * URI for QR code generation
   * Format: otpauth://totp/...
   */
  otpauthUrl: string;
}

/**
 * Response from QR code generation
 */
export interface QRCodeResponse {
  /**
   * QR code image as base64 data URL
   * Format: data:image/png;base64,...
   */
  dataUrl: string;

  /**
   * The otpauth:// URI used to generate the QR code
   */
  otpauthUrl: string;
}

/**
 * Result of TOTP token verification
 */
export interface VerifyTokenResponse {
  /**
   * True if the token is valid
   */
  valid: boolean;

  /**
   * Delta value indicating time steps between token and current time
   * 0 = current window, ±1 = adjacent windows (for clock skew tolerance)
   */
  delta?: number;
}

/**
 * Backup code for account recovery
 */
export interface BackupCode {
  /**
   * The backup code (formatted with spaces for readability)
   */
  code: string;

  /**
   * Whether this backup code has been used
   */
  used: boolean;
}

/**
 * Response from generating backup codes
 */
export interface GenerateBackupCodesResponse {
  /**
   * Array of 10 backup codes
   * Store these securely - show once to user
   */
  codes: string[];

  /**
   * Raw backup code objects with metadata
   */
  backupCodes: Omit<BackupCode, 'used'>[];
}

/**
 * Configuration options for TOTP generation
 */
export interface TOTPConfigOptions {
  /**
   * Application name for OTP auth URI
   */
  appName?: string;

  /**
   * Algorithm used for HMAC (default: sha1)
   * Options: sha1, sha256, sha512
   */
  algorithm?: 'sha1' | 'sha256' | 'sha512';

  /**
   * Number of digits in token (default: 6)
   */
  digits?: 6 | 8;

  /**
   * Time period in seconds (default: 30)
   */
  period?: number;

  /**
   * Number of windows to check before/after current time
   * Used to handle clock skew (default: 1)
   */
  window?: number;
}
