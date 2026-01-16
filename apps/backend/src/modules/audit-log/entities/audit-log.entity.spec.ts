import {
  AuditLog,
  AuditActionType,
  AuditResourceType,
} from './audit-log.entity';

describe('AuditLog Entity', () => {
  let auditLog: AuditLog;

  beforeEach(() => {
    auditLog = new AuditLog();
    auditLog.id = '123e4567-e89b-12d3-a456-426614174000';
    auditLog.action = AuditActionType.CREATE;
    auditLog.resourceType = AuditResourceType.DOCUMENT;
    auditLog.resourceId = '123e4567-e89b-12d3-a456-426614174001';
    auditLog.userId = '123e4567-e89b-12d3-a456-426614174002';
    auditLog.ipAddress = '192.168.1.1';
    auditLog.userAgent = 'Mozilla/5.0';
    auditLog.statusCode = 200;
    auditLog.errorMessage = null;
    auditLog.changeDetails = null;
    auditLog.createdAt = new Date();
    auditLog.updatedAt = new Date();
  });

  describe('isSuccessful', () => {
    it('should return true for 2xx status codes', () => {
      auditLog.statusCode = 200;
      expect(auditLog.isSuccessful()).toBe(true);

      auditLog.statusCode = 201;
      expect(auditLog.isSuccessful()).toBe(true);

      auditLog.statusCode = 204;
      expect(auditLog.isSuccessful()).toBe(true);
    });

    it('should return true for 3xx status codes', () => {
      auditLog.statusCode = 301;
      expect(auditLog.isSuccessful()).toBe(true);

      auditLog.statusCode = 302;
      expect(auditLog.isSuccessful()).toBe(true);
    });

    it('should return false for 4xx status codes', () => {
      auditLog.statusCode = 400;
      expect(auditLog.isSuccessful()).toBe(false);

      auditLog.statusCode = 404;
      expect(auditLog.isSuccessful()).toBe(false);

      auditLog.statusCode = 403;
      expect(auditLog.isSuccessful()).toBe(false);
    });

    it('should return false for 5xx status codes', () => {
      auditLog.statusCode = 500;
      expect(auditLog.isSuccessful()).toBe(false);

      auditLog.statusCode = 503;
      expect(auditLog.isSuccessful()).toBe(false);
    });

    it('should return false when statusCode is null', () => {
      auditLog.statusCode = null;
      expect(auditLog.isSuccessful()).toBe(false);
    });
  });

  describe('isFailed', () => {
    it('should return true for 4xx status codes', () => {
      auditLog.statusCode = 400;
      expect(auditLog.isFailed()).toBe(true);

      auditLog.statusCode = 404;
      expect(auditLog.isFailed()).toBe(true);
    });

    it('should return true for 5xx status codes', () => {
      auditLog.statusCode = 500;
      expect(auditLog.isFailed()).toBe(true);

      auditLog.statusCode = 503;
      expect(auditLog.isFailed()).toBe(true);
    });

    it('should return false for 2xx status codes', () => {
      auditLog.statusCode = 200;
      expect(auditLog.isFailed()).toBe(false);

      auditLog.statusCode = 201;
      expect(auditLog.isFailed()).toBe(false);
    });

    it('should return false when statusCode is null', () => {
      auditLog.statusCode = null;
      expect(auditLog.isFailed()).toBe(false);
    });
  });

  describe('isWriteOperation', () => {
    it('should return true for CREATE action', () => {
      auditLog.action = AuditActionType.CREATE;
      expect(auditLog.isWriteOperation()).toBe(true);
    });

    it('should return true for UPDATE action', () => {
      auditLog.action = AuditActionType.UPDATE;
      expect(auditLog.isWriteOperation()).toBe(true);
    });

    it('should return true for DELETE action', () => {
      auditLog.action = AuditActionType.DELETE;
      expect(auditLog.isWriteOperation()).toBe(true);
    });

    it('should return false for READ action', () => {
      auditLog.action = AuditActionType.READ;
      expect(auditLog.isWriteOperation()).toBe(false);
    });

    it('should return false for EXPORT action', () => {
      auditLog.action = AuditActionType.EXPORT;
      expect(auditLog.isWriteOperation()).toBe(false);
    });

    it('should return false for LOGIN action', () => {
      auditLog.action = AuditActionType.LOGIN;
      expect(auditLog.isWriteOperation()).toBe(false);
    });

    it('should return false for LOGOUT action', () => {
      auditLog.action = AuditActionType.LOGOUT;
      expect(auditLog.isWriteOperation()).toBe(false);
    });
  });

  describe('getActionDescription', () => {
    it('should return description with resource ID', () => {
      auditLog.action = AuditActionType.CREATE;
      auditLog.resourceType = AuditResourceType.DOCUMENT;
      auditLog.resourceId = '123e4567-e89b-12d3-a456-426614174001';

      expect(auditLog.getActionDescription()).toBe(
        'CREATE on DOCUMENT (123e4567-e89b-12d3-a456-426614174001)',
      );
    });

    it('should return description without resource ID when null', () => {
      auditLog.action = AuditActionType.LOGIN;
      auditLog.resourceType = AuditResourceType.USER;
      auditLog.resourceId = null;

      expect(auditLog.getActionDescription()).toBe('LOGIN on USER');
    });

    it('should work for all action types', () => {
      auditLog.resourceId = null;
      auditLog.resourceType = AuditResourceType.SYSTEM;

      Object.values(AuditActionType).forEach((action) => {
        auditLog.action = action;
        expect(auditLog.getActionDescription()).toBe(`${action} on SYSTEM`);
      });
    });
  });

  describe('AuditActionType enum', () => {
    it('should have all expected action types', () => {
      expect(AuditActionType.CREATE).toBe('CREATE');
      expect(AuditActionType.READ).toBe('READ');
      expect(AuditActionType.UPDATE).toBe('UPDATE');
      expect(AuditActionType.DELETE).toBe('DELETE');
      expect(AuditActionType.EXPORT).toBe('EXPORT');
      expect(AuditActionType.LOGIN).toBe('LOGIN');
      expect(AuditActionType.LOGOUT).toBe('LOGOUT');
    });
  });

  describe('AuditResourceType enum', () => {
    it('should have all expected resource types', () => {
      expect(AuditResourceType.USER).toBe('USER');
      expect(AuditResourceType.DOCUMENT).toBe('DOCUMENT');
      expect(AuditResourceType.SESSION).toBe('SESSION');
      expect(AuditResourceType.SYSTEM).toBe('SYSTEM');
    });
  });
});
