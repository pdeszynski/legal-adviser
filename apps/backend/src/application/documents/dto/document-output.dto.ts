import {
  DocumentTypeEnum,
  DocumentStatusEnum,
} from '../../../domain/legal-documents/value-objects';

/**
 * Standard output DTO representing a legal document.
 * Used for queries that return document information.
 */
export interface DocumentDto {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly documentType: DocumentTypeEnum;
  readonly status: DocumentStatusEnum;
  readonly ownerId: string;
  readonly metadata: Record<string, unknown>;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Summary DTO for document lists (without content).
 */
export interface DocumentSummaryDto {
  readonly id: string;
  readonly title: string;
  readonly documentType: DocumentTypeEnum;
  readonly status: DocumentStatusEnum;
  readonly ownerId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Paginated result for document queries.
 */
export interface PaginatedDocumentsDto {
  readonly items: DocumentSummaryDto[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}
