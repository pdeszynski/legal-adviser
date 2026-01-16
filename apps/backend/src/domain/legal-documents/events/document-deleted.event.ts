import { DomainEvent } from '../../shared/base';

interface DocumentDeletedPayload {
  documentId: string;
  deletedBy: string;
  deletedAt: Date;
  reason?: string;
}

/**
 * Event raised when a legal document is deleted
 */
export class DocumentDeletedEvent extends DomainEvent {
  public readonly eventName = 'legal-documents.document.deleted';
  public readonly aggregateType = 'LegalDocument';

  constructor(private readonly payload: DocumentDeletedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.documentId;
  }

  toPayload(): Record<string, unknown> {
    return {
      documentId: this.payload.documentId,
      deletedBy: this.payload.deletedBy,
      deletedAt: this.payload.deletedAt.toISOString(),
      reason: this.payload.reason,
    };
  }
}
