import { DomainEvent } from '../../shared/base';

interface DocumentPublishedPayload {
  documentId: string;
  title: string;
  publishedBy: string;
  publishedAt: Date;
}

/**
 * Event raised when a legal document is published
 */
export class DocumentPublishedEvent extends DomainEvent {
  public readonly eventName = 'legal-documents.document.published';
  public readonly aggregateType = 'LegalDocument';

  constructor(private readonly payload: DocumentPublishedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.documentId;
  }

  toPayload(): Record<string, unknown> {
    return {
      documentId: this.payload.documentId,
      title: this.payload.title,
      publishedBy: this.payload.publishedBy,
      publishedAt: this.payload.publishedAt.toISOString(),
    };
  }
}
