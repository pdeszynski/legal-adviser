/**
 * Input DTO for updating document title.
 */
export interface UpdateDocumentTitleDto {
  readonly documentId: string;
  readonly title: string;
  readonly updatedBy: string;
}

/**
 * Input DTO for updating document content.
 */
export interface UpdateDocumentContentDto {
  readonly documentId: string;
  readonly content: string;
  readonly updatedBy: string;
}

/**
 * Input DTO for publishing a document.
 */
export interface PublishDocumentDto {
  readonly documentId: string;
  readonly publishedBy: string;
}

/**
 * Input DTO for deleting a document.
 */
export interface DeleteDocumentDto {
  readonly documentId: string;
  readonly deletedBy: string;
  readonly reason?: string;
}
