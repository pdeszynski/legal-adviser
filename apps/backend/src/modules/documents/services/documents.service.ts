import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
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
import { GraphQLPubSubService } from '../../../shared/streaming';
import { DocumentVersioningService } from './document-versioning.service';

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
    private readonly graphqlPubSub: GraphQLPubSubService,
    @Inject(forwardRef(() => DocumentVersioningService))
    private readonly versioningService: DocumentVersioningService,
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
   * Automatically creates a version if content is updated
   */
  async update(id: string, dto: UpdateDocumentDto, authorUserId?: string): Promise<LegalDocument> {
    const document = await this.findByIdOrFail(id);

    const updatedFields: string[] = [];
    let contentChanged = false;

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
      contentChanged = true;
    }

    if (dto.metadata !== undefined) {
      document.metadata = dto.metadata;
      updatedFields.push('metadata');
    }

    const savedDocument = await this.documentRepository.save(document);

    // Create version if content changed
    if (contentChanged && dto.contentRaw) {
      await this.versioningService.createVersionOnUpdate(
        savedDocument.id,
        savedDocument.sessionId,
        dto.contentRaw,
        authorUserId,
      );
    }

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

    const previousStatus = document.status;
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

    // Emit GraphQL subscription event for status change: DRAFT -> GENERATING
    await this.graphqlPubSub.publishDocumentStatusChange({
      documentId: savedDocument.id,
      sessionId: savedDocument.sessionId,
      previousStatus,
      newStatus: savedDocument.status,
      timestamp: new Date(),
      message: 'Document generation started',
    });

    return savedDocument;
  }

  /**
   * Complete document generation with content
   * Automatically creates a version for the generated content
   */
  async completeGeneration(
    id: string,
    content: string,
  ): Promise<LegalDocument> {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: ['session', 'session.user'],
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (!document.isGenerating()) {
      throw new BadRequestException(
        'Document must be in GENERATING status to complete',
      );
    }

    const previousStatus = document.status;
    document.contentRaw = content;
    document.markCompleted();

    const savedDocument = await this.documentRepository.save(document);

    // Create version for the generated content
    await this.versioningService.createVersionOnUpdate(
      savedDocument.id,
      savedDocument.sessionId,
      content,
      undefined, // No specific author for AI-generated content
    );

    // Get user information for email notification
    const userEmail = document.session?.user?.email ?? undefined;
    const firstName = document.session?.user?.firstName ?? undefined;

    // Emit domain event
    this.eventEmitter.emit(
      EVENT_PATTERNS.DOCUMENT.GENERATION_COMPLETED,
      new DocumentGenerationCompletedEvent(
        savedDocument.id,
        savedDocument.sessionId,
        savedDocument.type,
        content.length,
        userEmail,
        firstName,
      ),
    );

    // Emit GraphQL subscription event for status change: GENERATING -> COMPLETED
    await this.graphqlPubSub.publishDocumentStatusChange({
      documentId: savedDocument.id,
      sessionId: savedDocument.sessionId,
      previousStatus,
      newStatus: savedDocument.status,
      timestamp: new Date(),
      message: 'Document generation completed successfully',
    });

    return savedDocument;
  }

  /**
   * Fail document generation with error message
   */
  async failGeneration(
    id: string,
    errorMessage: string,
  ): Promise<LegalDocument> {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: ['session', 'session.user'],
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (!document.isGenerating()) {
      throw new BadRequestException(
        'Document must be in GENERATING status to fail',
      );
    }

    const previousStatus = document.status;
    document.markFailed();
    const savedDocument = await this.documentRepository.save(document);

    // Get user information for email notification
    const userEmail = document.session?.user?.email ?? undefined;
    const firstName = document.session?.user?.firstName ?? undefined;

    // Emit domain event
    this.eventEmitter.emit(
      EVENT_PATTERNS.DOCUMENT.GENERATION_FAILED,
      new DocumentGenerationFailedEvent(
        savedDocument.id,
        savedDocument.sessionId,
        errorMessage,
        userEmail,
        firstName,
      ),
    );

    // Emit GraphQL subscription event for status change: GENERATING -> FAILED
    await this.graphqlPubSub.publishDocumentStatusChange({
      documentId: savedDocument.id,
      sessionId: savedDocument.sessionId,
      previousStatus,
      newStatus: savedDocument.status,
      timestamp: new Date(),
      message: 'Document generation failed',
      error: errorMessage,
    });

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
