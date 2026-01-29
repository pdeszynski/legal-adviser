'use client';

import React from 'react';
import { ClarificationPrompt } from '../clarification-prompt';
import type { ClarificationInfo } from '@/hooks/use-chat';

export interface ClarificationQuestionMessageProps {
  clarification: ClarificationInfo;
  onSubmit?: (answers: Record<string, string>) => Promise<void>;
  isSubmitting?: boolean;
  readonly?: boolean;
  prefillAnswers?: Record<string, string>;
}

/**
 * ClarificationQuestionMessage Component
 *
 * Renders a message containing clarification questions.
 * Displays the ClarificationPrompt component with the questions.
 */
export function ClarificationQuestionMessage({
  clarification,
  onSubmit,
  isSubmitting,
  readonly,
  prefillAnswers,
}: ClarificationQuestionMessageProps) {
  return (
    <ClarificationPrompt
      clarification={clarification}
      onSubmit={onSubmit || (async () => {})}
      isSubmitting={isSubmitting}
      readonly={readonly}
      prefillAnswers={prefillAnswers}
    />
  );
}
