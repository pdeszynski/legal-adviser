'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { getAccessToken } from '@/providers/auth-provider/auth-provider.client';
import type { ChatCitation, ClarificationInfo } from './use-chat';
import type { ClarificationQuestion } from './use-chat';
import { getCsrfHeaders } from '@/lib/csrf';
import {
  detectStreamErrorType,
  isRetryableError,
  calculateBackoffDelay,
  delay,
  shouldUseFallback,
  buildErrorResponse,
  logStreamError,
  logStreamCompletion,
  hasStreamTimedOut,
  updateActivity,
  DEFAULT_RETRY_CONFIG,
} from './streaming/streaming-error-handler';
import type {
  StreamErrorContext,
  StreamErrorResponse,
  RetryConfig,
  ReconnectionState,
} from './streaming/streaming-error-handler';

// Re-export types for convenience
export type { StreamErrorResponse } from './streaming/streaming-error-handler';

const AI_ENGINE_URL = process.env.NEXT_PUBLIC_AI_ENGINE_URL || 'http://localhost:8000';
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

/**
 * Build conversation metadata for Langfuse observability
 */
function buildConversationMetadata(
  conversationHistory: Array<{ role: string; content: string }> | null,
): {
  message_count: number;
  is_first_message: boolean;
  language: string;
  locale: string;
  user_agent: string;
  platform: string;
} {
  const messageCount = (conversationHistory?.length || 0) + 1; // +1 for current message
  const isFirstMessage = !conversationHistory || conversationHistory.length === 0;

  // Detect language from browser
  const language = navigator.language.split('-')[0] || 'en';
  const locale = navigator.language || 'en-US';

  // Get user agent
  const userAgent = navigator.userAgent;

  // Detect platform
  let platform = 'web';
  if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
    platform = 'mobile';
  } else if (/Tablet|iPad/i.test(userAgent)) {
    platform = 'tablet';
  } else if (/Win|Mac|Linux/i.test(userAgent)) {
    platform = 'desktop';
  }

  return {
    message_count: messageCount,
    is_first_message: isFirstMessage,
    language,
    locale,
    user_agent: userAgent,
    platform,
  };
}

/**
 * Save a user message to the backend via GraphQL mutation
 */
