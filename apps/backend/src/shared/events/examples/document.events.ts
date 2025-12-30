import { BaseEvent } from '../base/base.event';
import { EVENT_PATTERNS } from '../base/event-patterns';

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
  ) {
    super();
  }

  protected getPayload(): Record<string, any> {
    return {
      documentId: this.documentId,
      userId: this.userId,
      documentType: this.documentType,
      generationTimeMs: this.generationTimeMs,
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
  ) {
    super();
  }

  protected getPayload(): Record<string, any> {
    return {
      documentId: this.documentId,
      userId: this.userId,
      error: this.error,
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
