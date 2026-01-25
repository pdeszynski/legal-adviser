import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import {
  DocumentsService,
  DocumentSearchOptions,
} from './services/documents.service';
import {
  GenerateDocumentInput,
  UpdateDocumentInput,
} from './dto/document.types';
import {
  ExportDocumentToPdfInput,
  PdfExportJobResponse,
  PdfExportResult,
  PdfExportStatusResponse,
} from './dto/pdf-export.dto';
import {
  SearchLegalDocumentsInput,
  LegalDocumentSearchResponse,
} from './dto/legal-document-search.dto';
import { LegalDocument, DocumentType } from './entities/legal-document.entity';
import { DocumentGenerationStarter } from '../temporal/workflows/document/document-generation.starter';
import { PdfExportService } from './services/pdf-export.service';
import { StrictThrottle, SkipThrottle } from '../../shared/throttler';
import {
  GqlAuthGuard,
  DocumentPermissionGuard,
  RequireDocumentPermission,
  DocumentPermission,
} from '../auth/guards';
import { QuotaGuard, RequireQuota, QuotaType } from '../../shared';

/**
 * Custom GraphQL Resolver for Legal Documents
 *
 * Provides custom business logic mutations that complement the
 * auto-generated CRUD resolvers from nestjs-query.
 *
 * Auto-generated operations (via nestjs-query):
 * - legalDocuments: Query all documents with filtering, sorting, paging
 * - legalDocument: Query single document by ID
 * - createOneLegalDocument: Create a new document
 * - updateOneLegalDocument: Update a document
 * - deleteOneLegalDocument: Delete a document
 *
 * Custom operations (this resolver):
 * - documentsBySession: Query documents by session ID (convenience query)
 * - generateDocument: Create document and start AI generation
 * - updateDocument: Update with custom business logic
 * - deleteDocument: Delete with event emission (deprecated - use deleteOneLegalDocument)
 *
 * Security:
 * - All operations require authentication
 * - Document access is controlled via ownership and sharing permissions
 */
