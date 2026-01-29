'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { ClarificationPrompt } from './clarification-prompt';
import { StreamErrorMessage } from './stream-error-message';
import { ChatExportButton } from './chat-export-button';
import { useStreamingChat, type StreamErrorResponse } from '@/hooks/useStreamingChat';
import { useChat, type ChatCitation } from '@/hooks/use-chat';
import type { ClarificationInfo } from '@/hooks/use-chat';
import { useChatSession } from '@/hooks/use-chat-history';
import { useChatSessionManagement } from '@/hooks/use-chat-session-management';
import { getAccessToken } from '@/providers/auth-provider/auth-provider.client';
import { getCsrfHeaders } from '@/lib/csrf';
import {
  Bot,
  Plus,
  Scale,
  Sparkles,
  MessageSquareText,
  ShieldQuestion,
  HelpCircle,
  WifiOff,
  History,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@legal/ui';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: ChatCitation[];
  clarification?: ClarificationInfo;
  timestamp: Date;
  isStreaming?: boolean;
  hasError?: boolean;
  errorResponse?: StreamErrorResponse;
  partial?: boolean;
  /** For historical clarification messages, indicates if already answered */
  clarificationAnswered?: boolean;
  /** For user messages containing clarification answers */
  isClarificationAnswer?: boolean;
  /** Stores the answers submitted for a clarification (for readonly display) */
  clarificationAnswers?: Record<string, string>;
}

const STARTER_PROMPTS = [
  {
    icon: Scale,
    title: 'Draft a Lawyer Demand Letter',
    prompt: 'I need to draft a demand letter for unpaid services. Can you help me?',
  },
  {
    icon: MessageSquareText,
    title: 'Analyze a Rental Contract',
    prompt: 'What are the common pitfalls in a residential rental agreement in Poland?',
  },
  {
    icon: ShieldQuestion,
    title: 'Ask about Employee Rights',
    prompt: 'What are my rights if my employer terminates my contract without notice?',
  },
];

/**
 * ChatInterface Component
 *
 * Main chat container for Q&A functionality.
 * Displays conversation history and handles user input.
 * Supports real-time streaming of AI responses and multi-turn clarification.
 * Supports session restoration via ?session= URL parameter.
 *
 * Session Management:
 * - Session IDs are ALWAYS generated server-side via backend GraphQL mutation
 * - NO crypto.randomUUID() calls on frontend
 * - NO localStorage for session IDs - stored in component state only
 * - New chats: create session via backend before first message
 * - Restored chats: use session ID from URL parameter
 */
