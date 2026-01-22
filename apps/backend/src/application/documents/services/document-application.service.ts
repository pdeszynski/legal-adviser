import { Injectable, Logger } from '@nestjs/common';
import {
  ServiceResult,
  successResult,
  failureResult,
  PaginationParams,
  PaginatedResult,
  paginatedResult,
} from '../../common';
import {
  ApplicationError,
  NotFoundError,
} from '../../common/application-error';
import {
  CreateDocumentDto,
  CreateDocumentResultDto,
  DocumentDto,
  DocumentSummaryDto,
  UpdateDocumentTitleDto,
  PublishDocumentDto,
  DeleteDocumentDto,
} from '../dto';
import { CreateDocumentUseCase } from '../use-cases/create-document.use-case';
import {
  GetDocumentUseCase,
  GetDocumentInput,
} from '../use-cases/get-document.use-case';
import {
  ListDocumentsByOwnerUseCase,
  ListDocumentsByOwnerInput,
} from '../use-cases/list-documents.use-case';
import { UpdateDocumentTitleUseCase } from '../use-cases/update-document-title.use-case';
import { PublishDocumentUseCase } from '../use-cases/publish-document.use-case';
import { DeleteDocumentUseCase } from '../use-cases/delete-document.use-case';
import { DocumentStatusEnum } from '../../../domain/legal-documents/value-objects';

/**
 * Document Application Service
 *
 * This service acts as an orchestrator for document-related operations.
 * It coordinates between use cases, handles cross-cutting concerns,
 * and provides a unified API for the presentation layer.
 *
 * Key responsibilities:
 * - Coordinate multiple use cases when needed
 * - Handle error transformation
 * - Provide consistent result structure
 * - Support pagination and filtering
 * - Authorization checks (if needed)
 */
@Injectable()
export class DocumentApplicationService {
  private readonly logger = new Logger(DocumentApplicationService.name);

  constructor(
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    private readonly getDocumentUseCase: GetDocumentUseCase,
    private readonly listDocumentsByOwnerUseCase: ListDocumentsByOwnerUseCase,
    private readonly updateDocumentTitleUseCase: UpdateDocumentTitleUseCase,
    private readonly publishDocumentUseCase: PublishDocumentUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
  ) {}

  /**
   * Creates a new legal document.
   *
   * @param dto - Document creation data
   * @returns Service result with created document info
   */
  async createDocument(
    dto: CreateDocumentDto,
  ): Promise<ServiceResult<CreateDocumentResultDto>> {
    try {
      this.logger.log(`Creating document for owner: ${dto.ownerId}`);
      const result = await this.createDocumentUseCase.execute(dto);
      this.logger.log(`Document created successfully: ${result.id}`);
      return successResult(result);
    } catch (error) {
      return this.handleError<CreateDocumentResultDto>(
        error,
        'create document',
      );
    }
  }

  /**
   * Retrieves a document by ID.
   *
   * @param documentId - The document ID
   * @returns Service result with document data
   */
  async getDocument(documentId: string): Promise<ServiceResult<DocumentDto>> {
    try {
      this.logger.log(`Getting document: ${documentId}`);
      const result = await this.getDocumentUseCase.execute({ documentId });
      return successResult(result);
    } catch (error) {
      return this.handleError<DocumentDto>(error, 'get document');
    }
  }

  /**
   * Lists documents by owner with optional status filter.
   *
   * @param ownerId - The owner ID
   * @param status - Optional status filter
   * @returns Service result with document summaries
   */
  async listDocumentsByOwner(
    ownerId: string,
    status?: DocumentStatusEnum,
  ): Promise<ServiceResult<DocumentSummaryDto[]>> {
    try {
      this.logger.log(
        `Listing documents for owner: ${ownerId}, status: ${status || 'all'}`,
      );
      const input: ListDocumentsByOwnerInput = { ownerId, status };
      const result = await this.listDocumentsByOwnerUseCase.execute(input);
      return successResult(result);
    } catch (error) {
      return this.handleError<DocumentSummaryDto[]>(error, 'list documents');
    }
  }