@Resolver(() => LegalDocument)
@UseGuards(GqlAuthGuard, QuotaGuard)
export class DocumentsResolver {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly pdfExportService: PdfExportService,
    private readonly documentGenerationStarter: DocumentGenerationStarter,
  ) {}

  /**
   * Query: Get documents by session ID
   * Convenience query for filtering by session - also available via legalDocuments filter
   * Requires authentication
   */
  @SkipThrottle()
  @Query(() => [LegalDocument], { name: 'documentsBySession' })
  async findBySession(
    @Args('sessionId', { type: () => String }) sessionId: string,
  ): Promise<LegalDocument[]> {
    return this.documentsService.findBySessionId(sessionId);
  }

  /**
   * Query: Full-text search for legal documents
   *
   * Searches across document titles, content, and metadata fields.
   * Returns results ranked by relevance with highlighted snippets.
   *
   * @param input - Search options including query string and filters
   * @returns Paginated search results with relevance ranking
   */
  @SkipThrottle()
  @Query(() => LegalDocumentSearchResponse, {
    name: 'searchLegalDocuments',
    description: 'Full-text search across documents with relevance ranking',
  })
  async searchDocuments(
    @Args('input') input: SearchLegalDocumentsInput,
  ): Promise<LegalDocumentSearchResponse> {
    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;

    const searchOptions: DocumentSearchOptions = {
      query: input.query,
      type: input.type ?? undefined,
      status: input.status ?? undefined,
      sessionId: input.sessionId ?? undefined,
      startDate: input.startDate ?? undefined,
      endDate: input.endDate ?? undefined,
      limit,
      offset,
    };

    const [results, totalCount] = await Promise.all([
      this.documentsService.search(searchOptions),
      this.documentsService.countSearchResults(searchOptions),
    ]);

    return {
      results: results.map((r) => ({
        ...r.document,
        rank: r.rank,
        headline: r.headline ?? null,
      })),
      totalCount,
      count: results.length,
      offset,
      hasMore: offset + results.length < totalCount,
    };
  }

  /**
   * Mutation: Generate a new document
   *
   * Creates a document and queues it for AI generation processing.
   * Returns the document with status GENERATING.
   *
   * This is a custom mutation that:
   * 1. Creates the document in DRAFT status
   * 2. Marks it as GENERATING
   * 3. Starts the Temporal workflow for async processing
   *
   * The actual content generation happens asynchronously via Temporal.
   * Poll the document status to check for completion.
   *
   * Quota check: Requires one document generation quota
   */
  @StrictThrottle()
  @RequireQuota(QuotaType.DOCUMENT)
  @Mutation(() => LegalDocument, { name: 'generateDocument' })
  async generateDocument(
    @Args('input') input: GenerateDocumentInput,
  ): Promise<LegalDocument> {
    // Step 1: Create the document
    const document = await this.documentsService.create({
      sessionId: input.sessionId,
      title: input.title,
      type: input.type,
      metadata: input.metadata ? { ...input.metadata } : undefined,
    });

    // Step 2: Mark as generating
    const generatingDocument = await this.documentsService.startGeneration(
      document.id,
    );

    // Step 3: Start the Temporal workflow for async processing
    await this.documentGenerationStarter.startDocumentGeneration({
      documentId: document.id,
      sessionId: input.sessionId,
      title: input.title,
      documentType: input.type ?? DocumentType.OTHER,
      description: input.title, // Use title as the description for AI generation
      context: input.metadata ? { ...input.metadata } : undefined,
    });

    return generatingDocument;
  }

  /**
   * Mutation: Update an existing document with custom business logic
   *
   * Note: For simple field updates, prefer updateOneLegalDocument from nestjs-query.
   * This mutation is for updates that require business logic validation.
   * Requires WRITE permission (owner or shared with EDIT/ADMIN).
   */
  @Mutation(() => LegalDocument, { name: 'updateDocument' })
  @RequireDocumentPermission(DocumentPermission.WRITE)
  async updateDocument(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateDocumentInput,
  ): Promise<LegalDocument> {
    return this.documentsService.update(id, {
      ...input,
      metadata: input.metadata ? { ...input.metadata } : undefined,
    });
  }

  /**
   * Mutation: Delete a document
   *
   * @deprecated Use deleteOneLegalDocument from nestjs-query instead.
   * This mutation is kept for backward compatibility with existing clients.
   * Requires OWNER permission.
   */
  @Mutation(() => Boolean, {
    name: 'deleteDocument',
    deprecationReason: 'Use deleteOneLegalDocument instead',
  })
  @RequireDocumentPermission(DocumentPermission.OWNER)
  async deleteDocument(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.documentsService.delete(id);
    return true;
  }

  // ============================================================
  // PDF EXPORT MUTATIONS
  // ============================================================

  /**
   * Mutation: Export a document to PDF
   *
   * Queues a PDF export job for the specified document.
   * The document must be in COMPLETED status with content.
   *
   * Returns a job response with the job ID that can be used
   * to poll for the PDF export status.
   *
   * @param input - Export options including document ID and PDF settings
   * @returns Job response with job ID for tracking
   * Requires READ permission.
   */
  @StrictThrottle()
  @Mutation(() => PdfExportJobResponse, {
    name: 'exportDocumentToPdf',
    description: 'Queue a document for PDF export',
  })
  @RequireDocumentPermission(DocumentPermission.READ)
  async exportDocumentToPdf(
    @Args('input') input: ExportDocumentToPdfInput,
  ): Promise<PdfExportJobResponse> {
    return this.pdfExportService.exportToPdf(input);
  }

  /**
   * Query: Get PDF export job status
   *
   * Check the status of a PDF export job by job ID.
   * If completed, returns the PDF result with base64-encoded content.
   *
   * @param jobId - The job ID returned from exportDocumentToPdf
   * @returns Current status and result if completed
   */
  @SkipThrottle()
  @Query(() => PdfExportStatusResponse, {
    name: 'pdfExportStatus',
    description: 'Get the status of a PDF export job',
  })
  async getPdfExportStatus(
    @Args('jobId', { type: () => ID }) jobId: string,
  ): Promise<PdfExportStatusResponse> {
    return this.pdfExportService.getExportStatus(jobId);
  }

  /**
   * Mutation: Export document to PDF and wait for result
   *
   * Synchronous version that queues the export and waits for completion.
   * Use this for smaller documents where you want immediate results.
   * For larger documents, prefer exportDocumentToPdf + polling.
   *
   * @param input - Export options including document ID and PDF settings
   * @returns The PDF export result with base64-encoded content
   * Requires READ permission.
   */
  @StrictThrottle()
  @Mutation(() => PdfExportResult, {
    name: 'exportDocumentToPdfSync',
    description: 'Export a document to PDF and wait for the result',
  })
  @RequireDocumentPermission(DocumentPermission.READ)
  async exportDocumentToPdfSync(
    @Args('input') input: ExportDocumentToPdfInput,
  ): Promise<PdfExportResult> {
    return this.pdfExportService.exportToPdfSync(input);
  }
}
