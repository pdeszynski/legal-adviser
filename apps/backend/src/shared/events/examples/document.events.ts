import { BaseEvent } from '../base/base.event';
import { EVENT_PATTERNS } from '../base/event-patterns';
import { DocumentType } from '../../../modules/documents/entities/legal-document.entity';

/**
 * Document Created Event
 *
 * Emitted when a new legal document is created in the system.
 * Other modules can listen to this event to perform actions like:
 * - Logging document creation
 * - Triggering AI generation workflow
 * - Starting analytics tracking
 */
export class DocumentCreatedEvent extends BaseEvent {
  public readonly eventName = EVENT_PATTERNS.DOCUMENT.CREATED;

  constructor(
    public readonly documentId: string,
    public readonly sessionId: string,
    public readonly title: string,
    public readonly type: DocumentType,
    public readonly createdAt: Date = new Date(),
  ) {
    super();
  }

  protected getPayload(): Record<string, unknown> {
    return {
      documentId: this.documentId,
      sessionId: this.sessionId,
      title: this.title,
      type: this.type,
      createdAt: this.createdAt.toISOString(),
    };
  }
}

/**
 * Document Updated Event
 *
 * Emitted when document information is updated.
 */
export class DocumentUpdatedEvent extends BaseEvent {
  public readonly eventName = EVENT_PATTERNS.DOCUMENT.UPDATED;

  constructor(
    public readonly documentId: string,
    public readonly updatedFields: string[],
  ) {
    super();
  }

  protected getPayload(): Record<string, unknown> {
    return {
      documentId: this.documentId,
      updatedFields: this.updatedFields,
    };
  }
}

/**
 * Document Deleted Event
 *
 * Emitted when a document is deleted.
 */
export class DocumentDeletedEvent extends BaseEvent {
  public readonly eventName = EVENT_PATTERNS.DOCUMENT.DELETED;

  constructor(
    public readonly documentId: string,
    public readonly sessionId: string,
  ) {
    super();
  }

  protected getPayload(): Record<string, unknown> {
    return {
      documentId: this.documentId,
      sessionId: this.sessionId,
    };
  }
}

/**
 * Document Generation Started Event
 *
 * Emitted when AI document generation process begins.
 */
export class DocumentGenerationStartedEvent extends BaseEvent {
  public readonly eventName = EVENT_PATTERNS.DOCUMENT.GENERATION_STARTED;

  constructor(
    public readonly documentId: string,
    public readonly userId: string,
    public readonly documentType: string,
  ) {
    super();
  }

  protected getPayload(): Record<string, any> {
    return {
      documentId: this.documentId,
      userId: this.userId,
      documentType: this.documentType,
    };
  }
}

/**
 * Document Generation Completed Event
 *
 * Emitted when AI document generation completes successfully.
 */
export class DocumentGenerationCompletedEvent extends BaseEvent {
  public readonly eventName = EVENT_PATTERNS.DOCUMENT.GENERATION_COMPLETED;

  constructor(
    public readonly documentId: string,
    public readonly userId: string,
    public readonly documentType: string,
    public readonly generationTimeMs: number,
    public readonly userEmail?: string,
    public readonly firstName?: string,
  ) {
    super();
  }

  protected getPayload(): Record<string, any> {
    return {
      documentId: this.documentId,
      userId: this.userId,
      documentType: this.documentType,
      generationTimeMs: this.generationTimeMs,
      userEmail: this.userEmail,
      firstName: this.firstName,
    };
  }
}

/**
 * Document Generation Failed Event
 *
 * Emitted when AI document generation fails.
 */
export class DocumentGenerationFailedEvent extends BaseEvent {
  public readonly eventName = EVENT_PATTERNS.DOCUMENT.GENERATION_FAILED;

  constructor(
    public readonly documentId: string,
    public readonly userId: string,
    public readonly error: string,
    public readonly userEmail?: string,
    public readonly firstName?: string,
  ) {
    super();
  }

  protected getPayload(): Record<string, any> {
    return {
      documentId: this.documentId,
      userId: this.userId,
      error: this.error,
      userEmail: this.userEmail,
      firstName: this.firstName,
    };
  }
}

/**
 * Document Exported Event
 *
 * Emitted when a document is exported to PDF.
 */
export class DocumentExportedEvent extends BaseEvent {
  public readonly eventName = EVENT_PATTERNS.DOCUMENT.EXPORTED;

  constructor(
    public readonly documentId: string,
    public readonly userId: string,
    public readonly format: string = 'pdf',
  ) {
    super();
  }

  protected getPayload(): Record<string, any> {
    return {
      documentId: this.documentId,
      userId: this.userId,
      format: this.format,
    };
  }
}
