'use client';

import { useTranslate, useList } from '@refinedev/core';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CardGridSkeleton } from '@/components/skeleton';

/**
 * Template Category enum matching backend GraphQL schema
 */
enum TemplateCategory {
  LAWSUIT = 'LAWSUIT',
  COMPLAINT = 'COMPLAINT',
  CONTRACT = 'CONTRACT',
  MOTION = 'MOTION',
  LETTER = 'LETTER',
  OTHER = 'OTHER',
}

/**
 * Template Variable interface matching backend
 */
interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'boolean';
  required: boolean;
  defaultValue?: string | number | boolean;
  description?: string;
}

/**
 * Conditional Section interface
 */
interface ConditionalSection {
  id: string;
  condition: string;
  description?: string;
}

/**
 * Document Template type matching GraphQL DocumentTemplate
 */
interface DocumentTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description?: string;
  content: string;
  variables: TemplateVariable[];
  conditionalSections?: ConditionalSection[];
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Category color mapping for badges
 */
const categoryColors: Record<string, string> = {
  LAWSUIT: 'bg-red-100 text-red-800',
  COMPLAINT: 'bg-orange-100 text-orange-800',
  CONTRACT: 'bg-blue-100 text-blue-800',
  MOTION: 'bg-purple-100 text-purple-800',
  LETTER: 'bg-green-100 text-green-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

/**
 * Template Library Page
 *
 * Displays available document templates with filtering by category,
 * preview functionality, and 'Use Template' action.
 */
export default function TemplateLibrary() {
  const translate = useTranslate();
  const router = useRouter();

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);

  // Fetch templates
  const { query, result } = useList<DocumentTemplate>({
    resource: 'documentTemplates',
    pagination: {
      pageSize: 100,
    },
    sorters: [
      {
        field: 'usageCount',
        order: 'desc',
      },
    ],
  });

  const { data, isLoading, error } = query;

  // Filter templates
  const filteredTemplates = useMemo(() => {
    if (!result?.data) return [];

    let templates = [...result.data];

    // Filter by category
    if (categoryFilter) {
      templates = templates.filter((t) => t.category === categoryFilter);
    }

    // Filter by search
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.description?.toLowerCase().includes(searchLower),
      );
    }

    return templates;
  }, [result, categoryFilter, searchFilter]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!result?.data) return [];
    const uniqueCategories = new Set(result.data.map((t) => t.category));
    return Array.from(uniqueCategories);
  }, [result]);

  // Handle filter clear
  const handleClearFilters = () => {
    setCategoryFilter('');
    setSearchFilter('');
  };

  // Handle template preview
  const handlePreview = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
  };

  // Handle use template
  const handleUseTemplate = (templateId: string) => {
    router.push(`/documents/create?templateId=${templateId}`);
  };

  const hasActiveFilters = categoryFilter || searchFilter;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {translate('templates.titles.library') || 'Document Templates'}
        </h1>
        <p className="text-gray-600">
          {translate('templates.description') ||
            'Choose from our collection of professional legal document templates to get started quickly.'}
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {translate('templates.fields.search') || 'Search'}
            </label>
            <input
              type="text"
              placeholder={translate('templates.placeholders.search') || 'Search templates...'}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {translate('templates.fields.category') || 'Category'}
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{translate('common.all') || 'All'}</option>
              {Object.values(TemplateCategory).map((category) => (
                <option key={category} value={category}>
                  {translate(`templates.categories.${category}`) || category}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              {translate('buttons.clear') || 'Clear'}
            </button>
          )}
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <CardGridSkeleton cards={6} />
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">
            {translate('templates.errors.loadingFailed') || 'Failed to load templates'}
          </p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {hasActiveFilters
              ? translate('templates.noFilteredResults') || 'No templates match your filters'
              : translate('templates.noTemplates') || 'No templates available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 flex flex-col"
            >
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">{template.name}</h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                      categoryColors[template.category] || categoryColors.OTHER
                    }`}
                  >
                    {translate(`templates.categories.${template.category}`) || template.category}
                  </span>
                </div>
                {template.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                )}
              </div>

              {/* Metadata */}
              <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                  <span>{template.variables.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span>{template.usageCount}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-auto flex gap-2">
                <button
                  onClick={() => handlePreview(template)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  {translate('templates.buttons.preview') || 'Preview'}
                </button>
                <button
                  onClick={() => handleUseTemplate(template.id)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  {translate('templates.buttons.useTemplate') || 'Use Template'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {selectedTemplate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTemplate(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{selectedTemplate.name}</h2>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        categoryColors[selectedTemplate.category] || categoryColors.OTHER
                      }`}
                    >
                      {translate(`templates.categories.${selectedTemplate.category}`) ||
                        selectedTemplate.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      {translate('templates.info.used', { count: selectedTemplate.usageCount }) ||
                        `Used ${selectedTemplate.usageCount} times`}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {selectedTemplate.description && (
                <p className="mt-3 text-gray-600">{selectedTemplate.description}</p>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {/* Variables Section */}
              {selectedTemplate.variables.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">
                    {translate('templates.titles.variables') || 'Required Information'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedTemplate.variables.map((variable, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{variable.label}</span>
                          {variable.required && <span className="text-red-500 text-xs">*</span>}
                        </div>
                        {variable.description && (
                          <p className="text-sm text-gray-600">{variable.description}</p>
                        )}
                        <div className="mt-1 text-xs text-gray-500">
                          {translate(`templates.variableTypes.${variable.type}`) || variable.type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Preview */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  {translate('templates.titles.contentPreview') || 'Content Preview'}
                </h3>
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                    {selectedTemplate.content.substring(0, 500)}
                    {selectedTemplate.content.length > 500 && '...'}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              >
                {translate('buttons.cancel') || 'Cancel'}
              </button>
              <button
                onClick={() => {
                  handleUseTemplate(selectedTemplate.id);
                  setSelectedTemplate(null);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {translate('templates.buttons.useTemplate') || 'Use Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
