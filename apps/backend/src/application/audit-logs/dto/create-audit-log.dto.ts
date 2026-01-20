import {
  AuditActionType,
  AuditResourceType,
  ChangeDetails,
} from '../../../modules/audit-log/entities/audit-log.entity';

/**
 * Application Layer DTO for creating audit logs
 *
 * Used by use cases to capture audit log data from interceptors
 * or other application services.
 */
export class CreateAuditLogDto {
  action: AuditActionType;
  resourceType: AuditResourceType;
  resourceId?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  statusCode?: number | null;
  errorMessage?: string | null;
  changeDetails?: ChangeDetails | null;
}

/**
 * Result DTO returned after creating an audit log
 */
export class CreateAuditLogResultDto {
  id: string;
  action: AuditActionType;
  resourceType: AuditResourceType;
  resourceId: string | null;
  userId: string | null;
  createdAt: Date;
}
