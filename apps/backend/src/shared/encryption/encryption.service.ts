import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

/**
 * Encryption Service
 *
 * Provides encryption/decryption for sensitive data like TOTP secrets.
 * Uses AES-256-GCM for authenticated encryption.
 *
 * Key derivation:
 * - Uses scrypt for key derivation from environment password
 * - Salt is stored separately or derived from config
 *
 * @example
 * ```typescript
 * // Encrypt sensitive data
 * const encrypted = await encryptionService.encrypt('my-totp-secret');
 *
 * // Decrypt when needed
 * const decrypted = await encryptionService.decrypt(encrypted);
 * ```
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  private readonly nonceLength = 16;

  constructor(private readonly configService: ConfigService) {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error(
        'ENCRYPTION_KEY environment variable is required for EncryptionService',
      );
    }

    if (encryptionKey.length < 32) {
      throw new Error(
        'ENCRYPTION_KEY must be at least 32 characters long for AES-256',
      );
    }

    // Derive a 32-byte key from the encryption key using scrypt
    // Use a fixed salt for key derivation (in production, consider using a separate salt)
    const salt =
      this.configService.get<string>('ENCRYPTION_SALT') || 'legal-ai-salt';
    this.key = scryptSync(encryptionKey, salt, 32);

    this.logger.log('Encryption Service initialized with AES-256-GCM');
  }

  /**
   * Encrypt plaintext using AES-256-GCM
   *
   * @param plaintext - The data to encrypt
   * @returns Base64-encoded encrypted data with auth tag appended
   */
  encrypt(plaintext: string): string {
    try {
      // Generate a random nonce/IV for each encryption
      const nonce = randomBytes(this.nonceLength);

      // Create cipher with derived key and nonce
      const cipher = createCipheriv(this.algorithm, this.key, nonce);

      // Encrypt the data
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Get the authentication tag
      const authTag = cipher.getAuthTag();

      // Combine: nonce + authTag + encrypted data
      // All base64 encoded for safe storage
      const combined = Buffer.concat([
        nonce,
        authTag,
        Buffer.from(encrypted, 'base64'),
      ]);

      this.logger.debug('Data encrypted successfully');

      return combined.toString('base64');
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypt ciphertext that was encrypted with encrypt()
   *
   * @param ciphertext - Base64-encoded encrypted data with nonce and auth tag
   * @returns Decrypted plaintext
   */
  decrypt(ciphertext: string): string {
    try {
      // Decode base64
      const combined = Buffer.from(ciphertext, 'base64');

      // Extract nonce (first 16 bytes)
      const nonce = combined.subarray(0, this.nonceLength);

      // Extract auth tag (next 16 bytes)
      const authTag = combined.subarray(
        this.nonceLength,
        this.nonceLength + 16,
      );

      // Extract encrypted data (remaining bytes)
      const encrypted = combined.subarray(this.nonceLength + 16);

      // Create decipher
      const decipher = createDecipheriv(this.algorithm, this.key, nonce);
      decipher.setAuthTag(authTag);

      // Decrypt the data
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      this.logger.debug('Data decrypted successfully');

      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  /**
   * Hash a backup code using bcrypt-like approach
   * Uses the existing password hashing from users service
   *
   * @param code - The backup code to hash
   * @returns Hashed backup code
   */
  hashBackupCode(code: string): string {
    // For backup codes, we use a simple hash with salt
    // In production, this should use bcrypt
    const salt = randomBytes(16).toString('hex');
    const hash = this.scryptHash(code, salt);
    return `${salt}:${hash}`;
  }

  /**
   * Verify a backup code against its hash
   *
   * @param code - The backup code to verify
   * @param hash - The stored hash
   * @returns True if the code matches
   */
  verifyBackupCode(code: string, hash: string): boolean {
    const [salt, storedHash] = hash.split(':');
    const computedHash = this.scryptHash(code, salt);
    return storedHash === computedHash;
  }

  /**
   * Internal scrypt hash function
   */
  private scryptHash(data: string, salt: string): string {
    const derivedKey = scryptSync(data, salt, 32);
    return derivedKey.toString('hex');
  }

  /**
   * Check if a string appears to be encrypted by this service
   * Useful for data migration validation
   *
   * @param data - The data to check
   * @returns True if data looks like our encrypted format
   */
  isEncrypted(data: string): boolean {
    try {
      const decoded = Buffer.from(data, 'base64');
      // Our format: nonce (16) + authTag (16) + at least some data (1+)
      return decoded.length >= this.nonceLength + 16 + 1;
    } catch {
      return false;
    }
  }
}
