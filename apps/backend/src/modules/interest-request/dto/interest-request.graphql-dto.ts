import {
  Field,
  ObjectType,
  InputType,
} from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MaxLength,
  MinLength,
  IsOptional,
  IsBoolean,
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
 * GraphQL Input Type for early access interest request submission
 */
@InputType('InterestRequestInput')
export class InterestRequestInput {
  @Field(() => String, { description: 'Full name of the requester' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Full name must be at most 255 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  fullName!: string;

  @Field(() => String, { description: 'Email address' })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255, { message: 'Email must be at most 255 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  email!: string;

  @Field(() => String, {
    nullable: true,
    description: 'Company name',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Company name must be at least 2 characters long' })
  @MaxLength(255, {
    message: 'Company name must be at most 255 characters long',
  })
  @Transform(({ value }) => sanitizeString(value))
  company?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Job role or position',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Role must be at least 2 characters long' })
  @MaxLength(255, { message: 'Role must be at most 255 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  role?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Specific use case or requirements',
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Use case must be at least 10 characters long' })
  @MaxLength(2000, { message: 'Use case must be at most 2000 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  useCase?: string;

  @Field(() => String, {
    nullable: true,
    description: 'How they heard about us (lead source)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Lead source must be at most 255 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  leadSource?: string;

  @Field(() => Boolean, { description: 'GDPR consent checkbox' })
  @IsBoolean()
  @IsNotEmpty({ message: 'GDPR consent is required' })
  consent!: boolean;
}

/**
 * GraphQL Response Type for early access interest request submission
 */
@ObjectType('InterestRequestResponse')
export class InterestRequestResponse {
  @Field(() => Boolean, {
    description: 'Whether the request was submitted successfully',
  })
  success!: boolean;

  @Field(() => String, {
    description: 'Confirmation message with next steps',
  })
  message!: string;

  @Field(() => String, {
    nullable: true,
    description: 'Unique reference ID for the request',
  })
  referenceId?: string;
}
