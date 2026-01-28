'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { getAccessToken } from '@/providers/auth-provider/auth-provider.client';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

/**
 * LocalStorage chat message format
 */
export interface LocalStorageChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: ChatCitation[];
  clarification?: ClarificationInfo;
  timestamp: Date | string;
  isStreaming?: boolean;
  hasError?: boolean;
  errorResponse?: unknown;
  partial?: boolean;
}

/**
 * Citation format from localStorage
 */
export interface ChatCitation {
  source: string;
  url?: string;
  article?: string;
  excerpt?: string;
}

/**
 * Clarification info from localStorage
 */
export interface ClarificationInfo {
  needs_clarification: boolean;
  questions: string[];
  context_summary: string;
  next_steps: string;
}

/**
 * LocalStorage session data format
 */
export interface LocalStorageSessionData {
  sessionId: string;
  messages: LocalStorageChatMessage[];
  title?: string;
  mode: 'LAWYER' | 'SIMPLE';
}

/**
 * Migration status from backend
 */
export interface MigrationStatus {
  hasMigrated: boolean;
  lastMigrationAt: string | null;
  sessionsMigrated: number;
}

/**
 * Migration result from backend
 */
export interface MigrationResult {
  sessionId: string;
  success: boolean;
  error: string | null;
  messageCount: number;
}

/**
 * Bulk migration result from backend
 */
export interface BulkMigrationResult {
  results: MigrationResult[];
  totalProcessed: number;
  successfulCount: number;
  failedCount: number;
  totalMessagesMigrated: number;
}

/**
 * Migration state
 */
export interface MigrationState {
  status: 'idle' | 'checking' | 'pending' | 'migrating' | 'completed' | 'error';
  sessionCount: number;
  currentSession: number;
  error: string | null;
  progress: number; // 0-100
}

/**
 * Options for the migration hook
 */
export interface UseChatMigrationOptions {
  /** Callback when migration is complete */
  onMigrationComplete?: (result: BulkMigrationResult) => void;
  /** Callback when migration fails */
  onMigrationError?: (error: string) => void;
  /** Auto-check for migration on mount */
  autoCheck?: boolean;
}

/**
 * useChatMigration Hook
 *
 * Handles migration of chat sessions from localStorage to the database.
 *
 * Features:
 * - Detects localStorage chat sessions
 * - Validates session data
 * - Shows migration prompt to user
 * - Migrates sessions with progress tracking
 * - Handles errors gracefully
 * - Clears localStorage after successful migration
 *
 * @example
 * ```tsx
 * const {
 *   migrationState,
 *   checkForMigration,
 *   startMigration,
 *   dismissMigration,
 *   resetMigrationFlag,
 * } = useChatMigration({
 *   onMigrationComplete: (result) => {
 *     console.log(`Migrated ${result.successfulCount} sessions`);
 *   },
 * });
 * ```
 */
