import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  Sse,
  MessageEvent,
  Res,
  BadRequestException,
  NotFoundException,
  Query,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  DocumentProgressPubSubService,
  DocumentProgressEvent,
} from '../../shared/streaming';
import { DocumentsService } from './services/documents.service';
import { PdfUrlService } from './services/pdf-url.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { LegalDocument, DocumentType } from './entities/legal-document.entity';
import { DocumentGenerationStarter } from '../temporal/workflows/document/document-generation.starter';

/**
 * Documents REST Controller
 *
 * Provides REST API endpoints for document operations.
 * Primary API is GraphQL; this controller is for internal services.
 */
@Controller('api/documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly documentGenerationStarter: DocumentGenerationStarter,
    private readonly progressPubSub: DocumentProgressPubSubService,
    private readonly pdfUrlService: PdfUrlService,
  ) {}

  /**
   * Generate a new document
   *
   * Creates a document and queues it for AI generation processing.
   * Returns the document with status GENERATING.
   *
   * The actual content generation happens asynchronously via Temporal workflow.
   * Poll GET /api/documents/:id to check for completion.
   */
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generate(
    @Body() createDocumentDto: CreateDocumentDto,
  ): Promise<LegalDocument> {
    // Step 1: Create the document
    const document = await this.documentsService.create(createDocumentDto);

    // Step 2: Mark as generating
    const generatingDocument = await this.documentsService.startGeneration(
      document.id,
    );

    // Step 3: Start the Temporal workflow for async processing
    await this.documentGenerationStarter.startDocumentGeneration({
      documentId: document.id,
      sessionId: createDocumentDto.sessionId,
      title: createDocumentDto.title,
      documentType: createDocumentDto.type || DocumentType.OTHER,
      description: createDocumentDto.title,
      context: createDocumentDto.metadata
        ? { ...createDocumentDto.metadata }
        : undefined,
    });

    return generatingDocument;
  }

  /**
   * Get a document by ID
   *
   * Use this to poll for document generation completion.
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<LegalDocument> {
    return this.documentsService.findByIdOrFail(id);
  }

  /**
   * Stream document generation progress
   *
   * Server-Sent Events (SSE) endpoint for real-time progress updates.
   * Frontend connects here to visualize the generation process.
   */
  @Sse(':id/stream')
  stream(@Param('id') id: string): Observable<MessageEvent> {
    return this.progressPubSub.subscribeToDocument(id).pipe(
      map(
        (event: DocumentProgressEvent) =>
          ({
            data: event,
          }) as MessageEvent,
      ),
    );
  }

  /**
   * Download document as PDF
   *
   * Returns the PDF version of a document.
   * Validates the signed URL parameters for security.
   *
   * @param id - Document ID
   * @param filename - Sanitized filename (for display purposes)
   * @param expires - Expiration timestamp from signed URL
   * @param signature - Signature from signed URL
   * @param res - Express response object
   */
  @Get(':id/pdf/:filename')
  async downloadPdf(
    @Param('id') id: string,
    @Param('filename') filename: string,
    @Query('expires') expires: string,
    @Query('signature') signature: string,
    @Res() res: Response,
  ): Promise<void> {
    // Verify the signed URL
    const expiration = parseInt(expires, 10);
    if (isNaN(expiration)) {
      throw new BadRequestException('Invalid expiration parameter');
    }

    const isValid = this.pdfUrlService.verifyPdfUrlSignature(
      id,
      expiration,
      signature,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid or expired PDF URL');
    }

    // Get the document
    const document = await this.documentsService.findById(id);
    if (!document) {
      throw new NotFoundException(`Document ${id} not found`);
    }

    if (!document.contentRaw) {
      throw new BadRequestException('Document has no content');
    }

    // Set response headers for PDF download
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    // Return a simple response for now
    // In a full implementation, you would generate PDF from document.contentRaw
    // using the PdfExportService
    res.send(document.contentRaw);
  }
}
