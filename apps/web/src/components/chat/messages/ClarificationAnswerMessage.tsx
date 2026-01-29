'use client';

import React from 'react';
import { FileQuestion } from 'lucide-react';

export interface ClarificationAnswerMessageProps {
  content: string;
  timestamp: Date;
}

/**
 * ClarificationAnswerMessage Component
 *
 * Renders a user's message containing clarification answers.
 * Displays the answers in a styled format with an icon.
 */
export function ClarificationAnswerMessage({
  content,
  timestamp,
}: ClarificationAnswerMessageProps) {
  return (
    <>
      <div className="flex items-start gap-2">
        <FileQuestion className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
            Clarification answers:
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      </div>

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
