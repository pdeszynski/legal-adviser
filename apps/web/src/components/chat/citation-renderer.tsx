'use client';

import React, { useState } from 'react';
import type { ChatCitation } from '@/hooks/use-chat';

interface CitationRendererProps {
  readonly citations: ChatCitation[];
  readonly className?: string;
}

/**
 * CitationRenderer Component
 *
 * Displays legal citations with proper formatting.
 * Supports links to source documents and hover previews of cited text.
 */
export function CitationRenderer({ citations, className = '' }: CitationRendererProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div className={`citation-renderer ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <svg
          className="w-4 h-4 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span className="text-xs font-semibold text-gray-700">Sources ({citations.length})</span>
      </div>

      <div className="space-y-2">
        {citations.map((citation, index) => (
          <div
            key={index}
            className="relative group"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Citation Card */}
            <div className="flex items-start gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-default">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-600">{index + 1}</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Source with link */}
                <div className="flex items-center gap-1">
                  {citation.url ? (
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>{citation.source}</span>
                      <svg
                        className="w-3 h-3 inline-block"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-gray-900">{citation.source}</span>
                  )}

                  {citation.article && (
                    <span className="text-sm text-gray-600"> - {citation.article}</span>
                  )}
                </div>

                {/* Truncated excerpt */}
                {citation.excerpt && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    &quot;{truncateText(citation.excerpt, 100)}&quot;
                  </p>
                )}
              </div>

              {/* Expand icon indicator */}
              {citation.excerpt && citation.excerpt.length > 100 && (
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Hover Preview Tooltip */}
            {citation.excerpt && citation.excerpt.length > 100 && hoveredIndex === index && (
              <div className="absolute z-50 left-0 right-0 top-full mt-2 p-4 bg-gray-900 text-white rounded-lg shadow-xl">
                <p className="text-sm leading-relaxed">&quot;{citation.excerpt}&quot;</p>
                <div className="mt-2 pt-2 border-t border-gray-700 flex items-center gap-2 text-xs text-gray-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Hover preview</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Truncates text to specified length and adds ellipsis if needed
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}
