'use client';

import { useState, useCallback } from 'react';
import { getAccessToken } from '@/providers/auth-provider/auth-provider.client';
import { getCsrfHeaders } from '@/lib/csrf';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

interface Citation {
  source: string;
  url?: string;
  excerpt?: string;
  article?: string;
}

interface ChatResponse {
  answerMarkdown: string;
  citations: Citation[];
}

export type ChatMode = 'LAWYER' | 'SIMPLE';

interface UseChatReturn {
  sendMessage: (question: string, mode?: ChatMode) => Promise<ChatResponse>;
  isLoading: boolean;
  error: string | null;
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
}

/**
 * useChat Hook
 *
 * Custom hook for managing chat interactions with the backend.
 * Handles GraphQL mutations for sending questions and receiving answers.
 * Supports mode selection between LAWYER (detailed) and SIMPLE (layperson-friendly).
 */
export function useChat(): UseChatReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ChatMode>('LAWYER');

  const sendMessage = useCallback(
    async (question: string, selectedMode?: ChatMode): Promise<ChatResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(), // Include CSRF token for mutations
        };

        // Include access token if available
        const accessToken = getAccessToken();
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        // Get session ID from localStorage or generate a new one (UUID v4 format)
        let sessionId = localStorage.getItem('chat_session_id');
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          localStorage.setItem('chat_session_id', sessionId);
        }

        const mutation = `
          mutation AskLegalQuestion($input: AskLegalQuestionInput!) {
            askLegalQuestion(input: $input) {
              id
              question
              answerMarkdown
              citations {
                source
                url
                excerpt
                article
              }
              sessionId
              createdAt
              updatedAt
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
              input: {
                question,
                sessionId,
                mode: selectedMode || mode, // Use provided mode or current mode
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

        const data = result.data?.askLegalQuestion;

        if (!data) {
          throw new Error('No data returned from server');
        }

        return {
          answerMarkdown: data.answerMarkdown || '',
          citations: data.citations || [],
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [mode],
  );

  return {
    sendMessage,
    isLoading,
    error,
    mode,
    setMode,
  };
}
