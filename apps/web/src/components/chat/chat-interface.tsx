'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { useChat } from '@/hooks/use-chat';

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
    // Get or create session ID
    let id = localStorage.getItem('chat_session_id');
    if (!id) {
      id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Legal Q&A Chat</h1>
              <p className="text-sm text-gray-600 mt-1">
                Ask legal questions and get AI-powered answers with citations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Chat
            </button>

            {/* Mode Toggle */}
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setMode('SIMPLE')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'SIMPLE' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Simple
              </button>
              <button
                onClick={() => setMode('LAWYER')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'LAWYER' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Pro
              </button>
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {mode === 'LAWYER' ? (
            <span>Detailed legal analysis with comprehensive citations</span>
          ) : (
            <span>Easy-to-understand answers in plain language</span>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="max-w-md">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a conversation</h3>
              <p className="text-gray-600">
                Ask any legal question and get answers with references to legal sources.
              </p>
            </div>
          </div>
        ) : (
          <MessageList messages={messages} isLoading={isStreaming || isLoading} />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <MessageInput
          onSend={handleSendMessage}
          disabled={isStreaming || isLoading}
          placeholder="Ask a legal question..."
        />
      </div>
    </div>
  );
}
