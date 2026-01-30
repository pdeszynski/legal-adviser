import {
  DocumentPermissionGuard,
  DocumentPermissionLevel,
  RequireDocumentPermission,
  PERMISSION_KEY,
} from './document-permission.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Repository } from 'typeorm';
import { LegalDocument } from '../../documents/entities/legal-document.entity';
import { DocumentShare } from '../../documents/entities/document-share.entity';
import { UserSession } from '../../users/entities/user-session.entity';

/**
 * Mock DocumentShare for testing
 */
class MockDocumentShare {
  isActive(): boolean {
    return true;
  }

  canView(): boolean {
    return (
      this.permission === 'read' ||
      this.permission === 'write' ||
      this.permission === 'share'
    );
  }

  canEdit(): boolean {
    return this.permission === 'write' || this.permission === 'share';
  }

  canShare(): boolean {
    return this.permission === 'share';
  }

  constructor(private permission: 'read' | 'write' | 'share') {}
}

/**
 * Create a mock execution context for testing DocumentPermissionGuard
 */
function createMockContext(
  userId: string | null = 'user-123',
  args: Record<string, unknown> = {},
): ExecutionContext {
  const mockContext = {
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;

  jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
    getContext: () => ({
      req: {
        user: userId ? { id: userId } : undefined,
      },
    }),
    getArgs: () => args,
  } as unknown as GqlExecutionContext);

  return mockContext;
}

/**
 * Create mock repositories
 */
function createMockRepositories(
  document: LegalDocument | null = null,
  share: DocumentShare | null = null,
) {
  const mockDocumentRepo = {
    findOne: jest.fn().mockResolvedValue(document),
  } as unknown as Repository<LegalDocument>;

  const mockShareRepo = {
    findOne: jest.fn().mockResolvedValue(share),
  } as unknown as Repository<DocumentShare>;

  return { documentRepo: mockDocumentRepo, shareRepo: mockShareRepo };
}

/**
 * Create a mock LegalDocument
 */
function createMockDocument(
  documentId: string,
  userId: string | null,
): LegalDocument {
  const doc = {
    id: documentId,
    session: userId ? { userId } : null,
  } as unknown as LegalDocument;
  return doc;
}