async function saveUserMessageToBackend(
  sessionId: string,
  content: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return { success: false, error: 'No authentication token' };
  }

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...getCsrfHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify({
        query: `
          mutation SaveUserMessage($input: SaveChatMessageInput!) {
            saveChatMessage(input: $input) {
              messageId
              sessionId
              role
              content
              sequenceOrder
              createdAt
            }
          }
        `,
        variables: {
          input: {
            sessionId,
            content,
            role: 'USER',
          },
        },
      }),
    });

    if (!response.ok) {
      console.error('Failed to save user message:', response.status);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
      console.error('GraphQL errors saving user message:', result.errors);
      return { success: false, error: result.errors[0].message };
    }

    return {
      success: true,
      messageId: result.data?.saveChatMessage?.messageId,
    };
  } catch (error) {
    console.error('Error saving user message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Save an assistant message to the backend via GraphQL mutation
 */
async function saveAssistantMessageToBackend(
  sessionId: string,
  content: string,
  citations: ChatCitation[] | null,
  metadata: {
    confidence?: number;
    queryType?: string;
    keyTerms?: string[];
  } | null,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return { success: false, error: 'No authentication token' };
  }

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...getCsrfHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify({
        query: `
          mutation SaveAssistantMessage($input: SaveChatMessageInput!) {
            saveChatMessage(input: $input) {
              messageId
              sessionId
              role
              content
              sequenceOrder
              createdAt
            }
          }
        `,
        variables: {
          input: {
            sessionId,
            content,
            role: 'ASSISTANT',
            citations: citations || [],
            metadata: metadata || {},
          },
        },
      }),
    });

    if (!response.ok) {
      console.error('Failed to save assistant message:', response.status);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
      console.error('GraphQL errors saving assistant message:', result.errors);
      return { success: false, error: result.errors[0].message };
    }

    return {
      success: true,
      messageId: result.data?.saveChatMessage?.messageId,
    };
  } catch (error) {
    console.error('Error saving assistant message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Stream event types from AI Engine
type StreamEventType = 'token' | 'citation' | 'error' | 'done' | 'clarification';

interface StreamEvent {
  type: StreamEventType;
  content: string;
  metadata: Record<string, unknown>;
}

interface StreamCitation {
  source: string;
  article: string;
  url?: string;
}

interface DoneMetadata {
  citations: StreamCitation[];
  confidence: number;
  processing_time_ms: number;
  query_type?: string;
  key_terms?: string[];
  suggested_title?: string;
}

interface StreamError {
  error: string;
  error_code?: string;
}

export interface StreamingChatResponse {
  content: string;
  citations: ChatCitation[];
  clarification?: ClarificationInfo;
  queryType?: string;
  keyTerms?: string[];
  confidence?: number;
  error?: string;
  errorResponse?: StreamErrorResponse;
  partial?: boolean;
  fellBack?: boolean;
  suggestedTitle?: string;
}

export interface UseStreamingChatOptions {
  /** Enable/disable streaming (default: true) */
  enabled?: boolean;
  /** Fallback to GraphQL if streaming fails (default: true) */
  fallbackToGraphQL?: boolean;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Retry configuration */
  retryConfig?: Partial<RetryConfig>;
  /** Callback when stream starts */
  onStreamStart?: () => void;
  /** Callback when each token is received */
  onToken?: (token: string) => void;
  /** Callback when citation is received */
  onCitation?: (citation: StreamCitation) => void;
  /** Callback when stream completes */
  onStreamEnd?: (response: StreamingChatResponse) => void;
  /** Callback when stream errors */
  onStreamError?: (error: string, errorResponse: StreamErrorResponse) => void;
  /** Callback when clarification is received */
  onClarification?: (clarification: ClarificationInfo) => void;
  /** Callback when retrying */
  onRetry?: (attempt: number, delayMs: number) => void;
  /** Callback when connection is lost */
  onConnectionLost?: () => void;
  /** Callback when fallback occurs */
  onFallback?: () => void;
}

export interface UseStreamingChatReturn {
  /** Send a message with streaming response */
  sendMessage: (
    question: string,
    mode: 'LAWYER' | 'SIMPLE',
    sessionId?: string,
  ) => Promise<StreamingChatResponse>;
  /** Send clarification answers with streaming response */
  sendClarificationAnswers: (
    originalQuestion: string,
    answers: Array<{ question: string; question_type: string; answer: string }>,
    mode: 'LAWYER' | 'SIMPLE',
    sessionId: string,
  ) => Promise<StreamingChatResponse>;
  /** Abort the current stream */
  abortStream: () => void;
  /** Retry the last failed request */
  retryLastRequest: () => Promise<StreamingChatResponse | null>;
  /** Whether a stream is currently active */
  isStreaming: boolean;
  /** Whether reconnection is in progress */
  isReconnecting: boolean;
  /** Current error message */
  error: string | null;
  /** Current error response */
  errorResponse: StreamErrorResponse | null;
  /** Current accumulated content during streaming */
  currentContent: string;
  /** Current citations during streaming */
  currentCitations: StreamCitation[];
  /** Whether response was a fallback */
  wasFallback: boolean;
  /** Reconnection state */
  reconnectionState: ReconnectionState | null;
  /** Current clarification being received */
  currentClarification: ClarificationInfo | null;
}

/**
 * useStreamingChat Hook
 *
 * Enhanced streaming hook with comprehensive error handling:
 * - Automatic retry with exponential backoff (max 3 retries)
 * - Fallback to GraphQL if streaming fails
 * - Timeout handling (30s inactivity)
 * - Partial response preservation
 * - Connection loss detection
 * - Sentry error logging with context
 * - User-friendly error messages
 *
 * @example
 * ```tsx
 * const { sendMessage, isStreaming, abortStream, retryLastRequest } = useStreamingChat({
 *   onStreamError: (error, response) => console.log('Error:', error, response),
 *   onRetry: (attempt, delay) => console.log(`Retry ${attempt} in ${delay}ms`),
 * });
 * ```
 */
export function useStreamingChat(options: UseStreamingChatOptions = {}): UseStreamingChatReturn {
  const {
    enabled = true,
    fallbackToGraphQL = true,
    maxRetries = 3,
    retryConfig: partialRetryConfig,
    onStreamStart,
    onToken,
    onCitation,
    onStreamEnd,
    onStreamError,
    onRetry,
    onConnectionLost,
    onFallback,
    onClarification,
  } = options;

  const retryConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...partialRetryConfig, maxRetries };

  const [isStreaming, setIsStreaming] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorResponse, setErrorResponse] = useState<StreamErrorResponse | null>(null);
  const [currentContent, setCurrentContent] = useState('');
  const [currentCitations, setCurrentCitations] = useState<StreamCitation[]>([]);
  const [wasFallback, setWasFallback] = useState(false);
  const [reconnectionState, setReconnectionState] = useState<ReconnectionState | null>(null);
  const [currentClarification, setCurrentClarification] = useState<ClarificationInfo | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<{ question: string; mode: 'LAWYER' | 'SIMPLE'; sessionId: string } | null>(
    null,
  );
  const activityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);

  /**
   * Clear activity timeout
   */
  const clearActivityTimeout = useCallback(() => {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = null;
    }
  }, []);

  /**
   * Setup activity timeout to detect stale streams
   */
  const setupActivityTimeout = useCallback(() => {
    clearActivityTimeout();
    activityTimeoutRef.current = setTimeout(() => {
      // If we're still streaming but haven't received data in 30s, abort
      if (abortControllerRef.current && isStreaming) {
        onConnectionLost?.();
        abortControllerRef.current.abort();
        setError('Stream timed out - no activity for 30 seconds');
      }
    }, 30000); // 30 second timeout
  }, [isStreaming, onConnectionLost, clearActivityTimeout]);

  /**
   * Parse an SSE line into a StreamEvent
   */
  const parseEventLine = useCallback((line: string): StreamEvent | null => {
    if (!line.startsWith('data: ')) return null;

    try {
      const jsonStr = line.slice(6);
      const data = JSON.parse(jsonStr) as StreamEvent;
      return data;
    } catch {
      return null;
    }
  }, []);

  /**
   * Detect if token content contains a clarification JSON
   * Clarification JSON has format: {"type":"clarification","questions":[...],...}
   */
  const isClarificationJson = useCallback((content: string): boolean => {
    const trimmed = content.trim();
    return trimmed.startsWith('{"type":"clarification"') ||
           trimmed.startsWith('{"type": "clarification"');
  }, []);

  /**
   * Parse clarification JSON from token content
   */
  const parseClarificationFromToken = useCallback((content: string): ClarificationInfo | null => {
    try {
      const data = JSON.parse(content);
      if (data.type === 'clarification' && Array.isArray(data.questions)) {
        return {
          needs_clarification: true,
          questions: (data.questions as Array<{question: string; question_type?: string; options?: string[]; hint?: string}>).map(q => ({
            question: q.question,
            question_type: q.question_type || 'text',
            options: q.options,
            hint: q.hint,
          })),
          context_summary: data.context_summary || '',
          next_steps: data.next_steps || '',
        };
      }
    } catch {
      // Not valid JSON or not a clarification object
    }
    return null;
  }, []);

  /**
   * Process a single stream event
   */
  const processEvent = useCallback(
    (event: StreamEvent): Partial<StreamingChatResponse> | null => {
      switch (event.type) {
        case 'token':
          const tokenContent = event.content;

          // Check if this token contains clarification JSON
          if (isClarificationJson(tokenContent)) {
            const clarification = parseClarificationFromToken(tokenContent);
            if (clarification) {
              // Trigger callback and return clarification, NOT as content
              onClarification?.(clarification);
              return { clarification };
            }
          }

          onToken?.(tokenContent);
          return { content: tokenContent };

        case 'citation':
          const citation: StreamCitation = {
            source: event.metadata.source as string,
            article: event.metadata.article as string,
            url: event.metadata.url as string | undefined,
          };
          onCitation?.(citation);
          return { citations: [citation] };

        case 'error':
          const errorData = event.metadata as unknown as StreamError;
          const errorMsg = errorData.error || 'Unknown error';
          return { error: errorMsg };

        case 'clarification':
          try {
            const clarificationData = JSON.parse(event.content);
            return {
              clarification: {
                needs_clarification: true,
                questions: clarificationData.questions || [],
                context_summary: clarificationData.context_summary || '',
                next_steps: clarificationData.next_steps || '',
              },
            };
          } catch {
            return null;
          }

        case 'done':
          const metadata = event.metadata as unknown as DoneMetadata;
          return {
            citations: metadata.citations,
            confidence: metadata.confidence,
            queryType: metadata.query_type,
            keyTerms: metadata.key_terms,
            suggestedTitle: metadata.suggested_title,
          };

        default:
          return null;
      }
    },
    [onToken, onCitation, onClarification, isClarificationJson, parseClarificationFromToken],
  );

  /**
   * Fetch conversation history from backend for a session
   */
  const fetchConversationHistory = useCallback(async (sessionId: string): Promise<Array<{ role: string; content: string }> | null> => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.warn('[fetchConversationHistory] No access token available');
      return null;
    }

    try {
      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            query GetChatMessages($sessionId: ID!) {
              chatMessages(sessionId: $sessionId) {
                role
                content
                sequenceOrder
              }
            }
          `,
          variables: { sessionId },
        }),
      });

      if (!response.ok) {
        console.warn('[fetchConversationHistory] Response not OK:', response.status, response.statusText);
        return null;
      }

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        console.warn('[fetchConversationHistory] GraphQL errors:', result.errors);
        return null;
      }

      const messages = result.data?.chatMessages;
      if (!messages || !Array.isArray(messages)) {
        console.warn('[fetchConversationHistory] No messages found in response');
        return null;
      }

      // Transform to AI Engine format: {role, content}
      // Map MessageRole enum (USER/ASSISTANT) to 'user'/'assistant'
      const history = messages
        .sort((a: { sequenceOrder: number }, b: { sequenceOrder: number }) => a.sequenceOrder - b.sequenceOrder)
        .map((msg: { role: string; content: string }) => ({
          role: msg.role === 'USER' ? 'user' : 'assistant',
          content: msg.content,
        }));

      console.log('[fetchConversationHistory] Fetched', history.length, 'messages for session', sessionId);
      return history;
    } catch (error) {
      console.error('[fetchConversationHistory] Error fetching conversation history:', error);
      return null;
    }
  }, []);

  /**
   * Fallback to GraphQL mutation when streaming fails
   */
  const fallbackSendMessage = useCallback(
    async (
      question: string,
      mode: 'LAWYER' | 'SIMPLE',
      sessionId: string,
    ): Promise<StreamingChatResponse> => {
      onFallback?.();
      setWasFallback(true);

      const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getCsrfHeaders(),
      };

      const accessToken = getAccessToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
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
            clarificationInfo {
              needs_clarification
              questions
              context_summary
              next_steps
            }
            queryType
            keyTerms
            confidence
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
              mode,
              sessionId,
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

      // WARNING: Session ID is managed by backend only - do NOT store in localStorage

      return {
        content: data.answerMarkdown || '',
        citations: data.citations || [],
        clarification: data.clarificationInfo || undefined,
        queryType: data.queryType,
        keyTerms: data.keyTerms,
        confidence: data.confidence,
        fellBack: true,
      };
    },
    [onFallback],
  );

  /**
   * Execute streaming request with retry logic
   */
  const executeStreamRequest = useCallback(
    async (
      question: string,
      mode: 'LAWYER' | 'SIMPLE',
      sessionId: string,
      retryAttempt = 0,
    ): Promise<StreamingChatResponse> => {
      startTimeRef.current = Date.now();

      // Get JWT token for authentication
      const accessToken = getAccessToken();
      const userId = accessToken ? (parseJwt(accessToken)?.sub as string) : undefined;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Fetch conversation history from backend (only on first attempt, not retries)
      let conversationHistory: Array<{ role: string; content: string }> | null = null;
      if (retryAttempt === 0) {
        conversationHistory = await fetchConversationHistory(sessionId);
        if (conversationHistory && conversationHistory.length > 0) {
          // Exclude the last message if it's a user message with the same content
          // (to avoid duplicating the current question)
          const lastMessage = conversationHistory[conversationHistory.length - 1];
          if (lastMessage && lastMessage.role === 'user' && lastMessage.content === question) {
            console.log('[executeStreamRequest] Removing last message from history as it matches current question');
            conversationHistory = conversationHistory.slice(0, -1);
          }
        }
      }

      // Build request body with conversation history
      const requestBody = {
        question,
        mode,
        session_id: sessionId,
        ...(conversationHistory && conversationHistory.length > 0
          ? { conversation_history: conversationHistory }
          : {}),
        // Add conversation metadata for Langfuse observability
        conversation_metadata: buildConversationMetadata(conversationHistory),
      };

      console.log('[executeStreamRequest] Sending request to AI Engine:', {
        sessionId,
        questionLength: question.length,
        conversationHistoryLength: conversationHistory?.length || 0,
        hasConversationHistory: !!conversationHistory && conversationHistory.length > 0,
        conversationMetadata: requestBody.conversation_metadata,
      });

      // Create abort controller for this attempt
      abortControllerRef.current = new AbortController();

      try {
        // Fetch with streaming (using POST with JSON body)
        const response = await fetch(`${AI_ENGINE_URL}/api/v1/qa/ask-stream`, {
          method: 'POST',
          headers,
          signal: abortControllerRef.current.signal,
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check for SSE content type
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('text/event-stream')) {
          throw new Error('Invalid response type: expected text/event-stream');
        }

        // Read the stream
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body reader available');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let finalResponse: StreamingChatResponse = {
          content: '',
          citations: [],
        };

        // Setup activity timeout
        setupActivityTimeout();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            // Update activity timeout on each chunk
            setupActivityTimeout();

            // Decode chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete lines
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim()) continue;

              const eventLine = line.split('\n').find((l) => l.startsWith('data: '));
              if (!eventLine) continue;

              const event = parseEventLine(eventLine);
              if (!event) continue;

              const processed = processEvent(event);

              if (processed) {
                // Update accumulated content for tokens (but NOT for clarification JSON)
                if (event.type === 'token' && processed.content && !isClarificationJson(processed.content)) {
                  finalResponse.content += processed.content;
                  setCurrentContent(finalResponse.content);
                }

                // Handle clarification from token events
                // IMPORTANT: Check event.content directly, not processed.content, because
                // processEvent returns { clarification } for clarification tokens without content
                if (event.type === 'token' && isClarificationJson(event.content)) {
                  const clarification = parseClarificationFromToken(event.content);
                  if (clarification) {
                    console.log('[executeStreamRequest] Clarification JSON captured from token event:', {
                      questionsCount: clarification.questions?.length || 0,
                      contextSummary: clarification.context_summary?.substring(0, 50) || '',
                    });
                    finalResponse.clarification = clarification;
                    setCurrentClarification(clarification);
                  }
                }

                // Add citations
                if (event.type === 'citation' && processed.citations) {
                  finalResponse.citations = [
                    ...finalResponse.citations,
                    ...processed.citations,
                  ] as ChatCitation[];
                  setCurrentCitations(finalResponse.citations as StreamCitation[]);
                }

                // Handle clarification from clarification events (legacy)
                if (event.type === 'clarification' && processed.clarification) {
                  finalResponse.clarification = processed.clarification;
                  setCurrentClarification(processed.clarification);
                }

                // Handle done event
                if (event.type === 'done') {
                  finalResponse = {
                    ...finalResponse,
                    citations: processed.citations as ChatCitation[],
                    confidence: processed.confidence,
                    queryType: processed.queryType,
                    keyTerms: processed.keyTerms,
                    suggestedTitle: processed.suggestedTitle,
                  };
                }

                // Handle error event from server
                if (event.type === 'error' && processed.error) {
                  finalResponse.error = processed.error;
                  // Server-side error - don't retry, return immediately
                  return finalResponse;
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
          clearActivityTimeout();
        }

        // Log successful completion
        const duration = Date.now() - startTimeRef.current;
        logStreamCompletion(sessionId, userId, true, duration, finalResponse.content.length);

        return finalResponse;
      } catch (err) {
        const errorType = detectStreamErrorType(err);
        const isRetryable = isRetryableError(errorType) && retryAttempt < retryConfig.maxRetries;

        // Build error context for logging
        const errorContext: StreamErrorContext = {
          sessionId,
          userId,
          question,
          timestamp: new Date(),
          retryAttempt,
          partialContent: currentContent,
          errorType,
        };

        // Log to Sentry
        logStreamError(err, errorContext);

        // Check if we should retry or fallback
        const fallbackDecision = shouldUseFallback(errorType, retryAttempt, retryConfig);

        if (isRetryable && !fallbackDecision.shouldFallback) {
          // Retry with backoff
          const backoffDelay = calculateBackoffDelay(retryAttempt, retryConfig);

          setIsReconnecting(true);
          setReconnectionState({
            isReconnecting: true,
            attempt: retryAttempt + 1,
            lastAttemptTime: new Date(),
            nextAttemptTime: new Date(Date.now() + backoffDelay),
          });

          onRetry?.(retryAttempt + 1, backoffDelay);

          // Wait before retry
          await delay(backoffDelay);

          // Recursive retry
          return executeStreamRequest(question, mode, sessionId, retryAttempt + 1);
        }

        // Can't retry - build error response
        const responseError = buildErrorResponse(
          errorType,
          retryAttempt,
          currentContent,
          retryConfig,
        );

        setError(responseError.userMessage);
        setErrorResponse(responseError);

        onStreamError?.(responseError.userMessage, responseError);

        // Check if we should fallback to GraphQL
        if (fallbackToGraphQL && fallbackDecision.fallbackMethod === 'graphql') {
          return fallbackSendMessage(question, mode, sessionId);
        }

        // Return partial response with error
        return {
          content: currentContent,
          citations: currentCitations as ChatCitation[],
          error: responseError.userMessage,
          errorResponse: responseError,
          partial: currentContent.length > 0,
        };
      }
    },
    [
      currentContent,
      currentCitations,
      retryConfig,
      fallbackToGraphQL,
      onStreamError,
      onRetry,
      onFallback,
      parseEventLine,
      processEvent,
      fallbackSendMessage,
      setupActivityTimeout,
      clearActivityTimeout,
      fetchConversationHistory,
      isClarificationJson,
      parseClarificationFromToken,
    ],
  );

  /**
   * Send a message with streaming response
   *
   * IMPORTANT: Session ID must be provided and must be a valid UUID v4.
   * This hook no longer generates session IDs - they must come from the backend.
   * Use the useChatSessionManagement hook to create sessions before calling this.
   */
  const sendMessage = useCallback(
    async (
      question: string,
      mode: 'LAWYER' | 'SIMPLE',
      sessionId?: string,
    ): Promise<StreamingChatResponse> => {
      // Reset state
      setIsStreaming(true);
      setIsReconnecting(false);
      setError(null);
      setErrorResponse(null);
      setCurrentContent('');
      setCurrentCitations([]);
      setWasFallback(false);
      setReconnectionState(null);
      setCurrentClarification(null);
      onStreamStart?.();

      // CRITICAL: Session ID must be provided and valid
      // Session IDs are now ALWAYS generated server-side via backend GraphQL mutation
      const uuidV4Regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (!sessionId || !uuidV4Regex.test(sessionId)) {
        const error = 'Invalid or missing session ID. Please start a new chat session.';
        setIsStreaming(false);
        setError(error);
        setErrorResponse({
          type: 'INVALID_SESSION_ID',
          message: error,
          userMessage: 'Chat session not found. Please refresh the page.',
          retryable: false,
          fallbackAvailable: false,
          canRecover: false,
          severity: 'high',
        });
        onStreamError?.(error, {
          type: 'INVALID_SESSION_ID',
          message: error,
          userMessage: 'Chat session not found. Please refresh the page.',
          retryable: false,
          fallbackAvailable: false,
          canRecover: false,
          severity: 'high',
        });
        throw new Error(error);
      }

      lastRequestRef.current = { question, mode, sessionId };

      // Save user message to backend before streaming
      const userMessageResult = await saveUserMessageToBackend(sessionId, question);
      if (!userMessageResult.success) {
        console.warn('Failed to save user message to backend:', userMessageResult.error);
        // Continue anyway - don't block the user experience
      }

      try {
        // If streaming is disabled, fallback immediately
        if (!enabled) {
          throw new Error('Streaming disabled');
        }

        // Execute streaming request (includes retry logic)
        const response = await executeStreamRequest(question, mode, sessionId);

        // Save assistant message to backend after streaming completes
        if (!response.error) {
          // For clarification responses, the content field is empty but we need to store
          // the clarification JSON so the backend can parse it and store in metadata.
          // The backend's parseClarificationFromContent() expects the JSON in content.
          let contentToSave = response.content;

          if (!contentToSave && response.clarification) {
            // Serialize the clarification to JSON for storage
            // The backend will parse this and store it in metadata.clarification
            contentToSave = JSON.stringify({
              type: 'clarification',
              questions: response.clarification.questions,
              context_summary: response.clarification.context_summary,
              next_steps: response.clarification.next_steps,
            });
            console.log('[sendMessage] Saving clarification message with JSON content:', {
              contentLength: contentToSave.length,
              questionsCount: response.clarification.questions?.length || 0,
            });
          }

          // Log what we're about to save (for debugging empty content issues)
          console.log('[sendMessage] Saving assistant message to backend:', {
            contentLength: contentToSave.length,
            hasContent: !!contentToSave,
            hasClarification: !!response.clarification,
            isClarificationJson: isClarificationJson(contentToSave),
          });

          const assistantMessageResult = await saveAssistantMessageToBackend(
            sessionId,
            contentToSave,
            response.citations || null,
            {
              confidence: response.confidence,
              queryType: response.queryType,
              keyTerms: response.keyTerms,
            },
          );
          if (!assistantMessageResult.success) {
            console.warn('Failed to save assistant message to backend:', assistantMessageResult.error);
            // Continue anyway - don't block the user experience
          } else {
            console.log('[sendMessage] Assistant message saved successfully:', {
              messageId: assistantMessageResult.messageId,
            });
          }
        }

        setIsStreaming(false);
        setIsReconnecting(false);
        onStreamEnd?.(response);

        return response;
      } catch (err) {
        setIsStreaming(false);
        setIsReconnecting(false);

        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';

        // Handle abort
        if (err instanceof Error && err.name === 'AbortError') {
          return {
            content: currentContent,
            citations: currentCitations as ChatCitation[],
            error: 'Stream aborted by user',
            partial: currentContent.length > 0,
          };
        }

        setError(errorMessage);

        // Final fallback attempt
        if (fallbackToGraphQL) {
          return fallbackSendMessage(question, mode, sessionId);
        }

        throw err;
      }
    },
    [
      enabled,
      fallbackToGraphQL,
      onStreamStart,
      onStreamEnd,
      onStreamError,
      executeStreamRequest,
      currentContent,
      currentCitations,
      fallbackSendMessage,
    ],
  );

  /**
   * Abort the current stream
   */
  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    clearActivityTimeout();
    setIsStreaming(false);
    setIsReconnecting(false);
    setReconnectionState(null);
  }, [clearActivityTimeout]);

  /**
   * Retry the last failed request
   */
  const retryLastRequest = useCallback(async (): Promise<StreamingChatResponse | null> => {
    if (!lastRequestRef.current) {
      return null;
    }

    const { question, mode, sessionId } = lastRequestRef.current;

    // Reset error state
    setError(null);
    setErrorResponse(null);

    try {
      return await executeStreamRequest(question, mode, sessionId, 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Retry failed';
      setError(errorMessage);
      return null;
    }
  }, [executeStreamRequest]);

  /**
   * Send clarification answers with streaming response
   *
   * This function sends the user's answers to clarification questions
   * and streams the AI's response in real-time.
   */
  const sendClarificationAnswers = useCallback(
    async (
      originalQuestion: string,
      answers: Array<{ question: string; question_type: string; answer: string }>,
      mode: 'LAWYER' | 'SIMPLE',
      sessionId: string,
    ): Promise<StreamingChatResponse> => {
      // Reset state
      setIsStreaming(true);
      setIsReconnecting(false);
      setError(null);
      setErrorResponse(null);
      setCurrentContent('');
      setCurrentCitations([]);
      setWasFallback(false);
      setReconnectionState(null);
      setCurrentClarification(null);
      onStreamStart?.();

      // Validate session ID
      const uuidV4Regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (!sessionId || !uuidV4Regex.test(sessionId)) {
        const error = 'Invalid or missing session ID. Please start a new chat session.';
        setIsStreaming(false);
        setError(error);
        const errorResp: StreamErrorResponse = {
          type: 'INVALID_SESSION_ID',
          message: error,
          userMessage: 'Chat session not found. Please refresh the page.',
          retryable: false,
          fallbackAvailable: false,
          canRecover: false,
          severity: 'high',
        };
        setErrorResponse(errorResp);
        onStreamError?.(error, errorResp);
        throw new Error(error);
      }

      // Get JWT token for authentication
      const accessToken = getAccessToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Fetch conversation history for context
      const conversationHistory = await fetchConversationHistory(sessionId);

      // Build request body
      const requestBody = {
        original_question: originalQuestion,
        answers: answers,
        mode,
        session_id: sessionId,
        ...(conversationHistory && conversationHistory.length > 0
          ? { conversation_history: conversationHistory }
          : {}),
        // Add conversation metadata for Langfuse observability
        conversation_metadata: buildConversationMetadata(conversationHistory),
      };

      console.log('[sendClarificationAnswers] Sending request to AI Engine:', {
        sessionId,
        originalQuestionLength: originalQuestion.length,
        answersCount: answers.length,
        conversationHistoryLength: conversationHistory?.length || 0,
        conversationMetadata: requestBody.conversation_metadata,
      });

      // Save user's clarification answers to backend before streaming
      const answerText = answers
        .map((a) => `${a.question}: ${a.answer}`)
        .join('\n');
      const userMessageResult = await saveUserMessageToBackend(sessionId, answerText);
      if (!userMessageResult.success) {
        console.warn('Failed to save clarification answers to backend:', userMessageResult.error);
        // Continue anyway - don't block the user experience
      }

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        if (!enabled) {
          throw new Error('Streaming disabled');
        }

        const response = await fetch(`${AI_ENGINE_URL}/api/v1/qa/clarification-answer-stream`, {
          method: 'POST',
          headers,
          signal: abortControllerRef.current.signal,
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('text/event-stream')) {
          throw new Error('Invalid response type: expected text/event-stream');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body reader available');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let finalResponse: StreamingChatResponse = {
          content: '',
          citations: [],
        };

        setupActivityTimeout();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            setupActivityTimeout();

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim()) continue;

              const eventLine = line.split('\n').find((l) => l.startsWith('data: '));
              if (!eventLine) continue;

              const event = parseEventLine(eventLine);
              if (!event) continue;

              const processed = processEvent(event);

              if (processed) {
                // Update accumulated content for tokens (but NOT for clarification JSON)
                if (event.type === 'token' && processed.content && !isClarificationJson(processed.content)) {
                  finalResponse.content += processed.content;
                  setCurrentContent(finalResponse.content);
                }

                // Add citations
                if (event.type === 'citation' && processed.citations) {
                  finalResponse.citations = [
                    ...finalResponse.citations,
                    ...processed.citations,
                  ] as ChatCitation[];
                  setCurrentCitations(finalResponse.citations as StreamCitation[]);
                }

                // Handle done event
                if (event.type === 'done') {
                  finalResponse = {
                    ...finalResponse,
                    citations: processed.citations as ChatCitation[],
                    confidence: processed.confidence,
                    queryType: processed.queryType,
                    keyTerms: processed.keyTerms,
                    suggestedTitle: processed.suggestedTitle,
                  };
                }

                // Handle error event from server
                if (event.type === 'error' && processed.error) {
                  finalResponse.error = processed.error;
                  return finalResponse;
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
          clearActivityTimeout();
        }

        // Save assistant message to backend after streaming completes
        if (!finalResponse.error) {
          // For clarification responses, the content field is empty but we need to store
          // the clarification JSON so the backend can parse it and store in metadata.
          let contentToSave = finalResponse.content;

          if (!contentToSave && finalResponse.clarification) {
            // Serialize the clarification to JSON for storage
            // The backend will parse this and store it in metadata.clarification
            contentToSave = JSON.stringify({
              type: 'clarification',
              questions: finalResponse.clarification.questions,
              context_summary: finalResponse.clarification.context_summary,
              next_steps: finalResponse.clarification.next_steps,
            });
            console.log('[sendClarificationAnswers] Saving clarification message with JSON content');
          }

          const assistantMessageResult = await saveAssistantMessageToBackend(
            sessionId,
            contentToSave,
            finalResponse.citations || null,
            {
              confidence: finalResponse.confidence,
              queryType: finalResponse.queryType,
              keyTerms: finalResponse.keyTerms,
            },
          );
          if (!assistantMessageResult.success) {
            console.warn('Failed to save assistant message:', assistantMessageResult.error);
          }
        }

        setIsStreaming(false);
        setIsReconnecting(false);
        onStreamEnd?.(finalResponse);

        return finalResponse;
      } catch (err) {
        setIsStreaming(false);
        setIsReconnecting(false);

        const errorMessage = err instanceof Error ? err.message : 'Failed to send clarification answers';

        // Handle abort
        if (err instanceof Error && err.name === 'AbortError') {
          return {
            content: currentContent,
            citations: currentCitations as ChatCitation[],
            error: 'Stream aborted by user',
            partial: currentContent.length > 0,
          };
        }

        setError(errorMessage);

        // No fallback for clarification answers - the user needs to see the error
        throw err;
      }
    },
    [
      enabled,
      onStreamStart,
      onStreamEnd,
      onStreamError,
      parseEventLine,
      processEvent,
      setupActivityTimeout,
      clearActivityTimeout,
      fetchConversationHistory,
      isClarificationJson,
      currentContent,
      currentCitations,
    ],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearActivityTimeout();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [clearActivityTimeout]);

  return {
    sendMessage,
    sendClarificationAnswers,
    abortStream,
    retryLastRequest,
    isStreaming,
    isReconnecting,
    error,
    errorResponse,
    currentContent,
    currentCitations,
    wasFallback,
    reconnectionState,
    currentClarification,
  };
}

/**
 * Parse JWT token to extract user ID
 */
function parseJwt(token: string): { sub?: string } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}
