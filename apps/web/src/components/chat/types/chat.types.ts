import type { ChatCitation } from '@/hooks/use-chat';
import type { ClarificationInfo } from '@/hooks/use-chat';
import type { StreamErrorResponse } from '@/hooks/streaming/streaming-error-handler';

// Re-export types for convenience
export type { ClarificationInfo } from '@/hooks/use-chat';
export type { StreamErrorResponse } from '@/hooks/streaming/streaming-error-handler';

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

export type ChatMode = 'LAWYER' | 'SIMPLE';

export interface StarterPrompt {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  prompt: string;
}

export interface ClarificationSubmissionData {
  clarificationMessageId: string;
  answers: Record<string, string>;
  clarificationQuestions: Array<{ question: string; question_type?: string }>;
}
