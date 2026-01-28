'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAccessToken } from '@/providers/auth-provider/auth-provider.client';
import { getCsrfHeaders } from '@/lib/csrf';
import type { ChatMessage } from '@/components/chat/chat-interface';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

interface ChatSession {
  id: string;
  title: string | null;
  mode: 'LAWYER' | 'SIMPLE';
  messageCount: number;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  deletedAt: Date | null;
}

interface ChatMessageFromBackend {
  messageId: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
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
  createdAt: Date;
}

interface SessionRestorationResult {
  session: ChatSession | null;
  messages: ChatMessage[];
  error: string | null;
}

interface UseChatSessionRestorationReturn {
  isRestoring: boolean;
  restorationError: string | null;
  restoredSession: ChatSession | null;
  restoreSession: (sessionId: string) => Promise<SessionRestorationResult>;
}

/**
 * Hook for restoring chat sessions from URL parameters.
 * Fetches session details and messages from the backend.
 */
export function useChatSessionRestoration(): UseChatSessionRestorationReturn {
  const searchParams = useSearchParams();
  const [isRestoring, setIsRestoring] = useState(false);
  const [restorationError, setRestorationError] = useState<string | null>(null);
  const [restoredSession, setRestoredSession] = useState<ChatSession | null>(null);
  const hasRestoredRef = useRef(false);

  const restoreSession = useCallback(async (sessionId: string): Promise<SessionRestorationResult> => {
    setIsRestoring(true);
    setRestorationError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getCsrfHeaders(),
      };

      const accessToken = getAccessToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Fetch both session details and messages in parallel
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
                  lastMessageAt
                  createdAt
                  updatedAt
                  isPinned
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
        throw new Error('Failed to fetch session data');
      }

      const sessionResult = await sessionResponse.json();
      const messagesResult = await messagesResponse.json();

      if (sessionResult.errors?.length > 0) {
        throw new Error(sessionResult.errors[0].message || 'Failed to load session');
      }

      if (messagesResult.errors?.length > 0) {
        throw new Error(messagesResult.errors[0].message || 'Failed to load messages');
      }

      const sessionData = sessionResult.data?.chatSessionDetail;
      const messagesData = messagesResult.data?.chatMessages as ChatMessageFromBackend[];

      if (!sessionData) {
        throw new Error('Session not found');
      }

      // Transform backend messages to frontend ChatMessage format
      const transformedMessages: ChatMessage[] = (messagesData || [])
        .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
        .map((msg) => ({
          id: msg.messageId,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          citations: msg.citations?.map((c) => ({
            source: c.source,
            url: c.url || undefined,
            article: c.article || undefined,
            excerpt: c.excerpt || '',
          })) || undefined,
          timestamp: new Date(msg.createdAt),
        }));

      setRestoredSession(sessionData);
      setIsRestoring(false);

      return {
        session: sessionData,
        messages: transformedMessages,
        error: null,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore session';
      setRestorationError(errorMessage);
      setIsRestoring(false);
      return {
        session: null,
        messages: [],
        error: errorMessage,
      };
    }
  }, []);

  // Auto-restore session from URL params on mount
  useEffect(() => {
    if (hasRestoredRef.current) return;

    const sessionIdFromUrl = searchParams.get('session');
    if (sessionIdFromUrl) {
      hasRestoredRef.current = true;
      restoreSession(sessionIdFromUrl);
    }
  }, [searchParams, restoreSession]);

  return {
    isRestoring,
    restorationError,
    restoredSession,
    restoreSession,
  };
}
