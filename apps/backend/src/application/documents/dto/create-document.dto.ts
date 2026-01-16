import { DocumentTypeEnum } from '../../../domain/legal-documents/value-objects';

/**
 * Input DTO for creating a legal document.
 * DTOs in the Application layer define the data contract between
 * the Presentation layer and Application layer.
 */
export interface CreateDocumentDto {
  readonly title: string;
  readonly content: string;
  readonly documentType: DocumentTypeEnum;
  readonly ownerId: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Output DTO representing a created document.
 */
export interface CreateDocumentResultDto {
  readonly id: string;
  readonly title: string;
  readonly documentType: DocumentTypeEnum;
  readonly ownerId: string;
  readonly createdAt: Date;
}
