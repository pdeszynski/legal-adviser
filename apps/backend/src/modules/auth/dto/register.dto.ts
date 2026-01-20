import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
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
 * DTO for user registration request
 */
export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255, { message: 'Email must be at most 255 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  email: string;

  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(50, { message: 'Username must be at most 50 characters long' })
  @Matches(/^[a-zA-Z0-9_.\-]+$/, {
    message:
      'Username can only contain letters, numbers, underscores, dots, and hyphens',
  })
  @Transform(({ value }) => sanitizeString(value))
  username?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'First name must be at most 100 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Last name must be at most 100 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  lastName?: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must be at most 128 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, and one number',
  })
  password: string;
}
