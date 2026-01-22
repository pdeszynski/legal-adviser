import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere, In } from 'typeorm';
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
import { DocumentShare } from '../entities/document-share.entity';

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
  pdfUrl?: string;
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
 * Search result with relevance score
 */
export interface DocumentSearchResult {
  document: LegalDocument;
  rank: number;
  headline?: string;
}

/**
 * Search options for full-text search
 */
export interface DocumentSearchOptions {
  query: string;
  type?: DocumentType;
  status?: DocumentStatus;
  sessionId?: string;
  startDate?: Date;
  endDate?: Date;
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
    @InjectRepository(DocumentShare)
    private readonly shareRepository: Repository<DocumentShare>,
    private readonly eventEmitter: EventEmitter2,
    private readonly graphqlPubSub: GraphQLPubSubService,
    @Inject(forwardRef(() => DocumentVersioningService))
    private readonly versioningService: DocumentVersioningService,
    private readonly dataSource: DataSource,
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
  async update(
    id: string,
    dto: UpdateDocumentDto,
    authorUserId?: string,
  ): Promise<LegalDocument> {
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

    if (dto.pdfUrl !== undefined && document.pdfUrl !== dto.pdfUrl) {
      document.pdfUrl = dto.pdfUrl;
      updatedFields.push('pdfUrl');
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

  /**
   * Find documents accessible to a user (owned or shared)
   * This method filters the results based on user permissions
   */
  async findAccessibleByUser(
    userId: string,
    options?: DocumentQueryOptions,
  ): Promise<LegalDocument[]> {
    // Get all documents matching the base filters
    const allDocuments = await this.findAll(options);

    // Get document IDs shared with the user
    const shares = await this.shareRepository.find({
      where: { sharedWithUserId: userId },
      select: ['documentId'],
    });

    const sharedDocumentIds = new Set(shares.map((s) => s.documentId));

    // Filter: user owns the document OR it's shared with them
    return allDocuments.filter(
      (doc) => doc.session?.userId === userId || sharedDocumentIds.has(doc.id),
    );
  }

  /**
   * Check if a user has access to a document
   */
  async canUserAccessDocument(
    documentId: string,
    userId: string,
    requiredPermission: 'read' | 'write' | 'share' | 'owner' = 'read',
  ): Promise<boolean> {
    const document = await this.findById(documentId);

    if (!document) {
      return false;
    }

    // Check ownership
    if (document.session?.userId === userId) {
      return true;
    }

    // Check shares for non-owners
    const share = await this.shareRepository.findOne({
      where: {
        documentId,
        sharedWithUserId: userId,
      },
    });

    if (!share || !share.isActive()) {
      return false;
    }

    // Check permission level
    switch (requiredPermission) {
      case 'read':
        return true;
      case 'write':
        return share.canEdit();
      case 'share':
        return share.canShare();
      case 'owner':
        return false;
      default:
        return false;
    }
  }

  /**
   * Full-text search for legal documents
   *
   * Uses PostgreSQL's full-text search with:
   * - to_tsquery for query parsing
   * - ts_rank for relevance scoring
   * - ts_headline for highlighted snippets
   *
   * @param options Search options including query string and filters
   * @returns Array of search results with relevance ranking
   */
  async search(
    options: DocumentSearchOptions,
  ): Promise<DocumentSearchResult[]> {
    const {
      query,
      type,
      status,
      sessionId,
      startDate,
      endDate,
      limit = 20,
      offset = 0,
    } = options;

    // Sanitize the search query for PostgreSQL
    const sanitizedQuery = this.sanitizeSearchQuery(query);

    if (!sanitizedQuery) {
      return [];
    }

    // Build the search query using PostgreSQL full-text search
    let sql = `
      SELECT
        d.*,
        ts_rank(
          COALESCE(d."searchVector", to_tsvector('simple', '')),
          plainto_tsquery('simple', $1)
        ) as rank,
        ts_headline(
          'simple',
          COALESCE(d.title, '') || ' ' || COALESCE(d."contentRaw", ''),
          plainto_tsquery('simple', $1),
          'MaxWords=35, MinWords=15, ShortWord=3, HighlightAll=FALSE, MaxFragments=2, FragmentDelimiter=" ... "'
        ) as headline
      FROM legal_documents d
      WHERE (
        d."searchVector" @@ plainto_tsquery('simple', $1)
        OR d.title ILIKE $2
        OR COALESCE(d."contentRaw", '') ILIKE $2
        OR COALESCE(d.metadata->>'plaintiffName', '') ILIKE $2
        OR COALESCE(d.metadata->>'defendantName', '') ILIKE $2
      )
    `;

    const params: (string | Date | number)[] = [
      sanitizedQuery,
      `%${sanitizedQuery}%`,
    ];
    let paramIndex = 3;

    // Add type filter
    if (type) {
      sql += ` AND d.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    // Add status filter
    if (status) {
      sql += ` AND d.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Add session filter
    if (sessionId) {
      sql += ` AND d."sessionId" = $${paramIndex}`;
      params.push(sessionId);
      paramIndex++;
    }

    // Add date range filters
    if (startDate) {
      sql += ` AND d."createdAt" >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      sql += ` AND d."createdAt" <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    // Order by relevance rank, then by creation date
    sql += ` ORDER BY rank DESC, d."createdAt" DESC`;

    // Add pagination
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    // Execute the raw query
    const results = await this.dataSource.query(sql, params);

    // Map results to DocumentSearchResult objects
    return results.map(
      (row: Record<string, unknown> & { rank: number; headline: string }) => ({
        document: this.mapRowToDocument(row),
        rank: parseFloat(row.rank?.toString() || '0'),
        headline: row.headline,
      }),
    );
  }

  /**
   * Count search results for pagination
   */
  async countSearchResults(
    options: Omit<DocumentSearchOptions, 'limit' | 'offset'>,
  ): Promise<number> {
    const { query, type, status, sessionId, startDate, endDate } = options;

    const sanitizedQuery = this.sanitizeSearchQuery(query);
    if (!sanitizedQuery) {
      return 0;
    }

    let sql = `
      SELECT COUNT(*) as count
      FROM legal_documents d
      WHERE (
        d."searchVector" @@ plainto_tsquery('simple', $1)
        OR d.title ILIKE $2
        OR COALESCE(d."contentRaw", '') ILIKE $2
        OR COALESCE(d.metadata->>'plaintiffName', '') ILIKE $2
        OR COALESCE(d.metadata->>'defendantName', '') ILIKE $2
      )
    `;

    const params: (string | Date)[] = [sanitizedQuery, `%${sanitizedQuery}%`];
    let paramIndex = 3;

    if (type) {
      sql += ` AND d.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (status) {
      sql += ` AND d.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (sessionId) {
      sql += ` AND d."sessionId" = $${paramIndex}`;
      params.push(sessionId);
      paramIndex++;
    }

    if (startDate) {
      sql += ` AND d."createdAt" >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      sql += ` AND d."createdAt" <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await this.dataSource.query(sql, params);
    return parseInt(result[0]?.count || '0', 10);
  }

  /**
   * Update the search vector for a document using PostgreSQL tsvector
   * Uses weighted vectors for different fields (A=highest, D=lowest)
   */
  async updateSearchVector(documentId: string): Promise<void> {
    // Use PostgreSQL setweight function for weighted full-text search
    // A: title (highest weight)
    // B: plaintiff name, defendant name
    // C: metadata fields
    // D: content (lowest weight)
    await this.dataSource.query(
      `
      UPDATE legal_documents
      SET "searchVector" = (
        setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(metadata->>'plaintiffName', '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(metadata->>'defendantName', '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE("contentRaw", '')), 'D')
      )
      WHERE id = $1
    `,
      [documentId],
    );
  }

  /**
   * Rebuild search vectors for all documents
   * Useful for initial setup or after schema changes
   */
  async rebuildAllSearchVectors(): Promise<number> {
    const documents = await this.documentRepository.find({ select: ['id'] });

    for (const document of documents) {
      await this.updateSearchVector(document.id);
    }

    return documents.length;
  }

  /**
   * Sanitize search query to prevent SQL injection and handle special characters
   */
  private sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') {
      return '';
    }

    // Trim and remove excessive whitespace
    let sanitized = query.trim().replace(/\s+/g, ' ');

    // Remove special characters that could affect tsquery parsing
    // Keep alphanumeric, spaces, and Polish diacritics
    sanitized = sanitized.replace(/[^\w\s\u0080-\u017F]/g, ' ');

    return sanitized.trim();
  }

  /**
   * Map raw database row to LegalDocument entity
   */
  private mapRowToDocument(row: Record<string, unknown>): LegalDocument {
    const document = new LegalDocument();
    document.id = row['id'] as string;
    document.sessionId = row['sessionId'] as string;
    document.title = row['title'] as string;
    document.type = row['type'] as DocumentType;
    document.status = row['status'] as DocumentStatus;
    document.contentRaw = row['contentRaw'] as string | null;
    document.metadata = row['metadata'] as DocumentMetadata | null;
    document.pdfUrl = row['pdfUrl'] as string | null;
    document.createdAt = new Date(row['createdAt'] as string);
    document.updatedAt = new Date(row['updatedAt'] as string);
    return document;
  }
}
