'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAccessToken } from '@/providers/auth-provider/auth-provider.client';
import { getCsrfHeaders } from '@/lib/csrf';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

export type ChatMode = 'LAWYER' | 'SIMPLE';

export interface ChatSession {
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

export interface ChatSessionFilters {
  mode?: ChatMode;
  isPinned?: boolean;
  search: string;
}

interface UseChatHistoryOptions {
  limit?: number;
  enabled?: boolean;
}

interface UseChatHistoryResult {
  sessions: ChatSession[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  totalCount: number;
}

/**
 * Hook for fetching chat history with filtering and pagination
 *
 * Uses the chatSessions GraphQL query to retrieve user's chat sessions.
 * Supports filtering by mode, pinned status, and search in titles.
 */
export function useChatHistory(
  filters: ChatSessionFilters,
  options: UseChatHistoryOptions = {},
): UseChatHistoryResult {
  const { limit = 20, enabled = true } = options;

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const isLoadingRef = useRef(false);

  // Reset pagination when filters change
  useEffect(() => {
    offsetRef.current = 0;
    hasMoreRef.current = true;
    setSessions([]);
  }, [filters.mode, filters.isPinned, filters.search]);

  const fetchSessions = useCallback(
    async (append = false) => {
      if (!enabled || isLoadingRef.current || (append && !hasMoreRef.current)) {
        return;
      }

      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(),
        };

        const accessToken = getAccessToken();
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const query = `
          query GetChatSessions(
            $limit: Int
            $offset: Int
            $mode: ChatMode
            $search: String
            $isPinned: Boolean
            $sortBy: String
            $sortOrder: String
          ) {
            chatSessions(
              limit: $limit
              offset: $offset
              mode: $mode
              search: $search
              isPinned: $isPinned
              sortBy: $sortBy
              sortOrder: $sortOrder
            ) {
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

        const variables: Record<string, unknown> = {
          limit,
          offset: append ? offsetRef.current : 0,
          sortBy: 'lastMessageAt',
          sortOrder: 'DESC',
        };

        if (filters.mode) variables.mode = filters.mode;
        if (filters.search) variables.search = filters.search;
        if (filters.isPinned !== undefined) variables.isPinned = filters.isPinned;

        const response = await fetch(GRAPHQL_URL, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ query, variables }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message || 'GraphQL error');
        }

        const newSessions = result.data?.chatSessions || [];

        if (append) {
          setSessions((prev) => [...prev, ...newSessions]);
          offsetRef.current += newSessions.length;
        } else {
          setSessions(newSessions);
          offsetRef.current = newSessions.length;
        }

        hasMoreRef.current = newSessions.length === limit;
        setTotalCount((prev) => (append ? prev : newSessions.length));
      } catch (err) {
        const errorObj =
          err instanceof Error ? err : new Error('Failed to fetch chat sessions');
        setError(errorObj);
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    },
    [enabled, filters, limit],
  );

  // Initial fetch
  useEffect(() => {
    fetchSessions(false);
  }, [fetchSessions]);

  const refetch = useCallback(() => {
    offsetRef.current = 0;
    hasMoreRef.current = true;
    fetchSessions(false);
  }, [fetchSessions]);

  const fetchNextPage = useCallback(() => {
    fetchSessions(true);
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    error,
    refetch,
    hasNextPage: hasMoreRef.current,
    fetchNextPage,
    totalCount,
  };
}

export interface ChatMessage {
  messageId: string;
  sessionId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  rawContent: string | null;
  citations: Array<{
    source: string;
    url: string | null;
    article: string | null;
    excerpt: string | null;
  }> | null;
  metadata: {
    confidence: number | null;
    model: string | null;
    queryType: string | null;
    keyTerms: string[] | null;
    language: string | null;
  } | null;
  sequenceOrder: number;
  createdAt: string;
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}

/**
 * Hook for fetching a single chat session with its messages
 */
export function useChatSession(sessionId: string | null) {
  const [session, setSession] = useState<ChatSessionWithMessages | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      return;
    }

    const fetchSession = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(),
        };

        const accessToken = getAccessToken();
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        // Fetch session and messages in parallel
        const [sessionResponse, messagesResponse] = await Promise.all([
          fetch(GRAPHQL_URL, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({
              query: `
                query GetChatSession($sessionId: ID!) {
                  chatSessionDetail(sessionId: $sessionId) {
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
              `,
              variables: { sessionId },
            }),
          }),
          fetch(GRAPHQL_URL, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({
              query: `
                query GetChatMessages($sessionId: ID!) {
                  chatMessages(sessionId: $sessionId) {
                    messageId
                    sessionId
                    role
                    content
                    rawContent
                    citations {
                      source
                      url
                      article
                      excerpt
                    }
                    metadata {
                      confidence
                      model
                      queryType
                      keyTerms
                      language
                    }
                    sequenceOrder
                    createdAt
                  }
                }
              `,
              variables: { sessionId },
            }),
          }),
        ]);

        if (!sessionResponse.ok || !messagesResponse.ok) {
          throw new Error(`HTTP error! status: ${sessionResponse.status || messagesResponse.status}`);
        }

        const sessionResult = await sessionResponse.json();
        const messagesResult = await messagesResponse.json();

        if (sessionResult.errors?.length > 0) {
          throw new Error(sessionResult.errors[0].message || 'GraphQL error');
        }

        if (messagesResult.errors?.length > 0) {
          throw new Error(messagesResult.errors[0].message || 'GraphQL error');
        }

        const sessionData = sessionResult.data?.chatSessionDetail;
        const messagesData = messagesResult.data?.chatMessages || [];

        if (!sessionData) {
          throw new Error('Session not found');
        }

        // Combine session with messages
        setSession({
          ...sessionData,
          messages: messagesData.sort((a: ChatMessage, b: ChatMessage) => a.sequenceOrder - b.sequenceOrder),
        });
      } catch (err) {
        const errorObj =
          err instanceof Error ? err : new Error('Failed to fetch chat session');
        setError(errorObj);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  return { session, isLoading, error };
}
