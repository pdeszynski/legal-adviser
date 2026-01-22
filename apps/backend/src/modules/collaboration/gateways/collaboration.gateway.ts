import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { CollaborationService } from '../services/collaboration.service';
import {
  UpdateCursorInput,
  CursorOperationInput,
  CursorEventPayload,
  DocumentEditEventPayload,
} from '../dto';

/**
 * Collaboration WebSocket Gateway
 *
 * Handles real-time collaborative editing over WebSocket connections.
 *
 * Events:
 * - joinDocument: Client joins a document editing session
 * - leaveDocument: Client leaves a document editing session
 * - updateCursor: Client updates their cursor position
 * - operation: Client sends an editing operation
 *
 * Broadcasts:
 * - userJoined: Notifies other users when someone joins
 * - userLeft: Notifies other users when someone leaves
 * - cursorUpdated: Broadcasts cursor position changes
 * - documentEdited: Broadcasts document edits
 *
 * CORS configuration allows connections from the frontend.
 * Namespace: /collaboration (ws://host/collaboration)
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/collaboration',
})
export class CollaborationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // Map to track which socket is viewing which document
  // socketId -> documentId
  private readonly socketDocuments = new Map<string, string>();

  // Map to track user info per socket
  // socketId -> { userId, userName }
  private readonly socketUsers = new Map<
    string,
    { userId: string; userName: string }
  >();

  constructor(private readonly collaborationService: CollaborationService) {}

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(client: Socket) {
    console.log(`WebSocket client connected: ${client.id}`);
  }

  /**
   * Handle WebSocket disconnection
   *
   * Automatically removes user from any document they were viewing.
   */
  async handleDisconnect(client: Socket) {
    console.log(`WebSocket client disconnected: ${client.id}`);

    const documentId = this.socketDocuments.get(client.id);
    const userInfo = this.socketUsers.get(client.id);

    if (documentId && userInfo) {
      // Leave the document
      await this.collaborationService.leaveDocument(
        documentId,
        userInfo.userId,
      );

      // Notify other users in the document
      this.server.to(documentId).emit('userLeft', {
        documentId,
        userId: userInfo.userId,
        userName: userInfo.userName,
      });

      // Clean up maps
      this.socketDocuments.delete(client.id);
      this.socketUsers.delete(client.id);
    }
  }

  /**
   * Join a document for collaborative editing
   *
   * Client payload: { documentId: string, userId: string, userName: string }
   */
  @SubscribeMessage('joinDocument')
  async handleJoinDocument(
    @MessageBody()
    data: { documentId: string; userId: string; userName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { documentId, userId, userName } = data;

    try {
      // Join socket room for this document
      client.join(documentId);

      // Update tracking maps
      this.socketDocuments.set(client.id, documentId);
      this.socketUsers.set(client.id, { userId, userName });

      // Register user with collaboration service
      const cursor = await this.collaborationService.joinDocument(
        documentId,
        userId,
        userName,
      );

      // Get all active cursors for this document
      const activeCursors =
        await this.collaborationService.getActiveCursors(documentId);

      // Send current state to the joining client
      client.emit('documentState', {
        documentId,
        cursors: activeCursors.map((c) => ({
          userId: c.userId,
          userName: c.userName,
          color: c.color,
          position: c.position,
          selectionLength: c.selectionLength,
        })),
      });

      // Notify other users in the document
      client.to(documentId).emit('userJoined', {
        documentId,
        userId,
        userName,
        color: cursor.color,
      });

      console.log(`User ${userId} joined document ${documentId}`);
    } catch (error) {
      client.emit('error', {
        message: error.message,
      });
    }
  }

  /**
   * Leave a document
   *
   * Client payload: { documentId: string }
   */
  @SubscribeMessage('leaveDocument')
  async handleLeaveDocument(
    @MessageBody() _data: { documentId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const documentId = this.socketDocuments.get(client.id);
    const userInfo = this.socketUsers.get(client.id);

    if (documentId && userInfo) {
      // Leave the document
      await this.collaborationService.leaveDocument(
        documentId,
        userInfo.userId,
      );

      // Leave socket room
      client.leave(documentId);

      // Notify other users
      client.to(documentId).emit('userLeft', {
        documentId,
        userId: userInfo.userId,
        userName: userInfo.userName,
      });

      // Clean up maps
      this.socketDocuments.delete(client.id);
      this.socketUsers.delete(client.id);

      console.log(`User ${userInfo.userId} left document ${documentId}`);
    }
  }

  /**
   * Update cursor position
   *
   * Client payload: UpdateCursorInput
   */
  @SubscribeMessage('updateCursor')
  async handleUpdateCursor(
    @MessageBody() data: UpdateCursorInput,
    @ConnectedSocket() client: Socket,
  ) {
    const userInfo = this.socketUsers.get(client.id);
    const documentId = this.socketDocuments.get(client.id);

    if (!userInfo || !documentId) {
      return;
    }

    try {
      const cursor = await this.collaborationService.updateCursor(
        documentId,
        userInfo.userId,
        data.position,
        data.selectionLength,
      );

      // Broadcast to other users in the document
      client.to(documentId).emit('cursorUpdated', {
        documentId,
        userId: userInfo.userId,
        userName: userInfo.userName,
        color: cursor.color,
        position: data.position,
        selectionLength: data.selectionLength,
      });
    } catch (error) {
      client.emit('error', {
        message: error.message,
      });
    }
  }

  /**
   * Apply editing operation with Operational Transformation
   *
   * Client payload: CursorOperationInput
   */
  @SubscribeMessage('operation')
  async handleOperation(
    @MessageBody() data: CursorOperationInput,
    @ConnectedSocket() client: Socket,
  ) {
    const userInfo = this.socketUsers.get(client.id);
    const documentId = this.socketDocuments.get(client.id);

    if (!userInfo || !documentId) {
      return;
    }

    try {
      // Apply operation with OT transformation
      const transformedOp = await this.collaborationService.applyOperation(
        data,
        userInfo.userId,
        userInfo.userName,
      );

      // Broadcast to other users in the document (not the sender)
      client.to(documentId).emit('documentEdited', {
        documentId,
        userId: userInfo.userId,
        userName: userInfo.userName,
        operation: {
          type: transformedOp.operationType,
          position: transformedOp.position,
          length: transformedOp.length,
          text: transformedOp.text,
        },
        version: transformedOp.version,
      });

      // Send confirmation to sender with new version
      client.emit('operationApplied', {
        operationId: data, // Use operation data as ID
        newVersion: transformedOp.version,
        transformedPosition: transformedOp.position,
      });
    } catch (error) {
      client.emit('error', {
        message: error.message,
      });
    }
  }
}