  /**
   * Lists documents by owner with pagination support.
   *
   * @param ownerId - The owner ID
   * @param status - Optional status filter
   * @param pagination - Pagination parameters
   * @returns Service result with paginated document summaries
   */
  async listDocumentsByOwnerPaginated(
    ownerId: string,
    status?: DocumentStatusEnum,
    pagination?: PaginationParams,
  ): Promise<ServiceResult<PaginatedResult<DocumentSummaryDto>>> {
    try {
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;

      this.logger.log(
        `Listing documents paginated for owner: ${ownerId}, page: ${page}, limit: ${limit}`,
      );

      // Get all documents (in a real app, pagination would be handled at repository level)
      const input: ListDocumentsByOwnerInput = { ownerId, status };
      const allDocuments =
        await this.listDocumentsByOwnerUseCase.execute(input);

      // Apply pagination
      const total = allDocuments.length;
      const startIndex = (page - 1) * limit;
      const paginatedDocuments = allDocuments.slice(
        startIndex,
        startIndex + limit,
      );

      return successResult(
        paginatedResult(paginatedDocuments, total, page, limit),
      );
    } catch (error) {
      return this.handleError<PaginatedResult<DocumentSummaryDto>>(
        error,
        'list documents paginated',
      );
    }
  }

  /**
   * Updates a document's title.
   *
   * @param dto - Update title data
   * @returns Service result with updated document
   */
  async updateDocumentTitle(
    dto: UpdateDocumentTitleDto,
  ): Promise<ServiceResult<DocumentDto>> {
    try {
      this.logger.log(`Updating title for document: ${dto.documentId}`);
      const result = await this.updateDocumentTitleUseCase.execute(dto);
      this.logger.log(`Document title updated successfully: ${dto.documentId}`);
      return successResult(result);
    } catch (error) {
      return this.handleError<DocumentDto>(error, 'update document title');
    }
  }

  /**
   * Publishes a document.
   *
   * @param dto - Publish document data
   * @returns Service result with published document
   */
  async publishDocument(
    dto: PublishDocumentDto,
  ): Promise<ServiceResult<DocumentDto>> {
    try {
      this.logger.log(`Publishing document: ${dto.documentId}`);
      const result = await this.publishDocumentUseCase.execute(dto);
      this.logger.log(`Document published successfully: ${dto.documentId}`);
      return successResult(result);
    } catch (error) {
      return this.handleError<DocumentDto>(error, 'publish document');
    }
  }

  /**
   * Deletes a document.
   *
   * @param dto - Delete document data
   * @returns Service result indicating success
   */
  async deleteDocument(dto: DeleteDocumentDto): Promise<ServiceResult<void>> {
    try {
      this.logger.log(`Deleting document: ${dto.documentId}`);
      await this.deleteDocumentUseCase.execute(dto);
      this.logger.log(`Document deleted successfully: ${dto.documentId}`);
      return successResult(undefined);
    } catch (error) {
      return this.handleError<void>(error, 'delete document');
    }
  }

  /**
   * Checks if a user owns a document.
   *
   * @param documentId - The document ID
   * @param userId - The user ID
   * @returns Service result with ownership status
   */
  async checkDocumentOwnership(
    documentId: string,
    userId: string,
  ): Promise<ServiceResult<boolean>> {
    try {
      const documentResult = await this.getDocument(documentId);
      if (!documentResult.success || !documentResult.data) {
        return failureResult('NOT_FOUND', 'Document not found');
      }
      return successResult(documentResult.data.ownerId === userId);
    } catch (error) {
      return this.handleError<boolean>(error, 'check document ownership');
    }
  }

  /**
   * Gets document statistics for an owner.
   *
   * @param ownerId - The owner ID
   * @returns Service result with document statistics
   */
  async getDocumentStatistics(ownerId: string): Promise<
    ServiceResult<{
      total: number;
      byStatus: Record<DocumentStatusEnum, number>;
    }>
  > {
    try {
      this.logger.log(`Getting document statistics for owner: ${ownerId}`);
      const documentsResult = await this.listDocumentsByOwner(ownerId);

      if (!documentsResult.success || !documentsResult.data) {
        return failureResult('OPERATION_FAILED', 'Failed to get documents');
      }

      const documents = documentsResult.data;
      const byStatus = documents.reduce(
        (acc, doc) => {
          acc[doc.status] = (acc[doc.status] || 0) + 1;
          return acc;
        },
        {} as Record<DocumentStatusEnum, number>,
      );

      return successResult({
        total: documents.length,
        byStatus,
      });
    } catch (error) {
      return this.handleError(error, 'get document statistics');
    }
  }

  /**
   * Handles errors and transforms them into service results.
   */
  private handleError<T>(error: unknown, operation: string): ServiceResult<T> {
    if (error instanceof NotFoundError) {
      this.logger.warn(`Not found during ${operation}: ${error.message}`);
      return failureResult('NOT_FOUND', error.message, error.details);
    }

    if (error instanceof ApplicationError) {
      this.logger.warn(
        `Application error during ${operation}: ${error.message}`,
      );
      return failureResult(error.code, error.message, error.details);
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(`Unexpected error during ${operation}: ${errorMessage}`);
    return failureResult('INTERNAL_ERROR', `Failed to ${operation}`, {
      originalError: errorMessage,
    });
  }
}
