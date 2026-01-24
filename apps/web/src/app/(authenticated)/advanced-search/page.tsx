'use client';

import { useTranslate } from '@refinedev/core';
import { useState } from 'react';
import { AdvancedSearchSkeleton, AdvancedSearchPaginationSkeleton } from '@/components/skeleton';
import {
  AdvancedSearchLegalRulingsDocument,
  type AdvancedSearchLegalRulingsQueryVariables,
  type CourtType,
  type SearchSource,
  type BooleanOperator,
  type SearchField,
  type RulingMetadata,
  type LegalRuling,
  type AggregatedLegalRulingSearchResult,
  type AdvancedLegalRulingSearchResponse,
} from '@/generated/graphql';

// Enum constant values (matching generated types)
const COURT_TYPES = [
  'ADMINISTRATIVE_COURT',
  'APPELLATE_COURT',
  'CONSTITUTIONAL_TRIBUNAL',
  'DISTRICT_COURT',
  'OTHER',
  'REGIONAL_COURT',
  'SUPREME_COURT',
] as const;

const SEARCH_SOURCES = ['ISAP', 'LOCAL', 'SAOS'] as const;

const BOOLEAN_OPERATORS = ['AND', 'OR', 'NOT'] as const;

const SEARCH_FIELDS = [
  'ALL',
  'COURT_NAME',
  'FULL_TEXT',
  'KEYWORDS',
  'LEGAL_AREA',
  'SIGNATURE',
  'SUMMARY',
] as const;

/**
 * Search term input interface
 */
interface SearchTermInput {
  id: string;
  term: string;
  field: SearchField;
  operator: BooleanOperator;
}

/**
 * Search result interface with relevance ranking
 */
type RulingSearchResult = AggregatedLegalRulingSearchResult;

/**
 * Search response interface
 */
type SearchResponse = AdvancedLegalRulingSearchResponse;

/**
 * Court type display labels
 */
const COURT_TYPE_LABELS: Record<CourtType, string> = {
  ADMINISTRATIVE_COURT: 'Administrative Court',
  APPELLATE_COURT: 'Appellate Court',
  CONSTITUTIONAL_TRIBUNAL: 'Constitutional Tribunal',
  DISTRICT_COURT: 'District Court',
  OTHER: 'Other',
  REGIONAL_COURT: 'Regional Court',
  SUPREME_COURT: 'Supreme Court',
};

/**
 * Court type color mapping for badges
 */
const COURT_TYPE_COLORS: Record<CourtType, string> = {
  ADMINISTRATIVE_COURT: 'bg-purple-100 text-purple-800',
  APPELLATE_COURT: 'bg-blue-100 text-blue-800',
  CONSTITUTIONAL_TRIBUNAL: 'bg-amber-100 text-amber-800',
  DISTRICT_COURT: 'bg-green-100 text-green-800',
  OTHER: 'bg-gray-100 text-gray-800',
  REGIONAL_COURT: 'bg-teal-100 text-teal-800',
  SUPREME_COURT: 'bg-red-100 text-red-800',
};

/**
 * Source color mapping for badges
 */
const SOURCE_COLORS: Record<SearchSource, string> = {
  LOCAL: 'bg-green-100 text-green-800',
  SAOS: 'bg-blue-100 text-blue-800',
  ISAP: 'bg-orange-100 text-orange-800',
};

/**
 * Search field display labels
 */
const SEARCH_FIELD_LABELS: Record<SearchField, string> = {
  ALL: 'All Fields',
  COURT_NAME: 'Court Name',
  FULL_TEXT: 'Full Text',
  KEYWORDS: 'Keywords',
  LEGAL_AREA: 'Legal Area',
  SIGNATURE: 'Signature',
  SUMMARY: 'Summary',
};

/**
 * Boolean operator display labels
 */
const OPERATOR_LABELS: Record<BooleanOperator, string> = {
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
};

/**
 * GraphQL endpoint
 */
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

/**
 * GraphQL fetcher using generated query document
 */
async function fetcher<TData, TVariables>(query: string, variables?: TVariables): Promise<TData> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Get access token from localStorage if available
  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
  }

  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  const result = await response.json();

  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors[0].message || 'GraphQL error');
  }

  return result.data;
}

