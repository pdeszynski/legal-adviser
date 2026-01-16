import { DomainEvent } from '../../shared/base';

interface DocumentCreatedPayload {
  documentId: string;
  title: string;
  documentType: string;
  ownerId: string;
  createdAt: Date;
}

/**
 * Event raised when a new legal document is created
 */
export class DocumentCreatedEvent extends DomainEvent {
  public readonly eventName = 'legal-documents.document.created';
  public readonly aggregateType = 'LegalDocument';

  constructor(private readonly payload: DocumentCreatedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.documentId;
  }

  toPayload(): Record<string, unknown> {
    return {
      documentId: this.payload.documentId,
      title: this.payload.title,
      documentType: this.payload.documentType,
      ownerId: this.payload.ownerId,
      createdAt: this.payload.createdAt.toISOString(),
    };
  }
}
