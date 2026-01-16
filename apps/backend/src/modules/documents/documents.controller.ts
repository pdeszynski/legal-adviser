import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
} from '@nestjs/common';
import { DocumentsService } from './services/documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { LegalDocument, DocumentType } from './entities/legal-document.entity';
import { DocumentGenerationProducer } from './queues/document-generation.producer';

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
    private readonly documentGenerationProducer: DocumentGenerationProducer,
  ) {}

  /**
   * Generate a new document
   *
   * Creates a document and queues it for AI generation processing.
   * Returns the document with status GENERATING.
   *
   * The actual content generation happens asynchronously via the Bull queue.
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

    // Step 3: Queue the generation job for async processing
    await this.documentGenerationProducer.queueDocumentGeneration({
      documentId: document.id,
      sessionId: createDocumentDto.sessionId,
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
   * Get queue statistics
   *
   * Returns current queue status including job counts.
   */
  @Get('queue/stats')
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }> {
    return this.documentGenerationProducer.getQueueStats();
  }
}
