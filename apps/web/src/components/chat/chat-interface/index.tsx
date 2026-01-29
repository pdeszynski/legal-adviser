'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat, type ChatCitation } from '@/hooks/use-chat';
import type { ClarificationInfo } from '@/hooks/use-chat';
import type { StreamErrorResponse } from '@/hooks/streaming/streaming-error-handler';
import { useChatSessionManagement } from '@/hooks/use-chat-session-management';
import { useChatSession } from '@/hooks/use-chat-history';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { ChatHeader } from './chat-header';
import { EmptyChatState } from './empty-chat-state';
import { SessionLoadingState, SessionErrorState } from './session-states';
import { ChatMessagesArea } from './chat-messages-area';
import { ChatInputArea } from './chat-input-area';
import { useChatSessionRestoration } from '../hooks/use-chat-session-restoration';
import { useChatActions } from '../hooks/use-chat-actions';
import type { ChatMessage, ChatMode, ClarificationSubmissionData } from '../types/chat.types';

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
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get('session');

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const [currentError, setCurrentError] = useState<StreamErrorResponse | null>(null);
  const [lastUserQuestion, setLastUserQuestion] = useState<string | null>(null);
  const [pendingClarificationMessageId, setPendingClarificationMessageId] = useState<string | null>(null);

  // Refs
  const streamingMessageIdRef = useRef<string | null>(null);
  const pendingClarificationSubmissionRef = useRef<ClarificationSubmissionData | null>(null);
  const clarificationIdMapRef = useRef<Map<string, string>>(new Map());

  // Hooks - non-streaming chat for clarification responses
  const {
    sendClarificationResponse,
    isLoading: chatLoading,
    mode,
    setMode,
    isInClarificationMode,
  } = useChat();

  // Session management
  const { sessionId, isCreatingSession, sessionError, createSession } = useChatSessionManagement({
    initialSessionId: sessionParam,
    defaultMode: 'LAWYER',
    autoCreate: false,
  });

  // Fetch session data when session ID changes (for restoration)
  const effectiveSessionIdForFetch = sessionParam || sessionId;
  const {
    session: sessionData,
    isLoading: isLoadingSession,
    error: sessionFetchError,
  } = useChatSession(effectiveSessionIdForFetch);

  // Session restoration hook
  useChatSessionRestoration({
    sessionParam,
    sessionId,
    sessionData,
    sessionFetchError,
    setMode,
    setMessages,
  });

  // Update session title
  const updateSessionTitle = useCallback(
    async (title: string) => {
      if (!sessionId) return;
      const { getAccessToken } = await import('@/providers/auth-provider/auth-provider.client');
      const token = getAccessToken();
      const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

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
              input: { sessionId, title },
            },
          }),
        });
        await response.json();
      } catch (error) {
        console.warn('Failed to update session title:', error);
      }
    },
    [sessionId],
  );

  // Streaming chat
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
    onStreamStart: () => {},
    onToken: (token) => {
      const isClarification =
        token.trim().startsWith('{"type":"clarification"') ||
        token.trim().startsWith('{"type": "clarification"');
      if (!isClarification && streamingMessageIdRef.current) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingMessageIdRef.current ? { ...msg, content: msg.content + token } : msg,
          ),
        );
      }
    },
    onCitation: (citation) => {
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
              return { ...msg, citations: [...(msg.citations || []), newCitation] };
            }
            return msg;
          }),
        );
      }
    },
    onStreamEnd: async (response) => {
      if (streamingMessageIdRef.current) {
        const tempId = streamingMessageIdRef.current;
        const dbId = response.dbMessageId;

        if (dbId && response.clarification?.needs_clarification) {
          clarificationIdMapRef.current.set(tempId, dbId);
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
                  ...(dbId && { id: dbId }),
                }
              : msg,
          ),
        );

        if (response.clarification?.needs_clarification) {
          const messageIdToTrack = dbId || tempId;
          setPendingClarificationMessageId(messageIdToTrack);
        } else {
          setPendingClarificationMessageId(null);
        }
      }

      if (response.suggestedTitle) {
        updateSessionTitle(response.suggestedTitle);
      }

      if (pendingClarificationSubmissionRef.current) {
        const submission = pendingClarificationSubmissionRef.current;
        const clarifDbId =
          clarificationIdMapRef.current.get(submission.clarificationMessageId) ||
          submission.clarificationMessageId;

        await submitClarificationAnswersToBackend(
          clarifDbId,
          submission.answers,
          submission.clarificationQuestions,
        );

        pendingClarificationSubmissionRef.current = null;
      }

      streamingMessageIdRef.current = null;
    },
    onStreamError: (error, response) => {
      setCurrentError(response);
      setShowErrorBanner(true);

      if (pendingClarificationSubmissionRef.current) {
        pendingClarificationSubmissionRef.current = null;
      }

      if (streamingMessageIdRef.current) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingMessageIdRef.current
              ? { ...msg, content: error, isStreaming: false, hasError: true, errorResponse: response }
              : msg,
          ),
        );
      }
      streamingMessageIdRef.current = null;
    },
    onConnectionLost: () => {
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
    onRetry: () => setShowErrorBanner(true),
    onClarification: (clarification) => {
      if (streamingMessageIdRef.current) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === streamingMessageIdRef.current ? { ...msg, clarification } : msg)),
        );
      }
    },
  });

  // Chat actions hook
  const {
    handleNewChat,
    submitClarificationAnswersToBackend,
    handleSendMessage,
    handleClarificationSubmit,
    handleClarificationCancel,
  } = useChatActions({
    messages,
    setMessages,
    pendingClarificationMessageId,
    setPendingClarificationMessageId,
    clarificationIdMapRef,
    pendingClarificationSubmissionRef,
    streamingMessageIdRef,
    lastUserQuestion,
    setLastUserQuestion,
    setShowErrorBanner,
    setCurrentError,
    mode,
    sessionId,
    createSession,
    updateSessionTitle,
  });

  const isLoading = isStreamingActive || chatLoading || isReconnecting || isCreatingSession;

  // Check if the last message has a pending clarification
  const lastMessage = messages[messages.length - 1];
  const pendingClarification =
    lastMessage?.role === 'assistant' &&
    lastMessage.clarification?.needs_clarification &&
    !lastMessage.clarificationAnswered
      ? lastMessage.clarification
      : null;

  // Handle aborting the stream
  const handleAbortStream = useCallback(() => {
    abortStream();
    if (streamingMessageIdRef.current) {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === streamingMessageIdRef.current ? { ...msg, isStreaming: false } : msg)),
      );
    }
    streamingMessageIdRef.current = null;
    setShowErrorBanner(false);
    if (pendingClarificationSubmissionRef.current) {
      pendingClarificationSubmissionRef.current = null;
    }
  }, [abortStream, setMessages]);

  // Handle retry from error banner
  const handleRetryFromBanner = useCallback(async () => {
    setShowErrorBanner(false);
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
  }, [retryLastRequest, setMessages]);

  // Handle dismiss error
  const handleDismissError = useCallback(() => {
    setShowErrorBanner(false);
  }, []);

  // Wrapper for send message
  const onSendMessage = useCallback(
    (content: string) => handleSendMessage(content, sendStreamingMessage),
    [handleSendMessage, sendStreamingMessage],
  );

  // Wrapper for clarification submit
  const onClarificationSubmit = useCallback(
    (clarification: ClarificationInfo, answers: Record<string, string>) =>
      handleClarificationSubmit(answers, sendClarificationAnswersStreaming),
    [handleClarificationSubmit, sendClarificationAnswersStreaming],
  );

  // Wrapper for clarification cancel
  const onClarificationCancel = useCallback(
    () => handleClarificationCancel(onSendMessage),
    [handleClarificationCancel, onSendMessage],
  );

  return (
    <div className="flex flex-col h-full bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
      {/* Header */}
      <ChatHeader
        isInClarificationMode={isInClarificationMode}
        isReconnecting={isReconnecting}
        isStreamingActive={isStreamingActive}
        mode={mode}
        setMode={setMode}
        sessionId={sessionId}
        sessionData={sessionData}
        reconnectionState={reconnectionState}
        onNewChat={handleNewChat}
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scroll-smooth">
        {/* Only show loading state when creating session, not during streaming */}
        {isCreatingSession ? (
          <SessionLoadingState sessionParam={sessionParam} mode={mode} />
        ) : sessionError ? (
          <SessionErrorState error={sessionError} mode={mode} onRetry={handleNewChat} />
        ) : messages.length === 0 ? (
          <EmptyChatState onStarterPromptClick={onSendMessage} />
        ) : (
          <ChatMessagesArea
            messages={messages}
            pendingClarification={pendingClarification}
            showErrorBanner={showErrorBanner}
            currentError={currentError}
            isLoadingSession={isLoadingSession}
            isCreatingSession={isCreatingSession}
            sessionError={sessionError}
            sessionParam={sessionParam}
            reconnectionState={reconnectionState}
            sessionId={sessionId}
            sessionData={sessionData}
            onClarificationSubmit={onClarificationSubmit}
            onClarificationCancel={onClarificationCancel}
            onRetryFromBanner={handleRetryFromBanner}
            onDismissError={handleDismissError}
          />
        )}
      </div>

      {/* Input Area */}
      <ChatInputArea
        mode={mode}
        isLoading={isLoading}
        pendingClarification={pendingClarification}
        onSend={onSendMessage}
        onStop={handleAbortStream}
        isStreaming={isStreamingActive}
      />
    </div>
  );
}
