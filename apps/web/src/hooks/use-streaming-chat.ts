'use client';

import { useState, useCallback, useRef } from 'react';
import { getAccessToken } from '@/providers/auth-provider/auth-provider.client';

const AI_ENGINE_URL = process.env.NEXT_PUBLIC_AI_ENGINE_URL || 'http://localhost:8000';

// Chat response types
export interface StreamChatCitation {
  source: string;
  article: string;
  url?: string;
}

export interface ClarificationQuestion {
  question: string;
  question_type: string;
  options?: string[];
  hint?: string;
}

export interface ClarificationInfo {
  needs_clarification: boolean;
  questions: ClarificationQuestion[];
  context_summary: string;
  next_steps: string;
  sessionId?: string;
  currentRound?: number;
  totalRounds?: number;
}

export interface StreamChunk {
  content: string;
  done: boolean;
  metadata?: {
    type?: string;
    citations?: StreamChatCitation[];
    confidence?: number;
    processing_time_ms?: number;
    error?: string;
  };
}

export interface StreamChatResponse {
  answerMarkdown: string;
  citations: StreamChatCitation[];
  confidence: number;
  clarification?: ClarificationInfo;
}

export type ChatMode = 'LAWYER' | 'SIMPLE';

interface UseStreamingChatReturn {
  sendMessage: (
    question: string,
    mode?: ChatMode,
    onChunk?: (chunk: string) => void,
  ) => Promise<StreamChatResponse>;
  isLoading: boolean;
  error: string | null;
  abort: () => void;
}

/**
 * useStreamingChat Hook
 *
 * Custom hook for managing streaming chat interactions with the AI Engine.
 * Communicates directly with AI Engine using Server-Sent Events (SSE).
 * Supports JWT authentication for user identification.
 *
 * DEPRECATED: This is a simplified streaming hook for temporary use.
 * For proper chat session persistence, use the main useStreamingChat hook instead.
 */
export function useStreamingChat(): UseStreamingChatReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (
      question: string,
      selectedMode: ChatMode = 'LAWYER',
      onChunk?: (chunk: string) => void,
    ): Promise<StreamChatResponse> => {
      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoading(true);
      setError(null);

      // CRITICAL: Session ID management
      // This is a simplified streaming hook that doesn't support persistent sessions.
      // For proper chat session persistence, use the main useStreamingChat hook instead.
      // This hook is deprecated for use in the main chat interface.

      // Prepare headers with JWT token
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      try {
        // Make streaming request to AI Engine
        const response = await fetch(`${AI_ENGINE_URL}/api/v1/qa/stream`, {
          method: 'POST',
          headers,
          signal: abortController.signal,
          body: JSON.stringify({
            question,
            mode: selectedMode,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail?.message || `HTTP error! status: ${response.status}`);
        }

        // Process Server-Sent Events
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Response body is not readable');
        }

        let fullAnswer = '';
        let citations: StreamChatCitation[] = [];
        let confidence = 0;
        let clarification: ClarificationInfo | undefined;

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data: StreamChunk = JSON.parse(line.slice(6));

                // Handle content chunks
                if (data.content && !data.done) {
                  fullAnswer += data.content;
                  if (onChunk) {
                    onChunk(data.content);
                  }
                }

                // Handle final chunk with metadata
                if (data.done && data.metadata) {
                  citations = data.metadata.citations || [];
                  confidence = data.metadata.confidence || 0;

                  // Handle error in metadata
                  if (data.metadata.type === 'error' && data.metadata.error) {
                    throw new Error(data.metadata.error);
                  }
                }
              } catch (e) {
                // Skip invalid JSON lines
                console.warn('Failed to parse SSE chunk:', line);
              }
            }
          }
        }

        return {
          answerMarkdown: fullAnswer,
          citations,
          confidence,
          clarification,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.name === 'AbortError'
              ? 'Request cancelled'
              : err.message
            : 'Failed to send message';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [],
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  return {
    sendMessage,
    isLoading,
    error,
    abort,
  };
}
