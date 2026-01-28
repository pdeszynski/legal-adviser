'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { getAccessToken } from '@/providers/auth-provider/auth-provider.client';
import { getCsrfHeaders } from '@/lib/csrf';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

export type ChatMode = 'LAWYER' | 'SIMPLE';

export interface ChatSessionData {
  id: string;
  title: string | null;
  mode: ChatMode;
  messageCount: number;
  isPinned: boolean;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface UseChatSessionManagementOptions {
  /** Initial session ID from URL parameter for restoration */
  initialSessionId?: string | null;
  /** Mode for new sessions */
  defaultMode?: ChatMode;
  /** Whether to automatically create a session on mount (for new chats) */
  autoCreate?: boolean;
}

interface UseChatSessionManagementResult {
  /** Current session ID (always from backend, never generated client-side) */
  sessionId: string | null;
  /** Whether a session is being created */
  isCreatingSession: boolean;
  /** Error from session operations */
  sessionError: string | null;
  /** Create a new chat session */
  createSession: (mode?: ChatMode) => Promise<string | null>;
  /** Clear the current session (for new chat) */
  clearSession: () => void;
  /** Set a specific session ID (for restoration from URL) */
  setSessionId: (sessionId: string | null) => void;
}

/**
 * Hook for managing chat session lifecycle
 *
 * - NEVER generates session IDs client-side
 * - ALWAYS creates sessions via backend GraphQL mutation
 * - Stores session ID only in component state (never localStorage)
 *
 * Session creation flow:
 * 1. On mount with autoCreate=true, creates a new session via backend
 * 2. If initialSessionId is provided (URL param), validates and uses it
 * 3. Otherwise, waits for explicit session creation or restoration
 *
 * @example
 * ```tsx
 * const { sessionId, isCreatingSession, createSession, clearSession } = useChatSessionManagement({
 *   initialSessionId: searchParams.get('session'),
 *   defaultMode: 'LAWYER',
 *   autoCreate: true, // Automatically create session for new chats
 * });
 * ```
 */
export function useChatSessionManagement(
  options: UseChatSessionManagementOptions = {},
): UseChatSessionManagementResult {
  const { initialSessionId, defaultMode = 'LAWYER', autoCreate = false } = options;

  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // UUID v4 regex for validation - memoized to prevent re-renders
  const uuidV4Regex = useMemo(
    () => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    [],
  );

  /**
   * Create a new chat session via backend GraphQL mutation
   * Session ID is ALWAYS generated server-side
   */
  const createSession = useCallback(
    async (mode: ChatMode = defaultMode): Promise<string | null> => {
      setIsCreatingSession(true);
      setSessionError(null);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(),
        };

        const accessToken = getAccessToken();
        if (!accessToken) {
          throw new Error('Not authenticated');
        }
        headers['Authorization'] = `Bearer ${accessToken}`;

        const mutation = `
          mutation CreateChatSession($input: CreateChatSessionInput!) {
            createChatSession(input: $input) {
              id
              title
              mode
              messageCount
              isPinned
              lastMessageAt
              createdAt
              updatedAt
              deletedAt
            }
          }
        `;

        const response = await fetch(GRAPHQL_URL, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            query: mutation,
            variables: {
              input: { mode },
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message || 'GraphQL error');
        }

        const sessionData: ChatSessionData = result.data?.createChatSession;
        if (!sessionData || !sessionData.id) {
          throw new Error('No session ID returned from server');
        }

        // Validate that backend returned a valid UUID v4
        if (!uuidV4Regex.test(sessionData.id)) {
          throw new Error('Invalid session ID format returned from server');
        }

        setSessionIdState(sessionData.id);
        return sessionData.id;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create chat session';
        setSessionError(errorMessage);
        console.error('Failed to create chat session:', err);
        return null;
      } finally {
        setIsCreatingSession(false);
      }
    },
    [defaultMode, uuidV4Regex],
  );

  /**
   * Set session ID from external source (e.g., URL parameter)
   * Validates that it's a proper UUID v4 before accepting
   */
  const setSessionId = useCallback(
    (newSessionId: string | null) => {
      if (newSessionId === null) {
        setSessionIdState(null);
        return;
      }

      if (uuidV4Regex.test(newSessionId)) {
        setSessionIdState(newSessionId);
        setSessionError(null);
      } else {
        console.error('Invalid session ID format:', newSessionId);
        setSessionError('Invalid session ID format');
      }
    },
    [uuidV4Regex],
  );

  /**
   * Clear the current session (for starting a new chat)
   * Does NOT delete the session from backend, just clears local state
   */
  const clearSession = useCallback(() => {
    setSessionIdState(null);
    setSessionError(null);
  }, []);

  // Initialize session on mount
  useEffect(() => {
    if (initialSessionId) {
      // Validate and set the session from URL parameter
      if (uuidV4Regex.test(initialSessionId)) {
        setSessionIdState(initialSessionId);
      } else {
        console.error('Invalid session ID in URL parameter:', initialSessionId);
        setSessionError('Invalid session ID in URL');
      }
    } else if (autoCreate) {
      // Auto-create a session for new chats
      createSession(defaultMode);
    }
  }, [initialSessionId, autoCreate, defaultMode, createSession, uuidV4Regex]);

  return {
    sessionId,
    isCreatingSession,
    sessionError,
    createSession,
    clearSession,
    setSessionId,
  };
}
