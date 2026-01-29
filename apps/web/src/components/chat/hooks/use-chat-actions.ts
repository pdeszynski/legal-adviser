'use client';

import { useRef, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { useChat, type ChatCitation } from '@/hooks/use-chat';
import type { ClarificationInfo } from '@/hooks/use-chat';
import { useChatSessionManagement } from '@/hooks/use-chat-session-management';
import { useChatSession } from '@/hooks/use-chat-history';
import { getAccessToken } from '@/providers/auth-provider/auth-provider.client';
import { getCsrfHeaders } from '@/lib/csrf';
import type {
  ChatMessage,
  ChatMode,
  ClarificationSubmissionData,
  StreamErrorResponse,
} from '../types/chat.types';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

interface UseChatActionsProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  pendingClarificationMessageId: string | null;
  setPendingClarificationMessageId: React.Dispatch<React.SetStateAction<string | null>>;
  clarificationIdMapRef: React.MutableRefObject<Map<string, string>>;
  pendingClarificationSubmissionRef: React.MutableRefObject<ClarificationSubmissionData | null>;
  streamingMessageIdRef: React.MutableRefObject<string | null>;
  lastUserQuestion: string | null;
  setLastUserQuestion: React.Dispatch<React.SetStateAction<string | null>>;
  setShowErrorBanner: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentError: React.Dispatch<React.SetStateAction<StreamErrorResponse | null>>;
  mode: ChatMode;
  sessionId: string | null;
  createSession: (mode: ChatMode) => Promise<string | null>;
  updateSessionTitle: (title: string) => Promise<void>;
}

