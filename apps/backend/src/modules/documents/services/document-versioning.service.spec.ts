import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentVersioningService } from './document-versioning.service';
import { DocumentVersion } from '../entities/document-version.entity';
import {
  LegalDocument,
  DocumentStatus,
  DocumentType,
} from '../entities/legal-document.entity';
import { NotFoundException } from '@nestjs/common';

describe('DocumentVersioningService', () => {
  let service: DocumentVersioningService;
  let versionRepository: Repository<DocumentVersion>;
  let documentRepository: Repository<LegalDocument>;

  const mockDocument: Partial<LegalDocument> = {
    id: 'doc-123',
    sessionId: 'session-123',
    title: 'Test Document',
    type: DocumentType.CONTRACT,
    status: DocumentStatus.DRAFT,
    contentRaw: 'Initial content',
    metadata: null,
  };

  const mockVersion1: Partial<DocumentVersion> = {
    id: 'ver-1',
    documentId: 'doc-123',
    sessionId: 'session-123',
    versionNumber: 1,
    contentSnapshot: 'Initial content',
    changeDescription: 'Initial version',
    authorUserId: 'user-123',
    createdAt: new Date(),
  };

  const mockVersion2: Partial<DocumentVersion> = {
    id: 'ver-2',
    documentId: 'doc-123',
    sessionId: 'session-123',
    versionNumber: 2,
    contentSnapshot: 'Updated content',
    changeDescription: '+1 line, -1 line',
    authorUserId: 'user-123',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentVersioningService,
        {
          provide: getRepositoryToken(DocumentVersion),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LegalDocument),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentVersioningService>(DocumentVersioningService);
    versionRepository = module.get<Repository<DocumentVersion>>(
      getRepositoryToken(DocumentVersion),
    );
    documentRepository = module.get<Repository<LegalDocument>>(
      getRepositoryToken(LegalDocument),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVersion', () => {
    it('should create a version with sequential version number', async () => {
      jest
        .spyOn(documentRepository, 'findOne')
        .mockResolvedValue(mockDocument as LegalDocument);
      jest
        .spyOn(versionRepository, 'findOne')
        .mockResolvedValue(mockVersion1 as DocumentVersion);
      jest.spyOn(versionRepository, 'create').mockReturnValue({
        ...mockVersion2,
        validate: jest.fn(),
      } as any);
      jest
        .spyOn(versionRepository, 'save')
        .mockResolvedValue(mockVersion2 as DocumentVersion);

      const result = await service.createVersion(
        'doc-123',
        'session-123',
        'Updated content',
        'Test update',
        'user-123',
      );

      expect(result).toBeDefined();
      expect(documentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'doc-123' },
      });
      expect(versionRepository.findOne).toHaveBeenCalledWith({
        where: { documentId: 'doc-123' },
        order: { versionNumber: 'DESC' },
      });
      expect(versionRepository.save).toHaveBeenCalled();
    });

    it('should create version 1 when no previous versions exist', async () => {
      jest
        .spyOn(documentRepository, 'findOne')
        .mockResolvedValue(mockDocument as LegalDocument);
      jest.spyOn(versionRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(versionRepository, 'create').mockReturnValue({
        ...mockVersion1,
        validate: jest.fn(),
      } as any);
      jest
        .spyOn(versionRepository, 'save')
        .mockResolvedValue(mockVersion1 as DocumentVersion);

      const result = await service.createVersion(
        'doc-123',
        'session-123',
        'Initial content',
        'Initial version',
        'user-123',
      );

      expect(result).toBeDefined();
      expect(versionRepository.create).toHaveBeenCalledWith({
        documentId: 'doc-123',
        sessionId: 'session-123',
        versionNumber: 1,
        contentSnapshot: 'Initial content',
        changeDescription: 'Initial version',
        authorUserId: 'user-123',
      });
    });

    it('should throw NotFoundException when document does not exist', async () => {
      jest.spyOn(documentRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.createVersion(
          'doc-999',
          'session-123',
          'Content',
          'Description',
          'user-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createVersionOnUpdate', () => {
    it('should create a version when content changes', async () => {
      jest
        .spyOn(versionRepository, 'findOne')
        .mockResolvedValue(mockVersion1 as DocumentVersion);
      jest
        .spyOn(documentRepository, 'findOne')
        .mockResolvedValue(mockDocument as LegalDocument);
      jest.spyOn(versionRepository, 'create').mockReturnValue({
        ...mockVersion2,
        validate: jest.fn(),
      } as any);
      jest
        .spyOn(versionRepository, 'save')
        .mockResolvedValue(mockVersion2 as DocumentVersion);

      const result = await service.createVersionOnUpdate(
        'doc-123',
        'session-123',
        'Updated content',
        'user-123',
      );

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(versionRepository.save).toHaveBeenCalled();
    });

    it('should not create a version when content is unchanged', async () => {
      jest
        .spyOn(versionRepository, 'findOne')
        .mockResolvedValue(mockVersion1 as DocumentVersion);

      const result = await service.createVersionOnUpdate(
        'doc-123',
        'session-123',
        'Initial content', // Same as mockVersion1
        'user-123',
      );

      expect(result).toBeNull();
      expect(versionRepository.save).not.toHaveBeenCalled();
    });

    it('should create initial version when no versions exist', async () => {
      jest.spyOn(versionRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(documentRepository, 'findOne')
        .mockResolvedValue(mockDocument as LegalDocument);
      jest.spyOn(versionRepository, 'create').mockReturnValue({
        ...mockVersion1,
        validate: jest.fn(),
      } as any);
      jest
        .spyOn(versionRepository, 'save')
        .mockResolvedValue(mockVersion1 as DocumentVersion);

      const result = await service.createVersionOnUpdate(
        'doc-123',
        'session-123',
        'Initial content',
        'user-123',
      );

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });
  });

  describe('getVersionHistory', () => {
    it('should return all versions for a document ordered descending', async () => {
      jest
        .spyOn(versionRepository, 'find')
        .mockResolvedValue([mockVersion2, mockVersion1] as DocumentVersion[]);

      const result = await service.getVersionHistory('doc-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockVersion2);
      expect(result[1]).toEqual(mockVersion1);
      expect(versionRepository.find).toHaveBeenCalledWith({
        where: { documentId: 'doc-123' },
        order: { versionNumber: 'DESC' },
      });
    });
  });

  describe('getVersion', () => {
    it('should return a specific version', async () => {
      jest
        .spyOn(versionRepository, 'findOne')
        .mockResolvedValue(mockVersion1 as DocumentVersion);

      const result = await service.getVersion('doc-123', 1);

      expect(result).toEqual(mockVersion1);
      expect(versionRepository.findOne).toHaveBeenCalledWith({
        where: { documentId: 'doc-123', versionNumber: 1 },
      });
    });

    it('should throw NotFoundException when version does not exist', async () => {
      jest.spyOn(versionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getVersion('doc-123', 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('rollbackToVersion', () => {
    it('should rollback document and create new version', async () => {
      jest
        .spyOn(versionRepository, 'findOne')
        .mockResolvedValueOnce(mockVersion1 as DocumentVersion) // getVersion call
        .mockResolvedValueOnce(mockVersion2 as DocumentVersion); // latest version for createVersion
      jest
        .spyOn(documentRepository, 'findOne')
        .mockResolvedValue(mockDocument as LegalDocument);
      jest.spyOn(documentRepository, 'save').mockResolvedValue({
        ...mockDocument,
        contentRaw: 'Initial content',
      } as LegalDocument);
      jest.spyOn(versionRepository, 'create').mockReturnValue({
        id: 'ver-3',
        documentId: 'doc-123',
        versionNumber: 3,
        contentSnapshot: 'Initial content',
        changeDescription: 'Rolled back to version 1',
        validate: jest.fn(),
      } as any);
      jest.spyOn(versionRepository, 'save').mockResolvedValue({
        id: 'ver-3',
        versionNumber: 3,
      } as DocumentVersion);

      const result = await service.rollbackToVersion(
        'doc-123',
        1,
        'session-123',
        'user-123',
      );

      expect(result).toBeDefined();
      expect(result.document).toBeDefined();
      expect(result.version).toBeDefined();
      expect(result.document.contentRaw).toBe('Initial content');
    });

    it('should throw NotFoundException when target version does not exist', async () => {
      jest.spyOn(versionRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.rollbackToVersion('doc-123', 999, 'session-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when document does not exist', async () => {
      jest
        .spyOn(versionRepository, 'findOne')
        .mockResolvedValue(mockVersion1 as DocumentVersion);
      jest.spyOn(documentRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.rollbackToVersion('doc-999', 1, 'session-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLatestVersion', () => {
    it('should return the latest version', async () => {
      jest
        .spyOn(versionRepository, 'findOne')
        .mockResolvedValue(mockVersion2 as DocumentVersion);

      const result = await service.getLatestVersion('doc-123');

      expect(result).toEqual(mockVersion2);
      expect(versionRepository.findOne).toHaveBeenCalledWith({
        where: { documentId: 'doc-123' },
        order: { versionNumber: 'DESC' },
      });
    });

    it('should return null when no versions exist', async () => {
      jest.spyOn(versionRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getLatestVersion('doc-123');

      expect(result).toBeNull();
    });
  });

  describe('countVersions', () => {
    it('should return the total number of versions', async () => {
      jest.spyOn(versionRepository, 'count').mockResolvedValue(2);

      const result = await service.countVersions('doc-123');

      expect(result).toBe(2);
      expect(versionRepository.count).toHaveBeenCalledWith({
        where: { documentId: 'doc-123' },
      });
    });

    it('should return 0 when no versions exist', async () => {
      jest.spyOn(versionRepository, 'count').mockResolvedValue(0);

      const result = await service.countVersions('doc-123');

      expect(result).toBe(0);
    });
  });

  describe('getDiff', () => {
    it('should calculate diff between two versions', async () => {
      jest
        .spyOn(versionRepository, 'findOne')
        .mockResolvedValueOnce(mockVersion1 as DocumentVersion)
        .mockResolvedValueOnce(mockVersion2 as DocumentVersion);

      const result = await service.getDiff('doc-123', 1, 2);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