export function ChatInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get('session');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const [currentError, setCurrentError] = useState<StreamErrorResponse | null>(null);
  // Track the original question that led to clarification for answer submission
  const [lastUserQuestion, setLastUserQuestion] = useState<string | null>(null);
  // Track the message ID containing the current pending clarification
  const [pendingClarificationMessageId, setPendingClarificationMessageId] = useState<string | null>(
    null,
  );
  // Store pending clarification submission data to submit after streaming completes
  const pendingClarificationSubmissionRef = useRef<{
    clarificationMessageId: string;
    answers: Record<string, string>;
    clarificationQuestions: Array<{ question: string; question_type?: string }>;
  } | null>(null);
  // Map temporary message IDs to database IDs for clarification messages
  const clarificationIdMapRef = useRef<Map<string, string>>(new Map());

  // Keep non-streaming chat for clarification responses - declared early for use in session restoration
  const {
    sendClarificationResponse,
    isLoading: chatLoading,
    mode,
    setMode,
    isInClarificationMode,
  } = useChat();

  // Session management: backend-generated IDs only, never localStorage
  // For new chats, autoCreate=false - session is created when user sends first message
  // For restored chats, initialSessionId is provided via URL parameter
  const { sessionId, isCreatingSession, sessionError, createSession } = useChatSessionManagement({
    initialSessionId: sessionParam,
    defaultMode: 'LAWYER',
    autoCreate: false, // Don't auto-create session on page load - create with first message
  });

  // Fetch session data when session ID changes (for restoration)
  const effectiveSessionIdForFetch = sessionParam || sessionId;
  const {
    session: sessionData,
    isLoading: isLoadingSession,
    error: sessionFetchError,
  } = useChatSession(effectiveSessionIdForFetch);

  // Handle session restoration from URL
  useEffect(() => {
    if (sessionParam && sessionData) {
      // Set mode from session
      if (sessionData.mode) {
        setMode(sessionData.mode);
      }

      // Load messages from session data with full support for citations and clarification
      // Uses message type discriminator from backend instead of parsing JSON from content
      if (sessionData.messages && sessionData.messages.length > 0) {
        // First pass: collect all clarification answers and their target message IDs
        // Uses the CLARIFICATION_ANSWER type discriminator with fallback to content check
        const clarificationAnswersMap = new Map<string, Record<string, string>>();
        const nonAnswerMessages = sessionData.messages.filter((msg: any) => {
          // Use type discriminator OR content check to identify clarification answer messages
          const isClarificationAnswerType = msg.type === 'CLARIFICATION_ANSWER';
          const isClarificationAnswerContent =
            msg.content && typeof msg.content === 'string' && msg.role === 'USER'
              ? (() => {
                  const trimmed = msg.content.trim();
                  return (
                    trimmed.startsWith('{"type":"clarification_answer"') ||
                    trimmed.startsWith('{"type": "clarification_answer"')
                  );
                })()
              : false;

          if (isClarificationAnswerType || isClarificationAnswerContent) {
            // Parse the JSON content from clarification_answer messages
            // Format: {"type":"clarification_answer","answers":[...],"clarification_message_id":"..."}
            const parsed = JSON.parse(msg.content);
            if (parsed.type === 'clarification_answer' && Array.isArray(parsed.answers)) {
              const clarificationMessageId = parsed.clarification_message_id;
              if (clarificationMessageId) {
                // Convert answers array to a record keyed by question text
                const answersRecord = parsed.answers.reduce(
                  (acc: Record<string, string>, a: any) => {
                    acc[a.question] = a.answer;
                    return acc;
                  },
                  {},
                );
                clarificationAnswersMap.set(clarificationMessageId, answersRecord);
              }
            }
            // Filter out this message - don't display it
            return false;
          }
          return true;
        });

        // Second pass: load remaining messages and attach clarification answers
        const loadedMessages: ChatMessage[] = nonAnswerMessages
          .sort((a: any, b: any) => a.sequenceOrder - b.sequenceOrder)
          .map((msg: any) => {
            const msgId = msg.messageId;
            const answersForThis = clarificationAnswersMap.get(msgId);
            if (answersForThis) {
              console.log('[Message Loading] Attaching answers to message:', {
                msgId,
                answersCount: Object.keys(answersForThis).length,
                answers: answersForThis,
              });
            }

            // Use clarification from metadata for CLARIFICATION_QUESTION type messages
            // Check both type discriminator (new messages) and metadata (old messages with null type)
            const hasValidClarificationType =
              msg.type === 'CLARIFICATION_QUESTION' || msg.type === null;
            const clarificationFromMetadata =
              hasValidClarificationType && msg.metadata?.clarification?.needs_clarification
                ? msg.metadata.clarification
                : null;

            const message: ChatMessage = {
              id: msg.messageId,
              role: msg.role === 'USER' ? 'user' : 'assistant',
              content: msg.content,
              citations: msg.citations?.map((c: any) => ({
                source: c.source,
                url: c.url || undefined,
                article: c.article || undefined,
                excerpt: c.excerpt || '',
              })),
              timestamp: new Date(msg.createdAt),
              isStreaming: false,
            };

            // Attach clarification data from metadata (for CLARIFICATION_QUESTION type messages)
            if (clarificationFromMetadata) {
              message.clarification = {
                needs_clarification: true,
                questions: clarificationFromMetadata.questions || [],
                context_summary: clarificationFromMetadata.context_summary || '',
                next_steps: clarificationFromMetadata.next_steps || '',
                currentRound: clarificationFromMetadata.currentRound,
                totalRounds: clarificationFromMetadata.totalRounds,
              };
              // Store whether this clarification was already answered
              message.clarificationAnswered =
                clarificationFromMetadata.answered ||
                msg.metadata?.clarification?.answered ||
                false;

              // Check if we have answers for this clarification message from the map
              const answersForThis = clarificationAnswersMap.get(msg.messageId);
              if (answersForThis) {
                console.log('[Message Loading] Setting clarificationAnswers on message:', {
                  msgId: msg.messageId,
                  answersCount: Object.keys(answersForThis).length,
                  answers: answersForThis,
                });
                message.clarificationAnswers = answersForThis;
                message.clarificationAnswered = true;
              } else {
                console.log('[Message Loading] No answers found for clarification message:', {
                  msgId: msg.messageId,
                  mapKeys: Array.from(clarificationAnswersMap.keys()),
                });
              }
            }

            return message;
          });
        setMessages(loadedMessages);
      }
    }

    // Handle session not found or error
    if (sessionParam && sessionFetchError) {
      console.error('Failed to load session:', sessionFetchError);
      // Continue with empty state - user can start a new conversation
    }
  }, [sessionParam, sessionData, sessionFetchError, setMode]);

  // Use streaming chat for real-time responses
  const {
    sendMessage: sendStreamingMessage,
    sendClarificationAnswers: sendClarificationAnswersStreaming,
    isStreaming: isStreamingActive,
    isReconnecting,
    abortStream,
    retryLastRequest,
    errorResponse,
    reconnectionState,
  } = useStreamingChat({
    onStreamStart: () => {
      // Stream started - isStreamingActive state will be true
    },
    onToken: (token) => {
      // Skip clarification JSON tokens from being displayed as content
      const isClarification =
        token.trim().startsWith('{"type":"clarification"') ||
        token.trim().startsWith('{"type": "clarification"');

      if (!isClarification && streamingMessageIdRef.current) {
        // Update the streaming message with new token (only if not clarification)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingMessageIdRef.current
              ? { ...msg, content: msg.content + token }
              : msg,
          ),
        );
      }
    },
    onCitation: (citation) => {
      // Add citation to the streaming message
      if (streamingMessageIdRef.current) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === streamingMessageIdRef.current) {
              const newCitation: ChatCitation = {
                source: citation.source,
                article: citation.article,
                url: citation.url,
                excerpt: '',
              };
              return {
                ...msg,
                citations: [...(msg.citations || []), newCitation],
              };
            }
            return msg;
          }),
        );
      }
    },
    onStreamEnd: async (response) => {
      // Finalize the streaming message
      if (streamingMessageIdRef.current) {
        const tempId = streamingMessageIdRef.current;
        const dbId = response.dbMessageId;

        // Store the mapping from temporary ID to database ID for clarification messages
        if (dbId && response.clarification?.needs_clarification) {
          clarificationIdMapRef.current.set(tempId, dbId);
          console.log('[onStreamEnd] Stored clarification ID mapping:', { tempId, dbId });
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                  ...msg,
                  content: response.content,
                  citations: response.citations,
                  clarification: response.clarification,
                  isStreaming: false,
                  hasError: !!response.error,
                  errorResponse: response.errorResponse,
                  partial: response.partial,
                  // Update the message ID to the database ID if available
                  ...(dbId && { id: dbId }),
                }
              : msg,
          ),
        );

        // Track the message ID if it contains a pending clarification
        // Use the database ID if available, otherwise use the temporary ID
        if (response.clarification?.needs_clarification) {
          const messageIdToTrack = dbId || tempId;
          setPendingClarificationMessageId(messageIdToTrack);
        } else {
          setPendingClarificationMessageId(null);
        }
      }

      // Update session title if suggested title is provided
      if (response.suggestedTitle) {
        updateSessionTitle(response.suggestedTitle);
      }

      // Handle pending clarification submission after streaming completes
      // We need to use the database ID for the clarification message
      if (pendingClarificationSubmissionRef.current) {
        const submission = pendingClarificationSubmissionRef.current;

        // Check if the clarification message has been mapped to a database ID
        const clarifDbId =
          clarificationIdMapRef.current.get(submission.clarificationMessageId) ||
          submission.clarificationMessageId;

        console.log('[onStreamEnd] Submitting clarification answers to backend with:', {
          originalTempId: submission.clarificationMessageId,
          clarifDbId,
        });

        await submitClarificationAnswersToBackend(
          clarifDbId, // Use the database ID if available, otherwise the original ID
          submission.answers,
          submission.clarificationQuestions,
        );

        // Clear the pending submission
        pendingClarificationSubmissionRef.current = null;
      }

      streamingMessageIdRef.current = null;
    },
    onStreamError: (error, response) => {
      // Handle stream errors - show error banner
      setCurrentError(response);
      setShowErrorBanner(true);

      // Clear the pending clarification submission on error
      if (pendingClarificationSubmissionRef.current) {
        console.warn('[onStreamError] Clearing pending clarification submission due to error');
        pendingClarificationSubmissionRef.current = null;
      }

      if (streamingMessageIdRef.current) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingMessageIdRef.current
              ? {
                  ...msg,
                  content: error,
                  isStreaming: false,
                  hasError: true,
                  errorResponse: response,
                }
              : msg,
          ),
        );
      }
      streamingMessageIdRef.current = null;
    },
    onConnectionLost: () => {
      // Connection was lost - notify user
      setCurrentError({
        type: 'CONNECTION_LOST',
        message: 'Connection lost',
        userMessage: 'Connection lost. Please check your internet connection.',
        retryable: true,
        fallbackAvailable: true,
        canRecover: true,
        severity: 'low',
      });
      setShowErrorBanner(true);
    },
    onRetry: (attempt, delayMs) => {
      // Update banner to show reconnection status
      setShowErrorBanner(true);
    },
    onClarification: (clarification) => {
      // Update the streaming message with clarification data
      if (streamingMessageIdRef.current) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingMessageIdRef.current ? { ...msg, clarification } : msg,
          ),
        );
      }
    },
  });

  const isLoading = isStreamingActive || chatLoading || isReconnecting || isCreatingSession;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start a new chat session - creates a new backend session
  const handleNewChat = useCallback(async () => {
    // Clear current messages
    setMessages([]);

    // Create a new session via backend (ID is server-generated)
    const newSessionId = await createSession(mode);

    // Navigate to clean URL without session parameter
    // The new session ID will be used for subsequent messages
    if (newSessionId) {
      router.push('/chat');
    }
  }, [createSession, mode, router]);

  // Update session title via GraphQL mutation
  const updateSessionTitle = useCallback(
    async (title: string) => {
      if (!sessionId) {
        console.warn('Cannot update session title: no session ID');
        return;
      }

      const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

      // Get auth token from auth provider (NOT localStorage)
      // Import and use getAccessToken to ensure proper auth flow
      const { getAccessToken } = await import('@/providers/auth-provider/auth-provider.client');
      const token = getAccessToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const response = await fetch(GRAPHQL_URL, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            query: `
              mutation UpdateChatSessionTitle($input: UpdateChatSessionTitleInput!) {
                updateChatSessionTitle(input: $input) {
                  id
                  title
                  updatedAt
                }
              }
            `,
            variables: {
              input: {
                sessionId: sessionId,
                title: title,
              },
            },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data?.updateChatSessionTitle) {
            console.log('Session title updated:', result.data.updateChatSessionTitle.title);
          }
        }
      } catch (error) {
        console.warn('Failed to update session title:', error);
        // Silently fail - title generation is not critical
      }
    },
    [sessionId],
  );

  // Update clarification answered status via GraphQL mutation
  const updateClarificationStatusHelper = useCallback(
    async (messageId: string, answered: boolean, answers?: Record<string, string>) => {
      const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

      const { getAccessToken } = await import('@/providers/auth-provider/auth-provider.client');
      const token = getAccessToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getCsrfHeaders(),
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const response = await fetch(GRAPHQL_URL, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            query: `
              mutation UpdateClarificationStatus($input: UpdateClarificationStatusInput!) {
                updateClarificationStatus(input: $input) {
                  success
                  messageId
                  status
                }
              }
            `,
            variables: {
              input: {
                messageId,
                answered,
                answers: answers ? JSON.stringify(answers) : undefined,
              },
            },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data?.updateClarificationStatus?.success) {
            console.log(
              'Clarification status updated:',
              result.data.updateClarificationStatus.status,
            );

            // Update local message state to reflect the answered status
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId ? { ...msg, clarificationAnswered: answered } : msg,
              ),
            );
          }
        }
      } catch (error) {
        console.warn('Failed to update clarification status:', error);
        // Don't block the flow - the user can still continue
      }
    },
    [],
  );

  // Handle aborting the stream
  const handleAbortStream = useCallback(() => {
    abortStream();
    if (streamingMessageIdRef.current) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamingMessageIdRef.current ? { ...msg, isStreaming: false } : msg,
        ),
      );
    }
    streamingMessageIdRef.current = null;
    setShowErrorBanner(false);
    // Clear the pending clarification submission on abort
    if (pendingClarificationSubmissionRef.current) {
      console.warn('[handleAbortStream] Clearing pending clarification submission due to abort');
      pendingClarificationSubmissionRef.current = null;
    }
  }, [abortStream]);

  // Handle retry from error banner
  const handleRetryFromBanner = useCallback(async () => {
    setShowErrorBanner(false);

    if (!lastRequestRef.current) {
      return;
    }

    const { question } = lastRequestRef.current;

    // Update the streaming message to show retrying state
    if (streamingMessageIdRef.current) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamingMessageIdRef.current
            ? { ...msg, content: 'Retrying...', isStreaming: true }
            : msg,
        ),
      );
    }

    const result = await retryLastRequest();

    if (result && streamingMessageIdRef.current) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamingMessageIdRef.current
            ? {
                ...msg,
                content: result.content,
                citations: result.citations,
                clarification: result.clarification,
                isStreaming: false,
                hasError: !!result.error,
                errorResponse: result.errorResponse,
                partial: result.partial,
              }
            : msg,
        ),
      );
    }
  }, [retryLastRequest]);

  // Store reference to last request for retry
  const lastRequestRef = useRef<{ question: string; mode: 'LAWYER' | 'SIMPLE' } | null>(null);

  const handleSendMessage = async (content: string) => {
    // Store request for potential retry
    lastRequestRef.current = { question: content, mode };

    // Track the user's last question for clarification answer submission
    setLastUserQuestion(content);

    // Hide any existing error banner
    setShowErrorBanner(false);

    // Ensure we have a session ID from backend
    let effectiveSessionId = sessionId;
    if (!effectiveSessionId) {
      // Create a new session via backend if we don't have one
      // Session ID is ALWAYS generated server-side
      effectiveSessionId = await createSession(mode);
      if (!effectiveSessionId) {
        // Failed to create session - show error
        setCurrentError({
          type: 'SESSION_ERROR',
          message: 'Failed to create chat session',
          userMessage: 'Could not start a new chat session. Please try again.',
          retryable: true,
          fallbackAvailable: false,
          canRecover: true,
          severity: 'high',
        });
        setShowErrorBanner(true);
        return;
      }
    }

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Create a placeholder assistant message for streaming
    const assistantId = `assistant-${Date.now()}`;
    streamingMessageIdRef.current = assistantId;

    const initialAssistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, initialAssistantMessage]);

    try {
      // Send streaming message to AI Engine with backend-generated session ID
      const response = await sendStreamingMessage(content, mode, effectiveSessionId);

      // Finalize is handled in onStreamEnd callback
      // This is just a fallback in case callbacks don't fire
      if (streamingMessageIdRef.current) {
        const finalAssistantMessage: ChatMessage = {
          id: assistantId,
          role: 'assistant',
          content: response.content,
          citations: response.citations,
          clarification: response.clarification,
          timestamp: new Date(),
          isStreaming: false,
          hasError: !!response.error,
          errorResponse: response.errorResponse,
          partial: response.partial,
        };

        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantId ? finalAssistantMessage : msg)),
        );
      }
    } catch (err) {
      // Error is handled in onStreamError callback
      // This is just a fallback
      if (streamingMessageIdRef.current) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred while processing your request.';

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: errorMessage,
                  isStreaming: false,
                  hasError: true,
                }
              : msg,
          ),
        );
      }
    }
  };

  /**
   * Helper function to submit clarification answers to the backend
   * This creates a new user message with the answers as JSON content with type CLARIFICATION_ANSWER
   *
   * The answers are stringified as JSON and sent with message_type: CLARIFICATION_ANSWER
   * Format: {"type":"clarification_answer","answers":{"question1":"answer1",...}}
   */
  const submitClarificationAnswersToBackend = useCallback(
    async (
      clarificationMessageId: string,
      answers: Record<string, string>,
      clarificationQuestions: Array<{ question: string; question_type?: string }>,
    ): Promise<boolean> => {
      const accessToken = getAccessToken();
      if (!accessToken || !sessionId) {
        console.warn(
          '[submitClarificationAnswersToBackend] No access token or session ID available',
        );
        return false;
      }

      try {
        // Build answers array with question types for structured data
        const answersArray = Object.entries(answers).map(([question, answer]) => {
          const questionObj = clarificationQuestions.find((q) => q.question === question);
          return {
            question,
            answer,
            question_type: questionObj?.question_type || 'text',
          };
        });

        // Create the structured JSON object for the message content
        // This is the key change: answers are now structured data, not a formatted string
        const clarificationAnswerContent = JSON.stringify({
          type: 'clarification_answer',
          answers: answersArray,
          clarification_message_id: clarificationMessageId,
        });

        console.log('[submitClarificationAnswersToBackend] Saving clarification answers as JSON:', {
          sessionId,
          clarificationMessageId,
          answersCount: answersArray.length,
          contentPreview: clarificationAnswerContent.substring(0, 100) + '...',
        });

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
              mutation SaveClarificationAnswerMessage($input: SaveChatMessageInput!) {
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
                content: clarificationAnswerContent,
                role: 'USER',
                type: 'CLARIFICATION_ANSWER',
              },
            },
          }),
        });

        if (!response.ok) {
          console.warn('Failed to submit clarification answers:', response.status);
          return false;
        }

        const result = await response.json();
        if (result.errors?.length > 0) {
          console.warn('[submitClarificationAnswersToBackend] GraphQL errors:', result.errors);
          return false;
        }

        const success = !!result.data?.saveChatMessage?.messageId;

        // If successful, update the clarification message's answered status and store answers
        if (success) {
          // Update the clarification message's answered status and store answers for readonly display
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === clarificationMessageId && msg.clarification) {
                return {
                  ...msg,
                  clarificationAnswered: true,
                  clarificationAnswers: answers, // Store answers for readonly display
                };
              }
              return msg;
            }),
          );
        }

        return success;
      } catch (error) {
        console.warn('Error submitting clarification answers:', error);
        return false;
      }
    },
    [sessionId],
  );

  const handleClarificationSubmit = async (answers: Record<string, string>) => {
    // Ensure we have a session ID
    if (!sessionId) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Session not found. Please start a new chat session.',
        timestamp: new Date(),
        isStreaming: false,
        hasError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    // Find the clarification message to get its questions for the backend submission
    const clarificationMessage = messages.find(
      (m) => m.id === pendingClarificationMessageId && m.clarification?.needs_clarification,
    );

    if (!clarificationMessage || !clarificationMessage.clarification) {
      console.warn('[handleClarificationSubmit] Clarification message not found');
      return;
    }

    // Store the submission data in a ref so we can submit after streaming completes
    // We need the database ID (which we'll get after streaming) for the backend mutation
    pendingClarificationSubmissionRef.current = {
      clarificationMessageId: pendingClarificationMessageId!,
      answers,
      clarificationQuestions: clarificationMessage.clarification.questions,
    };

    // Convert answers to the format expected by the streaming endpoint
    const answersArray = Object.entries(answers)
      .filter(([, value]) => value.trim())
      .map(([question, answer]) => {
        const questionObj = clarificationMessage.clarification!.questions.find(
          (q) => q.question === question,
        );
        return {
          question,
          answer,
          question_type: questionObj?.question_type || 'text',
        };
      });

    // Use the original question that led to clarification
    const originalQuestion = lastUserQuestion || 'Previous question';

    // Create a placeholder assistant message for streaming
    const assistantId = `assistant-${Date.now()}`;
    streamingMessageIdRef.current = assistantId;

    const initialAssistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, initialAssistantMessage]);

    try {
      // Send clarification answers with streaming
      const response = await sendClarificationAnswersStreaming(
        originalQuestion,
        answersArray,
        mode,
        sessionId,
      );

      // Finalize is handled in onStreamEnd callback
      // This is just a fallback in case callbacks don't fire
      if (streamingMessageIdRef.current) {
        const finalAssistantMessage: ChatMessage = {
          id: assistantId,
          role: 'assistant',
          content: response.content,
          citations: response.citations,
          clarification: response.clarification,
          timestamp: new Date(),
          isStreaming: false,
        };
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? finalAssistantMessage : m)));
      }
    } catch (err) {
      // Clear the pending submission on error
      if (pendingClarificationSubmissionRef.current) {
        console.warn('[handleClarificationSubmit] Clearing pending submission due to error:', err);
        pendingClarificationSubmissionRef.current = null;
      }

      // Handle error
      const errorMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your answers. Please try again.',
        timestamp: new Date(),
        isStreaming: false,
        hasError: true,
      };
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? errorMessage : m)));
    } finally {
      streamingMessageIdRef.current = null;
    }
  };

  // Handle clarification submission from historical messages (loaded from session)
  const handleHistoricalClarificationSubmit = async (
    clarification: ClarificationInfo,
    answers: Record<string, string>,
  ) => {
    // Ensure we have a session ID
    if (!sessionId) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Session not found. Please start a new chat session.',
        timestamp: new Date(),
        isStreaming: false,
        hasError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    // Find the clarification message that needs to be answered
    const clarificationMessage = messages.find(
      (m) =>
        m.clarification?.needs_clarification &&
        !m.clarificationAnswered &&
        !m.id.startsWith('user-') &&
        !m.id.startsWith('assistant-'),
    );

    if (!clarificationMessage) {
      console.warn('Could not find clarification message to update');
      return;
    }

    // Submit the answers to the backend to persist them
    await submitClarificationAnswersToBackend(
      clarificationMessage.id,
      answers,
      clarification.questions,
    );

    // For historical clarifications, we need to find the original user question
    // Look for the last user message before the clarification
    const messagesWithLastUserQuestion = [...messages].reverse();
    let originalQuestion = 'Previous question';
    for (const msg of messagesWithLastUserQuestion) {
      if (msg.role === 'user' && !msg.content.includes(':')) {
        originalQuestion = msg.content;
        break;
      }
    }

    // Convert answers to the format expected by the streaming endpoint
    const answersArray = Object.entries(answers)
      .filter(([, value]) => value.trim())
      .map(([question, answer]) => {
        const questionObj = clarification.questions.find((q) => q.question === question);
        return {
          question,
          answer,
          question_type: questionObj?.question_type || 'text',
        };
      });

    // Create a placeholder assistant message for streaming
    const assistantId = `assistant-${Date.now()}`;
    streamingMessageIdRef.current = assistantId;

    const initialAssistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, initialAssistantMessage]);

    try {
      // Send clarification answers with streaming
      const response = await sendClarificationAnswersStreaming(
        originalQuestion,
        answersArray,
        mode,
        sessionId,
      );

      // Update the historical clarification message to mark it as answered
      setMessages((prev) =>
        prev.map((m) => {
          if (m.clarification?.needs_clarification && !m.isStreaming && m.id !== assistantId) {
            return { ...m, clarificationAnswered: true };
          }
          if (m.id === assistantId) {
            return {
              id: assistantId,
              role: 'assistant',
              content: response.content,
              citations: response.citations,
              clarification: response.clarification,
              timestamp: new Date(),
              isStreaming: false,
            };
          }
          return m;
        }),
      );
    } catch (err) {
      // Handle error
      const errorMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your answers. Please try again.',
        timestamp: new Date(),
        isStreaming: false,
        hasError: true,
      };
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? errorMessage : m)));
    } finally {
      streamingMessageIdRef.current = null;
    }
  };

  const handleClarificationCancel = () => {
    // User chose to skip clarification - send a generic follow-up
    handleSendMessage('Please provide a general answer based on the information available.');
  };

  // Check if the last message has a pending clarification
  const lastMessage = messages[messages.length - 1];
  const pendingClarification =
    lastMessage?.role === 'assistant' &&
    lastMessage.clarification?.needs_clarification &&
    !lastMessage.clarificationAnswered
      ? lastMessage.clarification
      : null;

  return (
    <div className="flex flex-col h-full bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
      {/* Header */}
      <div
        className={cn(
          'px-6 py-4 border-b backdrop-blur-sm flex items-center justify-between sticky top-0 z-10 transition-colors',
          isInClarificationMode
            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
            : showErrorBanner || isReconnecting
              ? 'bg-orange-50/80 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900'
              : 'bg-card/50 border-border',
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center transition-colors',
              isInClarificationMode
                ? 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400'
                : showErrorBanner || isReconnecting
                  ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
                  : 'bg-primary/10 text-primary',
            )}
          >
            {isReconnecting ? (
              <WifiOff className="h-6 w-6" />
            ) : isInClarificationMode ? (
              <HelpCircle className="h-6 w-6" />
            ) : (
              <Bot className="h-6 w-6" />
            )}
          </div>
          <div>
            <h1
              className={cn(
                'text-lg font-bold transition-colors',
                isInClarificationMode ? 'text-amber-900 dark:text-amber-100' : '',
                showErrorBanner || isReconnecting ? 'text-orange-900 dark:text-orange-100' : '',
              )}
            >
              {isReconnecting
                ? 'Reconnecting...'
                : isInClarificationMode
                  ? 'Clarification Mode'
                  : 'Legal AI Assistant'}
            </h1>
            <p
              className={cn(
                'text-xs flex items-center gap-1 transition-colors',
                isInClarificationMode
                  ? 'text-amber-700 dark:text-amber-300'
                  : showErrorBanner || isReconnecting
                    ? 'text-orange-700 dark:text-orange-300'
                    : 'text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full inline-block',
                  isInClarificationMode
                    ? 'bg-amber-500 animate-pulse'
                    : isReconnecting
                      ? 'bg-orange-500 animate-pulse'
                      : isStreamingActive
                        ? 'bg-blue-500 animate-pulse'
                        : 'bg-green-500 animate-pulse',
                )}
              ></span>
              {isReconnecting
                ? `Reconnecting... (Attempt ${reconnectionState?.attempt || 1}/3)`
                : isInClarificationMode
                  ? 'Waiting for your answers'
                  : isStreamingActive
                    ? 'Generating response...'
                    : 'Online & Ready'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* History Button */}
          <button
            onClick={() => router.push('/chat/history')}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            title="Chat History"
          >
            <History className="h-5 w-5" />
          </button>

          {/* Export Button - only show when there are messages AND we have a session ID */}
          {messages.length > 0 && sessionId && (
            <ChatExportButton
              sessionId={sessionId}
              title={sessionData?.title ?? undefined}
              variant="menu"
            />
          )}

          {/* Mode Toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setMode('SIMPLE')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                mode === 'SIMPLE'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Simple
            </button>
            <button
              onClick={() => setMode('LAWYER')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                mode === 'LAWYER'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Pro
            </button>
          </div>

          <button
            onClick={handleNewChat}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors ml-2"
            title="New Chat"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scroll-smooth">
        {isLoadingSession || isCreatingSession ? (
          <div className="flex flex-col items-center justify-center h-full animate-in fade-in duration-300">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {isCreatingSession ? 'Starting new conversation...' : 'Loading conversation...'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {sessionParam
                ? 'Restoring your chat session'
                : isCreatingSession
                  ? 'Creating a new session'
                  : 'Preparing a new conversation'}
            </p>
          </div>
        ) : sessionError ? (
          <div className="flex flex-col items-center justify-center h-full animate-in fade-in duration-300">
            <AlertTriangle className="h-12 w-12 text-orange-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Session Error</h2>
            <p className="text-muted-foreground text-sm mb-4">{sessionError}</p>
            <button
              onClick={() => createSession(mode)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-10">
              <div className="h-24 w-24 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary">
                <Sparkles className="h-12 w-12" />
              </div>
              <h2 className="text-3xl font-bold mb-3 tracking-tight">How can I help you today?</h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-lg">
                I can help you draft documents, analyze contracts, or answer complex legal
                questions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              {STARTER_PROMPTS.map((starter, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(starter.prompt)}
                  className="flex flex-col items-start p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left shadow-sm group"
                >
                  <starter.icon className="h-6 w-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-sm mb-1">{starter.title}</span>
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {starter.prompt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {/* Error Banner */}
            {showErrorBanner && currentError && (
              <div className="px-4 md:px-0">
                <StreamErrorMessage
                  errorResponse={currentError}
                  reconnectionState={reconnectionState}
                  hasPartialContent={messages.some(
                    (m) => m.role === 'assistant' && m.partial && m.content.length > 0,
                  )}
                  onRetry={handleRetryFromBanner}
                  onDismiss={() => setShowErrorBanner(false)}
                />
              </div>
            )}

            <MessageList
              messages={messages}
              isLoading={false}
              onClarificationSubmit={handleHistoricalClarificationSubmit}
              skipLastClarification={true}
            />

            {/* Render clarification prompt if pending */}
            {pendingClarification && (
              <ClarificationPrompt
                clarification={pendingClarification}
                onSubmit={handleClarificationSubmit}
                onCancel={handleClarificationCancel}
                isSubmitting={isLoading}
              />
            )}
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="px-4 md:px-8 py-6 bg-gradient-to-t from-background to-background/50 backdrop-blur-sm z-10">
        <MessageInput
          onSend={handleSendMessage}
          onStop={handleAbortStream}
          disabled={isLoading || !!pendingClarification}
          isLoading={isStreamingActive}
          placeholder={
            mode === 'LAWYER' ? 'Ask a complex legal question...' : 'Ask for legal help...'
          }
        />
      </div>
    </div>
  );
}
