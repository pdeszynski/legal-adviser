'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@refinedev/core';
import { Search, FileText, Scale, LayoutTemplate, Loader2 } from 'lucide-react';
import { OmnisearchSkeleton } from '@/components/skeleton';

interface SearchResultItem {
  id: string;
  title: string;
  type: 'document' | 'ruling' | 'template';
  subtitle?: string;
  url: string;
}

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

async function executeGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

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

async function searchAll(query: string): Promise<SearchResultItem[]> {
  if (!query.trim()) return [];

  const results: SearchResultItem[] = [];

  try {
    // Search legal rulings
    const rulingQuery = `
      query SearchLegalRulings($input: SearchLegalRulingsInput!) {
        searchLegalRulings(input: $input) {
          results {
            ruling {
              id
              signature
              courtName
            }
          }
        }
      }
    `;

    const rulingData = await executeGraphQL<{
      searchLegalRulings: {
        results: Array<{ ruling: { id: string; signature: string; courtName: string } }>;
      };
    }>(rulingQuery, {
      input: {
        query,
        limit: 3,
      },
    });

    if (rulingData?.searchLegalRulings?.results) {
      rulingData.searchLegalRulings.results.forEach(({ ruling }) => {
        results.push({
          id: ruling.id,
          title: ruling.signature,
          type: 'ruling',
          subtitle: ruling.courtName,
          url: `/rulings/${ruling.id}`,
        });
      });
    }
  } catch {
    // Silently fail for ruling search errors
  }

  try {
    // Search documents
    const documentQuery = `
      query SearchDocuments($filter: LegalDocumentFilter!) {
        legalDocuments(filter: $filter, paging: { first: 3 }) {
          edges {
            node {
              id
              title
              type
            }
          }
        }
      }
    `;

    const documentData = await executeGraphQL<{
      legalDocuments: {
        edges: Array<{ node: { id: string; title: string; type: string } }>;
      };
    }>(documentQuery, {
      filter: {
        title: { iLike: `%${query}%` },
      },
    });

    if (documentData?.legalDocuments?.edges) {
      documentData.legalDocuments.edges.forEach(({ node }) => {
        results.push({
          id: node.id,
          title: node.title,
          type: 'document',
          subtitle: node.type,
          url: `/documents/show/${node.id}`,
        });
      });
    }
  } catch {
    // Silently fail for document search errors
  }

  try {
    // Search templates
    const templateQuery = `
      query SearchTemplates {
        documentTemplates {
          id
          name
          category
        }
      }
    `;

    const templateData = await executeGraphQL<{
      documentTemplates: Array<{ id: string; name: string; category: string }>;
    }>(templateQuery);

    if (templateData?.documentTemplates) {
      const filteredTemplates = templateData.documentTemplates
        .filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3);

      filteredTemplates.forEach((template) => {
        results.push({
          id: template.id,
          title: template.name,
          type: 'template',
          subtitle: template.category,
          url: `/documents/create?template=${template.id}`,
        });
      });
    }
  } catch {
    // Silently fail for template search errors
  }

  return results;
}

const getTypeIcon = (type: SearchResultItem['type']) => {
  switch (type) {
    case 'document':
      return <FileText className="w-4 h-4" />;
    case 'ruling':
      return <Scale className="w-4 h-4" />;
    case 'template':
      return <LayoutTemplate className="w-4 h-4" />;
  }
};

const getTypeColor = (type: SearchResultItem['type']) => {
  switch (type) {
    case 'document':
      return 'text-blue-600 bg-blue-50';
    case 'ruling':
      return 'text-purple-600 bg-purple-50';
    case 'template':
      return 'text-green-600 bg-green-50';
  }
};

const getTypeLabel = (type: SearchResultItem['type']) => {
  switch (type) {
    case 'document':
      return 'Document';
    case 'ruling':
      return 'Ruling';
    case 'template':
      return 'Template';
  }
};

export const OmnisearchBar = () => {
  const router = useRouter();
  const { translate } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        try {
          const searchResults = await searchAll(query);
          setResults(searchResults);
          setIsOpen(true);
          setSelectedIndex(-1);
        } catch {
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleResultClick = (result: SearchResultItem) => {
    router.push(result.url);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim().length >= 2 && results.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={
            translate('omnisearch.placeholder') || 'Search documents, rulings, templates...'
          }
          className="w-full h-9 pl-10 pr-10 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
        {isLoading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {isOpen && isLoading && <OmnisearchSkeleton />}

      {isOpen && !isLoading && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-1">
            {results.map((result, index) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className={`w-full flex items-start gap-3 px-3 py-2 rounded-sm text-left transition-colors ${
                  index === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className={`p-1.5 rounded-sm ${getTypeColor(result.type)} flex-shrink-0`}>
                  {getTypeIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{result.title}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${getTypeColor(
                        result.type,
                      )} flex-shrink-0`}
                    >
                      {getTypeLabel(result.type)}
                    </span>
                  </div>
                  {result.subtitle && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {result.subtitle}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="border-t p-2">
            <button
              onClick={() => {
                router.push(`/rulings?query=${encodeURIComponent(query)}`);
                setIsOpen(false);
                setQuery('');
              }}
              className="w-full text-xs text-center text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              {translate('omnisearch.seeAll') || 'See all results'}
            </button>
          </div>
        </div>
      )}

      {isOpen && query.trim().length >= 2 && !isLoading && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 p-4">
          <p className="text-sm text-muted-foreground text-center">
            {translate('omnisearch.noResults') || 'No results found'}
          </p>
        </div>
      )}
    </div>
  );
};
