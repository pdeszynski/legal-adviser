'use client';

import React from 'react';
import { StreamingViewer } from './StreamingViewer';
import { ChatMessage } from './chat-interface';
import { CitationRenderer } from './citation-renderer';

interface MessageListProps {
  readonly messages: ChatMessage[];
}

/**
 * MessageList Component
 *
 * Displays a list of chat messages with proper styling.
 * Uses StreamingViewer for AI responses to support markdown and streaming.
 */
export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg px-4 py-3 ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            {/* Message Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2">
                {message.role === 'user' ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs font-medium">You</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs font-medium">AI Assistant</span>
                  </>
                )}
              </div>
              <span className="text-xs opacity-70">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* Message Content */}
            {message.role === 'user' ? (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            ) : (
              <div className="text-sm">
                <StreamingViewer
                  content={message.content}
                  isStreaming={message.isStreaming || false}
                  className="prose prose-blue max-w-none"
                  autoScroll={false}
                />
              </div>
            )}

            {/* Citations */}
            {message.citations && message.citations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-300/30">
                <CitationRenderer citations={message.citations} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
