import {
  Field,
  ObjectType,
  InputType,
  ID,
  GraphQLISODateTime,
} from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Sanitize string input by trimming whitespace
 */
const sanitizeString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    return value.trim();
  }
  return undefined;
};

/**
 * GraphQL Input Type for user login
 */
@InputType()
export class LoginInput {
  @Field({ description: 'Username or email address' })
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(255, { message: 'Username must be at most 255 characters long' })
  @Matches(/^[a-zA-Z0-9_.\-@]+$/, {
    message:
      'Username can only contain letters, numbers, underscores, dots, hyphens and @',
  })
  @Transform(({ value }) => sanitizeString(value))
  username!: string;

  @Field({ description: 'User password' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must be at most 128 characters long' })
  password!: string;

  @Field({
    nullable: true,
    description: '6-digit TOTP token (if 2FA is enabled)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'TOTP token must be 6 digits' })
  twoFactorToken?: string;

  @Field({
    nullable: true,
    description: 'Backup code for account recovery (alternative to TOTP token)',
  })
  @IsOptional()
  @IsString()
  backupCode?: string;
}

/**
 * GraphQL Input Type for user registration
 */
@InputType()
export class RegisterInput {
  @Field({ description: 'Email address' })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255, { message: 'Email must be at most 255 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  email!: string;

  @Field({ description: 'User password' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must be at most 128 characters long' })
  password!: string;

  @Field({ nullable: true, description: 'Optional username' })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(50, { message: 'Username must be at most 50 characters long' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message:
      'Username can only contain letters, numbers, underscores, dots, and hyphens',
  })
  @Transform(({ value }) => sanitizeString(value))
  username?: string;

  @Field({ nullable: true, description: 'First name' })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'First name must be at most 255 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  firstName?: string;

  @Field({ nullable: true, description: 'Last name' })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Last name must be at most 255 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  lastName?: string;
}

/**
 * GraphQL Input Type for token refresh
 */
@InputType()
export class RefreshTokenInput {
  @Field({ description: 'Refresh token' })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken!: string;
}

/**
 * GraphQL Output Type for authenticated user info
 */
@ObjectType('AuthUser')
export class AuthUserPayload {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field()
  isActive!: boolean;

  @Field()
  disclaimerAccepted!: boolean;

  @Field(() => GraphQLISODateTime, { nullable: true })
  disclaimerAcceptedAt?: Date;

  @Field(() => String)
  role!: string;
}

/**
 * GraphQL Output Type for authentication response
 * When 2FA is required, tokens and user will be null
 */
@ObjectType('AuthPayload')
export class AuthPayload {
  @Field(() => String, {
    nullable: true,
    description: 'JWT access token (null if 2FA is required)',
  })
  accessToken!: string | null;

  @Field(() => String, {
    nullable: true,
    description:
      'JWT refresh token for obtaining new access tokens (null if 2FA is required)',
  })
  refreshToken!: string | null;

  @Field(() => AuthUserPayload, {
    nullable: true,
    description: 'Authenticated user information (null if 2FA is required)',
  })
  user!: AuthUserPayload | null;

  @Field(() => String, {
    nullable: true,
    description:
      'Temporary token for completing 2FA (only present when 2FA is required)',
  })
  twoFactorTempToken?: string | null;

  @Field(() => Boolean, {
    defaultValue: false,
    description: 'True if user needs to provide 2FA token to complete login',
  })
  requiresTwoFactor!: boolean;
}

/**
 * GraphQL Output Type for token refresh response
 */
@ObjectType('RefreshTokenPayload')
export class RefreshTokenPayload {
  @Field({ description: 'New JWT access token' })
  accessToken!: string;

  @Field({ description: 'New JWT refresh token' })
  refreshToken!: string;
}

/**
 * GraphQL Input Type for updating user profile
 */
@InputType()
export class UpdateProfileInput {
  @Field({ nullable: true, description: 'Email address' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  @MaxLength(255, { message: 'Email must be at most 255 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  email?: string;

  @Field({ nullable: true, description: 'Username' })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(50, { message: 'Username must be at most 50 characters long' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message:
      'Username can only contain letters, numbers, underscores, dots, and hyphens',
  })
  @Transform(({ value }) => sanitizeString(value))
  username?: string;

  @Field({ nullable: true, description: 'First name' })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'First name must be at most 255 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  firstName?: string;

  @Field({ nullable: true, description: 'Last name' })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Last name must be at most 255 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  lastName?: string;
}

/**
 * GraphQL Input Type for changing password
 */
@InputType()
export class ChangePasswordInput {
  @Field({ description: 'Current password' })
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword!: string;

  @Field({ description: 'New password' })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must be at most 128 characters long' })
  newPassword!: string;
}

/**
 * GraphQL Input Type for completing 2FA login
 */
@InputType()
export class CompleteTwoFactorLoginInput {
  @Field({
    description: 'Temporary token received from login when 2FA is required',
  })
  @IsString()
  @IsNotEmpty({ message: 'Temporary token is required' })
  twoFactorTempToken!: string;

  @Field({
    nullable: true,
    description: 'The 6-digit TOTP token from authenticator app',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'TOTP token must be 6 digits' })
  twoFactorToken?: string;

  @Field({
    nullable: true,
    description: 'Backup code for account recovery (alternative to TOTP token)',
  })
  @IsOptional()
  @IsString()
  backupCode?: string;
}
