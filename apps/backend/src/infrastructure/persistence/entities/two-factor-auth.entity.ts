import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TotpStatusEnum } from '../../../domain/two-factor-auth/value-objects';

/**
 * Two-Factor Authentication Entity
 *
 * CQRS Read Model: This entity is used for querying two-factor authentication data.
 * The write operations use TwoFactorAuthAggregate from the domain layer.
 *
 * Security Notes:
 * - The TOTP secret is encrypted at rest using AES-256-GCM
 * - Backup codes are hashed using bcrypt/scrypt before storage
 * - The `secret` column is not selected by default for security
 *
 * This entity follows the simplified DDD approach where TypeORM annotations
 * are acceptable on entities. Repository handles mapping to/from domain aggregates.
 */
@Entity('two_factor_auth')
export class TwoFactorAuth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  userId: string;

  /**
   * Encrypted TOTP secret
   * Store as text to accommodate encrypted base64 data
   * Not selected by default for security (must explicitly query)
   */
  @Column({ type: 'text', select: false })
  secret: string;

  /**
   * Hashed backup codes for account recovery
   * Stored as JSON array of hashed codes
   */
  @Column({ type: 'json', name: 'backup_codes', default: [] })
  backupCodes: string[];

  /**
   * TOTP status
   * - disabled: User has not set up 2FA
   * - pending_verification: User has set up 2FA but not verified
   * - enabled: User has verified 2FA and it's active
   */
  @Column({
    type: 'enum',
    enum: TotpStatusEnum,
    default: TotpStatusEnum.DISABLED,
  })
  status: TotpStatusEnum;

  /**
   * Timestamp when TOTP was first verified
   */
  @Column({ type: 'timestamp', name: 'verified_at', nullable: true })
  verifiedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
