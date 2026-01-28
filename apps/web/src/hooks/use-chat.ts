'use client';

import { useState, useCallback } from 'react';
import { getAccessToken } from '@/providers/auth-provider/auth-provider.client';
import { getCsrfHeaders } from '@/lib/csrf';
import {
  AskLegalQuestionDocument,
  type AskLegalQuestionMutationVariables,
  type LegalQueryFragmentFragment,
} from '@/generated/graphql';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

// Chat response types using generated GraphQL types
export type ChatCitation = NonNullable<LegalQueryFragmentFragment['citations']>[number];

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

// Clarification Session types (matching backend schema)
export type ClarificationState = 'PENDING' | 'ANSWERED' | 'COMPLETE' | 'CANCELLED' | 'EXPIRED';

export interface ClarificationAnswer {
  question: string;
  answer: string;
  question_type: string;
  answered_at?: Date;
}

export interface ClarificationSessionData {
  id: string;
  state: ClarificationState;
  originalQuery: string;
  questionsAsked: string[];
  answersReceived: ClarificationAnswer[];
  rounds: number;
  accumulatedContext?: string[];
  finalQueryId?: string;
  completedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatResponse {
  answerMarkdown: string;
  citations: ChatCitation[];
  clarification?: ClarificationInfo;
  clarificationSession?: string; // Session ID if a clarification session was created
  queryType?: string | null;
  keyTerms?: string[] | null;
  confidence?: number | null;
}

export type ChatMode = 'LAWYER' | 'SIMPLE';

interface UseChatReturn {
  sendMessage: (question: string, mode?: ChatMode) => Promise<ChatResponse>;
  sendClarificationResponse: (
    clarificationAnswers: Record<string, string>,
  ) => Promise<ChatResponse>;
  submitClarificationAnswers: (
    sessionId: string,
    answers: ClarificationAnswer[],
    additionalContext?: string[],
  ) => Promise<ClarificationSessionData>;
  cancelClarificationSession: (sessionId: string) => Promise<ClarificationSessionData>;
  getClarificationSession: (queryId: string) => Promise<ClarificationSessionData | null>;
  isLoading: boolean;
  error: string | null;
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
  clarificationState: ClarificationInfo | null;
  clarificationSession: ClarificationSessionData | null;
  isInClarificationMode: boolean;
}

/**
 * useChat Hook
 *
 * Custom hook for managing chat interactions with the backend.
 * Handles GraphQL mutations for sending questions and receiving answers.
 * Supports mode selection between LAWYER (detailed) and SIMPLE (layperson-friendly).
 * Supports multi-turn clarification when the AI needs more information.
 */
export function useChat(): UseChatReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ChatMode>('LAWYER');
  const [clarificationState, setClarificationState] = useState<ClarificationInfo | null>(null);
  const [clarificationSession, setClarificationSession] = useState<ClarificationSessionData | null>(
    null,
  );

