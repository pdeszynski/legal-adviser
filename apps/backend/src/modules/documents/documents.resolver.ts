import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DocumentsService } from './services/documents.service';
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
import { LegalDocument, DocumentType, DocumentStatus } from './entities/legal-document.entity';
import { DocumentGenerationProducer } from './queues/document-generation.producer';
import { PdfExportProducer } from './queues/pdf-export.producer';

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
 */
@Resolver(() => LegalDocument)
export class DocumentsResolver {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly documentGenerationProducer: DocumentGenerationProducer,
    private readonly pdfExportProducer: PdfExportProducer,
  ) {}

  /**
   * Query: Get documents by session ID
   * Convenience query for filtering by session - also available via legalDocuments filter
   */
  @Query(() => [LegalDocument], { name: 'documentsBySession' })
  async findBySession(
    @Args('sessionId', { type: () => String }) sessionId: string,
  ): Promise<LegalDocument[]> {
    return this.documentsService.findBySessionId(sessionId);
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
   * 3. Queues the generation job for async processing
   *
   * The actual content generation happens asynchronously via the Bull queue.
   * Poll the document status to check for completion.
   */
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

    // Step 3: Queue the generation job for async processing
    await this.documentGenerationProducer.queueDocumentGeneration({
      documentId: document.id,
      sessionId: input.sessionId,
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
   */
  @Mutation(() => LegalDocument, { name: 'updateDocument' })
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
   */
  @Mutation(() => Boolean, {
    name: 'deleteDocument',
    deprecationReason: 'Use deleteOneLegalDocument instead',
  })
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
   */
  @Mutation(() => PdfExportJobResponse, {
    name: 'exportDocumentToPdf',
    description: 'Queue a document for PDF export',
  })
  async exportDocumentToPdf(
    @Args('input') input: ExportDocumentToPdfInput,
  ): Promise<PdfExportJobResponse> {
    // Step 1: Validate the document exists and is completed
    const document = await this.documentsService.findById(input.documentId);

    if (!document) {
      throw new NotFoundException(
        `Document with ID ${input.documentId} not found`,
      );
    }

    if (document.status !== DocumentStatus.COMPLETED) {
      throw new BadRequestException(
        `Document must be in COMPLETED status to export to PDF. Current status: ${document.status}`,
      );
    }

    if (!document.contentRaw) {
      throw new BadRequestException(
        'Document has no content to export',
      );
    }

    // Step 2: Queue the PDF export job
    const job = await this.pdfExportProducer.queuePdfExport({
      documentId: document.id,
      sessionId: document.sessionId,
      documentType: document.type,
      title: document.title,
      content: document.contentRaw,
      options: input.options
        ? {
            format: input.options.format,
            includeHeader: input.options.includeHeader,
            includeFooter: input.options.includeFooter,
            includeTableOfContents: input.options.includeTableOfContents,
            watermark: input.options.watermark,
            language: input.options.language as 'pl' | 'en' | undefined,
          }
        : undefined,
      metadata: document.metadata || undefined,
    });

    return {
      jobId: job.id?.toString() || '',
      documentId: document.id,
      status: 'PENDING',
      message: 'PDF export job queued successfully',
    };
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
  @Query(() => PdfExportStatusResponse, {
    name: 'pdfExportStatus',
    description: 'Get the status of a PDF export job',
  })
  async getPdfExportStatus(
    @Args('jobId', { type: () => ID }) jobId: string,
  ): Promise<PdfExportStatusResponse> {
    const job = await this.pdfExportProducer.getJobStatus(jobId);

    if (!job) {
      return {
        jobId,
        status: 'unknown',
        error: `Job with ID ${jobId} not found`,
      };
    }

    const state = await job.getState();
    const progress = job.progress();

    // Base response
    const response: PdfExportStatusResponse = {
      jobId,
      status: state as PdfExportStatusResponse['status'],
      progress: typeof progress === 'number' ? progress : undefined,
    };

    // Add result if completed
    if (state === 'completed') {
      const result = await this.pdfExportProducer.getJobResult(jobId);
      if (result) {
        response.result = {
          documentId: result.documentId,
          filename: result.filename,
          pdfBase64: result.pdfBase64,
          fileSizeBytes: result.fileSizeBytes,
          pageCount: result.pageCount,
          generationTimeMs: result.generationTimeMs,
        };
      }
    }

    // Add error if failed
    if (state === 'failed') {
      const failedReason = job.failedReason;
      response.error = failedReason || 'PDF export failed';
    }

    return response;
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
   */
  @Mutation(() => PdfExportResult, {
    name: 'exportDocumentToPdfSync',
    description: 'Export a document to PDF and wait for the result',
  })
  async exportDocumentToPdfSync(
    @Args('input') input: ExportDocumentToPdfInput,
  ): Promise<PdfExportResult> {
    // Step 1: Queue the export job (reuse existing validation)
    const jobResponse = await this.exportDocumentToPdf(input);

    // Step 2: Wait for the result
    try {
      const result = await this.pdfExportProducer.waitForResult(
        jobResponse.jobId,
        60000, // 60 second timeout
      );

      return {
        documentId: result.documentId,
        filename: result.filename,
        pdfBase64: result.pdfBase64,
        fileSizeBytes: result.fileSizeBytes,
        pageCount: result.pageCount,
        generationTimeMs: result.generationTimeMs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `PDF export failed: ${errorMessage}`,
      );
    }
  }
}
