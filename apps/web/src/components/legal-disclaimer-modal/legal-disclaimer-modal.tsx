'use client';

import { useState } from 'react';
import { useTranslate } from '@refinedev/core';
import { Button } from '@legal/ui';
import { acceptDisclaimer } from '@providers/auth-provider/auth-provider.client';

interface LegalDisclaimerModalProps {
  onAccept: () => void;
}

/**
 * Legal Disclaimer Modal Component
 *
 * Displays a modal requiring users to accept legal disclaimers before using AI features.
 * The modal is blocking and cannot be dismissed without accepting.
 */
export function LegalDisclaimerModal({ onAccept }: LegalDisclaimerModalProps) {
  const translate = useTranslate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
    if (isAtBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    if (!isChecked) {
      setError(translate('disclaimer.errors.mustAccept'));
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await acceptDisclaimer();

    if (result.success) {
      onAccept();
    } else {
      setError(result.error || translate('disclaimer.errors.failed'));
    }

    setIsLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
      data-testid="legal-disclaimer-modal"
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h2 id="disclaimer-title" className="text-xl font-semibold text-gray-900">
            {translate('disclaimer.title')}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {translate('disclaimer.subtitle')}
          </p>
        </div>

        {/* Scrollable Content */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4"
          onScroll={handleScroll}
          data-testid="disclaimer-content"
        >
          <div className="prose prose-sm max-w-none text-gray-700">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              {translate('disclaimer.sections.important.title')}
            </h3>
            <p className="mb-4">
              {translate('disclaimer.sections.important.content')}
            </p>

            <h3 className="text-lg font-medium text-gray-900 mb-3">
              {translate('disclaimer.sections.noLegalAdvice.title')}
            </h3>
            <p className="mb-4">
              {translate('disclaimer.sections.noLegalAdvice.content')}
            </p>

            <h3 className="text-lg font-medium text-gray-900 mb-3">
              {translate('disclaimer.sections.aiLimitations.title')}
            </h3>
            <p className="mb-4">
              {translate('disclaimer.sections.aiLimitations.content')}
            </p>

            <h3 className="text-lg font-medium text-gray-900 mb-3">
              {translate('disclaimer.sections.userResponsibility.title')}
            </h3>
            <p className="mb-4">
              {translate('disclaimer.sections.userResponsibility.content')}
            </p>

            <h3 className="text-lg font-medium text-gray-900 mb-3">
              {translate('disclaimer.sections.dataUsage.title')}
            </h3>
            <p className="mb-4">
              {translate('disclaimer.sections.dataUsage.content')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg">
          {!hasScrolledToBottom && (
            <p className="text-sm text-amber-600 mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              {translate('disclaimer.scrollToRead')}
            </p>
          )}

          <div className="flex items-start gap-3 mb-4">
            <input
              type="checkbox"
              id="accept-disclaimer"
              checked={isChecked}
              onChange={(e) => {
                setIsChecked(e.target.checked);
                if (e.target.checked) {
                  setError(null);
                }
              }}
              disabled={!hasScrolledToBottom}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              data-testid="disclaimer-checkbox"
            />
            <label
              htmlFor="accept-disclaimer"
              className={`text-sm ${hasScrolledToBottom ? 'text-gray-700' : 'text-gray-400'}`}
            >
              {translate('disclaimer.checkboxLabel')}
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-600 mb-3" role="alert" data-testid="disclaimer-error">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleAccept}
              disabled={!isChecked || isLoading}
              className="min-w-[120px]"
              data-testid="disclaimer-accept-button"
            >
              {isLoading ? translate('disclaimer.accepting') : translate('disclaimer.acceptButton')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
