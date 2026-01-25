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
 * TwoFactorAuth ORM Entity
 *
 * Represents the database schema for two-factor authentication in the infrastructure layer.
 * This is separate from the domain TwoFactorAuth aggregate and is used for persistence only.
 *
 * Security Notes:
 * - The TOTP secret is encrypted at rest using AES-256-GCM
 * - Backup codes are hashed using bcrypt/scrypt before storage
 * - The `secret` column should not be selected by default queries
 *
 * Note: This entity maps to the DDD TwoFactorAuthAggregate through the TwoFactorAuthMapper.
 * For GraphQL operations, use the TwoFactorAuth entity in modules/two-factor-auth/entities.
 */
@Entity('two_factor_auth')
export class TwoFactorAuthOrmEntity {
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
