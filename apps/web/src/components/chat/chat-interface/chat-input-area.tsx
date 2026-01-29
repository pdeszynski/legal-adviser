'use client';

import { useTranslations } from 'next-intl';
import { MessageInput } from '../message-input';
import type { ChatMode, ClarificationInfo } from '../types/chat.types';

interface ChatInputAreaProps {
  mode: ChatMode;
  isLoading: boolean;
  pendingClarification: ClarificationInfo | null;
  onSend: (content: string) => void;
  onStop: () => void;
  isStreaming: boolean;
}

export function ChatInputArea({
  mode,
  isLoading,
  pendingClarification,
  onSend,
  onStop,
  isStreaming,
}: ChatInputAreaProps) {
  const t = useTranslations('chat');

  const placeholder =
    mode === 'LAWYER' ? t('placeholders.lawyerMode') : t('placeholders.simpleMode');

  return (
    <div className="px-4 md:px-8 py-6 bg-gradient-to-t from-background to-background/50 backdrop-blur-sm z-10">
      <MessageInput
        onSend={onSend}
        onStop={onStop}
        disabled={isLoading || !!pendingClarification}
        isLoading={isStreaming}
        placeholder={placeholder}
      />
    </div>
  );
}
