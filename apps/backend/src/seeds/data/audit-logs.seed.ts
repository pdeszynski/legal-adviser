import {
  AuditActionType,
  AuditResourceType,
  ChangeDetails,
} from '../../modules/audit-log/entities/audit-log.entity';

/**
 * Audit log seed data for development and testing
 * Logs will be associated with users based on their email (nullable for system actions)
 */
export interface AuditLogSeedData {
  userEmail: string | null;
  action: AuditActionType;
  resourceType: AuditResourceType;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  statusCode: number | null;
  errorMessage: string | null;
  changeDetails: ChangeDetails | null;
}

export const auditLogsSeedData: AuditLogSeedData[] = [
  // Admin login
  {
    userEmail: 'admin@refine.dev',
    action: AuditActionType.LOGIN,
    resourceType: AuditResourceType.SESSION,
    resourceId: null,
    ipAddress: '192.168.1.100',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    statusCode: 200,
    errorMessage: null,
    changeDetails: null,
  },
  // Admin creates a document
  {
    userEmail: 'admin@refine.dev',
    action: AuditActionType.CREATE,
    resourceType: AuditResourceType.DOCUMENT,
    resourceId: null, // Will be set dynamically
    ipAddress: '192.168.1.100',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    statusCode: 201,
    errorMessage: null,
    changeDetails: {
      changedFields: ['title', 'type', 'status'],
      after: {
        title: 'Pozew o zapłatę',
        type: 'LAWSUIT',
        status: 'DRAFT',
      },
    },
  },
  // Lawyer login
  {
    userEmail: 'lawyer@example.com',
    action: AuditActionType.LOGIN,
    resourceType: AuditResourceType.SESSION,
    resourceId: null,
    ipAddress: '10.0.0.50',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    statusCode: 200,
    errorMessage: null,
    changeDetails: null,
  },
  // Lawyer reads a document
  {
    userEmail: 'lawyer@example.com',
    action: AuditActionType.READ,
    resourceType: AuditResourceType.DOCUMENT,
    resourceId: null,
    ipAddress: '10.0.0.50',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    statusCode: 200,
    errorMessage: null,
    changeDetails: null,
  },
  // Lawyer updates a document
  {
    userEmail: 'lawyer@example.com',
    action: AuditActionType.UPDATE,
    resourceType: AuditResourceType.DOCUMENT,
    resourceId: null,
    ipAddress: '10.0.0.50',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    statusCode: 200,
    errorMessage: null,
    changeDetails: {
      changedFields: ['status', 'contentRaw'],
      before: {
        status: 'DRAFT',
      },
      after: {
        status: 'COMPLETED',
      },
    },
  },
  // Regular user login
  {
    userEmail: 'user@example.com',
    action: AuditActionType.LOGIN,
    resourceType: AuditResourceType.SESSION,
    resourceId: null,
    ipAddress: '172.16.0.25',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/605.1.15',
    statusCode: 200,
    errorMessage: null,
    changeDetails: null,
  },
  // Failed login attempt
  {
    userEmail: null,
    action: AuditActionType.LOGIN,
    resourceType: AuditResourceType.SESSION,
    resourceId: null,
    ipAddress: '8.8.8.8',
    userAgent: 'curl/7.64.1',
    statusCode: 401,
    errorMessage: 'Invalid credentials',
    changeDetails: {
      context: {
        attemptedEmail: 'unknown@example.com',
      },
    },
  },
  // Admin exports data
  {
    userEmail: 'admin@refine.dev',
    action: AuditActionType.EXPORT,
    resourceType: AuditResourceType.DOCUMENT,
    resourceId: null,
    ipAddress: '192.168.1.100',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    statusCode: 200,
    errorMessage: null,
    changeDetails: {
      context: {
        exportFormat: 'PDF',
        documentsExported: 5,
      },
    },
  },
  // Admin updates user
  {
    userEmail: 'admin@refine.dev',
    action: AuditActionType.UPDATE,
    resourceType: AuditResourceType.USER,
    resourceId: null,
    ipAddress: '192.168.1.100',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    statusCode: 200,
    errorMessage: null,
    changeDetails: {
      changedFields: ['isActive'],
      before: { isActive: true },
      after: { isActive: false },
    },
  },
  // System operation
  {
    userEmail: null,
    action: AuditActionType.DELETE,
    resourceType: AuditResourceType.SYSTEM,
    resourceId: null,
    ipAddress: null,
    userAgent: null,
    statusCode: 200,
    errorMessage: null,
    changeDetails: {
      context: {
        operation: 'cleanup_expired_sessions',
        deletedCount: 42,
      },
    },
  },
  // Lawyer logout
  {
    userEmail: 'lawyer@example.com',
    action: AuditActionType.LOGOUT,
    resourceType: AuditResourceType.SESSION,
    resourceId: null,
    ipAddress: '10.0.0.50',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    statusCode: 200,
    errorMessage: null,
    changeDetails: null,
  },
];
