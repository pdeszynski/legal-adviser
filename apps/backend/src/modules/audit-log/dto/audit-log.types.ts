import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  MaxLength,
  IsObject,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  AuditActionType,
  AuditResourceType,
} from '../entities/audit-log.entity';

/**
 * XSS Protection - Sanitization helper
 */
const sanitizeString = (value: unknown): string | unknown => {
  if (typeof value === 'string') {
    return value
      .trim()
      .replace(/[<>]/g, '') // Remove HTML brackets
      .replace(/\s+/g, ' '); // Normalize whitespace
  }
  return value;
};

/**
 * GraphQL Input Type for Change Details
 */
@InputType('ChangeDetailsInput')
export class ChangeDetailsInput {
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsString({ each: true })
  changedFields?: string[];

  @Field(() => String, {
    nullable: true,
    description: 'JSON string of previous values',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeString(value))
  before?: string;

  @Field(() => String, {
    nullable: true,
    description: 'JSON string of new values',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeString(value))
  after?: string;

  @Field(() => String, {
    nullable: true,
    description: 'JSON string of additional context',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeString(value))
  context?: string;
}

/**
 * GraphQL Input Type for Creating Audit Log Entry
 */
@InputType('CreateAuditLogInput')
export class CreateAuditLogInput {
  @Field(() => AuditActionType)
  @IsEnum(AuditActionType)
  action: AuditActionType;

  @Field(() => AuditResourceType)
  @IsEnum(AuditResourceType)
  resourceType: AuditResourceType;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID('4')
  resourceId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(45)
  @Transform(({ value }) => sanitizeString(value))
  ipAddress?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => sanitizeString(value))
  userAgent?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  statusCode?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => sanitizeString(value))
  errorMessage?: string;

  @Field(() => ChangeDetailsInput, { nullable: true })
  @IsOptional()
  @IsObject()
  changeDetails?: ChangeDetailsInput;
}

/**
 * GraphQL Input Type for Querying Audit Logs
 */
@InputType('QueryAuditLogsInput')
export class QueryAuditLogsInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @Field(() => AuditActionType, { nullable: true })
  @IsOptional()
  @IsEnum(AuditActionType)
  action?: AuditActionType;

  @Field(() => AuditResourceType, { nullable: true })
  @IsOptional()
  @IsEnum(AuditResourceType)
  resourceType?: AuditResourceType;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID('4')
  resourceId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(45)
  @Transform(({ value }) => sanitizeString(value))
  ipAddress?: string;

  @Field(() => Int, { nullable: true, defaultValue: 50 })
  @IsOptional()
  @IsInt()
  limit?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  offset?: number;
}
