import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  MaxLength,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
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
 * DTO for Change Details nested object
 */
export class ChangeDetailsDto {
  @IsOptional()
  @IsString({ each: true })
  changedFields?: string[];

  @IsOptional()
  @IsObject()
  before?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  after?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}

/**
 * Create Audit Log DTO
 *
 * Used for creating new audit log entries.
 * All inputs are validated and sanitized.
 */
export class CreateAuditLogDto {
  @IsEnum(AuditActionType)
  action: AuditActionType;

  @IsEnum(AuditResourceType)
  resourceType: AuditResourceType;

  @IsOptional()
  @IsUUID('4')
  resourceId?: string;

  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(45)
  @Transform(({ value }) => sanitizeString(value))
  ipAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => sanitizeString(value))
  userAgent?: string;

  @IsOptional()
  @IsInt()
  statusCode?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => sanitizeString(value))
  errorMessage?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ChangeDetailsDto)
  changeDetails?: ChangeDetailsDto;
}

/**
 * Query Audit Logs DTO
 *
 * Used for filtering audit log queries.
 */
export class QueryAuditLogsDto {
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @IsOptional()
  @IsEnum(AuditActionType)
  action?: AuditActionType;

  @IsOptional()
  @IsEnum(AuditResourceType)
  resourceType?: AuditResourceType;

  @IsOptional()
  @IsUUID('4')
  resourceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(45)
  @Transform(({ value }) => sanitizeString(value))
  ipAddress?: string;

  @IsOptional()
  @IsInt()
  limit?: number;

  @IsOptional()
  @IsInt()
  offset?: number;
}
