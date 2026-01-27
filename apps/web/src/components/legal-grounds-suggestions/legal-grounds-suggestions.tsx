'use client';

import { useTranslate } from '@refinedev/core';

/**
 * Confidence level for legal ground suggestions
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Legal ground suggestion interface
 */
export interface LegalGroundSuggestion {
  id: string;
  article: string;
  title: string;
  explanation: string;
  confidence: ConfidenceLevel;
}

/**
 * Props for LegalGroundSuggestions component
 */
export interface LegalGroundSuggestionsProps {
  readonly suggestions: LegalGroundSuggestion[];
  readonly onSelect?: (suggestion: LegalGroundSuggestion) => void;
  readonly loading?: boolean;
  readonly className?: string;
  readonly inline?: boolean;
}

/**
 * Get styling for confidence level badges
 */
function getConfidenceBadgeStyles(confidence: ConfidenceLevel): string {
  const baseStyles = 'px-2 py-1 rounded text-xs font-medium border';
  const styles = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  };
  return `${baseStyles} ${styles[confidence]}`;
}

/**
 * Get confidence level label
 */
function getConfidenceLabel(confidence: ConfidenceLevel): string {
  const labels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };
  return labels[confidence];
}

/**
 * LegalGroundSuggestions Component
 *
 * Displays suggested legal grounds with confidence indicators.
 * Can be used inline in forms or as a standalone component.
 */
export function LegalGroundSuggestions({
  suggestions,
  onSelect,
  loading = false,
  className = '',
  inline = false,
}: LegalGroundSuggestionsProps) {
  const translate = useTranslate();

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  const containerClass = inline
    ? 'space-y-2'
    : 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3';

  return (
    <div className={containerClass}>
      {!inline && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            {translate('legalGroundsSuggestions.title')}
          </h3>
          <span className="text-xs text-gray-600">
            {translate('legalGroundsSuggestions.count', { count: suggestions.length })}
          </span>
        </div>
      )}

      <div className={inline ? 'space-y-2' : 'space-y-3'}>
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`group relative border rounded-lg p-3 transition-all ${
              onSelect
                ? 'cursor-pointer hover:border-blue-400 hover:shadow-sm'
                : 'border-gray-200 bg-gray-50'
            }`}
            onClick={() => onSelect?.(suggestion)}
            role={onSelect ? 'button' : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onKeyDown={(e) => {
              if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onSelect(suggestion);
              }
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                    {suggestion.article}
                  </span>
                  <span className={getConfidenceBadgeStyles(suggestion.confidence)}>
                    {getConfidenceLabel(suggestion.confidence)}{' '}
                    {translate('legalGroundsSuggestions.confidence')}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">{suggestion.title}</h4>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                  {suggestion.explanation}
                </p>
              </div>
              {onSelect && (
                <div className="flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!inline && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">{translate('legalGroundsSuggestions.disclaimer')}</p>
        </div>
      )}
    </div>
  );
}
