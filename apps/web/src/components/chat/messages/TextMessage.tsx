'use client';

import React from 'react';
import { StreamingViewer } from '../StreamingViewer';
import { CitationRenderer } from '../citation-renderer';
import type { ChatCitation } from '@/hooks/use-chat';

export interface TextMessageProps {
  content: string;
  isStreaming?: boolean;
  citations?: ChatCitation[];
  timestamp: Date;
  role: 'user' | 'assistant';
}

/**
 * TextMessage Component
 *
 * Renders a standard text message with optional citations.
 * Uses StreamingViewer for AI responses to support markdown and streaming.
 */
export function TextMessage({
  content,
  isStreaming,
  citations,
  timestamp,
  role,
}: TextMessageProps) {
  return (
    <>
      <div className="text-sm leading-relaxed">
        <StreamingViewer
          content={content}
          isStreaming={isStreaming || false}
          className="prose prose-sm dark:prose-invert max-w-none"
          autoScroll={false}
        />
      </div>

      {/* Citations */}
      {citations && citations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <CitationRenderer citations={citations} />
        </div>
      )}

      {/* Timestamp */}
      <div className="text-[10px] mt-1 opacity-70 flex justify-end text-muted-foreground">
        {new Date(timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </>
  );
}
