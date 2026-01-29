'use client';

import React from 'react';

export interface UserMessageProps {
  content: string;
  timestamp: Date;
}

/**
 * UserMessage Component
 *
 * Renders a standard user message (text content).
 */
export function UserMessage({ content, timestamp }: UserMessageProps) {
  return (
    <>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>

      {/* Timestamp */}
      <div className="text-[10px] mt-1 opacity-70 flex justify-end text-primary-foreground/70">
        {new Date(timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </>
  );
}
