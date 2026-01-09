import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './services/documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import {
  DocumentType,
  DocumentStatus,
  LegalDocument,
} from './entities/legal-document.entity';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let service: DocumentsService;

  const mockDocumentsService = {
    create: jest.fn(),
    startGeneration: jest.fn(),
    findByIdOrFail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        {
          provide: DocumentsService,
          useValue: mockDocumentsService,
        },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
    service = module.get<DocumentsService>(DocumentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generate', () => {
    it('should create and start generation of a document', async () => {
      const dto: CreateDocumentDto = {
        sessionId: 'session-123',
        title: 'Test Doc',
        type: DocumentType.LAWSUIT,
      };

      const createdDoc = {
        id: 'doc-123',
        ...dto,
        status: DocumentStatus.DRAFT,
      } as LegalDocument;

      const generatingDoc = {
        ...createdDoc,
        status: DocumentStatus.GENERATING,
      } as LegalDocument;

      mockDocumentsService.create.mockResolvedValue(createdDoc);
      mockDocumentsService.startGeneration.mockResolvedValue(generatingDoc);

      const result = await controller.generate(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(service.startGeneration).toHaveBeenCalledWith('doc-123');
      expect(result).toEqual(generatingDoc);
    });
  });

  describe('findOne', () => {
    it('should return a document', async () => {
      const doc = { id: 'doc-123', title: 'Test' } as LegalDocument;
      mockDocumentsService.findByIdOrFail.mockResolvedValue(doc);

      const result = await controller.findOne('doc-123');

      expect(service.findByIdOrFail).toHaveBeenCalledWith('doc-123');
      expect(result).toEqual(doc);
    });
  });
});
