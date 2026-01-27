'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Document Generation Progress Event
 *
 * Represents a real-time progress update received via SSE
 * from the backend during document generation.
 */
export interface DocumentProgressEvent {
  documentId: string;
  sessionId: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  progress: number; // 0-100
  message?: string;
  partialContent?: string;
  error?: string;
  timestamp: string;
}

/**
 * SSE Connection State
 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Hook Return Type
 */
export interface UseDocumentProgressReturn {
  /** Current progress event data */
  progressEvent: DocumentProgressEvent | null;
  /** Current progress percentage (0-100) */
  progress: number;
  /** Progress status message */
  message: string;
  /** Connection state */
  connectionState: ConnectionState;
  /** Whether generation is complete */
  isComplete: boolean;
  /** Whether generation failed */
  isFailed: boolean;
  /** Error message if failed */
  error: string | null;
  /** Manually reconnect to SSE stream */
  reconnect: () => void;
  /** Disconnect from SSE stream */
  disconnect: () => void;
}

/**
 * Backend API base URL
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * useDocumentProgress Hook
 *
 * Connects to the backend SSE endpoint to receive real-time
 * document generation progress updates.
 *
 * Features:
 * - Automatic connection management
 * - Reconnection on disconnect
 * - Type-safe event handling
 * - Progress state management
 *
 * Usage:
 * ```tsx
 * const { progress, message, isComplete } = useDocumentProgress(documentId);
 *
 * if (isComplete) {
 *   // Refetch document to get generated content
 * }
 *
 * return <ProgressBar value={progress} label={message} />;
 * ```
 *
 * @param documentId - The UUID of the document to track
 * @param enabled - Whether to enable the SSE connection (default: true)
 * @returns Progress state and control functions
 */
export function useDocumentProgress(
  documentId: string | null,
  enabled: boolean = true,
): UseDocumentProgressReturn {
  const [progressEvent, setProgressEvent] = useState<DocumentProgressEvent | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const eventSourceRef = useRef<EventSource | null>(null);

  /**
   * Connect to the SSE endpoint
   */
  const connect = useCallback(() => {
    if (!documentId || !enabled) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionState('connecting');

    const url = `${API_BASE_URL}/api/documents/${documentId}/stream`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    // Handle connection opened
    eventSource.addEventListener('connected', () => {
      setConnectionState('connected');
    });

    // Handle progress events
    eventSource.addEventListener('progress', (event) => {
      try {
        const data = JSON.parse(event.data) as DocumentProgressEvent;
        setProgressEvent(data);
      } catch {
        // Silently ignore parse errors
      }
    });

    // Handle completion event
    eventSource.addEventListener('completed', (event) => {
      try {
        const data = JSON.parse(event.data) as DocumentProgressEvent;
        setProgressEvent(data);
        setConnectionState('disconnected');
        eventSource.close();
      } catch {
        // Silently ignore parse errors
      }
    });

    // Handle failure event
    eventSource.addEventListener('failed', (event) => {
      try {
        const data = JSON.parse(event.data) as DocumentProgressEvent;
        setProgressEvent(data);
        setConnectionState('disconnected');
        eventSource.close();
      } catch {
        // Silently ignore parse errors
      }
    });

    // Handle heartbeat (keep-alive)
    eventSource.addEventListener('heartbeat', () => {
      // Heartbeat received, connection is alive
    });

    // Handle errors
    eventSource.addEventListener('error', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        setProgressEvent((prev) => ({
          ...prev!,
          status: 'FAILED',
          error: data.error || 'Connection error',
        }));
      } catch {
        // Standard error event (not custom error)
      }
      setConnectionState('error');
    });

    // Handle connection error/close
    eventSource.onerror = () => {
      // EventSource will automatically try to reconnect
      // We just update our state
      if (eventSource.readyState === EventSource.CLOSED) {
        setConnectionState('disconnected');
      } else {
        setConnectionState('error');
      }
    };
  }, [documentId, enabled]);

  /**
   * Disconnect from SSE stream
   */
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnectionState('disconnected');
    }
  }, []);

  /**
   * Reconnect to SSE stream
   */
  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [disconnect, connect]);

  // Connect on mount if enabled
  useEffect(() => {
    if (enabled && documentId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, documentId, connect, disconnect]);

  // Derived state
  const progress = progressEvent?.progress ?? 0;
  const message = progressEvent?.message ?? '';
  const isComplete = progressEvent?.status === 'COMPLETED';
  const isFailed = progressEvent?.status === 'FAILED';
  const error = progressEvent?.error ?? null;

  return {
    progressEvent,
    progress,
    message,
    connectionState,
    isComplete,
    isFailed,
    error,
    reconnect,
    disconnect,
  };
}
