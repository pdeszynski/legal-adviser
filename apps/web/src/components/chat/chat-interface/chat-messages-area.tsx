'use client';

import { useRef, useEffect } from 'react';
import { MessageList } from '../message-list';
import { ClarificationPrompt } from '../clarification-prompt';
import { StreamErrorMessage } from '../stream-error-message';
import { ChatExportButton } from '../chat-export-button';
import type { ChatMessage, ClarificationInfo, StreamErrorResponse } from '../types/chat.types';
import type { ReconnectionState } from '@/hooks/streaming/streaming-error-handler';

interface ChatMessagesAreaProps {
  messages: ChatMessage[];
  pendingClarification: ClarificationInfo | null;
  showErrorBanner: boolean;
  currentError: StreamErrorResponse | null;
  isLoadingSession: boolean;
  isCreatingSession: boolean;
  sessionError: string | null;
  sessionParam: string | null;
  reconnectionState?: ReconnectionState | null;
  sessionId: string | null;
  sessionData?: { title?: string | null } | null;
  onClarificationSubmit: (clarification: ClarificationInfo, answers: Record<string, string>) => Promise<void>;
  onClarificationCancel: () => void;
  onRetryFromBanner: () => void;
  onDismissError: () => void;
}

// Wrapper to adapt the MessageList callback signature
function createMessageListCallback(
  onClarificationSubmit: (clarification: ClarificationInfo, answers: Record<string, string>) => Promise<void>,
): (clarification: ClarificationInfo, answers: Record<string, string>) => Promise<void> {
  return onClarificationSubmit;
}

export function ChatMessagesArea({
  messages,
  pendingClarification,
  showErrorBanner,
  currentError,
  isLoadingSession,
  isCreatingSession,
  sessionError,
  sessionParam,
  reconnectionState,
  sessionId,
  sessionData,
  onClarificationSubmit,
  onClarificationCancel,
  onRetryFromBanner,
  onDismissError,
}: ChatMessagesAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isLoading = isLoadingSession || isCreatingSession;
  const hasPartialContent = messages.some(
    (m) => m.role === 'assistant' && m.partial && m.content.length > 0,
  );

  if (isLoading) {
    return null; // Handled by parent component
  }

  if (sessionError) {
    return null; // Handled by parent component
  }

  if (messages.length === 0) {
    return null; // Handled by EmptyChatState
  }

  return (
    <div className="py-4 space-y-4">
      {/* Error Banner */}
      {showErrorBanner && currentError && (
        <div className="px-4 md:px-0">
          <StreamErrorMessage
            errorResponse={currentError}
            reconnectionState={reconnectionState ?? null}
            hasPartialContent={hasPartialContent}
            onRetry={onRetryFromBanner}
            onDismiss={onDismissError}
          />
        </div>
      )}

      <MessageList
        messages={messages}
        isLoading={false}
        onClarificationSubmit={createMessageListCallback(onClarificationSubmit)}
        skipLastClarification={true}
      />

      {/* Render clarification prompt if pending */}
      {pendingClarification && (
        <ClarificationPrompt
          clarification={pendingClarification}
          onSubmit={(answers) => onClarificationSubmit(pendingClarification, answers)}
          onCancel={onClarificationCancel}
          isSubmitting={false}
        />
      )}

      <div ref={messagesEndRef} className="h-4" />
    </div>
  );
}
