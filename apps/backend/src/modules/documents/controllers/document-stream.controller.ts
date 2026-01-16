import {
  Controller,
  Get,
  Param,
  Res,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import type { Response } from 'express';
import { Subscription } from 'rxjs';
import {
  DocumentProgressPubSubService,
  DocumentProgressEvent,
} from '../../../shared/streaming';

/**
 * Document Stream Controller
 *
 * Provides Server-Sent Events (SSE) endpoint for real-time document
 * generation progress streaming to frontend clients.
 *
 * SSE was chosen over WebSockets/GraphQL Subscriptions because:
 * - Simpler infrastructure (HTTP-based, no WebSocket server needed)
 * - Built into browsers (EventSource API)
 * - Sufficient for unidirectional server→client updates
 * - Automatic reconnection handling by browsers
 *
 * Endpoint: GET /api/documents/:id/stream
 *
 * Usage:
 * ```javascript
 * const evtSource = new EventSource('/api/documents/123/stream');
 * evtSource.onmessage = (event) => {
 *   const progress = JSON.parse(event.data);
 *   console.log('Progress:', progress.progress, '%');
 * };
 * ```
 */
@Controller('api/documents')
export class DocumentStreamController implements OnModuleDestroy {
  private readonly logger = new Logger(DocumentStreamController.name);

  /**
   * Track active connections for cleanup
   */
  private readonly activeConnections = new Map<string, Subscription>();

  constructor(
    private readonly documentProgressPubSub: DocumentProgressPubSubService,
  ) {}

  /**
   * SSE endpoint for document generation progress
   *
   * Streams real-time progress updates for a specific document.
   * The connection stays open until:
   * - Document generation completes (COMPLETED status)
   * - Document generation fails (FAILED status)
   * - Client disconnects
   * - Server shuts down
   *
   * @param id - Document UUID
   * @param res - Express response object for SSE streaming
   */
  @Get(':id/stream')
  streamDocumentProgress(@Param('id') id: string, @Res() res: Response): void {
    this.logger.log(`SSE connection opened for document ${id}`);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Enable CORS for SSE endpoint
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Flush headers immediately
    res.flushHeaders();

    // Send initial connection event
    this.sendEvent(res, 'connected', {
      documentId: id,
      message: 'Connected to progress stream',
      timestamp: new Date(),
    });

    // Subscribe to progress events for this document
    const subscription = this.documentProgressPubSub
      .subscribeToDocument(id)
      .subscribe({
        next: (event: DocumentProgressEvent) => {
          this.logger.debug(
            `Sending progress event for document ${id}: ${event.progress}%`,
          );
          this.sendEvent(res, 'progress', event);

          // Close connection on terminal states
          if (event.status === 'COMPLETED' || event.status === 'FAILED') {
            this.logger.log(
              `Document ${id} reached terminal state: ${event.status}`,
            );

            // Send final event
            this.sendEvent(res, event.status.toLowerCase(), event);

            // Schedule connection cleanup
            setTimeout(() => {
              this.closeConnection(id, res, subscription);
            }, 1000); // Give client time to receive final event
          }
        },
        error: (error) => {
          this.logger.error(`SSE stream error for document ${id}:`, error);
          this.sendEvent(res, 'error', {
            documentId: id,
            error: error instanceof Error ? error.message : 'Stream error',
            timestamp: new Date(),
          });
          this.closeConnection(id, res, subscription);
        },
      });

    // Track connection
    this.activeConnections.set(id, subscription);

    // Handle client disconnect
    res.on('close', () => {
      this.logger.log(`Client disconnected from document ${id} stream`);
      this.closeConnection(id, res, subscription);
    });

    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (!res.writableEnded) {
        this.sendEvent(res, 'heartbeat', { timestamp: new Date() });
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000);

    // Cleanup heartbeat on connection close
    res.on('close', () => {
      clearInterval(heartbeatInterval);
    });
  }

  /**
   * Send an SSE event to the client
   *
   * SSE format:
   * event: <event-type>
   * data: <json-data>
   *
   * @param res - Express response
   * @param eventType - Event type (progress, completed, failed, error)
   * @param data - Event data to send
   */
  private sendEvent(
    res: Response,
    eventType: string,
    data: Record<string, unknown> | DocumentProgressEvent,
  ): void {
    if (res.writableEnded) return;

    try {
      res.write(`event: ${eventType}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      this.logger.warn(`Failed to send SSE event: ${error}`);
    }
  }

  /**
   * Close an SSE connection and cleanup
   */
  private closeConnection(
    documentId: string,
    res: Response,
    subscription: Subscription,
  ): void {
    // Unsubscribe from progress events
    if (!subscription.closed) {
      subscription.unsubscribe();
    }

    // Remove from active connections
    this.activeConnections.delete(documentId);

    // Decrement PubSub subscription count
    this.documentProgressPubSub.decrementSubscriptions();

    // End response if not already ended
    if (!res.writableEnded) {
      res.end();
    }
  }

  /**
   * Cleanup all connections on module destroy
   */
  onModuleDestroy(): void {
    this.logger.log(
      `Cleaning up ${this.activeConnections.size} active SSE connections`,
    );

    this.activeConnections.forEach((subscription, documentId) => {
      this.logger.debug(`Closing SSE connection for document ${documentId}`);
      if (!subscription.closed) {
        subscription.unsubscribe();
      }
    });

    this.activeConnections.clear();
  }
}
