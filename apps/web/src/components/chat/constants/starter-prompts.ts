import { Scale, MessageSquareText, ShieldQuestion } from 'lucide-react';
import type { StarterPrompt } from '../types/chat.types';

export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    icon: Scale,
    title: 'Draft a Lawyer Demand Letter',
    prompt: 'I need to draft a demand letter for unpaid services. Can you help me?',
  },
  {
    icon: MessageSquareText,
    title: 'Analyze a Rental Contract',
    prompt: 'What are the common pitfalls in a residential rental agreement in Poland?',
  },
  {
    icon: ShieldQuestion,
    title: 'Ask about Employee Rights',
    prompt: 'What are my rights if my employer terminates my contract without notice?',
  },
];
