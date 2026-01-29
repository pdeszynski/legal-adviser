'use client';

import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { STARTER_PROMPTS } from '../constants/starter-prompts';

interface EmptyChatStateProps {
  onStarterPromptClick: (prompt: string) => void;
}

export function EmptyChatState({ onStarterPromptClick }: EmptyChatStateProps) {
  const t = useTranslations('chat');

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-10">
        <div className="h-24 w-24 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary">
          <Sparkles className="h-12 w-12" />
        </div>
        <h2 className="text-3xl font-bold mb-3 tracking-tight">{t('emptyState.title')}</h2>
        <p className="text-muted-foreground max-w-lg mx-auto text-lg">
          {t('emptyState.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {STARTER_PROMPTS.map((starter, i) => (
          <button
            key={i}
            onClick={() => onStarterPromptClick(starter.prompt)}
            className="flex flex-col items-start p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left shadow-sm group"
          >
            <starter.icon className="h-6 w-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-sm mb-1">{t(`starterPrompts.${i === 0 ? 'draftDemandLetter' : i === 1 ? 'analyzeRentalContract' : 'askEmployeeRights'}.title`)}</span>
            <span className="text-xs text-muted-foreground line-clamp-2">
              {t(`starterPrompts.${i === 0 ? 'draftDemandLetter' : i === 1 ? 'analyzeRentalContract' : 'askEmployeeRights'}.prompt`)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
