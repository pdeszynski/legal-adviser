'use client';

import React from 'react';
import { StreamingViewer } from './StreamingViewer';
import { ChatMessage } from './chat-interface';
import { CitationRenderer } from './citation-renderer';
import { MessageSkeleton } from './message-skeleton';
import { Bot, User } from 'lucide-react';
import { cn } from '@legal/ui';

interface MessageListProps {
  readonly messages: ChatMessage[];
  readonly isLoading?: boolean;
}

/**
 * MessageList Component
 *
 * Displays a list of chat messages with proper styling.
 * Uses StreamingViewer for AI responses to support markdown and streaming.
 * Shows skeleton loading placeholder while waiting for AI response.
 */
export function MessageList({ messages, isLoading }: MessageListProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full pb-4">
      {messages.map((message) => (
        <div
          key={message.id}
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
            )}
          >
            {/* Header only for AI to show logic/citation status or just cleaner look? 
                Actually user doesn't need header. AI maybe. 
                Let's keep it clean and minimal.
            */}

            {/* Message Content */}
            {message.role === 'user' ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
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

            {/* Citations */}
            {message.citations && message.citations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <CitationRenderer citations={message.citations} />
              </div>
            )}

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
    </div>
  );
}
