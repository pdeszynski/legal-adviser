'use client';

import React from 'react';
import { StreamingViewer } from './StreamingViewer';
import { ChatMessage } from './chat-interface';
import { CitationRenderer } from './citation-renderer';
import { MessageSkeleton } from './message-skeleton';
import { ClarificationPrompt } from './clarification-prompt';
import type { ClarificationInfo } from '@/hooks/use-chat';
import { Bot, User, HelpCircle, FileQuestion } from 'lucide-react';
import { cn } from '@legal/ui';

interface MessageListProps {
  readonly messages: ChatMessage[];
  readonly isLoading?: boolean;
  readonly onClarificationSubmit?: (
    clarification: ClarificationInfo,
    answers: Record<string, string>,
  ) => Promise<void>;
  /** If true, skip rendering interactive ClarificationPrompt for the last message */
  readonly skipLastClarification?: boolean;
}

/**
 * MessageList Component
 *
 * Displays a list of chat messages with proper styling.
 * Uses StreamingViewer for AI responses to support markdown and streaming.
 * Shows skeleton loading placeholder while waiting for AI response.
 * For historical clarification messages, shows interactive ClarificationPrompt.
 */
export function MessageList({
  messages,
  isLoading,
  onClarificationSubmit,
  skipLastClarification = false,
}: MessageListProps) {
  // Check if we have any pending (not answered) clarification messages in history
  const hasPendingClarification = messages.some(
    (m) => m.clarification?.needs_clarification && !m.clarificationAnswered && !m.isStreaming,
  );

  // Determine if we should skip rendering the last message's clarification prompt
  // This prevents duplicate rendering when ChatInterface handles the current pending clarification
  const lastIndex = messages.length - 1;

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full pb-4">
      {messages.map((message, idx) => (
        <div
          key={message.id}
          data-testid={message.role === 'user' ? 'user-message' : 'assistant-message'}
          className={cn(
            'flex gap-4 w-full',
            message.role === 'user' ? 'justify-end' : 'justify-start',
          )}
        >
          {/* Avatar for AI */}
          {message.role === 'assistant' && (
            <div className="h-8 w-8 rounded-full border border-border bg-muted flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          <div
            className={cn(
              'max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm',
              message.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                : 'bg-card border border-border text-card-foreground rounded-tl-sm',
              // Adjust padding for full-width clarification prompt
              message.clarification?.needs_clarification &&
                'p-0 bg-transparent shadow-none border-0',
              // Special style for clarification answer messages
              message.isClarificationAnswer &&
                'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800',
            )}
          >
            {/* Header only for AI to show logic/citation status or just cleaner look?
                Actually user doesn't need header. AI maybe.
                Let's keep it clean and minimal.
            */}

            {/* Message Content */}
            {message.role === 'user' ? (
              <>
                {message.isClarificationAnswer ? (
                  <div className="flex items-start gap-2">
                    <FileQuestion className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
                        Clarification answers:
                      </p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                )}
              </>
            ) : message.clarification?.needs_clarification ? (
              <>
                {/* For historical clarification messages, show interactive or readonly ClarificationPrompt */}
                {/* Skip rendering for the last message if skipLastClarification is true (prevents duplicate rendering) */}
                {skipLastClarification &&
                idx === lastIndex ? /* Skip rendering - ChatInterface will handle this */
                null : message.clarificationAnswered || message.clarificationAnswers ? (
                  /* Show readonly ClarificationPrompt for answered clarifications */
                  <ClarificationPrompt
                    clarification={message.clarification}
                    onSubmit={async () => {
                      // No-op - readonly mode
                    }}
                    isSubmitting={false}
                    readonly={true}
                    prefillAnswers={message.clarificationAnswers}
                  />
                ) : (
                  /* Show interactive ClarificationPrompt for pending historical clarifications */
                  <ClarificationPrompt
                    clarification={message.clarification}
                    onSubmit={async (answers) => {
                      if (onClarificationSubmit) {
                        await onClarificationSubmit(message.clarification!, answers);
                      }
                    }}
                    isSubmitting={false}
                  />
                )}
              </>
            ) : (
              <div className="text-sm leading-relaxed">
                <StreamingViewer
                  content={message.content}
                  isStreaming={message.isStreaming || false}
                  className="prose prose-sm dark:prose-invert max-w-none"
                  autoScroll={false}
                />
              </div>
            )}

            {/* Citations - only show if not a clarification message */}
            {message.citations &&
              message.citations.length > 0 &&
              !message.clarification?.needs_clarification && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <CitationRenderer citations={message.citations} />
                </div>
              )}

            {/* Timestamp - only show if not a full-width clarification prompt */}
            {!message.clarification?.needs_clarification && (
              <div
                className={cn(
                  'text-[10px] mt-1 opacity-70 flex justify-end',
                  message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground',
                )}
              >
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
          </div>

          {/* Avatar for User */}
          {message.role === 'user' && (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
              <User className="h-4 w-4 text-primary" />
            </div>
          )}
        </div>
      ))}

      {/* Skeleton for loading AI response */}
      {isLoading && <MessageSkeleton />}

      {/* Warning banner if there's a pending clarification in history */}
      {hasPendingClarification && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-300">
          <HelpCircle className="h-4 w-4 flex-shrink-0" />
          <p>
            You have pending clarification questions above. Please answer them to continue the
            conversation.
          </p>
        </div>
      )}
    </div>
  );
}
