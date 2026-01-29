'use client';

import { useTranslations } from 'next-intl';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useChatSessionManagement } from '@/hooks/use-chat-session-management';
import type { ChatMode } from '../types/chat.types';

interface SessionLoadingStateProps {
  sessionParam: string | null;
  mode: ChatMode;
}

export function SessionLoadingState({ sessionParam, mode }: SessionLoadingStateProps) {
  const t = useTranslations('chat');
  const { isCreatingSession, createSession } = useChatSessionManagement();

  const loadingText = sessionParam
    ? t('loadingStates.restoringChatSession')
    : isCreatingSession
      ? t('loadingStates.creatingNewSession')
      : t('loadingStates.preparingConversation');

  const title = sessionParam
    ? t('loadingStates.loadingConversation')
    : t('loadingStates.startingNewConversation');

  return (
    <div className="flex flex-col items-center justify-center h-full animate-in fade-in duration-300">
      <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground text-sm">{loadingText}</p>
    </div>
  );
}

interface SessionErrorStateProps {
  error: string;
  mode: ChatMode;
  onRetry: () => void;
}

export function SessionErrorState({ error, onRetry }: SessionErrorStateProps) {
  const t = useTranslations('chat');

  return (
    <div className="flex flex-col items-center justify-center h-full animate-in fade-in duration-300">
      <AlertTriangle className="h-12 w-12 text-orange-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">{t('sessionError.title')}</h2>
      <p className="text-muted-foreground text-sm mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        {t('sessionError.tryAgain')}
      </button>
    </div>
  );
}