export function useChatMigration(options: UseChatMigrationOptions = {}) {
  const { autoCheck = true, onMigrationComplete, onMigrationError } = options;
  const { isAuthenticated } = useAuth();

  const [migrationState, setMigrationState] = useState<MigrationState>({
    status: 'idle',
    sessionCount: 0,
    currentSession: 0,
    error: null,
    progress: 0,
  });

  const [localStorageSessions, setLocalStorageSessions] = useState<
    LocalStorageSessionData[]
  >([]);

  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(
    null,
  );

  /**
   * Get all localStorage keys that match chat history pattern
   */
  const getChatHistoryKeys = useCallback((): string[] => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('chat_history_')) {
        keys.push(key);
      }
    }
    return keys;
  }, []);

  /**
   * Validate UUID v4 format
   */
  const isValidUuidV4 = useCallback((id: string): boolean => {
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidV4Regex.test(id);
  }, []);

  /**
   * Extract session ID from localStorage key
   */
  const extractSessionId = useCallback((key: string): string | null => {
    const match = key.match(/^chat_history_(.+)$/);
    return match ? match[1] : null;
  }, []);

  /**
   * Parse and validate a session from localStorage
   */
  const parseSession = useCallback((
    key: string,
    value: string,
  ): LocalStorageSessionData | null => {
    const sessionId = extractSessionId(key);
    if (!sessionId || !isValidUuidV4(sessionId)) {
      return null;
    }

    try {
      const messages = JSON.parse(value) as LocalStorageChatMessage[];
      if (!Array.isArray(messages) || messages.length === 0) {
        return null;
      }

      // Validate messages have required fields
      const validMessages = messages.filter(
        (msg) =>
          msg &&
          typeof msg === 'object' &&
          (msg.role === 'user' || msg.role === 'assistant') &&
          msg.content &&
          typeof msg.content === 'string',
      );

      if (validMessages.length === 0) {
        return null;
      }

      // Determine mode from messages (default to SIMPLE)
      // Check if any assistant message has lawyer-style patterns
      const hasLawyerContent = validMessages.some(
        (msg) =>
          msg.role === 'assistant' &&
          msg.citations &&
          msg.citations.length > 0,
      );

      return {
        sessionId,
        messages: validMessages,
        title: undefined, // Backend will auto-generate
        mode: hasLawyerContent ? 'LAWYER' : 'SIMPLE',
      };
    } catch {
      return null;
    }
  }, [extractSessionId, isValidUuidV4]);

  /**
   * Scan localStorage for chat sessions
   */
  const scanForSessions = useCallback((): LocalStorageSessionData[] => {
    const keys = getChatHistoryKeys();
    const sessions: LocalStorageSessionData[] = [];

    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value) {
        const session = parseSession(key, value);
        if (session) {
          sessions.push(session);
        }
      }
    }

    return sessions;
  }, [getChatHistoryKeys, parseSession]);

  /**
   * Check migration status from backend
   */
  const checkMigrationStatus = useCallback(async (): Promise<MigrationStatus | null> => {
    const token = getAccessToken();
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            query {
              localStorageMigrationStatus {
                hasMigrated
                lastMigrationAt
                sessionsMigrated
              }
            }
          `,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        return null;
      }

      return result.data?.localStorageMigrationStatus || null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Check if migration is needed
   */
  const checkForMigration = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setMigrationState((prev) => ({ ...prev, status: 'checking' }));

    const [status, sessions] = await Promise.all([
      checkMigrationStatus(),
      Promise.resolve(scanForSessions()),
    ]);

    setMigrationStatus(status);

    // Filter out sessions that might already exist
    // (we'll handle duplicates on the backend)
    const needsMigration =
      status &&
      !status.hasMigrated &&
      sessions.length > 0;

    if (needsMigration) {
      setMigrationState({
        status: 'pending',
        sessionCount: sessions.length,
        currentSession: 0,
        error: null,
        progress: 0,
      });
      setLocalStorageSessions(sessions);
    } else {
      setMigrationState({
        status: 'idle',
        sessionCount: 0,
        currentSession: 0,
        error: null,
        progress: 0,
      });
      setLocalStorageSessions([]);
    }
  }, [isAuthenticated, checkMigrationStatus, scanForSessions]);

  /**
   * Execute migration
   */
  const startMigration = useCallback(async () => {
    if (localStorageSessions.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setMigrationState((prev) => ({
        ...prev,
        status: 'error',
        error: 'Not authenticated',
      }));
      onMigrationError?.('Not authenticated');
      return;
    }

    setMigrationState({
      status: 'migrating',
      sessionCount: localStorageSessions.length,
      currentSession: 0,
      error: null,
      progress: 0,
    });

    try {
      // Prepare mutation input
      const sessionsInput = localStorageSessions.map((session) => ({
        sessionId: session.sessionId,
        messages: session.messages.map((msg, idx) => ({
          role: msg.role.toUpperCase() as 'USER' | 'ASSISTANT',
          content: msg.content,
          rawContent: null,
          citations: msg.citations?.map((c) => ({
            source: c.source,
            article: c.article || null,
            url: c.url || null,
            excerpt: c.excerpt || null,
          })) || null,
          timestamp:
            msg.timestamp instanceof Date
              ? msg.timestamp.toISOString()
              : msg.timestamp || new Date().toISOString(),
        })),
        title: session.title || null,
        mode: session.mode,
      }));

      // Execute bulk migration mutation
      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            mutation MigrateChatSessionsBulk($input: MigrateChatBulkInput!) {
              migrateChatSessionsBulk(input: $input) {
                results {
                  sessionId
                  success
                  error
                  messageCount
                }
                totalProcessed
                successfulCount
                failedCount
                totalMessagesMigrated
              }
            }
          `,
          variables: {
            input: {
              sessions: sessionsInput,
              skipDuplicates: true,
            },
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

      const migrationResult: BulkMigrationResult =
        result.data?.migrateChatSessionsBulk;

      if (!migrationResult) {
        throw new Error('No data returned from server');
      }

      // Clear localStorage for successfully migrated sessions
      for (const sessionResult of migrationResult.results) {
        if (sessionResult.success) {
          const key = `chat_history_${sessionResult.sessionId}`;
          localStorage.removeItem(key);
        }
      }

      // Mark migration as complete
      await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            mutation {
              markLocalStorageMigrated {
                hasMigrated
                lastMigrationAt
                sessionsMigrated
              }
            }
          `,
        }),
      });

      setMigrationState({
        status: 'completed',
        sessionCount: migrationResult.totalProcessed,
        currentSession: migrationResult.totalProcessed,
        error: null,
        progress: 100,
      });

      setLocalStorageSessions([]);

      onMigrationComplete?.(migrationResult);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Migration failed';

      setMigrationState((prev) => ({
        ...prev,
        status: 'error',
        error: errorMessage,
      }));

      onMigrationError?.(errorMessage);
    }
  }, [localStorageSessions, onMigrationComplete, onMigrationError]);

  /**
   * Dismiss the migration prompt (don't migrate now)
   */
  const dismissMigration = useCallback(() => {
    setMigrationState({
      status: 'idle',
      sessionCount: 0,
      currentSession: 0,
      error: null,
      progress: 0,
    });
    setLocalStorageSessions([]);
  }, []);

  /**
   * Reset the migration flag (for testing/re-migration)
   */
  const resetMigrationFlag = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      return;
    }

    try {
      await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            mutation {
              resetLocalStorageMigration {
                hasMigrated
                lastMigrationAt
                sessionsMigrated
              }
            }
          `,
        }),
      });

      // Refresh migration status
      await checkForMigration();
    } catch {
      // Ignore error
    }
  }, [checkForMigration]);

  /**
   * Auto-check on mount and auth state changes
   */
  useEffect(() => {
    if (autoCheck && isAuthenticated) {
      checkForMigration();
    }
  }, [autoCheck, isAuthenticated, checkForMigration]);

  return {
    /** Current migration state */
    migrationState,
    /** Sessions found in localStorage */
    localStorageSessions,
    /** Migration status from backend */
    migrationStatus,
    /** Check if migration is needed */
    checkForMigration,
    /** Start the migration process */
    startMigration,
    /** Dismiss the migration prompt */
    dismissMigration,
    /** Reset the migration flag (testing) */
    resetMigrationFlag,
  };
}

/**
 * Re-export types for convenience
 */
export type {
  LocalStorageChatMessage,
  LocalStorageSessionData,
  MigrationStatus,
  MigrationResult,
  BulkMigrationResult,
};
