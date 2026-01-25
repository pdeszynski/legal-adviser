import { AggregateRoot } from '../../shared/base';
import {
  BackupCodes,
  TwoFactorUserId,
  TotpSecret,
  TotpStatus,
  TotpStatusEnum,
} from '../value-objects';
import {
  BackupCodeGeneratedEvent,
  BackupCodeUsedEvent,
  TotpDisabledEvent,
  TotpEnabledEvent,
  TotpVerifiedEvent,
} from '../events';

interface TwoFactorAuthProps {
  userId: TwoFactorUserId;
  secret: TotpSecret;
  backupCodes: BackupCodes;
  status: TotpStatus;
  verifiedAt?: Date;
}

/**
 * TwoFactorAuth Aggregate Root
 *
 * Manages the lifecycle and business rules for two-factor authentication.
 * Handles TOTP secret storage, backup code management, and verification status.
 */
export class TwoFactorAuthAggregate extends AggregateRoot<string> {
  private _userId: TwoFactorUserId;
  private _secret: TotpSecret;
  private _backupCodes: BackupCodes;
  private _status: TotpStatus;
  private _verifiedAt?: Date;

  private constructor(id: string, props: TwoFactorAuthProps) {
    super(id);
    this._userId = props.userId;
    this._secret = props.secret;
    this._backupCodes = props.backupCodes;
    this._status = props.status;
    this._verifiedAt = props.verifiedAt;
  }

  // Getters
  get userId(): TwoFactorUserId {
    return this._userId;
  }

  get secret(): TotpSecret {
    return this._secret;
  }

  get backupCodes(): BackupCodes {
    return this._backupCodes;
  }

  get status(): TotpStatus {
    return this._status;
  }

  get verifiedAt(): Date | undefined {
    return this._verifiedAt;
  }

  get isEnabled(): boolean {
    return this._status.isEnabled();
  }

  get isPendingVerification(): boolean {
    return this._status.isPendingVerification();
  }

  get isDisabled(): boolean {
    return this._status.isDisabled();
  }

  /**
   * Factory method to create a new TwoFactorAuth configuration during setup.
   * Starts in PENDING_VERIFICATION status until the user verifies their first TOTP code.
   */
  static setup(
    id: string,
    userId: string,
    encryptedSecret: string,
  ): TwoFactorAuthAggregate {
    const twoFactorAuth = new TwoFactorAuthAggregate(id, {
      userId: TwoFactorUserId.create(userId),
      secret: TotpSecret.create(encryptedSecret),
      backupCodes: BackupCodes.empty(),
      status: TotpStatus.pendingVerification(),
    });

    return twoFactorAuth;
  }

  /**
   * Reconstitute from persistence.
   * Used when loading from the database.
   */
  static reconstitute(
    id: string,
    userId: string,
    encryptedSecret: string,
    backupCodes: string[],
    status: TotpStatusEnum,
    createdAt: Date,
    updatedAt: Date,
    verifiedAt?: Date,
  ): TwoFactorAuthAggregate {
    const twoFactorAuth = new TwoFactorAuthAggregate(id, {
      userId: TwoFactorUserId.create(userId),
      secret: TotpSecret.create(encryptedSecret),
      backupCodes: BackupCodes.create(backupCodes),
      status: TotpStatus.create(status),
      verifiedAt,
    });
    twoFactorAuth._createdAt = createdAt;
    twoFactorAuth._updatedAt = updatedAt;
    return twoFactorAuth;
  }

  /**
   * Verify the TOTP setup by confirming the user can generate valid codes.
   * Transitions from PENDING_VERIFICATION to ENABLED.
   */
  verify(): void {
    if (!this._status.isPendingVerification()) {
      throw new Error(
        'Cannot verify: two-factor auth is not in pending verification state',
      );
    }

    this._status = TotpStatus.enabled();
    this._verifiedAt = new Date();
    this.incrementVersion();

    this.addDomainEvent(
      new TotpVerifiedEvent({
        userId: this._userId.toValue(),
        verifiedAt: this._verifiedAt,
      }),
    );

    this.addDomainEvent(
      new TotpEnabledEvent({
        userId: this._userId.toValue(),
        enabledAt: this.updatedAt,
      }),
    );
  }

  /**
   * Disable two-factor authentication for this user.
   */
  disable(): void {
    if (!this._status.isEnabled()) {
      throw new Error('Cannot disable: two-factor auth is not enabled');
    }

    this._status = TotpStatus.disabled();
    this._verifiedAt = undefined;
    this.incrementVersion();

    this.addDomainEvent(
      new TotpDisabledEvent({
        userId: this._userId.toValue(),
        disabledAt: this.updatedAt,
      }),
    );
  }

  /**
   * Enable two-factor authentication (e.g., after re-enabling).
   */
  enable(): void {
    if (!this._status.isDisabled()) {
      throw new Error('Cannot enable: two-factor auth is not disabled');
    }

    this._status = TotpStatus.enabled();
    this._verifiedAt = new Date();
    this.incrementVersion();

    this.addDomainEvent(
      new TotpEnabledEvent({
        userId: this._userId.toValue(),
        enabledAt: this.updatedAt,
      }),
    );
  }

  /**
   * Update the TOTP secret (e.g., when regenerating after losing access).
   * Resets to pending verification state.
   */
  updateSecret(newEncryptedSecret: string): void {
    this._secret = TotpSecret.create(newEncryptedSecret);
    this._status = TotpStatus.pendingVerification();
    this._verifiedAt = undefined;
    this.incrementVersion();
  }

  /**
   * Set backup codes for account recovery.
   * Replaces any existing backup codes.
   */
  setBackupCodes(hashedCodes: string[]): void {
    this._backupCodes = BackupCodes.create(hashedCodes);
    this.incrementVersion();

    this.addDomainEvent(
      new BackupCodeGeneratedEvent({
        userId: this._userId.toValue(),
        codeCount: hashedCodes.length,
        generatedAt: this.updatedAt,
      }),
    );
  }

  /**
   * Use a backup code for authentication.
   * Returns the updated backup codes collection with the used code removed.
   */
  useBackupCode(usedHash: string): void {
    if (!this._backupCodes.contains(usedHash)) {
      throw new Error('Invalid backup code');
    }

    this._backupCodes = this._backupCodes.removeUsed(usedHash);
    this.incrementVersion();

    this.addDomainEvent(
      new BackupCodeUsedEvent({
        userId: this._userId.toValue(),
        remainingCount: this._backupCodes.count(),
        usedAt: this.updatedAt,
      }),
    );
  }

  /**
   * Check if the user has backup codes available.
   */
  hasBackupCodes(): boolean {
    return !this._backupCodes.isEmpty();
  }

  /**
   * Get the count of remaining backup codes.
   */
  getBackupCodesCount(): number {
    return this._backupCodes.count();
  }

  /**
   * Update the encrypted secret (for rotation or refresh).
   */
  updateEncryptedSecret(newEncryptedSecret: string): void {
    this._secret = TotpSecret.create(newEncryptedSecret);
    this.touch();
  }
}