/**
 * Search legal rulings using the advanced search query with generated types
 */
async function advancedSearchLegalRulings(params: {
  searchTerms: SearchTermInput[];
  courtType?: CourtType;
  legalArea?: string;
  keywords?: string[];
  dateFrom?: string;
  dateTo?: string;
  sources?: SearchSource[];
  limit?: number;
  offset?: number;
}): Promise<SearchResponse> {
  const variables: AdvancedSearchLegalRulingsQueryVariables = {
    input: {
      searchTerms: params.searchTerms.map(({ id, ...rest }) => rest),
      courtType: params.courtType,
      legalArea: params.legalArea,
      keywords: params.keywords,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      sources: params.sources || ['LOCAL', 'SAOS', 'ISAP'],
      limit: params.limit || 20,
      offset: params.offset || 0,
    },
  };

  const data = await fetcher<
    {
      advancedSearchLegalRulings: SearchResponse;
    },
    AdvancedSearchLegalRulingsQueryVariables
  >(AdvancedSearchLegalRulingsDocument, variables);

  return data.advancedSearchLegalRulings;
}

export default function AdvancedSearchPage() {
  const translate = useTranslate();

  // Search terms state
  const [searchTerms, setSearchTerms] = useState<SearchTermInput[]>([
    { id: '1', term: '', field: 'ALL', operator: 'AND' },
  ]);

  // Filter state
  const [courtTypeFilter, setCourtTypeFilter] = useState<string>('');
  const [legalAreaFilter, setLegalAreaFilter] = useState<string>('');
  const [keywordsFilter, setKeywordsFilter] = useState<string>('');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [sourcesFilter, setSourcesFilter] = useState<SearchSource[]>([
    'LOCAL' as SearchSource,
    'SAOS' as SearchSource,
    'ISAP' as SearchSource,
  ]);

  // Results state
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // Handle search
  const handleSearch = async (page: number = 0) => {
    const validTerms = searchTerms.filter((st) => st.term.trim().length > 0);

    if (validTerms.length === 0) {
      setError(
        translate('advancedSearch.errors.termsRequired') || 'Please enter at least one search term',
      );
      return;
    }

    setIsSearching(true);
    setError(null);
    setCurrentPage(page);

    try {
      const results = await advancedSearchLegalRulings({
        searchTerms: validTerms,
        courtType: courtTypeFilter as CourtType | undefined,
        legalArea: legalAreaFilter || undefined,
        keywords: keywordsFilter ? keywordsFilter.split(',').map((k) => k.trim()) : undefined,
        dateFrom: dateFromFilter || undefined,
        dateTo: dateToFilter || undefined,
        sources: sourcesFilter.length > 0 ? sourcesFilter : undefined,
        limit: pageSize,
        offset: page * pageSize,
      });

      setSearchResults(results);
      setHasSearched(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(0);
  };

  // Add search term
  const addSearchTerm = () => {
    const newId = (Math.max(...searchTerms.map((st) => Number.parseInt(st.id))) + 1).toString();
    setSearchTerms([...searchTerms, { id: newId, term: '', field: 'ALL', operator: 'AND' }]);
  };

  // Remove search term
  const removeSearchTerm = (id: string) => {
    if (searchTerms.length > 1) {
      setSearchTerms(searchTerms.filter((st) => st.id !== id));
    }
  };

  // Update search term
  const updateSearchTerm = (id: string, updates: Partial<SearchTermInput>) => {
    setSearchTerms(searchTerms.map((st) => (st.id === id ? { ...st, ...updates } : st)));
  };

  // Handle source toggle
  const toggleSource = (source: SearchSource) => {
    setSourcesFilter((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source],
    );
  };

  // Calculate pagination info
  const totalPages = searchResults ? Math.ceil(searchResults.totalCount / pageSize) : 0;
  const hasNextPage = searchResults?.hasMore ?? false;
  const hasPrevPage = currentPage > 0;

  // Format date for display
  const formatDate = (dateValue: Date | string) => {
    try {
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      return date.toLocaleDateString();
    } catch {
      return typeof dateValue === 'string' ? dateValue : String(dateValue);
    }
  };

  // Truncate text to max length
  const truncate = (text: string | null | undefined, maxLength: number = 200) => {
    if (!text) return null;
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Highlight headline if available
  const renderHeadline = (headline: string | null | undefined) => {
    if (!headline) return null;
    return (
      <div
        className="text-sm text-gray-600 italic border-l-4 border-blue-500 pl-3 py-2 mb-3 bg-blue-50"
        dangerouslySetInnerHTML={{ __html: headline }}
      />
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {translate('advancedSearch.title') || 'Advanced Search'}
        </h1>
        <p className="text-gray-600">
          {translate('advancedSearch.subtitle') ||
            'Search with boolean operators (AND, OR, NOT) and field-specific filters.'}
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Search Terms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {translate('advancedSearch.fields.searchTerms') || 'Search Terms'}
            </label>
            <div className="space-y-3">
              {searchTerms.map((st, index) => (
                <div key={st.id} className="flex gap-2 items-center">
                  {/* Operator dropdown (except for first term) */}
                  {index > 0 && (
                    <select
                      value={st.operator}
                      onChange={(e) =>
                        updateSearchTerm(st.id, { operator: e.target.value as BooleanOperator })
                      }
                      className="w-20 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {BOOLEAN_OPERATORS.map((op) => (
                        <option key={op} value={op}>
                          {OPERATOR_LABELS[op as BooleanOperator]}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Term input */}
                  <input
                    type="text"
                    value={st.term}
                    onChange={(e) => updateSearchTerm(st.id, { term: e.target.value })}
                    placeholder={
                      index === 0
                        ? translate('advancedSearch.placeholders.firstTerm') ||
                          'Enter search term...'
                        : translate('advancedSearch.placeholders.nextTerm') ||
                          'Enter another term...'
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Field dropdown */}
                  <select
                    value={st.field}
                    onChange={(e) =>
                      updateSearchTerm(st.id, { field: e.target.value as SearchField })
                    }
                    className="w-40 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SEARCH_FIELDS.map((field) => (
                      <option key={field} value={field}>
                        {SEARCH_FIELD_LABELS[field as SearchField]}
                      </option>
                    ))}
                  </select>

                  {/* Remove button (except for first/only term) */}
                  {searchTerms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSearchTerm(st.id)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {/* Add term button */}
              <button
                type="button"
                onClick={addSearchTerm}
                className="mt-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                {translate('advancedSearch.buttons.addTerm') || '+ Add another term'}
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Court Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {translate('advancedSearch.fields.courtType') || 'Court Type'}
              </label>
              <select
                value={courtTypeFilter}
                onChange={(e) => setCourtTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{translate('common.all') || 'All'}</option>
                {COURT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {COURT_TYPE_LABELS[type as CourtType]}
                  </option>
                ))}
              </select>
            </div>

            {/* Legal Area Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {translate('advancedSearch.fields.legalArea') || 'Legal Area'}
              </label>
              <input
                type="text"
                value={legalAreaFilter}
                onChange={(e) => setLegalAreaFilter(e.target.value)}
                placeholder={
                  translate('advancedSearch.placeholders.legalArea') || 'e.g., constitutional'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Keywords Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {translate('advancedSearch.fields.keywords') || 'Keywords'}
              </label>
              <input
                type="text"
                value={keywordsFilter}
                onChange={(e) => setKeywordsFilter(e.target.value)}
                placeholder={translate('advancedSearch.placeholders.keywords') || 'Comma separated'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date From Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {translate('advancedSearch.fields.dateFrom') || 'Date From'}
              </label>
              <input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date To Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {translate('advancedSearch.fields.dateTo') || 'Date To'}
              </label>
              <input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Source Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {translate('advancedSearch.fields.sources') || 'Data Sources'}
            </label>
            <div className="flex flex-wrap gap-2">
              {SEARCH_SOURCES.map((source) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => toggleSource(source as SearchSource)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    sourcesFilter.includes(source as SearchSource)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching
                ? translate('advancedSearch.buttons.searching') || 'Searching...'
                : translate('advancedSearch.buttons.search') || 'Search'}
            </button>
            {(hasSearched ||
              courtTypeFilter ||
              legalAreaFilter ||
              keywordsFilter ||
              dateFromFilter ||
              dateToFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerms([{ id: '1', term: '', field: 'ALL', operator: 'AND' }]);
                  setCourtTypeFilter('');
                  setLegalAreaFilter('');
                  setKeywordsFilter('');
                  setDateFromFilter('');
                  setDateToFilter('');
                  setSourcesFilter(['LOCAL', 'SAOS', 'ISAP'] as SearchSource[]);
                  setSearchResults(null);
                  setHasSearched(false);
                  setError(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                {translate('buttons.clear') || 'Clear'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          <p className="font-medium">{translate('advancedSearch.errors.title') || 'Error'}</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isSearching && hasSearched && <AdvancedSearchPaginationSkeleton />}

      {/* Initial Loading Skeleton */}
      {isSearching && !hasSearched && <AdvancedSearchSkeleton />}

      {/* Results Display */}
      {hasSearched && !isSearching && (
        <div>
          {/* Query Explanation */}
          {searchResults?.queryExplanation && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md mb-4">
              <p className="font-medium">
                {translate('advancedSearch.queryExplanation') || 'Query'}
              </p>
              <p className="text-sm">{searchResults.queryExplanation}</p>
            </div>
          )}

          {/* Results Summary */}
          {searchResults && (
            <div className="mb-4 text-sm text-gray-600">
              {translate('advancedSearch.results.summary', {
                count: searchResults.count,
                total: searchResults.totalCount,
              }) || `Showing ${searchResults.count} of ${searchResults.totalCount} results`}
            </div>
          )}

          {/* Results List */}
          <div className="space-y-4">
            {!searchResults || searchResults.results.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                <p className="text-lg">
                  {translate('advancedSearch.results.noResults') || 'No results found'}
                </p>
                <p className="text-sm mt-2">
                  {translate('advancedSearch.results.tryDifferent') ||
                    'Try adjusting your search terms or filters'}
                </p>
              </div>
            ) : (
              searchResults.results.map((result) => (
                <div
                  key={`${result.ruling.id}-${result.source}`}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                >
                  {/* Header: Signature and Source Badge */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-600 hover:underline cursor-pointer">
                        {result.ruling.signature}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {result.ruling.courtName} • {formatDate(result.ruling.rulingDate)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {/* Source Badge */}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          SOURCE_COLORS[result.source]
                        }`}
                      >
                        {result.source}
                      </span>
                      {/* Court Type Badge */}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          COURT_TYPE_COLORS[result.ruling.courtType]
                        }`}
                      >
                        {COURT_TYPE_LABELS[result.ruling.courtType]}
                      </span>
                    </div>
                  </div>

                  {/* Headline/Highlighted Snippet */}
                  {renderHeadline(result.headline)}

                  {/* Summary */}
                  {result.ruling.summary && (
                    <p className="text-gray-700 mb-3">{truncate(result.ruling.summary, 300)}</p>
                  )}

                  {/* Metadata */}
                  {result.ruling.metadata && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {result.ruling.metadata.legalArea && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          Area: {result.ruling.metadata.legalArea}
                        </span>
                      )}
                      {result.ruling.metadata.keywords &&
                        result.ruling.metadata.keywords.length > 0 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            Keywords: {result.ruling.metadata.keywords.join(', ')}
                          </span>
                        )}
                    </div>
                  )}

                  {/* Relevance Score */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      {translate('advancedSearch.results.relevance') || 'Relevance'}:{' '}
                      <span className="font-medium text-gray-700">
                        {Math.round(result.rank * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {searchResults && searchResults.results.length > 0 && (
            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => handleSearch(currentPage - 1)}
                disabled={!hasPrevPage}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                {translate('buttons.previous') || 'Previous'}
              </button>

              <div className="text-sm text-gray-600">
                {translate('table.page', { current: currentPage + 1, total: totalPages + 1 }) ||
                  `Page ${currentPage + 1} of ${totalPages + 1}`}
              </div>

              <button
                onClick={() => handleSearch(currentPage + 1)}
                disabled={!hasNextPage}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                {translate('buttons.next') || 'Next'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
