'use client';

import React, { useEffect, useRef } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';

interface StreamingViewerProps {
  /** The content to display (markdown string) */
  readonly content: string;
  /** Whether the content is currently being streamed/generated */
  readonly isStreaming?: boolean;
  /** Class name for the container */
  readonly className?: string;
  /** Whether to auto-scroll to bottom as content updates */
  readonly autoScroll?: boolean;
}

const MarkdownComponents: Components = {
  // Customize link rendering to be safer/styled
  a: ({ node, ...props }) => (
    <a
      {...props}
      className="text-blue-600 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {props.children}
    </a>
  ),
  // Style tables for legal data
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-4">
      <table {...props} className="min-w-full divide-y divide-gray-300 border">
        {props.children}
      </table>
    </div>
  ),
  th: ({ node, ...props }) => (
    <th {...props} className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 bg-gray-50">
      {props.children}
    </th>
  ),
  td: ({ node, ...props }) => (
    <td {...props} className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 border-t">
      {props.children}
    </td>
  ),
};

/**
 * StreamingViewer Component
 *
 * Displays markdown content with support for streaming visualization.
 * Used for both Document Generation (US1) and Q&A Chat (US2).
 *
 * Features:
 * - Markdown rendering via react-markdown
 * - Blinking cursor effect during streaming
 * - Auto-scroll to bottom
 */
export function StreamingViewer({
  content,
  isStreaming = false,
  className = '',
  autoScroll = true,
}: StreamingViewerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when content changes if streaming
  useEffect(() => {
    if (autoScroll && isStreaming && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [content, isStreaming, autoScroll]);

  return (
    <div ref={containerRef} className={`prose prose-blue max-w-none ${className}`}>
      <ReactMarkdown components={MarkdownComponents}>{content || ''}</ReactMarkdown>

      {/* Streaming Cursor Indicator */}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 align-middle bg-blue-600 animate-pulse" />
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}
