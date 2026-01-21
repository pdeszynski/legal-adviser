import { DocumentShare, SharePermission } from './document-share.entity';

/**
 * Unit tests for DocumentShare entity
 *
 * Tests the business logic methods and permission hierarchy
 * This verifies the core DocumentPermission functionality
 */
describe('DocumentShare Entity', () => {
  describe('SharePermission Enum', () => {
    it('should have all four permission levels', () => {
      expect(SharePermission.VIEW).toBe('VIEW');
      expect(SharePermission.COMMENT).toBe('COMMENT');
      expect(SharePermission.EDIT).toBe('EDIT');
      expect(SharePermission.ADMIN).toBe('ADMIN');
    });
  });

  describe('isActive', () => {
    it('should return true when no expiration date is set', () => {
      const share = new DocumentShare();
      share.expiresAt = null;

      expect(share.isActive()).toBe(true);
    });

    it('should return true when expiration date is in the future', () => {
      const share = new DocumentShare();
      share.expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

      expect(share.isActive()).toBe(true);
    });

    it('should return false when expiration date is in the past', () => {
      const share = new DocumentShare();
      share.expiresAt = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago

      expect(share.isActive()).toBe(false);
    });
  });

  describe('isExpired', () => {
    it('should return false when no expiration date is set', () => {
      const share = new DocumentShare();
      share.expiresAt = null;

      expect(share.isExpired()).toBe(false);
    });

    it('should return false when expiration date is in the future', () => {
      const share = new DocumentShare();
      share.expiresAt = new Date(Date.now() + 1000 * 60 * 60);

      expect(share.isExpired()).toBe(false);
    });

    it('should return true when expiration date is in the past', () => {
      const share = new DocumentShare();
      share.expiresAt = new Date(Date.now() - 1000 * 60 * 60);

      expect(share.isExpired()).toBe(true);
    });
  });

  describe('canEdit', () => {
    it('should return false for VIEW permission', () => {
      const share = new DocumentShare();
      share.permission = SharePermission.VIEW;

      expect(share.canEdit()).toBe(false);
    });

    it('should return false for COMMENT permission', () => {
      const share = new DocumentShare();
      share.permission = SharePermission.COMMENT;

      expect(share.canEdit()).toBe(false);
    });

    it('should return true for EDIT permission', () => {
      const share = new DocumentShare();
      share.permission = SharePermission.EDIT;

      expect(share.canEdit()).toBe(true);
    });

    it('should return true for ADMIN permission', () => {
      const share = new DocumentShare();
      share.permission = SharePermission.ADMIN;

      expect(share.canEdit()).toBe(true);
    });
  });

  describe('canShare', () => {
    it('should return false for VIEW permission', () => {
      const share = new DocumentShare();
      share.permission = SharePermission.VIEW;

      expect(share.canShare()).toBe(false);
    });

    it('should return false for COMMENT permission', () => {
      const share = new DocumentShare();
      share.permission = SharePermission.COMMENT;

      expect(share.canShare()).toBe(false);
    });

    it('should return false for EDIT permission', () => {
      const share = new DocumentShare();
      share.permission = SharePermission.EDIT;

      expect(share.canShare()).toBe(false);
    });

    it('should return true for ADMIN permission', () => {
      const share = new DocumentShare();
      share.permission = SharePermission.ADMIN;

      expect(share.canShare()).toBe(true);
    });
  });

  describe('canView', () => {
    it('should return true for all permission levels', () => {
      const viewShare = new DocumentShare();
      viewShare.permission = SharePermission.VIEW;

      const commentShare = new DocumentShare();
      commentShare.permission = SharePermission.COMMENT;

      const editShare = new DocumentShare();
      editShare.permission = SharePermission.EDIT;

      const adminShare = new DocumentShare();
      adminShare.permission = SharePermission.ADMIN;

      expect(viewShare.canView()).toBe(true);
      expect(commentShare.canView()).toBe(true);
      expect(editShare.canView()).toBe(true);
      expect(adminShare.canView()).toBe(true);
    });
  });

  describe('Permission Hierarchy', () => {
    it('should enforce correct permission hierarchy: VIEW < COMMENT < EDIT < ADMIN', () => {
      const viewShare = new DocumentShare();
      viewShare.permission = SharePermission.VIEW;

      const commentShare = new DocumentShare();
      commentShare.permission = SharePermission.COMMENT;

      const editShare = new DocumentShare();
      editShare.permission = SharePermission.EDIT;

      const adminShare = new DocumentShare();
      adminShare.permission = SharePermission.ADMIN;

      // VIEW can only view
      expect(viewShare.canView()).toBe(true);
      expect(viewShare.canEdit()).toBe(false);
      expect(viewShare.canShare()).toBe(false);

      // COMMENT can view (but not edit or share in current implementation)
      expect(commentShare.canView()).toBe(true);
      expect(commentShare.canEdit()).toBe(false);
      expect(commentShare.canShare()).toBe(false);

      // EDIT can view and edit
      expect(editShare.canView()).toBe(true);
      expect(editShare.canEdit()).toBe(true);
      expect(editShare.canShare()).toBe(false);

      // ADMIN can do everything
      expect(adminShare.canView()).toBe(true);
      expect(adminShare.canEdit()).toBe(true);
      expect(adminShare.canShare()).toBe(true);
    });
  });

  describe('Entity Properties', () => {
    it('should support all required properties', () => {
      const share = new DocumentShare();

      // Set all properties
      share.id = '123e4567-e89b-12d3-a456-426614174000';
      share.documentId = '123e4567-e89b-12d3-a456-426614174001';
      share.sharedWithUserId = '123e4567-e89b-12d3-a456-426614174002';
      share.sharedByUserId = '123e4567-e89b-12d3-a456-426614174003';
      share.permission = SharePermission.EDIT;
      share.expiresAt = new Date('2026-12-31');
      share.createdAt = new Date();
      share.updatedAt = new Date();

      // Verify all properties are set correctly
      expect(share.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(share.documentId).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(share.sharedWithUserId).toBe('123e4567-e89b-12d3-a456-426614174002');
      expect(share.sharedByUserId).toBe('123e4567-e89b-12d3-a456-426614174003');
      expect(share.permission).toBe(SharePermission.EDIT);
      expect(share.expiresAt).toBeInstanceOf(Date);
      expect(share.createdAt).toBeInstanceOf(Date);
      expect(share.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Audit Trail Support', () => {
    it('should track who shared the document (sharedByUserId)', () => {
      const share = new DocumentShare();
      share.sharedByUserId = 'owner-user-id';

      expect(share.sharedByUserId).toBe('owner-user-id');
    });

    it('should track who received the share (sharedWithUserId)', () => {
      const share = new DocumentShare();
      share.sharedWithUserId = 'recipient-user-id';

      expect(share.sharedWithUserId).toBe('recipient-user-id');
    });

    it('should have creation and update timestamps', () => {
      const share = new DocumentShare();
      const now = new Date();
      share.createdAt = now;
      share.updatedAt = now;

      expect(share.createdAt).toBe(now);
      expect(share.updatedAt).toBe(now);
    });
  });
});
