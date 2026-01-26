import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { TotpService } from '../../shared/totp/totp.service';
import { UsersService } from '../users/users.service';
import { EncryptionService } from '../../shared/encryption/encryption.service';
import { AuditLogApplicationService } from '../../application/audit-logs';
import {
  AuditActionType,
  AuditResourceType,
} from '../../modules/audit-log/entities/audit-log.entity';

/**
 * Backup code entity for 2FA recovery
 */
interface BackupCodeEntity {
  code: string;
  used: boolean;
  hash?: string; // Store bcrypt hash instead of plain code
}

/**
 * Response from enabling 2FA
 */
interface EnableTwoFactorResponse {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

/**
 * Response from verifying 2FA setup
 */
interface VerifyTwoFactorSetupResponse {
  success: boolean;
  backupCodes: string[];
}

/**
 * Two Factor Authentication Service
 *
 * Handles TOTP-based 2FA operations including:
 * - Enabling 2FA (generating secret and QR code)
 * - Verifying initial 2FA setup
 * - Disabling 2FA
 * - Regenerating backup codes
 *
 * Security measures:
 * - Rate limiting on TOTP verification endpoint (5 attempts per minute)
 * - Account lockout after 10 failed 2FA attempts (requires admin reset)
 * - Encrypt TOTP secrets using AES-256-GCM with key from environment variable
 * - Hash backup codes using bcrypt before storage
 * - Log all 2FA events in audit logs
 * - Invalidate JWT session immediately when 2FA is disabled
 * - Require password confirmation before disabling 2FA
 */
@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  // Maximum failed 2FA attempts before account lockout
  private readonly MAX_FAILED_ATTEMPTS = 10;

  constructor(
    private readonly totpService: TotpService,
    private readonly usersService: UsersService,
    private readonly encryptionService: EncryptionService,
    private readonly auditLogApplicationService: AuditLogApplicationService,
  ) {}

