import { DomainEvent } from '../../shared/base';

interface DocumentUpdatedPayload {
  documentId: string;
  title?: string;
  contentUpdated: boolean;
  updatedBy: string;
  updatedAt: Date;
}

/**
 * Event raised when a legal document is updated
 */
export class DocumentUpdatedEvent extends DomainEvent {
  public readonly eventName = 'legal-documents.document.updated';
  public readonly aggregateType = 'LegalDocument';

  constructor(private readonly payload: DocumentUpdatedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.documentId;
  }

  toPayload(): Record<string, unknown> {
    return {
      documentId: this.payload.documentId,
      title: this.payload.title,
      contentUpdated: this.payload.contentUpdated,
      updatedBy: this.payload.updatedBy,
      updatedAt: this.payload.updatedAt.toISOString(),
    };
  }
}
