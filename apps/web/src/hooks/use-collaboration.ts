import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * User cursor interface
 * Represents another user's cursor in the document
 */
export interface UserCursor {
  userId: string;
  userName: string;
  color: string | null;
  position: number;
  selectionLength: number;
}

/**
 * Document operation interface
 * Represents an editing operation (insert/delete/replace)
 */
export interface DocumentOperation {
  operationType: 'INSERT' | 'DELETE' | 'REPLACE' | 'CURSOR_MOVE';
  position: number;
  length?: number;
  text?: string;
  version: number;
}

/**
 * Collaboration state interface
 * Returned by useCollaboration hook
 */
export interface CollaborationState {
  isConnected: boolean;
  currentUser: string | null;
  activeUsers: UserCursor[];
  documentVersion: number;
  error: string | null;
}

/**
 * Collaboration actions interface
 * Functions to interact with the collaboration service
 */
export interface CollaborationActions {
  joinDocument: (documentId: string, userId: string, userName: string) => void;
  leaveDocument: () => void;
  sendOperation: (operation: DocumentOperation) => void;
  updateCursor: (position: number, selectionLength?: number) => void;
}

/**
 * useCollaboration Hook
 *
 * Manages WebSocket connection for real-time document collaboration.
 *
 * Features:
 * - Join/leave document editing sessions
 * - Send and receive editing operations with OT
 * - Track active users and their cursors
 * - Automatic reconnection on disconnect
 *
 * Usage:
 * ```tsx
 * const { state, actions } = useCollaboration();
 *
 * // Join a document
 * actions.joinDocument(docId, userId, userName);
 *
 * // Send an edit operation
 * actions.sendOperation({
 *   operationType: 'INSERT',
 *   position: 10,
 *   text: 'Hello',
 *   version: state.documentVersion,
 * });
 *
 * // Update cursor position
 * actions.updateCursor(42);
 * ```
 */
export function useCollaboration(): {
  state: CollaborationState;
  actions: CollaborationActions;
} {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<UserCursor[]>([]);
  const [documentVersion, setDocumentVersion] = useState(0);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize WebSocket connection
   */
  useEffect(() => {
    const socket = io(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/collaboration`,
      {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      },
    );

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to collaboration server');
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from collaboration server');
      setIsConnected(false);
    });

    socket.on('connect_error', (err: Error) => {
      console.error('Connection error:', err);
      setError(`Failed to connect: ${err.message}`);
    });

    // Document state (received when joining)
    socket.on('documentState', (data: { documentId: string; cursors: UserCursor[] }) => {
      setActiveUsers(data.cursors);
    });

    // User joined event
    socket.on(
      'userJoined',
      (data: { documentId: string; userId: string; userName: string; color: string | null }) => {
        setActiveUsers((prev) => {
          const exists = prev.some((u) => u.userId === data.userId);
          if (exists) return prev;
          return [
            ...prev,
            {
              userId: data.userId,
              userName: data.userName,
              color: data.color,
              position: 0,
              selectionLength: 0,
            },
          ];
        });
      },
    );

    // User left event
    socket.on('userLeft', (data: { documentId: string; userId: string; userName: string }) => {
      setActiveUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    // Cursor updated event
    socket.on('cursorUpdated', (data: UserCursor) => {
      setActiveUsers((prev) =>
        prev.map((u) =>
          u.userId === data.userId
            ? { ...u, position: data.position, selectionLength: data.selectionLength }
            : u,
        ),
      );
    });

    // Document edited event
    socket.on(
      'documentEdited',
      (data: {
        documentId: string;
        userId: string;
        operation: DocumentOperation;
        version: number;
      }) => {
        setDocumentVersion(data.version);
        // The parent component should handle applying the operation
        // We'll emit a custom event that the editor can listen to
        window.dispatchEvent(new CustomEvent('documentEdited', { detail: data }));
      },
    );

    // Operation applied confirmation
    socket.on(
      'operationApplied',
      (data: {
        operationId: DocumentOperation;
        newVersion: number;
        transformedPosition: number;
      }) => {
        setDocumentVersion(data.newVersion);
      },
    );

    // Error event
    socket.on('error', (data: { message: string }) => {
      setError(data.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  /**
   * Join a document for collaborative editing
   */
  const joinDocument = useCallback((documentId: string, userId: string, userName: string) => {
    if (!socketRef.current) return;

    setCurrentDocumentId(documentId);
    setCurrentUser(userId);

    socketRef.current.emit('joinDocument', {
      documentId,
      userId,
      userName,
    });
  }, []);

  /**
   * Leave the current document
   */
  const leaveDocument = useCallback(() => {
    if (!socketRef.current || !currentDocumentId) return;

    socketRef.current.emit('leaveDocument', {
      documentId: currentDocumentId,
    });

    setCurrentDocumentId(null);
    setActiveUsers([]);
  }, [currentDocumentId]);

  /**
   * Send an editing operation
   */
  const sendOperation = useCallback(
    (operation: DocumentOperation) => {
      if (!socketRef.current || !currentDocumentId) return;

      socketRef.current.emit('operation', {
        ...operation,
        documentId: currentDocumentId,
      });
    },
    [currentDocumentId],
  );

  /**
   * Update cursor position
   */
  const updateCursor = useCallback(
    (position: number, selectionLength: number = 0) => {
      if (!socketRef.current || !currentDocumentId) return;

      socketRef.current.emit('updateCursor', {
        documentId: currentDocumentId,
        position,
        selectionLength,
      });
    },
    [currentDocumentId],
  );

  const state: CollaborationState = {
    isConnected,
    currentUser,
    activeUsers,
    documentVersion,
    error,
  };

  const actions: CollaborationActions = {
    joinDocument,
    leaveDocument,
    sendOperation,
    updateCursor,
  };

  return { state, actions };
}