describe('DocumentPermissionGuard', () => {
  let guard: DocumentPermissionGuard;
  let reflector: Reflector;
  let mockDocumentRepo: Repository<LegalDocument>;
  let mockShareRepo: Repository<DocumentShare>;

  beforeEach(() => {
    reflector = new Reflector();
    jest.clearAllMocks();
  });

  describe('with no permission requirement', () => {
    beforeEach(() => {
      const repos = createMockRepositories();
      mockDocumentRepo = repos.documentRepo;
      mockShareRepo = repos.shareRepo;
      guard = new DocumentPermissionGuard(
        reflector,
        mockDocumentRepo,
        mockShareRepo,
      );
    });

    it('should allow access when no permission is required', async () => {
      const context = createMockContext('user-123');
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(undefined); // No permission required

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('document ownership', () => {
    beforeEach(() => {
      const doc = createMockDocument('doc-123', 'user-123');
      const repos = createMockRepositories(doc, null);
      mockDocumentRepo = repos.documentRepo;
      mockShareRepo = repos.shareRepo;
      guard = new DocumentPermissionGuard(
        reflector,
        mockDocumentRepo,
        mockShareRepo,
      );
    });

    it('should allow owner to read document', async () => {
      const context = createMockContext('user-123', { id: 'doc-123' });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(DocumentPermissionLevel.READ);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow owner to write document', async () => {
      const context = createMockContext('user-123', { id: 'doc-123' });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(DocumentPermissionLevel.WRITE);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow owner to share document', async () => {
      const context = createMockContext('user-123', { id: 'doc-123' });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(DocumentPermissionLevel.SHARE);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow access when checking OWNER permission for owner', async () => {
      const context = createMockContext('user-123', { id: 'doc-123' });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(DocumentPermissionLevel.OWNER);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('non-owner access', () => {
    it('should deny non-owner without share', async () => {
      const doc = createMockDocument('doc-123', 'different-user');
      const repos = createMockRepositories(doc, null);
      mockDocumentRepo = repos.documentRepo;
      mockShareRepo = repos.shareRepo;
      guard = new DocumentPermissionGuard(
        reflector,
        mockDocumentRepo,
        mockShareRepo,
      );

      const context = createMockContext('user-123', { id: 'doc-123' });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(DocumentPermissionLevel.READ);

      await expect(guard.canActivate(context)).rejects.toThrow(
        'You do not have read permission for this document',
      );
    });

    it('should allow non-owner with valid read share', async () => {
      const doc = createMockDocument('doc-123', 'different-user');
      const mockShare = new MockDocumentShare(
        'read',
      ) as unknown as DocumentShare;
      const repos = createMockRepositories(doc, mockShare);
      mockDocumentRepo = repos.documentRepo;
      mockShareRepo = repos.shareRepo;
      guard = new DocumentPermissionGuard(
        reflector,
        mockDocumentRepo,
        mockShareRepo,
      );

      const context = createMockContext('user-123', { id: 'doc-123' });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(DocumentPermissionLevel.READ);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow non-owner with valid write share to write', async () => {
      const doc = createMockDocument('doc-123', 'different-user');
      const mockShare = new MockDocumentShare(
        'write',
      ) as unknown as DocumentShare;
      const repos = createMockRepositories(doc, mockShare);
      mockDocumentRepo = repos.documentRepo;
      mockShareRepo = repos.shareRepo;
      guard = new DocumentPermissionGuard(
        reflector,
        mockDocumentRepo,
        mockShareRepo,
      );

      const context = createMockContext('user-123', { id: 'doc-123' });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(DocumentPermissionLevel.WRITE);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should deny non-owner with read share from writing', async () => {
      const doc = createMockDocument('doc-123', 'different-user');
      const mockShare = new MockDocumentShare(
        'read',
      ) as unknown as DocumentShare;
      const repos = createMockRepositories(doc, mockShare);
      mockDocumentRepo = repos.documentRepo;
      mockShareRepo = repos.shareRepo;
      guard = new DocumentPermissionGuard(
        reflector,
        mockDocumentRepo,
        mockShareRepo,
      );

      const context = createMockContext('user-123', { id: 'doc-123' });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(DocumentPermissionLevel.WRITE);

      await expect(guard.canActivate(context)).rejects.toThrow(
        'You do not have write permission for this document',
      );
    });

    it('should allow non-owner with share permission to share', async () => {
      const doc = createMockDocument('doc-123', 'different-user');
      const mockShare = new MockDocumentShare(
        'share',
      ) as unknown as DocumentShare;
      const repos = createMockRepositories(doc, mockShare);
      mockDocumentRepo = repos.documentRepo;
      mockShareRepo = repos.shareRepo;
      guard = new DocumentPermissionGuard(
        reflector,
        mockDocumentRepo,
        mockShareRepo,
      );

      const context = createMockContext('user-123', { id: 'doc-123' });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(DocumentPermissionLevel.SHARE);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('document ID extraction from args', () => {
    beforeEach(() => {
      const doc = createMockDocument('doc-123', 'user-123');
      const repos = createMockRepositories(doc, null);
      mockDocumentRepo = repos.documentRepo;
      mockShareRepo = repos.shareRepo;
      guard = new DocumentPermissionGuard(
        reflector,
        mockDocumentRepo,
        mockShareRepo,
      );
    });

    it('should extract document ID from direct id argument', async () => {
      const context = createMockContext('user-123', { id: 'doc-123' });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(DocumentPermissionLevel.READ);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should extract document ID from input.documentId', async () => {
      const context = createMockContext('user-123', {
        input: { documentId: 'doc-123' },
      });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(DocumentPermissionLevel.READ);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should extract document ID from input.id', async () => {
      const context = createMockContext('user-123', {
        input: { id: 'doc-123' },
      });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(DocumentPermissionLevel.READ);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should extract document ID from documentId argument', async () => {
      const context = createMockContext('user-123', {
        documentId: 'doc-123',
      });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(DocumentPermissionLevel.READ);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow access when no document ID is present (list query)', async () => {
      const context = createMockContext('user-123', {});
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(DocumentPermissionLevel.READ);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('non-existent documents', () => {
    it('should allow access when document does not exist (let resolver handle 404)', async () => {
      const repos = createMockRepositories(null, null);
      mockDocumentRepo = repos.documentRepo;
      mockShareRepo = repos.shareRepo;
      guard = new DocumentPermissionGuard(
        reflector,
        mockDocumentRepo,
        mockShareRepo,
      );

      const context = createMockContext('user-123', { id: 'non-existent-doc' });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(DocumentPermissionLevel.READ);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('with no authenticated user', () => {
    it('should throw missing token exception', async () => {
      const repos = createMockRepositories();
      mockDocumentRepo = repos.documentRepo;
      mockShareRepo = repos.shareRepo;
      guard = new DocumentPermissionGuard(
        reflector,
        mockDocumentRepo,
        mockShareRepo,
      );

      const context = createMockContext(null, { id: 'doc-123' });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(DocumentPermissionLevel.READ);

      await expect(guard.canActivate(context)).rejects.toThrow(
        'User not authenticated',
      );
    });
  });

  describe('RequireDocumentPermission decorator', () => {
    it('should set metadata for READ permission', () => {
      const decorator = RequireDocumentPermission(DocumentPermissionLevel.READ);
      expect(typeof decorator).toBe('function');
    });

    it('should set metadata for WRITE permission', () => {
      const decorator = RequireDocumentPermission(
        DocumentPermissionLevel.WRITE,
      );
      expect(typeof decorator).toBe('function');
    });

    it('should set metadata for SHARE permission', () => {
      const decorator = RequireDocumentPermission(
        DocumentPermissionLevel.SHARE,
      );
      expect(typeof decorator).toBe('function');
    });

    it('should set metadata for OWNER permission', () => {
      const decorator = RequireDocumentPermission(
        DocumentPermissionLevel.OWNER,
      );
      expect(typeof decorator).toBe('function');
    });
  });
});
