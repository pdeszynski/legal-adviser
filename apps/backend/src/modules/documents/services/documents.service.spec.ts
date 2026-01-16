import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import {
  LegalDocument,
  DocumentType,
  DocumentStatus,
} from '../entities/legal-document.entity';
import {
  DocumentCreatedEvent,
  DocumentUpdatedEvent,
  DocumentDeletedEvent,
  DocumentGenerationStartedEvent,
  DocumentGenerationCompletedEvent,
  DocumentGenerationFailedEvent,
} from '../../../shared/events/examples/document.events';
import { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';
import { GraphQLPubSubService } from '../../../shared/streaming';

describe('DocumentsService', () => {
  let service: DocumentsService;

  const mockDocumentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockGraphQLPubSubService = {
    publishDocumentStatusChange: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getRepositoryToken(LegalDocument),
          useValue: mockDocumentRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: GraphQLPubSubService,
          useValue: mockGraphQLPubSubService,
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a document and emit DocumentCreatedEvent', async () => {
      const createDto = {
        sessionId: 'session-123',
        title: 'Test Document',
        type: DocumentType.LAWSUIT,
        metadata: { defendantName: 'John Doe' },
      };

      const createdDocument = {
        id: 'doc-123',
        ...createDto,
        status: DocumentStatus.DRAFT,
        contentRaw: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDocumentRepository.create.mockReturnValue(createdDocument);
      mockDocumentRepository.save.mockResolvedValue(createdDocument);

      const result = await service.create(createDto);

      expect(mockDocumentRepository.create).toHaveBeenCalledWith({
        sessionId: createDto.sessionId,
        title: createDto.title,
        type: createDto.type,
        status: DocumentStatus.DRAFT,
        contentRaw: null,
        metadata: createDto.metadata,
      });
      expect(mockDocumentRepository.save).toHaveBeenCalledWith(createdDocument);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        EVENT_PATTERNS.DOCUMENT.CREATED,
        expect.any(DocumentCreatedEvent),
      );
      expect(result).toEqual(createdDocument);
    });

    it('should use default type OTHER when not provided', async () => {
      const createDto = {
        sessionId: 'session-123',
        title: 'Test Document',
      };

      const createdDocument = {
        id: 'doc-123',
        ...createDto,
        type: DocumentType.OTHER,
        status: DocumentStatus.DRAFT,
        contentRaw: null,
        metadata: null,
        createdAt: new Date(),
      };

      mockDocumentRepository.create.mockReturnValue(createdDocument);
      mockDocumentRepository.save.mockResolvedValue(createdDocument);

      await service.create(createDto);

      expect(mockDocumentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: DocumentType.OTHER,
          metadata: null,
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return a document by id', async () => {
      const document = {
        id: 'doc-123',
        title: 'Test Document',
      };

      mockDocumentRepository.findOne.mockResolvedValue(document);

      const result = await service.findById('doc-123');

      expect(mockDocumentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'doc-123' },
        relations: ['session'],
      });
      expect(result).toEqual(document);
    });

    it('should return null if document not found', async () => {
      mockDocumentRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByIdOrFail', () => {
    it('should return a document by id', async () => {
      const document = {
        id: 'doc-123',
        title: 'Test Document',
      };

      mockDocumentRepository.findOne.mockResolvedValue(document);

      const result = await service.findByIdOrFail('doc-123');

      expect(result).toEqual(document);
    });

    it('should throw NotFoundException if document not found', async () => {
      mockDocumentRepository.findOne.mockResolvedValue(null);

      await expect(service.findByIdOrFail('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all documents', async () => {
      const documents = [
        { id: 'doc-1', title: 'Doc 1' },
        { id: 'doc-2', title: 'Doc 2' },
      ];

      mockDocumentRepository.find.mockResolvedValue(documents);

      const result = await service.findAll();

      expect(mockDocumentRepository.find).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC' },
        take: undefined,
        skip: undefined,
        relations: ['session'],
      });
      expect(result).toEqual(documents);
    });

    it('should filter documents by options', async () => {
      const documents = [{ id: 'doc-1', title: 'Doc 1' }];

      mockDocumentRepository.find.mockResolvedValue(documents);

      await service.findAll({
        sessionId: 'session-123',
        type: DocumentType.LAWSUIT,
        status: DocumentStatus.COMPLETED,
        limit: 10,
        offset: 5,
      });

      expect(mockDocumentRepository.find).toHaveBeenCalledWith({
        where: {
          sessionId: 'session-123',
          type: DocumentType.LAWSUIT,
          status: DocumentStatus.COMPLETED,
        },
        order: { createdAt: 'DESC' },
        take: 10,
        skip: 5,
        relations: ['session'],
      });
    });
  });

  describe('findBySessionId', () => {
    it('should return documents for a session', async () => {
      const documents = [{ id: 'doc-1', sessionId: 'session-123' }];

      mockDocumentRepository.find.mockResolvedValue(documents);

      const result = await service.findBySessionId('session-123');

      expect(mockDocumentRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sessionId: 'session-123' },
        }),
      );
      expect(result).toEqual(documents);
    });
  });

  describe('update', () => {
    it('should update a document and emit DocumentUpdatedEvent', async () => {
      const existingDocument = {
        id: 'doc-123',
        title: 'Old Title',
        type: DocumentType.OTHER,
        contentRaw: null,
        metadata: null,
      };

      const updatedDocument = {
        ...existingDocument,
        title: 'New Title',
        type: DocumentType.LAWSUIT,
      };

      mockDocumentRepository.findOne.mockResolvedValue(existingDocument);
      mockDocumentRepository.save.mockResolvedValue(updatedDocument);

      const result = await service.update('doc-123', {
        title: 'New Title',
        type: DocumentType.LAWSUIT,
      });

      expect(mockDocumentRepository.save).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        EVENT_PATTERNS.DOCUMENT.UPDATED,
        expect.any(DocumentUpdatedEvent),
      );
      expect(result.title).toBe('New Title');
      expect(result.type).toBe(DocumentType.LAWSUIT);
    });

    it('should throw NotFoundException if document not found', async () => {
      mockDocumentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { title: 'New Title' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not emit event if no fields changed', async () => {
      const existingDocument = {
        id: 'doc-123',
        title: 'Test Title',
        type: DocumentType.OTHER,
        contentRaw: null,
        metadata: null,
      };

      mockDocumentRepository.findOne.mockResolvedValue(existingDocument);
      mockDocumentRepository.save.mockResolvedValue(existingDocument);

      await service.update('doc-123', {
        title: 'Test Title', // same value
      });

      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a document and emit DocumentDeletedEvent', async () => {
      const document = {
        id: 'doc-123',
        sessionId: 'session-123',
      };

      mockDocumentRepository.findOne.mockResolvedValue(document);
      mockDocumentRepository.remove.mockResolvedValue(document);

      await service.delete('doc-123');

      expect(mockDocumentRepository.remove).toHaveBeenCalledWith(document);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        EVENT_PATTERNS.DOCUMENT.DELETED,
        expect.any(DocumentDeletedEvent),
      );
    });

    it('should throw NotFoundException if document not found', async () => {
      mockDocumentRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('startGeneration', () => {
    it('should start document generation and emit event', async () => {
      const document = new LegalDocument();
      document.id = 'doc-123';
      document.sessionId = 'session-123';
      document.status = DocumentStatus.DRAFT;
      document.type = DocumentType.LAWSUIT;

      const updatedDocument = {
        ...document,
        status: DocumentStatus.GENERATING,
      };

      mockDocumentRepository.findOne.mockResolvedValue(document);
      mockDocumentRepository.save.mockResolvedValue(updatedDocument);

      const result = await service.startGeneration('doc-123');

      expect(document.status).toBe(DocumentStatus.GENERATING);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        EVENT_PATTERNS.DOCUMENT.GENERATION_STARTED,
        expect.any(DocumentGenerationStartedEvent),
      );
      expect(result.status).toBe(DocumentStatus.GENERATING);
    });

    it('should throw if document is already generating', async () => {
      const document = new LegalDocument();
      document.id = 'doc-123';
      document.status = DocumentStatus.GENERATING;

      mockDocumentRepository.findOne.mockResolvedValue(document);

      await expect(service.startGeneration('doc-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if document is already completed', async () => {
      const document = new LegalDocument();
      document.id = 'doc-123';
      document.status = DocumentStatus.COMPLETED;

      mockDocumentRepository.findOne.mockResolvedValue(document);

      await expect(service.startGeneration('doc-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('completeGeneration', () => {
    it('should complete document generation and emit event', async () => {
      const document = new LegalDocument();
      document.id = 'doc-123';
      document.sessionId = 'session-123';
      document.status = DocumentStatus.GENERATING;
      document.type = DocumentType.LAWSUIT;
      document.contentRaw = null;

      const content = 'Generated legal document content...';

      mockDocumentRepository.findOne.mockResolvedValue(document);
      mockDocumentRepository.save.mockImplementation((doc) =>
        Promise.resolve({
          ...doc,
          status: DocumentStatus.COMPLETED,
        }),
      );

      const result = await service.completeGeneration('doc-123', content);

      expect(document.contentRaw).toBe(content);
      expect(document.status).toBe(DocumentStatus.COMPLETED);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        EVENT_PATTERNS.DOCUMENT.GENERATION_COMPLETED,
        expect.any(DocumentGenerationCompletedEvent),
      );
      expect(result.status).toBe(DocumentStatus.COMPLETED);
    });

    it('should throw if document is not generating', async () => {
      const document = new LegalDocument();
      document.id = 'doc-123';
      document.status = DocumentStatus.DRAFT;

      mockDocumentRepository.findOne.mockResolvedValue(document);

      await expect(
        service.completeGeneration('doc-123', 'content'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('failGeneration', () => {
    it('should fail document generation and emit event', async () => {
      const document = new LegalDocument();
      document.id = 'doc-123';
      document.sessionId = 'session-123';
      document.status = DocumentStatus.GENERATING;

      const errorMessage = 'AI engine timeout';

      mockDocumentRepository.findOne.mockResolvedValue(document);
      mockDocumentRepository.save.mockImplementation((doc) =>
        Promise.resolve({ ...doc }),
      );

      const result = await service.failGeneration('doc-123', errorMessage);

      expect(document.status).toBe(DocumentStatus.FAILED);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        EVENT_PATTERNS.DOCUMENT.GENERATION_FAILED,
        expect.any(DocumentGenerationFailedEvent),
      );
      expect(result.status).toBe(DocumentStatus.FAILED);
    });

    it('should throw if document is not generating', async () => {
      const document = new LegalDocument();
      document.id = 'doc-123';
      document.status = DocumentStatus.DRAFT;

      mockDocumentRepository.findOne.mockResolvedValue(document);

      await expect(service.failGeneration('doc-123', 'error')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('count', () => {
    it('should count documents with filters', async () => {
      mockDocumentRepository.count.mockResolvedValue(5);

      const result = await service.count({
        sessionId: 'session-123',
        type: DocumentType.LAWSUIT,
      });

      expect(mockDocumentRepository.count).toHaveBeenCalledWith({
        where: {
          sessionId: 'session-123',
          type: DocumentType.LAWSUIT,
        },
      });
      expect(result).toBe(5);
    });

    it('should count all documents when no filters', async () => {
      mockDocumentRepository.count.mockResolvedValue(10);

      const result = await service.count();

      expect(mockDocumentRepository.count).toHaveBeenCalledWith({
        where: {},
      });
      expect(result).toBe(10);
    });
  });
});