  /**
   * Enable 2FA for a user
   * Generates TOTP secret, QR code, and backup codes
   *
   * @param userId - The user ID
   * @param ipAddress - Client IP address for audit logging
   * @param userAgent - Client user agent for audit logging
   * @returns Secret, QR code data URL, and backup codes
   */
  async enableTwoFactorAuth(
    userId: string,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<EnableTwoFactorResponse> {
    const user = await this.usersService.findByIdWith2FA(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if 2FA is already enabled
    if (user.twoFactorSecret) {
      throw new BadRequestException(
        'Two-factor authentication is already enabled',
      );
    }

    // Generate TOTP secret
    const { secret } = this.totpService.generateSecret(user.email);

    // Generate QR code
    const { dataUrl } = await this.totpService.generateQRCode(
      secret,
      user.email,
    );

    // Generate backup codes
    const { codes } = this.totpService.generateBackupCodes();

    // Hash backup codes using bcrypt
    const hashedBackupCodes: BackupCodeEntity[] = [];
    for (const code of codes) {
      const hash = await this.usersService.hashBackupCode(code);
      hashedBackupCodes.push({ code: hash, used: false });
    }

    // Encrypt the secret using AES-256-GCM before storing
    const encryptedSecret = this.encryptionService.encrypt(secret);

    // Store the encrypted secret and hashed backup codes
    // Mark as not verified yet - user needs to verify first
    await this.usersService.updateUser(userId, {
      twoFactorSecret: encryptedSecret,
      twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
      twoFactorEnabled: false, // Not enabled until verified
    });

    this.logger.log(`2FA setup initiated for user ${userId}`);

    // Log 2FA setup initiation
    await this.logAuditEvent(
      AuditActionType.CREATE,
      AuditResourceType.USER,
      userId,
      userId,
      ipAddress ?? null,
      userAgent ?? null,
      200,
      null,
      { action: '2FA_SETUP_INITIATED', backupCodesCount: codes.length },
    );

    // Return plain codes for display - this is the only time they are shown
    return {
      secret,
      qrCodeDataUrl: dataUrl,
      backupCodes: codes,
    };
  }

  /**
   * Verify 2FA setup with a TOTP token
   * Must be called after enableTwoFactorAuth to complete the setup
   *
   * @param userId - The user ID
   * @param token - The 6-digit TOTP token
   * @param ipAddress - Client IP address for audit logging
   * @param userAgent - Client user agent for audit logging
   * @returns Success status and backup codes
   */
  async verifyTwoFactorSetup(
    userId: string,
    token: string,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<VerifyTwoFactorSetupResponse> {
    const user = await this.usersService.findByIdWith2FA(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException(
        'Two-factor authentication has not been initiated. Call enableTwoFactorAuth first.',
      );
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException(
        'Two-factor authentication is already enabled',
      );
    }

    // Check if account is locked
    const isLocked = await this.usersService.is2faLocked(userId);
    if (isLocked) {
      await this.logAuditEvent(
        AuditActionType.UPDATE,
        AuditResourceType.USER,
        userId,
        userId,
        ipAddress ?? null,
        userAgent ?? null,
        403,
        'Account is locked due to too many failed 2FA attempts',
        { action: '2FA_SETUP_VERIFICATION_LOCKED' },
      );
      throw new BadRequestException(
        'Account is locked due to too many failed attempts. Please contact an administrator.',
      );
    }

    // Decrypt the secret
    let decryptedSecret: string;
    try {
      decryptedSecret = this.encryptionService.decrypt(user.twoFactorSecret);
    } catch {
      await this.logAuditEvent(
        AuditActionType.UPDATE,
        AuditResourceType.USER,
        userId,
        userId,
        ipAddress ?? null,
        userAgent ?? null,
        500,
        'Failed to decrypt TOTP secret',
        { action: '2FA_SETUP_VERIFICATION_DECRYPT_ERROR' },
      );
      throw new BadRequestException(
        'Failed to verify token. Please try again.',
      );
    }

    // Verify the token
    const { valid } = this.totpService.verifyToken(decryptedSecret, token);

    if (!valid) {
      // Increment failed attempts counter
      await this.usersService.incrementFailed2faAttempts(userId);

      await this.logAuditEvent(
        AuditActionType.UPDATE,
        AuditResourceType.USER,
        userId,
        userId,
        ipAddress ?? null,
        userAgent ?? null,
        401,
        'Invalid TOTP token during 2FA setup',
        { action: '2FA_SETUP_VERIFICATION_FAILED' },
      );

      throw new UnauthorizedException('Invalid token. Please try again.');
    }

    // Reset failed attempts counter on success
    await this.usersService.resetFailed2faAttempts(userId);

    // Enable 2FA
    await this.usersService.updateUser(userId, {
      twoFactorEnabled: true,
      twoFactorVerifiedAt: new Date(),
    });

    this.logger.log(`2FA verified and enabled for user ${userId}`);

    // Log successful 2FA enable
    await this.logAuditEvent(
      AuditActionType.CREATE,
      AuditResourceType.USER,
      userId,
      userId,
      ipAddress ?? null,
      userAgent ?? null,
      200,
      null,
      { action: '2FA_ENABLED' },
    );

    // Return empty array since backup codes were already shown during enable
    return {
      success: true,
      backupCodes: [],
    };
  }

  /**
   * Disable 2FA for a user
   * Requires password confirmation for security
   * Invalidates all existing JWT sessions by incrementing token version
   *
   * @param userId - The user ID
   * @param password - The user's password for confirmation
   * @param ipAddress - Client IP address for audit logging
   * @param userAgent - Client user agent for audit logging
   */
  async disableTwoFactorAuth(
    userId: string,
    password: string,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<void> {
    const user = await this.usersService.findByIdWith2FA(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    // Verify password
    const userWithPassword =
      await this.usersService.findByUsernameOrEmailForAuth(user.email);
    if (!userWithPassword || !userWithPassword.passwordHash) {
      throw new BadRequestException('Unable to verify password');
    }

    const isPasswordValid = await this.usersService.comparePassword(
      password,
      userWithPassword.passwordHash,
    );

    if (!isPasswordValid) {
      await this.logAuditEvent(
        AuditActionType.DELETE,
        AuditResourceType.USER,
        userId,
        userId,
        ipAddress ?? null,
        userAgent ?? null,
        401,
        'Incorrect password during 2FA disable',
        { action: '2FA_DISABLE_PASSWORD_FAILED' },
      );
      throw new UnauthorizedException('Password is incorrect');
    }

    // Increment token version to invalidate all existing JWT sessions
    await this.usersService.incrementTokenVersion(userId);

    // Clear 2FA data
    await this.usersService.updateUser(userId, {
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
      twoFactorEnabled: false,
    });

    this.logger.log(`2FA disabled for user ${userId}`);

    // Log 2FA disable
    await this.logAuditEvent(
      AuditActionType.DELETE,
      AuditResourceType.USER,
      userId,
      userId,
      ipAddress ?? null,
      userAgent ?? null,
      200,
      null,
      { action: '2FA_DISABLED', sessionsInvalidated: true },
    );
  }

  /**
   * Regenerate backup codes for a user
   * Invalidates all old backup codes
   *
   * @param userId - The user ID
   * @param ipAddress - Client IP address for audit logging
   * @param userAgent - Client user agent for audit logging
   * @returns New backup codes
   */
  async regenerateBackupCodes(
    userId: string,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<{ codes: string[] }> {
    const user = await this.usersService.findByIdWith2FA(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    // Generate new backup codes
    const { codes } = this.totpService.generateBackupCodes();

    // Hash backup codes using bcrypt
    const hashedBackupCodes: BackupCodeEntity[] = [];
    for (const code of codes) {
      const hash = await this.usersService.hashBackupCode(code);
      hashedBackupCodes.push({ code: hash, used: false });
    }

    // Store new hashed backup codes
    await this.usersService.updateUser(userId, {
      twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
    });

    this.logger.log(`Backup codes regenerated for user ${userId}`);

    // Log backup codes regeneration
    await this.logAuditEvent(
      AuditActionType.UPDATE,
      AuditResourceType.USER,
      userId,
      userId,
      ipAddress ?? null,
      userAgent ?? null,
      200,
      null,
      { action: '2FA_BACKUP_CODES_REGENERATED', count: codes.length },
    );

    return { codes };
  }

  /**
   * Verify a TOTP token for authentication
   * Used during login when 2FA is enabled
   * Implements rate limiting and account lockout
   *
   * @param userId - The user ID
   * @param token - The 6-digit TOTP token
   * @param ipAddress - Client IP address for audit logging
   * @param userAgent - Client user agent for audit logging
   * @returns True if token is valid
   */
  async verifyToken(
    userId: string,
    token: string,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<boolean> {
    const user = await this.usersService.findByIdWith2FA(userId);
    if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
      return false;
    }

    // Check if account is locked
    const isLocked = await this.usersService.is2faLocked(userId);
    if (isLocked) {
      await this.logAuditEvent(
        AuditActionType.UPDATE,
        AuditResourceType.USER,
        userId,
        userId,
        ipAddress ?? null,
        userAgent ?? null,
        403,
        'Account locked during 2FA verification',
        { action: '2FA_VERIFICATION_LOCKED' },
      );
      throw new BadRequestException(
        'Account is locked due to too many failed attempts. Please contact an administrator.',
      );
    }

    // Decrypt the secret
    let decryptedSecret: string;
    try {
      decryptedSecret = this.encryptionService.decrypt(user.twoFactorSecret);
    } catch {
      await this.logAuditEvent(
        AuditActionType.UPDATE,
        AuditResourceType.USER,
        userId,
        userId,
        ipAddress ?? null,
        userAgent ?? null,
        500,
        'Failed to decrypt TOTP secret',
        { action: '2FA_VERIFICATION_DECRYPT_ERROR' },
      );
      return false;
    }

    const { valid } = this.totpService.verifyToken(decryptedSecret, token);

    if (valid) {
      // Reset failed attempts counter on success
      await this.usersService.resetFailed2faAttempts(userId);
      await this.logAuditEvent(
        AuditActionType.UPDATE,
        AuditResourceType.USER,
        userId,
        userId,
        ipAddress ?? null,
        userAgent ?? null,
        200,
        null,
        { action: '2FA_VERIFICATION_SUCCESS' },
      );
    } else {
      // Increment failed attempts counter
      await this.usersService.incrementFailed2faAttempts(userId);
      await this.logAuditEvent(
        AuditActionType.UPDATE,
        AuditResourceType.USER,
        userId,
        userId,
        ipAddress ?? null,
        userAgent ?? null,
        401,
        'Invalid TOTP token',
        { action: '2FA_VERIFICATION_FAILED' },
      );
    }

    return valid;
  }

  /**
   * Verify and consume a backup code
   * Used when user loses access to authenticator
   * Implements rate limiting and account lockout
   *
   * @param userId - The user ID
   * @param backupCode - The backup code to use
   * @param ipAddress - Client IP address for audit logging
   * @param userAgent - Client user agent for audit logging
   * @returns True if backup code is valid
   */
  async verifyAndConsumeBackupCode(
    userId: string,
    backupCode: string,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<boolean> {
    const user = await this.usersService.findByIdWith2FA(userId);
    if (!user || !user.twoFactorBackupCodes || !user.twoFactorEnabled) {
      return false;
    }

    // Check if account is locked
    const isLocked = await this.usersService.is2faLocked(userId);
    if (isLocked) {
      await this.logAuditEvent(
        AuditActionType.UPDATE,
        AuditResourceType.USER,
        userId,
        userId,
        ipAddress ?? null,
        userAgent ?? null,
        403,
        'Account locked during backup code verification',
        { action: '2FA_BACKUP_CODE_LOCKED' },
      );
      throw new BadRequestException(
        'Account is locked due to too many failed attempts. Please contact an administrator.',
      );
    }

    // Validate backup code format
    if (!this.totpService.verifyBackupCode(backupCode)) {
      await this.usersService.incrementFailed2faAttempts(userId);
      await this.logAuditEvent(
        AuditActionType.UPDATE,
        AuditResourceType.USER,
        userId,
        userId,
        ipAddress ?? null,
        userAgent ?? null,
        400,
        'Invalid backup code format',
        { action: '2FA_BACKUP_CODE_INVALID_FORMAT' },
      );
      return false;
    }

    // Parse backup codes from storage (these contain hashes)
    const backupCodes = this.parseBackupCodes(user.twoFactorBackupCodes);

    // Find matching unused code by comparing hashes
    let matchedIndex = -1;
    for (let i = 0; i < backupCodes.length; i++) {
      const bc = backupCodes[i];
      if (bc.used) continue;

      // Compare using bcrypt
      const isMatch = await this.usersService.verifyBackupCodeHash(
        backupCode,
        bc.code, // bc.code contains the hash
      );

      if (isMatch) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex === -1) {
      // No matching code found
      await this.usersService.incrementFailed2faAttempts(userId);
      await this.logAuditEvent(
        AuditActionType.UPDATE,
        AuditResourceType.USER,
        userId,
        userId,
        ipAddress ?? null,
        userAgent ?? null,
        401,
        'Invalid or already used backup code',
        { action: '2FA_BACKUP_CODE_INVALID' },
      );
      return false;
    }

    // Mark code as used
    backupCodes[matchedIndex].used = true;
    await this.usersService.updateUser(userId, {
      twoFactorBackupCodes: JSON.stringify(backupCodes),
    });

    // Reset failed attempts counter on success
    await this.usersService.resetFailed2faAttempts(userId);

    this.logger.log(`Backup code used for user ${userId}`);

    // Log backup code usage
    await this.logAuditEvent(
      AuditActionType.UPDATE,
      AuditResourceType.USER,
      userId,
      userId,
      ipAddress ?? null,
      userAgent ?? null,
      200,
      null,
      {
        action: '2FA_BACKUP_CODE_USED',
        remainingCount: backupCodes.filter((bc) => !bc.used).length,
      },
    );

    return true;
  }

  /**
   * Check if user has 2FA enabled
   *
   * @param userId - The user ID
   * @returns True if 2FA is enabled
   */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    return user?.twoFactorEnabled ?? false;
  }

  /**
   * Get the timestamp when 2FA was last verified
   *
   * @param userId - The user ID
   * @returns Last verified timestamp or null
   */
  async getLastVerifiedAt(userId: string): Promise<Date | null> {
    const user = await this.usersService.findById(userId);
    return user?.twoFactorVerifiedAt ?? null;
  }

  /**
   * Get remaining unused backup codes count
   *
   * @param userId - The user ID
   * @returns Number of remaining backup codes
   */
  async getRemainingBackupCodesCount(userId: string): Promise<number> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.twoFactorBackupCodes) {
      return 0;
    }

    const backupCodes = this.parseBackupCodes(user.twoFactorBackupCodes);
    return backupCodes.filter((bc) => !bc.used).length;
  }

  /**
   * Parse backup codes from JSON string
   *
   * @param json - JSON string of backup codes
   * @returns Array of backup code entities
   */
  private parseBackupCodes(json: string | null): BackupCodeEntity[] {
    if (!json) {
      return [];
    }

    try {
      const parsed = JSON.parse(json) as unknown;
      if (Array.isArray(parsed)) {
        return parsed as BackupCodeEntity[];
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Log an audit event for 2FA operations
   *
   * @param action - The audit action type
   * @param resourceType - The resource type
   * @param resourceId - The resource ID
   * @param userId - The user ID
   * @param ipAddress - Client IP address
   * @param userAgent - Client user agent
   * @param statusCode - HTTP status code
   * @param errorMessage - Error message if any
   * @param context - Additional context
   */
  private async logAuditEvent(
    action: AuditActionType,
    resourceType: AuditResourceType,
    resourceId: string | null,
    userId: string | null,
    ipAddress: string | null,
    userAgent: string | null,
    statusCode: number,
    errorMessage: string | null,
    context: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.auditLogApplicationService.createAuditLog({
        action,
        resourceType,
        resourceId,
        userId,
        ipAddress,
        userAgent,
        statusCode,
        errorMessage,
        changeDetails: {
          context,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log for 2FA event:', error);
    }
  }

  /**
   * Admin force-disable 2FA for a user
   * Used when a user is locked out of their authenticator app
   * Does not require password confirmation (admin override)
   * Invalidates all existing JWT sessions by incrementing token version
   *
   * @param targetUserId - The ID of the user to disable 2FA for
   * @param adminUserId - The ID of the admin performing the action
   * @param ipAddress - Client IP address for audit logging
   * @param userAgent - Client user agent for audit logging
   */
  async adminForceDisableTwoFactor(
    targetUserId: string,
    adminUserId: string,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<{ id: string; twoFactorEnabled: boolean }> {
    const user = await this.usersService.findByIdWith2FA(targetUserId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException(
        'Two-factor authentication is not enabled for this user',
      );
    }

    // Increment token version to invalidate all existing JWT sessions
    await this.usersService.incrementTokenVersion(targetUserId);

    // Clear 2FA data
    await this.usersService.updateUser(targetUserId, {
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
      twoFactorEnabled: false,
    });

    this.logger.log(
      `Admin ${adminUserId} force-disabled 2FA for user ${targetUserId}`,
    );

    // Log admin 2FA disable
    await this.logAuditEvent(
      AuditActionType.DELETE,
      AuditResourceType.USER,
      targetUserId,
      adminUserId,
      ipAddress ?? null,
      userAgent ?? null,
      200,
      null,
      { action: 'ADMIN_2FA_FORCE_DISABLED', adminOverride: true },
    );

    return {
      id: targetUserId,
      twoFactorEnabled: false,
    };
  }
}
