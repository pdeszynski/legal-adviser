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
const sanitizeString = (value: unknown): string | unknown => {
  if (typeof value === 'string') {
    return value.trim();
  }
  return value;
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
  @Matches(/^[a-zA-Z0-9_.\-]+$/, {
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
 */
@ObjectType('AuthPayload')
export class AuthPayload {
  @Field({ description: 'JWT access token' })
  accessToken!: string;

  @Field({ description: 'JWT refresh token for obtaining new access tokens' })
  refreshToken!: string;

  @Field(() => AuthUserPayload, {
    description: 'Authenticated user information',
  })
  user!: AuthUserPayload;
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
  @Matches(/^[a-zA-Z0-9_.\-]+$/, {
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
