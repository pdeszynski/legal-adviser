import {
  Field,
  ObjectType,
  InputType,
  Int,
  registerEnumType,
} from '@nestjs/graphql';
import { GraphQLISODateTime } from '@nestjs/graphql';

/**
 * Two-Factor Authentication Status
 */
export enum TwoFactorStatus {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
  PENDING = 'PENDING',
}

registerEnumType(TwoFactorStatus, {
  name: 'TwoFactorStatus',
  description: 'Status of two-factor authentication',
});

/**
 * Response when enabling 2FA
 * Contains the secret, QR code, and backup codes
 */
@ObjectType()
export class EnableTwoFactorResponse {
  @Field(() => String, {
    description: 'The TOTP secret key for storing in authenticator app',
  })
  secret!: string;

  @Field(() => String, {
    description: 'QR code as base64 data URL for scanning',
  })
  qrCodeDataUrl!: string;

  @Field(() => [String], {
    description: 'Backup codes for account recovery (show only once)',
  })
  backupCodes!: string[];
}

/**
 * Response when verifying 2FA setup
 * Contains backup codes again for user to save
 */
@ObjectType()
export class VerifyTwoFactorSetupResponse {
  @Field(() => Boolean, {
    description: 'True if verification was successful',
  })
  success!: boolean;

  @Field(() => [String], {
    description: 'Backup codes for account recovery',
    nullable: true,
  })
  backupCodes?: string[];
}

/**
 * Input for verifying 2FA setup
 */
@InputType()
export class VerifyTwoFactorSetupInput {
  @Field(() => String, {
    description: 'The 6-digit TOTP token from authenticator app',
  })
  token!: string;
}

/**
 * Input for disabling 2FA
 */
@InputType()
export class DisableTwoFactorInput {
  @Field(() => String, {
    description: 'User password for confirmation',
  })
  password!: string;
}

/**
 * Response when regenerating backup codes
 */
@ObjectType()
export class RegenerateBackupCodesResponse {
  @Field(() => [String], {
    description: 'New backup codes for account recovery (show only once)',
  })
  codes!: string[];
}

/**
 * Two-Factor Authentication settings
 */
@ObjectType()
export class TwoFactorSettings {
  @Field(() => TwoFactorStatus, {
    description: 'Current 2FA status',
  })
  status!: TwoFactorStatus;

  @Field(() => Boolean, {
    description: 'True if 2FA is fully enabled',
  })
  enabled!: boolean;

  @Field(() => Int, {
    description: 'Number of remaining backup codes',
    nullable: true,
  })
  remainingBackupCodes?: number | null;

  @Field(() => GraphQLISODateTime, {
    description: 'Timestamp when 2FA was last verified/enabled',
    nullable: true,
  })
  lastVerifiedAt?: Date | null;
}

/**
 * Input for verifying TOTP token during login
 */
@InputType()
export class VerifyTwoFactorTokenInput {
  @Field(() => String, {
    description: 'The 6-digit TOTP token from authenticator app',
  })
  token!: string;
}

/**
 * Input for verifying backup code during login
 */
@InputType()
export class VerifyBackupCodeInput {
  @Field(() => String, {
    description: 'The backup code for account recovery',
  })
  backupCode!: string;
}

/**
 * Input for admin force-disabling 2FA
 */
@InputType()
export class AdminForceDisableTwoFactorInput {
  @Field(() => String, {
    description: 'The ID of the user to disable 2FA for',
  })
  userId!: string;
}

/**
 * Response for admin force-disabling 2FA
 */
@ObjectType()
export class AdminForceDisableTwoFactorResponse {
  @Field(() => String, {
    description: 'The user ID',
  })
  id!: string;

  @Field(() => Boolean, {
    description: 'The updated 2FA status (should be false)',
  })
  twoFactorEnabled!: boolean;
}
