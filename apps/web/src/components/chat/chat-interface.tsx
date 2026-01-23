'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { useChat } from '@/hooks/use-chat';
import { Bot, Plus, Scale, Sparkles, MessageSquareText, ShieldQuestion } from 'lucide-react';
import { cn } from '@legal/ui';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{
    source: string;
    url?: string;
    excerpt?: string;
    article?: string;
  }>;
  timestamp: Date;
  isStreaming?: boolean;
}

const STARTER_PROMPTS = [
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

/**
 * ChatInterface Component
 *
 * Main chat container for Q&A functionality.
 * Displays conversation history and handles user input.
 * Supports real-time streaming of AI responses.
 */
export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    // Get or create session ID (must be valid UUID v4 for backend validation)
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let id = localStorage.getItem('chat_session_id');
    if (!id || !uuidV4Regex.test(id)) {
      id = crypto.randomUUID();
      localStorage.setItem('chat_session_id', id);
    }
    return id;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { sendMessage, isLoading, mode, setMode } = useChat();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`chat_history_${sessionId}`);
    if (stored) {
      try {
        const history = JSON.parse(stored);
        setMessages(history);
      } catch {
        // Ignore corrupt history
      }
    }
  }, [sessionId]);

  // Start a new chat session
  const handleNewChat = () => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    localStorage.setItem('chat_session_id', newSessionId);
    setMessages([]);
  };

  // Save conversation history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat_history_${sessionId}`, JSON.stringify(messages));
    }
  }, [messages, sessionId]);

  const handleSendMessage = async (content: string) => {
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);

    try {
      // Send message and get response
      const response = await sendMessage(content);

      // Add assistant message to chat
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answerMarkdown || '',
        citations: response.citations,
        timestamp: new Date(),
        isStreaming: false,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content:
          err instanceof Error ? err.message : 'An error occurred while processing your request.',
        timestamp: new Date(),
        isStreaming: false,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Legal AI Assistant</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
              Online & Ready
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
              Simple
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
              Pro
            </button>
          </div>

          <button
            onClick={handleNewChat}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors ml-2"
            title="New Chat"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-10">
              <div className="h-24 w-24 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary">
                <Sparkles className="h-12 w-12" />
              </div>
              <h2 className="text-3xl font-bold mb-3 tracking-tight">How can I help you today?</h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-lg">
                I can help you draft documents, analyze contracts, or answer complex legal
                questions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              {STARTER_PROMPTS.map((starter, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(starter.prompt)}
                  className="flex flex-col items-start p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left shadow-sm group"
                >
                  <starter.icon className="h-6 w-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-sm mb-1">{starter.title}</span>
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {starter.prompt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4">
            <MessageList messages={messages} isLoading={isStreaming || isLoading} />
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="px-4 md:px-8 py-6 bg-gradient-to-t from-background to-background/50 backdrop-blur-sm z-10">
        <MessageInput
          onSend={handleSendMessage}
          disabled={isStreaming || isLoading}
          placeholder={
            mode === 'LAWYER' ? 'Ask a complex legal question...' : 'Ask for legal help...'
          }
        />
      </div>
    </div>
  );
}
