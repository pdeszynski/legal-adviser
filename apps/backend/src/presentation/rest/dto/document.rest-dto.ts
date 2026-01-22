import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';
import {
  DocumentTypeEnum,
  DocumentStatusEnum,
} from '../../../domain/legal-documents/value-objects';

/**
 * REST DTO for creating a document
 */
export class CreateDocumentRequest {
  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsEnum(DocumentTypeEnum)
  documentType!: DocumentTypeEnum;

  @IsUUID()
  ownerId!: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

/**
 * REST DTO for updating document title
 */
export class UpdateDocumentTitleRequest {
  @IsString()
  title!: string;

  @IsUUID()
  updatedBy!: string;
}

/**
 * REST DTO for publishing a document
 */
export class PublishDocumentRequest {
  @IsUUID()
  publishedBy!: string;
}

/**
 * REST DTO for deleting a document
 */
export class DeleteDocumentRequest {
  @IsUUID()
  deletedBy!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * REST Response DTO for document
 */
export class DocumentResponse {
  id!: string;
  title!: string;
  content!: string;
  documentType!: DocumentTypeEnum;
  status!: DocumentStatusEnum;
  ownerId!: string;
  metadata?: Record<string, unknown>;
  version!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

/**
 * REST Response DTO for document summary
 */
export class DocumentSummaryResponse {
  id!: string;
  title!: string;
  documentType!: DocumentTypeEnum;
  status!: DocumentStatusEnum;
  ownerId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
