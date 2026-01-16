import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  CreateDocumentUseCase,
  GetDocumentUseCase,
  ListDocumentsByOwnerUseCase,
  UpdateDocumentTitleUseCase,
  PublishDocumentUseCase,
  DeleteDocumentUseCase,
} from '../../../application/documents';
import {
  NotFoundError,
  BusinessRuleViolationError,
  ValidationError,
} from '../../../application/common';
import {
  CreateDocumentRequest,
  UpdateDocumentTitleRequest,
  PublishDocumentRequest,
  DeleteDocumentRequest,
  DocumentResponse,
  DocumentSummaryResponse,
} from '../dto';
import { DocumentStatusEnum } from '../../../domain/legal-documents/value-objects';

/**
 * REST Controller for Legal Documents (V2)
 *
 * Presentation Layer component that handles REST API requests
 * and delegates to Application layer use cases.
 *
 * Dependency Rules:
 * - CAN depend on: Application layer (use cases, DTOs)
 * - CANNOT depend on: Infrastructure layer, Domain layer directly
 */
@Controller('api/v2/documents')
export class DocumentsControllerV2 {
  constructor(
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    private readonly getDocumentUseCase: GetDocumentUseCase,
    private readonly listDocumentsUseCase: ListDocumentsByOwnerUseCase,
    private readonly updateTitleUseCase: UpdateDocumentTitleUseCase,
    private readonly publishDocumentUseCase: PublishDocumentUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
  ) {}

  @Post()
  async create(@Body() body: CreateDocumentRequest): Promise<DocumentResponse> {
    try {
      const result = await this.createDocumentUseCase.execute({
        title: body.title,
        content: body.content,
        documentType: body.documentType,
        ownerId: body.ownerId,
        metadata: body.metadata,
      });

      // Fetch full document for response
      const document = await this.getDocumentUseCase.execute({
        documentId: result.id,
      });

      return this.mapToResponse(document);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DocumentResponse> {
    try {
      const document = await this.getDocumentUseCase.execute({ documentId: id });
      return this.mapToResponse(document);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get()
  async listByOwner(
    @Query('ownerId', ParseUUIDPipe) ownerId: string,
    @Query('status') status?: DocumentStatusEnum,
  ): Promise<DocumentSummaryResponse[]> {
    const documents = await this.listDocumentsUseCase.execute({ ownerId, status });
    return documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      documentType: doc.documentType,
      status: doc.status,
      ownerId: doc.ownerId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }

  @Put(':id/title')
  async updateTitle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateDocumentTitleRequest,
  ): Promise<DocumentResponse> {
    try {
      const document = await this.updateTitleUseCase.execute({
        documentId: id,
        title: body.title,
        updatedBy: body.updatedBy,
      });
      return this.mapToResponse(document);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post(':id/publish')
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: PublishDocumentRequest,
  ): Promise<DocumentResponse> {
    try {
      const document = await this.publishDocumentUseCase.execute({
        documentId: id,
        publishedBy: body.publishedBy,
      });
      return this.mapToResponse(document);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: DeleteDocumentRequest,
  ): Promise<void> {
    try {
      await this.deleteDocumentUseCase.execute({
        documentId: id,
        deletedBy: body.deletedBy,
        reason: body.reason,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Map Application DTO to REST Response
   */
  private mapToResponse(dto: {
    id: string;
    title: string;
    content: string;
    documentType: string;
    status: string;
    ownerId: string;
    metadata: Record<string, unknown>;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): DocumentResponse {
    return {
      id: dto.id,
      title: dto.title,
      content: dto.content,
      documentType: dto.documentType as any,
      status: dto.status as any,
      ownerId: dto.ownerId,
      metadata: dto.metadata,
      version: dto.version,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }

  /**
   * Handle application errors and convert to HTTP exceptions
   */
  private handleError(error: unknown): never {
    if (error instanceof NotFoundError) {
      throw new HttpException(
        { message: error.message, code: error.code, details: error.details },
        HttpStatus.NOT_FOUND,
      );
    }
    if (error instanceof BusinessRuleViolationError) {
      throw new HttpException(
        { message: error.message, code: error.code, details: error.details },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (error instanceof ValidationError) {
      throw new HttpException(
        { message: error.message, code: error.code, details: error.details },
        HttpStatus.BAD_REQUEST,
      );
    }
    throw error;
  }
}
