import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  LegalDocument,
  DocumentType,
  DocumentStatus,
  DocumentMetadata,
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

/**
 * Create Document DTO
 */
export interface CreateDocumentDto {
  sessionId: string;
  title: string;
  type?: DocumentType;
  metadata?: DocumentMetadata;
}

/**
 * Update Document DTO
 */
export interface UpdateDocumentDto {
  title?: string;
  type?: DocumentType;
  contentRaw?: string;
  metadata?: DocumentMetadata;
}

/**
 * Document Query Options
 */
export interface DocumentQueryOptions {
  sessionId?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  limit?: number;
  offset?: number;
}

/**
 * Documents Service
 *
 * Provides CRUD operations for LegalDocument entities.
 * Emits domain events for inter-module communication.
 *
 * Part of User Story 1: AI Document Generation.
 */
@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(LegalDocument)
    private readonly documentRepository: Repository<LegalDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new legal document
   */
  async create(dto: CreateDocumentDto): Promise<LegalDocument> {
    const document = this.documentRepository.create({
      sessionId: dto.sessionId,
      title: dto.title,
      type: dto.type ?? DocumentType.OTHER,
      status: DocumentStatus.DRAFT,
      contentRaw: null,
      metadata: dto.metadata ?? null,
    });

    const savedDocument = await this.documentRepository.save(document);

    // Emit domain event
    this.eventEmitter.emit(
      EVENT_PATTERNS.DOCUMENT.CREATED,
      new DocumentCreatedEvent(
        savedDocument.id,
        savedDocument.sessionId,
        savedDocument.title,
        savedDocument.type,
        savedDocument.createdAt,
      ),
    );

    return savedDocument;
  }

  /**
   * Find a document by ID
   */
  async findById(id: string): Promise<LegalDocument | null> {
    return this.documentRepository.findOne({
      where: { id },
      relations: ['session'],
    });
  }

  /**
   * Find a document by ID or throw NotFoundException
   */
  async findByIdOrFail(id: string): Promise<LegalDocument> {
    const document = await this.findById(id);
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return document;
  }

  /**
   * Find all documents with optional filtering
   */
  async findAll(options?: DocumentQueryOptions): Promise<LegalDocument[]> {
    const where: FindOptionsWhere<LegalDocument> = {};

    if (options?.sessionId) {
      where.sessionId = options.sessionId;
    }
    if (options?.type) {
      where.type = options.type;
    }
    if (options?.status) {
      where.status = options.status;
    }

    return this.documentRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: options?.limit,
      skip: options?.offset,
      relations: ['session'],
    });
  }

  /**
   * Find documents by session ID
   */
  async findBySessionId(sessionId: string): Promise<LegalDocument[]> {
    return this.findAll({ sessionId });
  }

  /**
   * Update a document
   */
  async update(id: string, dto: UpdateDocumentDto): Promise<LegalDocument> {
    const document = await this.findByIdOrFail(id);

    const updatedFields: string[] = [];

    if (dto.title !== undefined && document.title !== dto.title) {
      document.title = dto.title;
      updatedFields.push('title');
    }

    if (dto.type !== undefined && document.type !== dto.type) {
      document.type = dto.type;
      updatedFields.push('type');
    }

    if (
      dto.contentRaw !== undefined &&
      document.contentRaw !== dto.contentRaw
    ) {
      document.contentRaw = dto.contentRaw;
      updatedFields.push('contentRaw');
    }

    if (dto.metadata !== undefined) {
      document.metadata = dto.metadata;
      updatedFields.push('metadata');
    }

    const savedDocument = await this.documentRepository.save(document);

    // Emit domain event if any fields were updated
    if (updatedFields.length > 0) {
      this.eventEmitter.emit(
        EVENT_PATTERNS.DOCUMENT.UPDATED,
        new DocumentUpdatedEvent(savedDocument.id, updatedFields),
      );
    }

    return savedDocument;
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    const document = await this.findByIdOrFail(id);

    const sessionId = document.sessionId;

    await this.documentRepository.remove(document);

    // Emit domain event
    this.eventEmitter.emit(
      EVENT_PATTERNS.DOCUMENT.DELETED,
      new DocumentDeletedEvent(id, sessionId),
    );
  }

  /**
   * Start document generation (AI processing)
   */
  async startGeneration(id: string): Promise<LegalDocument> {
    const document = await this.findByIdOrFail(id);

    if (document.isGenerating()) {
      throw new BadRequestException('Document is already being generated');
    }

    if (document.isCompleted()) {
      throw new BadRequestException(
        'Document has already been completed. Create a new document to regenerate.',
      );
    }

    document.markGenerating();
    const savedDocument = await this.documentRepository.save(document);

    // Emit domain event
    this.eventEmitter.emit(
      EVENT_PATTERNS.DOCUMENT.GENERATION_STARTED,
      new DocumentGenerationStartedEvent(
        savedDocument.id,
        savedDocument.sessionId,
        savedDocument.type,
      ),
    );

    return savedDocument;
  }

  /**
   * Complete document generation with content
   */
  async completeGeneration(
    id: string,
    content: string,
  ): Promise<LegalDocument> {
    const document = await this.findByIdOrFail(id);

    if (!document.isGenerating()) {
      throw new BadRequestException(
        'Document must be in GENERATING status to complete',
      );
    }

    document.contentRaw = content;
    document.markCompleted();

    const savedDocument = await this.documentRepository.save(document);

    // Emit domain event
    this.eventEmitter.emit(
      EVENT_PATTERNS.DOCUMENT.GENERATION_COMPLETED,
      new DocumentGenerationCompletedEvent(
        savedDocument.id,
        savedDocument.sessionId,
        savedDocument.type,
        content.length,
      ),
    );

    return savedDocument;
  }

  /**
   * Fail document generation with error message
   */
  async failGeneration(
    id: string,
    errorMessage: string,
  ): Promise<LegalDocument> {
    const document = await this.findByIdOrFail(id);

    if (!document.isGenerating()) {
      throw new BadRequestException(
        'Document must be in GENERATING status to fail',
      );
    }

    document.markFailed();
    const savedDocument = await this.documentRepository.save(document);

    // Emit domain event
    this.eventEmitter.emit(
      EVENT_PATTERNS.DOCUMENT.GENERATION_FAILED,
      new DocumentGenerationFailedEvent(
        savedDocument.id,
        savedDocument.sessionId,
        errorMessage,
      ),
    );

    return savedDocument;
  }

  /**
   * Count documents with optional filtering
   */
  async count(
    options?: Omit<DocumentQueryOptions, 'limit' | 'offset'>,
  ): Promise<number> {
    const where: FindOptionsWhere<LegalDocument> = {};

    if (options?.sessionId) {
      where.sessionId = options.sessionId;
    }
    if (options?.type) {
      where.type = options.type;
    }
    if (options?.status) {
      where.status = options.status;
    }

    return this.documentRepository.count({ where });
  }
}
