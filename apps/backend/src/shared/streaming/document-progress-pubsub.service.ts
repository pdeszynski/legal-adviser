import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, share } from 'rxjs/operators';

/**
 * Document Generation Progress Event
 *
 * Represents a real-time progress update during document generation.
 * These events are transient and not persisted to the database.
 */
export interface DocumentProgressEvent {
  documentId: string;
  sessionId: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  progress: number; // 0-100
  message?: string;
  partialContent?: string;
  error?: string;
  timestamp: Date;
}

/**
 * Document Progress PubSub Service
 *
 * Provides a publish/subscribe mechanism for real-time document generation
 * progress updates. Uses RxJS Subject for in-memory event streaming.
 *
 * This service enables:
 * - Backend processors to publish progress events
 * - SSE endpoints to subscribe to document-specific events
 * - Decoupled communication between queue processors and HTTP clients
 *
 * Architecture Notes:
 * - In-memory implementation suitable for single-server deployments
 * - For horizontal scaling, extend with Redis Pub/Sub adapter
 * - Events are transient and not persisted (progress is ephemeral)
 */
@Injectable()
export class DocumentProgressPubSubService implements OnModuleDestroy {
  /**
   * RxJS Subject for broadcasting progress events
   * Uses share() operator to multicast to multiple subscribers
   */
  private readonly progressSubject = new Subject<DocumentProgressEvent>();

  /**
   * Shared observable for all subscribers
   * Implements hot observable pattern for real-time streaming
   */
  private readonly progress$: Observable<DocumentProgressEvent> =
    this.progressSubject.asObservable().pipe(share());

  /**
   * Track active subscriptions for debugging
   */
  private activeSubscriptions = 0;

  /**
   * Publish a progress event for a document
   *
   * Called by DocumentGenerationProcessor during generation.
   * All subscribers watching this document will receive the event.
   *
   * @param event - Progress event to publish
   */
  publish(event: DocumentProgressEvent): void {
    this.progressSubject.next({
      ...event,
      timestamp: new Date(),
    });
  }

  /**
   * Subscribe to progress events for a specific document
   *
   * Filters the global event stream to only emit events
   * matching the specified document ID.
   *
   * @param documentId - Document ID to subscribe to
   * @returns Observable of progress events for this document
   */
  subscribeToDocument(documentId: string): Observable<DocumentProgressEvent> {
    this.activeSubscriptions++;
    return this.progress$.pipe(
      filter((event) => event.documentId === documentId),
    );
  }

  /**
   * Subscribe to progress events for a specific session
   *
   * Useful for dashboards showing all documents in a session.
   *
   * @param sessionId - Session ID to subscribe to
   * @returns Observable of progress events for this session
   */
  subscribeToSession(sessionId: string): Observable<DocumentProgressEvent> {
    this.activeSubscriptions++;
    return this.progress$.pipe(
      filter((event) => event.sessionId === sessionId),
    );
  }

  /**
   * Get count of active subscriptions (for monitoring)
   */
  getActiveSubscriptionsCount(): number {
    return this.activeSubscriptions;
  }

  /**
   * Decrement subscription count (called when connection closes)
   */
  decrementSubscriptions(): void {
    this.activeSubscriptions = Math.max(0, this.activeSubscriptions - 1);
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy(): void {
    this.progressSubject.complete();
  }
}