export function useChatActions({
  messages,
  setMessages,
  pendingClarificationMessageId,
  setPendingClarificationMessageId,
  clarificationIdMapRef,
  pendingClarificationSubmissionRef,
  streamingMessageIdRef,
  lastUserQuestion,
  setLastUserQuestion,
  setShowErrorBanner,
  setCurrentError,
  mode,
  sessionId,
  createSession,
  updateSessionTitle,
}: UseChatActionsProps) {
  const t = useTranslations('chat');
  const router = useRouter();

  // Start a new chat session
  const handleNewChat = useCallback(async () => {
    setMessages([]);
    const newSessionId = await createSession(mode);
    if (newSessionId) {
      router.push('/chat');
    }
  }, [createSession, mode, router, setMessages]);

  // Update clarification answered status via GraphQL mutation
  const updateClarificationStatusHelper = useCallback(
    async (messageId: string, answered: boolean, answers?: Record<string, string>) => {
      const { getAccessToken } = await import('@/providers/auth-provider/auth-provider.client');
      const token = getAccessToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getCsrfHeaders(),
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
              mutation UpdateClarificationStatus($input: UpdateClarificationStatusInput!) {
                updateClarificationStatus(input: $input) {
                  success
                  messageId
                  status
                }
              }
            `,
            variables: {
              input: {
                messageId,
                answered,
                answers: answers ? JSON.stringify(answers) : undefined,
              },
            },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data?.updateClarificationStatus?.success) {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === messageId ? { ...msg, clarificationAnswered: answered } : msg)),
            );
          }
        }
      } catch (error) {
        console.warn('Failed to update clarification status:', error);
      }
    },
    [setMessages],
  );

  // Submit clarification answers to backend
  const submitClarificationAnswersToBackend = useCallback(
    async (
      clarificationMessageId: string,
      answers: Record<string, string>,
      clarificationQuestions: Array<{ question: string; question_type?: string }>,
    ): Promise<boolean> => {
      const accessToken = getAccessToken();
      if (!accessToken || !sessionId) {
        return false;
      }

      try {
        const answersArray = Object.entries(answers).map(([question, answer]) => {
          const questionObj = clarificationQuestions.find((q) => q.question === question);
          return {
            question,
            answer,
            question_type: questionObj?.question_type || 'text',
          };
        });

        const clarificationAnswerContent = JSON.stringify({
          type: 'clarification_answer',
          answers: answersArray,
          clarification_message_id: clarificationMessageId,
        });

        const response = await fetch(GRAPHQL_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            ...getCsrfHeaders(),
          },
          credentials: 'include',
          body: JSON.stringify({
            query: `
              mutation SaveClarificationAnswerMessage($input: SaveChatMessageInput!) {
                saveChatMessage(input: $input) {
                  messageId
                  sessionId
                  role
                  content
                  sequenceOrder
                  createdAt
                }
              }
            `,
            variables: {
              input: {
                sessionId,
                content: clarificationAnswerContent,
                role: 'USER',
                type: 'CLARIFICATION_ANSWER',
              },
            },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const success = !!result.data?.saveChatMessage?.messageId;

          if (success) {
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === clarificationMessageId && msg.clarification) {
                  return {
                    ...msg,
                    clarificationAnswered: true,
                    clarificationAnswers: answers,
                  };
                }
                return msg;
              }),
            );
          }

          return success;
        }
        return false;
      } catch (error) {
        console.warn('Error submitting clarification answers:', error);
        return false;
      }
    },
    [sessionId, setMessages],
  );

  // Handle sending a message
  const handleSendMessage = async (
    content: string,
    sendStreamingMessage: (question: string, mode: ChatMode, sessionId: string) => Promise<any>,
  ) => {
    setShowErrorBanner(false);
    setLastUserQuestion(content);

    let effectiveSessionId = sessionId;
    if (!effectiveSessionId) {
      effectiveSessionId = await createSession(mode);
      if (!effectiveSessionId) {
        setCurrentError({
          type: 'SESSION_ERROR',
          message: t('errors.failedToCreateSession'),
          userMessage: t('errors.couldNotStartSession'),
          retryable: true,
          fallbackAvailable: false,
          canRecover: true,
          severity: 'high',
        });
        setShowErrorBanner(true);
        return;
      }
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

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
      await sendStreamingMessage(content, mode, effectiveSessionId);
    } catch (err) {
      if (streamingMessageIdRef.current) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred while processing your request.';
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: errorMessage, isStreaming: false, hasError: true }
              : msg,
          ),
        );
      }
    }
  };

  // Handle clarification submit
  const handleClarificationSubmit = async (
    answers: Record<string, string>,
    sendClarificationAnswersStreaming: (
      originalQuestion: string,
      answers: Array<{ question: string; answer: string; question_type: string }>,
      mode: ChatMode,
      sessionId: string,
    ) => Promise<any>,
  ) => {
    if (!sessionId) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: t('errors.sessionNotFound'),
        timestamp: new Date(),
        isStreaming: false,
        hasError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const clarificationMessage = messages.find(
      (m) => m.id === pendingClarificationMessageId && m.clarification?.needs_clarification,
    );

    if (!clarificationMessage || !clarificationMessage.clarification) {
      return;
    }

    pendingClarificationSubmissionRef.current = {
      clarificationMessageId: pendingClarificationMessageId!,
      answers,
      clarificationQuestions: clarificationMessage.clarification.questions,
    };

    const answersArray = Object.entries(answers)
      .filter(([, value]) => value.trim())
      .map(([question, answer]) => {
        const questionObj = clarificationMessage.clarification!.questions.find(
          (q) => q.question === question,
        );
        return {
          question,
          answer,
          question_type: questionObj?.question_type || 'text',
        };
      });

    const originalQuestion = lastUserQuestion || t('skipClarification');

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
      await sendClarificationAnswersStreaming(originalQuestion, answersArray, mode, sessionId);
    } catch (err) {
      if (pendingClarificationSubmissionRef.current) {
        pendingClarificationSubmissionRef.current = null;
      }

      const errorMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your answers. Please try again.',
        timestamp: new Date(),
        isStreaming: false,
        hasError: true,
      };
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? errorMessage : m)));
    }
  };

  // Handle clarification cancel
  const handleClarificationCancel = (sendMessage: (content: string) => Promise<void>) => {
    sendMessage(t('skipClarification'));
  };

  return {
    handleNewChat,
    updateClarificationStatusHelper,
    submitClarificationAnswersToBackend,
    handleSendMessage,
    handleClarificationSubmit,
    handleClarificationCancel,
  };
}
