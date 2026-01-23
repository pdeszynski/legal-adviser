'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Loader2, ArrowUp } from 'lucide-react';
import { cn } from '@legal/ui';

interface MessageInputProps {
  readonly onSend: (message: string) => void;
  readonly disabled?: boolean;
  readonly placeholder?: string;
}

/**
 * MessageInput Component
 *
 * Text input field for sending chat messages.
 * Supports Enter to send, Shift+Enter for new line.
 * Auto-resizes textarea based on content.
 */
export function MessageInput({
  onSend,
  disabled = false,
  placeholder = 'Ask a legal question...',
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative max-w-4xl mx-auto w-full">
      <div className="relative flex items-end gap-2 bg-background border border-input rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all p-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full px-4 py-3 bg-transparent border-0 focus:ring-0 resize-none disabled:opacity-50 min-h-[52px] max-h-[200px]"
        />

        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className={cn(
            'p-2.5 rounded-xl transition-all flex-shrink-0 mb-0.5',
            message.trim() && !disabled
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
              : 'bg-muted text-muted-foreground cursor-not-allowed',
          )}
        >
          {disabled ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowUp className="w-5 h-5" />
          )}
        </button>
      </div>
      <p className="text-xs text-center text-muted-foreground mt-2">
        AI can make mistakes. Please double check important information.
      </p>
    </div>
  );
}