  const sendMessage = useCallback(
    async (question: string, selectedMode?: ChatMode): Promise<ChatResponse> => {
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

        // WARNING: Do NOT use localStorage for chat session management.
        // Session IDs must be managed by the backend only to ensure data consistency.
        // All chat data is persisted via the backend GraphQL API.

        const inputVariables: AskLegalQuestionMutationVariables = {
          input: {
            question,
            mode: selectedMode || mode,
          },
        };

        const response = await fetch(GRAPHQL_URL, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            query: AskLegalQuestionDocument,
            variables: inputVariables,
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

        // WARNING: Session ID is managed by backend only - do NOT store in localStorage
        const chatResponse: ChatResponse = {
          answerMarkdown: data.answerMarkdown || '',
          citations: data.citations || [],
          clarification: data.clarificationInfo,
          queryType: data.queryType,
          keyTerms: data.keyTerms,
          confidence: data.confidence,
        };

        // Update clarification state if present
        if (data.clarificationInfo?.needs_clarification) {
          setClarificationState({
            ...data.clarificationInfo,
            sessionId: data.id, // Use query ID as reference
          });
        } else {
          setClarificationState(null);
        }

        return chatResponse;
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

  const sendClarificationResponse = useCallback(
    async (clarificationAnswers: Record<string, string>): Promise<ChatResponse> => {
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

        // WARNING: Do NOT use localStorage for chat session management.
        // Session IDs must be managed by the backend only.

        // Build a follow-up message with the clarification answers
        const answerText = Object.entries(clarificationAnswers)
          .filter(([_, value]) => value.trim())
          .map(([question, answer]) => `${question}: ${answer}`)
          .join('\n');

        const inputVariables: AskLegalQuestionMutationVariables = {
          input: {
            question: `Here are the answers to your questions:\n\n${answerText}`,
            mode,
          },
        };

        const response = await fetch(GRAPHQL_URL, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            query: AskLegalQuestionDocument,
            variables: inputVariables,
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

        const chatResponse: ChatResponse = {
          answerMarkdown: data.answerMarkdown || '',
          citations: data.citations || [],
          clarification: data.clarificationInfo,
          queryType: data.queryType,
          keyTerms: data.keyTerms,
          confidence: data.confidence,
        };

        // Update clarification state
        if (data.clarificationInfo?.needs_clarification) {
          setClarificationState(data.clarificationInfo);
        } else {
          setClarificationState(null);
        }

        return chatResponse;
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

  /**
   * Submit answers to a clarification session
   * Uses the dedicated submitClarificationAnswers mutation
   */
  const submitClarificationAnswers = useCallback(
    async (
      sessionId: string,
      answers: ClarificationAnswer[],
      additionalContext?: string[],
    ): Promise<ClarificationSessionData> => {
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

        const mutation = `
          mutation SubmitClarificationAnswers($input: SubmitClarificationAnswersInput!) {
            submitClarificationAnswers(input: $input) {
              id
              state
              originalQuery
              questionsAsked
              answersReceived {
                question
                answer
                question_type
              }
              rounds
              accumulatedContext
              finalQueryId
              completedAt
              expiresAt
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
                sessionId,
                answers,
                additionalContext,
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

        const sessionData = result.data?.submitClarificationAnswers;
        if (!sessionData) {
          throw new Error('No session data returned');
        }

        // Update local session state
        setClarificationSession(sessionData);

        // If session is complete, clear clarification state
        if (sessionData.state === 'COMPLETE' || sessionData.state === 'CANCELLED') {
          setClarificationState(null);
        }

        return sessionData;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to submit clarification answers';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Cancel an active clarification session
   */
  const cancelClarificationSession = useCallback(
    async (sessionId: string): Promise<ClarificationSessionData> => {
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

        const mutation = `
          mutation CancelClarificationSession($input: CancelClarificationSessionInput!) {
            cancelClarificationSession(input: $input) {
              id
              state
              originalQuery
              questionsAsked
              answersReceived {
                question
                answer
                question_type
              }
              rounds
              accumulatedContext
              finalQueryId
              completedAt
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
              input: { sessionId },
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

        const sessionData = result.data?.cancelClarificationSession;
        if (!sessionData) {
          throw new Error('No session data returned');
        }

        setClarificationSession(sessionData);
        setClarificationState(null);

        return sessionData;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to cancel clarification session';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Get active clarification session for a query
   */
  const getClarificationSession = useCallback(
    async (queryId: string): Promise<ClarificationSessionData | null> => {
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
          query GetClarificationSessionByQuery($queryId: ID!) {
            clarificationSessionByQuery(queryId: $queryId) {
              id
              state
              originalQuery
              questionsAsked
              answersReceived {
                question
                answer
                question_type
              }
              rounds
              accumulatedContext
              finalQueryId
              completedAt
              expiresAt
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
            query,
            variables: { queryId },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message || 'GraphQL error');
        }

        const sessionData = result.data?.clarificationSessionByQuery;
        if (sessionData) {
          setClarificationSession(sessionData);
        }

        return sessionData || null;
      } catch (err) {
        console.error('Failed to get clarification session:', err);
        return null;
      }
    },
    [],
  );

  // Computed property for clarification mode
  const isInClarificationMode = clarificationState?.needs_clarification === true;

  return {
    sendMessage,
    sendClarificationResponse,
    submitClarificationAnswers,
    cancelClarificationSession,
    getClarificationSession,
    isLoading,
    error,
    mode,
    setMode,
    clarificationState,
    clarificationSession,
    isInClarificationMode,
  };
}
