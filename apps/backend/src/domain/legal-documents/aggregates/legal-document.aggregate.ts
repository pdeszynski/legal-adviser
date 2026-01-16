import { AggregateRoot } from '../../shared/base';
import {
  DocumentId,
  DocumentTitle,
  DocumentContent,
  DocumentType,
  DocumentTypeEnum,
  DocumentStatus,
  DocumentStatusEnum,
} from '../value-objects';
import {
  DocumentCreatedEvent,
  DocumentUpdatedEvent,
  DocumentPublishedEvent,
  DocumentDeletedEvent,
} from '../events';

interface LegalDocumentProps {
  title: DocumentTitle;
  content: DocumentContent;
  documentType: DocumentType;
  status: DocumentStatus;
  ownerId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Legal Document Aggregate Root
 * Manages the lifecycle and business rules for legal documents
 */
export class LegalDocumentAggregate extends AggregateRoot<string> {
  private _title: DocumentTitle;
  private _content: DocumentContent;
  private _documentType: DocumentType;
  private _status: DocumentStatus;
  private _ownerId: string;
  private _metadata: Record<string, unknown>;

  private constructor(id: string, props: LegalDocumentProps) {
    super(id);
    this._title = props.title;
    this._content = props.content;
    this._documentType = props.documentType;
    this._status = props.status;
    this._ownerId = props.ownerId;
    this._metadata = props.metadata || {};
  }

  // Getters
  get title(): DocumentTitle {
    return this._title;
  }

  get content(): DocumentContent {
    return this._content;
  }

  get documentType(): DocumentType {
    return this._documentType;
  }

  get status(): DocumentStatus {
    return this._status;
  }

  get ownerId(): string {
    return this._ownerId;
  }

  get metadata(): Record<string, unknown> {
    return { ...this._metadata };
  }

  // Factory method
  static create(
    id: string,
    title: string,
    content: string,
    documentType: DocumentTypeEnum,
    ownerId: string,
    metadata?: Record<string, unknown>,
  ): LegalDocumentAggregate {
    const document = new LegalDocumentAggregate(id, {
      title: DocumentTitle.create(title),
      content: DocumentContent.create(content),
      documentType: DocumentType.create(documentType),
      status: DocumentStatus.draft(),
      ownerId,
      metadata,
    });

    document.addDomainEvent(
      new DocumentCreatedEvent({
        documentId: id,
        title,
        documentType,
        ownerId,
        createdAt: document.createdAt,
      }),
    );

    return document;
  }

  // Reconstitute from persistence
  static reconstitute(
    id: string,
    title: string,
    content: string,
    documentType: DocumentTypeEnum,
    status: DocumentStatusEnum,
    ownerId: string,
    createdAt: Date,
    updatedAt: Date,
    metadata?: Record<string, unknown>,
  ): LegalDocumentAggregate {
    const document = new LegalDocumentAggregate(id, {
      title: DocumentTitle.create(title),
      content: DocumentContent.create(content),
      documentType: DocumentType.create(documentType),
      status: DocumentStatus.create(status),
      ownerId,
      metadata,
    });
    document._createdAt = createdAt;
    document._updatedAt = updatedAt;
    return document;
  }

  // Business methods
  updateTitle(newTitle: string, updatedBy: string): void {
    if (!this._status.isEditable()) {
      throw new Error('Cannot update title of a non-editable document');
    }

    this._title = DocumentTitle.create(newTitle);
    this.incrementVersion();

    this.addDomainEvent(
      new DocumentUpdatedEvent({
        documentId: this.id,
        title: newTitle,
        contentUpdated: false,
        updatedBy,
        updatedAt: this.updatedAt,
      }),
    );
  }

  updateContent(newContent: string, updatedBy: string): void {
    if (!this._status.isEditable()) {
      throw new Error('Cannot update content of a non-editable document');
    }

    this._content = DocumentContent.create(newContent);
    this.incrementVersion();

    this.addDomainEvent(
      new DocumentUpdatedEvent({
        documentId: this.id,
        contentUpdated: true,
        updatedBy,
        updatedAt: this.updatedAt,
      }),
    );
  }

  submitForReview(): void {
    if (!this._status.canTransitionTo(DocumentStatusEnum.PENDING_REVIEW)) {
      throw new Error('Cannot submit document for review in current status');
    }

    this._status = DocumentStatus.create(DocumentStatusEnum.PENDING_REVIEW);
    this.incrementVersion();
  }

  approve(): void {
    if (!this._status.canTransitionTo(DocumentStatusEnum.APPROVED)) {
      throw new Error('Cannot approve document in current status');
    }

    this._status = DocumentStatus.create(DocumentStatusEnum.APPROVED);
    this.incrementVersion();
  }

  publish(publishedBy: string): void {
    if (!this._status.canTransitionTo(DocumentStatusEnum.PUBLISHED)) {
      throw new Error('Cannot publish document in current status');
    }

    this._status = DocumentStatus.published();
    this.incrementVersion();

    this.addDomainEvent(
      new DocumentPublishedEvent({
        documentId: this.id,
        title: this._title.toValue(),
        publishedBy,
        publishedAt: this.updatedAt,
      }),
    );
  }

  archive(): void {
    if (!this._status.canTransitionTo(DocumentStatusEnum.ARCHIVED)) {
      throw new Error('Cannot archive document in current status');
    }

    this._status = DocumentStatus.create(DocumentStatusEnum.ARCHIVED);
    this.incrementVersion();
  }

  delete(deletedBy: string, reason?: string): void {
    if (!this._status.canTransitionTo(DocumentStatusEnum.DELETED)) {
      throw new Error('Cannot delete document in current status');
    }

    this._status = DocumentStatus.create(DocumentStatusEnum.DELETED);
    this.incrementVersion();

    this.addDomainEvent(
      new DocumentDeletedEvent({
        documentId: this.id,
        deletedBy,
        deletedAt: this.updatedAt,
        reason,
      }),
    );
  }

  setMetadata(key: string, value: unknown): void {
    this._metadata[key] = value;
    this.touch();
  }
}
