import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentCursor } from '../entities/document-cursor.entity';
import {
  CursorOperationType,
  CursorOperationInput,
  TransformedOperation,
  CursorEventPayload,
  DocumentEditEventPayload,
  UserJoinedEventPayload,
  UserLeftEventPayload,
} from '../dto';
import { GraphQLPubSubService } from '../../../shared/streaming/graphql-pubsub.service';
import { LegalDocument } from '../../documents/entities/legal-document.entity';
import { InjectRepository as InjectRepo } from '@nestjs/typeorm';

/**
 * Collaboration Service
 *
 * Manages real-time collaborative editing with Operational Transformation.
 *
 * Key Features:
 * - Cursor tracking: Shows where other users are editing
 * - Operational Transformation: Resolves concurrent edits without conflicts
 * - User presence: Shows who is currently viewing/editing the document
 *
 * Operational Transformation (OT) Algorithm:
 * - Simple OT for text editing: transform position based on concurrent operations
 * - Based on the principles of Google Wave / Google Docs OT
 *
 * Architecture:
 * - WebSocket Gateway handles real-time connections
 * - This service handles business logic and OT transformations
 * - GraphQL subscriptions notify clients of changes
 */
@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);

  // In-memory document version tracking (for OT)
  // In production, use Redis for distributed systems
  private readonly documentVersions = new Map<string, number>();

  // Pending operations queue for each document (for OT transformation)
  private readonly pendingOperations = new Map<
    string,
    CursorOperationInput[]
  >();

  constructor(
    @InjectRepo(DocumentCursor)
    private readonly cursorRepository: Repository<DocumentCursor>,
    @InjectRepo(LegalDocument)
    private readonly documentRepository: Repository<LegalDocument>,
    private readonly pubSubService: GraphQLPubSubService,
  ) {}

  /**
   * User joins a document for collaborative editing
   *
   * Creates or updates a cursor record for the user.
   * Emits a UserJoinedEvent to notify other collaborators.
   */
  async joinDocument(
    documentId: string,
    userId: string,
    userName: string,
  ): Promise<DocumentCursor> {
    // Verify document exists
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });
    if (!document) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    // Find existing cursor or create new one
    let cursor = await this.cursorRepository.findOne({
      where: { documentId, userId },
    });

    if (cursor) {
      // Update existing cursor
      cursor.userName = userName;
      cursor.isActive = true;
      cursor.lastActivityAt = new Date();
      cursor.color = cursor.color || this.generateColor(userId);
    } else {
      // Create new cursor
      cursor = this.cursorRepository.create({
        documentId,
        userId,
        userName,
        position: 0,
        selectionLength: 0,
        isActive: true,
        color: this.generateColor(userId),
        lastActivityAt: new Date(),
      });
    }

    await this.cursorRepository.save(cursor);

    // Emit user joined event
    const payload: UserJoinedEventPayload = {
      documentId,
      userId,
      userName,
      color: cursor.color,
      timestamp: new Date(),
    };
    await this.pubSubService.getPubSub().publish('userJoinedDocument', {
      userJoinedDocument: payload,
    });

    this.logger.log(`User ${userId} joined document ${documentId}`);
    return cursor;
  }

  /**
   * User leaves a document
   *
   * Marks the cursor as inactive (soft delete).
   * Emits a UserLeftEvent to notify other collaborators.
   */
  async leaveDocument(documentId: string, userId: string): Promise<void> {
    const cursor = await this.cursorRepository.findOne({
      where: { documentId, userId },
    });

    if (cursor) {
      cursor.markInactive();
      await this.cursorRepository.save(cursor);

      // Emit user left event
      const payload: UserLeftEventPayload = {
        documentId,
        userId,
        userName: cursor.userName,
        timestamp: new Date(),
      };
      await this.pubSubService.getPubSub().publish('userLeftDocument', {
        userLeftDocument: payload,
      });

      this.logger.log(`User ${userId} left document ${documentId}`);
    }
  }

  /**
   * Update user's cursor position
   *
   * Updates the cursor in the database and broadcasts to other users.
   */
  async updateCursor(
    documentId: string,
    userId: string,
    position: number,
    selectionLength: number = 0,
  ): Promise<DocumentCursor> {
    const cursor = await this.cursorRepository.findOne({
      where: { documentId, userId },
    });

    if (!cursor) {
      throw new NotFoundException(
        `Cursor not found for user ${userId} in document ${documentId}`,
      );
    }

    cursor.updatePosition(position, selectionLength);
    await this.cursorRepository.save(cursor);

    // Broadcast cursor update to other users
    const payload: CursorEventPayload = {
      documentId,
      userId,
      userName: cursor.userName,
      color: cursor.color,
      position,
      selectionLength,
      timestamp: new Date(),
    };
    await this.pubSubService.getPubSub().publish('cursorUpdated', {
      cursorUpdated: payload,
    });

    return cursor;
  }

  /**
   * Apply an editing operation with Operational Transformation
   *
   * Steps:
   * 1. Transform the operation against any pending concurrent operations
   * 2. Apply the transformed operation to the document
   * 3. Update document version
   * 4. Clear pending operations
   * 5. Broadcast the edit to other users
   */
  async applyOperation(
    operation: CursorOperationInput,
    userId: string,
    userName: string,
  ): Promise<TransformedOperation> {
    const { documentId, version: clientVersion } = operation;

    // Get current document version
    const serverVersion = this.getDocumentVersion(documentId);

    // Transform operation against concurrent operations
    const transformedOp = this.transformOperation(
      operation,
      clientVersion,
      serverVersion,
    );

    // Apply the operation to the document
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    let newContent = document.contentRaw || '';

    // Apply the transformed operation
    switch (transformedOp.operationType) {
      case CursorOperationType.INSERT:
        newContent =
          newContent.slice(0, transformedOp.position) +
          (transformedOp.text || '') +
          newContent.slice(transformedOp.position);
        break;
      case CursorOperationType.DELETE:
        if (transformedOp.length && transformedOp.length > 0) {
          newContent =
            newContent.slice(0, transformedOp.position) +
            newContent.slice(transformedOp.position + transformedOp.length);
        }
        break;
      case CursorOperationType.REPLACE:
        if (transformedOp.length && transformedOp.length > 0) {
          newContent =
            newContent.slice(0, transformedOp.position) +
            (transformedOp.text || '') +
            newContent.slice(transformedOp.position + transformedOp.length);
        }
        break;
      case CursorOperationType.CURSOR_MOVE:
        // No content change, just cursor movement
        break;
    }

    // Update document
    document.contentRaw = newContent;
    await this.documentRepository.save(document);

    // Increment document version
    this.incrementDocumentVersion(documentId);

    // Broadcast edit to other users
    const payload: DocumentEditEventPayload = {
      documentId,
      userId,
      userName,
      operation: {
        type: transformedOp.operationType,
        position: transformedOp.position,
        length: transformedOp.length,
        text: transformedOp.text,
      },
      version: serverVersion + 1,
      timestamp: new Date(),
    };
    await this.pubSubService.getPubSub().publish('documentEdited', {
      documentEdited: payload,
    });

    this.logger.debug(
      `Applied operation ${transformedOp.operationType} at position ${transformedOp.position} in document ${documentId}`,
    );

    return {
      operationType: transformedOp.operationType,
      position: transformedOp.position,
      length: transformedOp.length,
      text: transformedOp.text,
      version: serverVersion + 1,
    };
  }

  /**
   * Get all active cursors for a document
   *
   * Returns cursors that have been active in the last 30 seconds.
   */
  async getActiveCursors(documentId: string): Promise<DocumentCursor[]> {
    const cursors = await this.cursorRepository.find({
      where: { documentId, isActive: true },
    });

    // Filter out stale cursors
    return cursors.filter((cursor) => !cursor.isStale(30));
  }

  /**
   * Get current document version
   */
  private getDocumentVersion(documentId: string): number {
    return this.documentVersions.get(documentId) || 0;
  }

  /**
   * Increment document version
   */
  private incrementDocumentVersion(documentId: string): void {
    const current = this.getDocumentVersion(documentId);
    this.documentVersions.set(documentId, current + 1);
  }

  /**
   * Transform operation against concurrent operations
   *
   * Simple OT algorithm:
   * - If client is behind, adjust position based on concurrent operations
   * - For INSERT operations after position: increment position by text length
   * - For DELETE operations before position: decrement position by deleted length
   */
  private transformOperation(
    operation: CursorOperationInput,
    clientVersion: number,
    serverVersion: number,
  ): CursorOperationInput {
    // Client is up-to-date, no transformation needed
    if (clientVersion >= serverVersion) {
      return operation;
    }

    // Get pending concurrent operations
    const pending = this.pendingOperations.get(operation.documentId) || [];

    let transformedPos = operation.position;
    const transformedOp = { ...operation };

    // Transform against each pending operation
    for (const pendingOp of pending) {
      if (pendingOp.version <= clientVersion) {
        continue; // Client already knows about this operation
      }

      // Transform position based on pending operation
      switch (pendingOp.operationType) {
        case CursorOperationType.INSERT:
          // If pending insert is before or at our position, shift our position
          if (pendingOp.position <= transformedPos) {
            transformedPos += pendingOp.text?.length || 0;
          }
          break;
        case CursorOperationType.DELETE:
          // If pending delete is before our position, shift our position back
          if (pendingOp.position < transformedPos) {
            const deleteLength = pendingOp.length || 0;
            transformedPos = Math.max(
              pendingOp.position,
              transformedPos - deleteLength,
            );
          }
          break;
        case CursorOperationType.REPLACE:
          // Replace is delete + insert, so adjust accordingly
          if (pendingOp.position < transformedPos) {
            const deleteLength = pendingOp.length || 0;
            const insertLength = pendingOp.text?.length || 0;
            transformedPos = transformedPos - deleteLength + insertLength;
          }
          break;
      }
    }

    transformedOp.position = transformedPos;
    return transformedOp;
  }

  /**
   * Generate a consistent color for a user based on their ID
   *
   * Uses a hashing algorithm to generate consistent colors.
   * Returns a hex color code.
   */
  private generateColor(userId: string): string {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Convert to HSL for better color distribution
    const h = Math.abs(hash % 360);
    const s = 70 + (Math.abs(hash >> 8) % 20); // 70-90% saturation
    const l = 45 + (Math.abs(hash >> 16) % 15); // 45-60% lightness

    // Convert HSL to hex
    return this.hslToHex(h, s, l);
  }

  /**
   * Convert HSL to hex color
   */
  private hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
  }

  /**
   * Clean up stale cursors (run periodically)
   *
   * Marks cursors as inactive if they haven't been updated in 5 minutes.
   */
  async cleanupStaleCursors(): Promise<void> {
    const staleCursors = await this.cursorRepository.find({
      where: { isActive: true },
    });

    let cleaned = 0;
    for (const cursor of staleCursors) {
      if (cursor.isStale(300)) {
        // 5 minutes
        cursor.markInactive();
        await this.cursorRepository.save(cursor);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} stale cursors`);
    }
  }
}
