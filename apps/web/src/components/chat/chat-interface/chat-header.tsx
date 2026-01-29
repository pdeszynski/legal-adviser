'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Bot,
  Plus,
  HelpCircle,
  WifiOff,
  History,
} from 'lucide-react';
import { cn } from '@legal/ui';
import { useChatSessionManagement } from '@/hooks/use-chat-session-management';
import { ChatExportButton } from '../chat-export-button';
import type { ChatMode } from '../types/chat.types';

interface ChatHeaderProps {
  isInClarificationMode: boolean;
  isReconnecting: boolean;
  isStreamingActive: boolean;
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
  sessionId: string | null;
  sessionData?: { title?: string | null } | null;
  reconnectionState?: { attempt?: number } | null;
  onNewChat: () => void;
}

export function ChatHeader({
  isInClarificationMode,
  isReconnecting,
  isStreamingActive,
  mode,
  setMode,
  sessionId,
  sessionData,
  reconnectionState,
  onNewChat,
}: ChatHeaderProps) {
  const t = useTranslations('chat');
  const router = useRouter();

  const headerBg = isInClarificationMode
    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
    : isReconnecting
      ? 'bg-orange-50/80 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900'
      : 'bg-card/50 border-border';

  const iconBg = isInClarificationMode
    ? 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400'
    : isReconnecting
      ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
      : 'bg-primary/10 text-primary';

  const titleColor = isInClarificationMode
    ? 'text-amber-900 dark:text-amber-100'
    : isReconnecting
      ? 'text-orange-900 dark:text-orange-100'
      : '';

  const statusColor = isInClarificationMode
    ? 'text-amber-700 dark:text-amber-300'
    : isReconnecting
      ? 'text-orange-700 dark:text-orange-300'
      : 'text-muted-foreground';

  const statusBg = isInClarificationMode
    ? 'bg-amber-500'
    : isReconnecting
      ? 'bg-orange-500'
      : isStreamingActive
        ? 'bg-blue-500'
        : 'bg-green-500';

  const title = isReconnecting
    ? t('reconnecting')
    : isInClarificationMode
      ? t('clarificationMode')
      : t('title');

  const statusText = isReconnecting
    ? t('status.reconnecting', { attempt: reconnectionState?.attempt || 1 })
    : isInClarificationMode
      ? t('status.waitingForAnswers')
      : isStreamingActive
        ? t('status.generatingResponse')
        : t('status.onlineAndReady');

  const Icon = isReconnecting ? WifiOff : isInClarificationMode ? HelpCircle : Bot;

  return (
    <div
      className={cn(
        'px-6 py-4 border-b backdrop-blur-sm flex items-center justify-between sticky top-0 z-10 transition-colors',
        headerBg,
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'h-10 w-10 rounded-xl flex items-center justify-center transition-colors',
            iconBg,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h1 className={cn('text-lg font-bold transition-colors', titleColor)}>
            {title}
          </h1>
          <p className={cn('text-xs flex items-center gap-1 transition-colors', statusColor)}>
            <span className={cn('w-2 h-2 rounded-full inline-block animate-pulse', statusBg)}></span>
            {statusText}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* History Button */}
        <button
          onClick={() => router.push('/chat/history')}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          title={t('buttons.history')}
        >
          <History className="h-5 w-5" />
        </button>

        {/* Export Button */}
        {sessionId && (
          <ChatExportButton
            sessionId={sessionId}
            title={sessionData?.title ?? undefined}
            variant="menu"
          />
        )}

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setMode('SIMPLE')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              mode === 'SIMPLE'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t('mode.simple')}
          </button>
          <button
            onClick={() => setMode('LAWYER')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              mode === 'LAWYER'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t('mode.lawyer')}
          </button>
        </div>

        <button
          onClick={onNewChat}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors ml-2"
          title={t('buttons.newChat')}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
