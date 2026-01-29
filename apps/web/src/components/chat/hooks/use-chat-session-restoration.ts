'use client';

import { useEffect } from 'react';
import { useChatSession } from '@/hooks/use-chat-history';
import type { ChatMessage, ChatMode } from '../types/chat.types';

interface UseChatSessionRestorationProps {
  sessionParam: string | null;
  sessionId: string | null;
  sessionData?: { messages?: any[]; mode?: string; title?: string | null } | null;
  sessionFetchError?: Error | null;
  setMode: (mode: ChatMode) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export function useChatSessionRestoration({
  sessionParam,
  sessionId,
  sessionData,
  sessionFetchError,
  setMode,
  setMessages,
}: UseChatSessionRestorationProps) {
  // Handle session restoration from URL
  useEffect(() => {
    if (sessionParam && sessionData) {
      // Set mode from session
      if (sessionData.mode) {
        setMode(sessionData.mode as ChatMode);
      }

      // Load messages from session data with full support for citations and clarification
      if (sessionData.messages && sessionData.messages.length > 0) {
        // First pass: collect all clarification answers and their target message IDs
        const clarificationAnswersMap = new Map<string, Record<string, string>>();
        const nonAnswerMessages = sessionData.messages.filter((msg: any) => {
          const isClarificationAnswerType = msg.type === 'CLARIFICATION_ANSWER';
          const isClarificationAnswerContent =
            msg.content && typeof msg.content === 'string' && msg.role === 'USER'
              ? (() => {
                  const trimmed = msg.content.trim();
                  return (
                    trimmed.startsWith('{"type":"clarification_answer"') ||
                    trimmed.startsWith('{"type": "clarification_answer"')
                  );
                })()
              : false;

          if (isClarificationAnswerType || isClarificationAnswerContent) {
            const parsed = JSON.parse(msg.content);
            if (parsed.type === 'clarification_answer' && Array.isArray(parsed.answers)) {
              const clarificationMessageId = parsed.clarification_message_id;
              if (clarificationMessageId) {
                const answersRecord = parsed.answers.reduce(
                  (acc: Record<string, string>, a: any) => {
                    acc[a.question] = a.answer;
                    return acc;
                  },
                  {},
                );
                clarificationAnswersMap.set(clarificationMessageId, answersRecord);
              }
            }
            return false;
          }
          return true;
        });

        // Second pass: load remaining messages and attach clarification answers
        const loadedMessages: ChatMessage[] = nonAnswerMessages
          .sort((a: any, b: any) => a.sequenceOrder - b.sequenceOrder)
          .map((msg: any) => {
            const msgId = msg.messageId;
            const answersForThis = clarificationAnswersMap.get(msgId);

            const hasValidClarificationType =
              msg.type === 'CLARIFICATION_QUESTION' || msg.type === null;
            const clarificationFromMetadata =
              hasValidClarificationType && msg.metadata?.clarification?.needs_clarification
                ? msg.metadata.clarification
                : null;

            const message: ChatMessage = {
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
            };

            if (clarificationFromMetadata) {
              message.clarification = {
                needs_clarification: true,
                questions: clarificationFromMetadata.questions || [],
                context_summary: clarificationFromMetadata.context_summary || '',
                next_steps: clarificationFromMetadata.next_steps || '',
                currentRound: clarificationFromMetadata.currentRound,
                totalRounds: clarificationFromMetadata.totalRounds,
              };
              message.clarificationAnswered =
                clarificationFromMetadata.answered ||
                msg.metadata?.clarification?.answered ||
                false;

              const answersForThis = clarificationAnswersMap.get(msg.messageId);
              if (answersForThis) {
                message.clarificationAnswers = answersForThis;
                message.clarificationAnswered = true;
              }
            }

            return message;
          });
        setMessages(loadedMessages);
      }
    }

    // Handle session not found or error
    if (sessionParam && sessionFetchError) {
      console.error('Failed to load session:', sessionFetchError);
    }
  }, [sessionParam, sessionData, sessionFetchError, setMode, setMessages]);
}
