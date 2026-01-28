'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { ClarificationPrompt } from './clarification-prompt';
import { StreamErrorMessage } from './stream-error-message';
import { ChatExportButton } from './chat-export-button';
import { useStreamingChat, type StreamErrorResponse } from '@/hooks/useStreamingChat';
import { useChat, type ChatCitation, type ClarificationInfo } from '@/hooks/use-chat';
import { useChatSession } from '@/hooks/use-chat-history';
import { useChatSessionManagement } from '@/hooks/use-chat-session-management';
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

  // Keep non-streaming chat for clarification responses - declared early for use in session restoration
  const {
    sendClarificationResponse,
    isLoading: chatLoading,
    mode,
    setMode,
    isInClarificationMode,
  } = useChat();

  // Session management: backend-generated IDs only, never localStorage
  // For new chats, autoCreate=true creates a session on mount
  // For restored chats, initialSessionId is provided via URL parameter
  const {
    sessionId,
    isCreatingSession,
    sessionError,
    createSession,
  } = useChatSessionManagement({
    initialSessionId: sessionParam,
    defaultMode: 'LAWYER',
    autoCreate: !sessionParam, // Auto-create session only for new chats (no session param)
  });

  // Fetch session data when session ID changes (for restoration)
  const effectiveSessionIdForFetch = sessionParam || sessionId;
  const { session: sessionData, isLoading: isLoadingSession, error: sessionFetchError } =
    useChatSession(effectiveSessionIdForFetch);

  // Handle session restoration from URL
  useEffect(() => {
    if (sessionParam && sessionData) {
      // Set mode from session
      if (sessionData.mode) {
        setMode(sessionData.mode);
      }

      // Load messages from session data with full support for citations
      if (sessionData.messages && sessionData.messages.length > 0) {
        const loadedMessages: ChatMessage[] = sessionData.messages
          .sort((a: any, b: any) => a.sequenceOrder - b.sequenceOrder)
          .map((msg: any) => ({
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
          }));
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
      // Update the streaming message with new token
      if (streamingMessageIdRef.current) {
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
    onStreamEnd: (response) => {
      // Finalize the streaming message
      if (streamingMessageIdRef.current) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingMessageIdRef.current
              ? {
                  ...msg,
                  content: response.content,
                  citations: response.citations,
                  clarification: response.clarification,
                  isStreaming: false,
                  hasError: !!response.error,
                  errorResponse: response.errorResponse,
                  partial: response.partial,
                }
              : msg,
          ),
        );
      }

      // Update session title if suggested title is provided
      if (response.suggestedTitle) {
        updateSessionTitle(response.suggestedTitle);
      }

      streamingMessageIdRef.current = null;
    },
    onStreamError: (error, response) => {
      // Handle stream errors - show error banner
      setCurrentError(response);
      setShowErrorBanner(true);

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

  const handleClarificationSubmit = async (answers: Record<string, string>) => {
    // Add user's clarification answers as a message
    const answerText = Object.entries(answers)
      .filter(([, value]) => value.trim())
      .map(([question, answer]) => `${question}: ${answer}`)
      .join('\n');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: answerText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await sendClarificationResponse(answers);

      // Add assistant message to chat
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answerMarkdown || '',
        citations: response.citations,
        clarification: response.clarification || undefined,
        timestamp: new Date(),
        isStreaming: false,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content:
          err instanceof Error ? err.message : 'An error occurred while processing your request.',
        timestamp: new Date(),
        isStreaming: false,
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleClarificationCancel = () => {
    // User chose to skip clarification - send a generic follow-up
    handleSendMessage('Please provide a general answer based on the information available.');
  };

  // Check if the last message has a pending clarification
  const lastMessage = messages[messages.length - 1];
  const pendingClarification =
    lastMessage?.role === 'assistant' && lastMessage.clarification?.needs_clarification
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

            <MessageList messages={messages} isLoading={false} />

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
