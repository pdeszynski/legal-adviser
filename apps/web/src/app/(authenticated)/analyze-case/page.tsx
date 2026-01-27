'use client';

import { useTranslate } from '@refinedev/core';
import { useState } from 'react';

/**
 * Legal Ground interface for displaying analysis results
 */
interface LegalGround {
  id: string;
  article: string;
  title: string;
  explanation: string;
  relevance: 'high' | 'medium' | 'low';
}

/**
 * Case Analysis Page
 *
 * Feature: analyze-case-page
 * Allows users to describe their case and receive AI-powered legal analysis
 * with identified legal grounds displayed as cards
 */
export default function AnalyzeCasePage() {
  const translate = useTranslate();
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [legalGrounds, setLegalGrounds] = useState<LegalGround[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const handleAnalyze = async () => {
    if (!description.trim()) return;

    setIsAnalyzing(true);

    // TODO: Integrate with AI backend for actual analysis
    // For now, simulating a response after 1.5 seconds
    setTimeout(() => {
      const mockResults: LegalGround[] = [
        {
          id: '1',
          article: 'Art. 361 § 1 K.c.',
          title: 'Termination of contract without notice',
          explanation:
            'In case of a serious breach of contract by the employer, the employee has the right to terminate the employment contract without notice.',
          relevance: 'high',
        },
        {
          id: '2',
          article: 'Art. 94 § 1 K.p.',
          title: "Employer's information obligations",
          explanation:
            'The employer is obliged to inform the employee about the type of work, place of work, and date of commencement of employment.',
          relevance: 'medium',
        },
        {
          id: '3',
          article: 'Art. 29 § 1 Labour Code',
          title: 'Trial period rules',
          explanation:
            "The trial period cannot exceed 3 months for a probationary period. During this time, the contract can be terminated with 3 days' notice.",
          relevance: 'low',
        },
      ];

      setLegalGrounds(mockResults);
      setHasAnalyzed(true);
      setIsAnalyzing(false);
    }, 1500);
  };

  const getRelevanceColor = (relevance: string) => {
    switch (relevance) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRelevanceLabel = (relevance: string) => {
    switch (relevance) {
      case 'high':
        return 'High Relevance';
      case 'medium':
        return 'Medium Relevance';
      case 'low':
        return 'Low Relevance';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{translate('analyzeCase.title')}</h1>
        <p className="text-gray-600">{translate('analyzeCase.subtitle')}</p>
      </div>

      {/* Description Input */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {translate('analyzeCase.descriptionLabel')}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={translate('analyzeCase.descriptionPlaceholder')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={8}
          disabled={isAnalyzing}
        />
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">{translate('analyzeCase.descriptionHint')}</p>
          <button
            onClick={handleAnalyze}
            disabled={!description.trim() || isAnalyzing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing
              ? translate('analyzeCase.analyzing')
              : translate('analyzeCase.analyzeButton')}
          </button>
        </div>
      </div>

      {/* Legal Grounds Results */}
      {hasAnalyzed && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{translate('analyzeCase.resultsTitle')}</h2>
            <span className="text-sm text-gray-600">
              {translate('analyzeCase.resultsCount', { count: legalGrounds.length })}
            </span>
          </div>

          {legalGrounds.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-600">{translate('analyzeCase.noResults')}</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {legalGrounds.map((ground) => (
                <div
                  key={ground.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {ground.article}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getRelevanceColor(ground.relevance)}`}
                        >
                          {getRelevanceLabel(ground.relevance)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{ground.title}</h3>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{ground.explanation}</p>
                </div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-8">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">
                  {translate('analyzeCase.disclaimerTitle')}
                </h4>
                <p className="text-sm text-amber-800">{translate('analyzeCase.disclaimerText')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
