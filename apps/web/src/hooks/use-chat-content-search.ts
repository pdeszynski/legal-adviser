'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAccessToken } from '@/providers/auth-provider/auth-provider.client';
import { getCsrfHeaders } from '@/lib/csrf';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

export type ChatMode = 'LAWYER' | 'SIMPLE';
export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export interface ChatContentSearchResult {
  messageId: string;
  sessionId: string;
  sessionTitle: string | null;
  sessionMode: ChatMode;
  role: MessageRole;
  highlightedContent: string;
  content: string;
  contextPreview: string | null;
  rank: number;
  matchedTerms: string[];
  createdAt: string;
  sequenceOrder: number;
  sessionMessageCount: number;
}

export interface ChatContentSearchResponse {
  results: ChatContentSearchResult[];
  totalCount: number;
  count: number;
  offset: number;
  hasMore: boolean;
}

export interface ChatContentSearchFilters {
  query: string;
  mode?: ChatMode;
  role?: MessageRole;
  sessionTitle?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface UseChatContentSearchOptions {
  limit?: number;
  enabled?: boolean;
  debounceMs?: number;
}

interface UseChatContentSearchResult {
  results: ChatContentSearchResult[];
  isLoading: boolean;
  error: Error | null;
  search: (filters: ChatContentSearchFilters) => void;
  refetch: () => void;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  totalCount: number;
  isSearching: boolean;
}

/**
 * Hook for full-text search across chat messages
 *
 * Uses the searchChatContent GraphQL query to perform full-text search
 * with relevance ranking and highlighted matches.
 *
 * Features:
 * - Debounced search to avoid excessive API calls
 * - Pagination support with load more
 * - Filter by mode, role, date range, and session title
 * - Highlighted content and context previews
 */
export function useChatContentSearch(
  options: UseChatContentSearchOptions = {},
): UseChatContentSearchResult {
  const { limit = 20, enabled = true, debounceMs = 300 } = options;

  const [results, setResults] = useState<ChatContentSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<ChatContentSearchFilters>({
    query: '',
  });

  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const isLoadingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(
    async (filters: ChatContentSearchFilters, append = false) => {
      if (!enabled || isLoadingRef.current || (append && !hasMoreRef.current)) {
        return;
      }

      // Don't search if query is too short
      if (!filters.query || filters.query.trim().length < 2) {
        setResults([]);
        setTotalCount(0);
        hasMoreRef.current = false;
        setIsLoading(false);
        setIsSearching(false);
        return;
      }

      isLoadingRef.current = true;
      setIsLoading(true);
      setIsSearching(!append);
      setError(null);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(),
        };

        const accessToken = getAccessToken();
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const query = `
          query SearchChatContent(
            $query: String!
            $limit: Int
            $offset: Int
            $mode: ChatMode
            $role: MessageRole
            $sessionTitle: String
            $dateFrom: String
            $dateTo: String
          ) {
            searchChatContent(
              query: $query
              limit: $limit
              offset: $offset
              mode: $mode
              role: $role
              sessionTitle: $sessionTitle
              dateFrom: $dateFrom
              dateTo: $dateTo
            ) {
              results {
                messageId
                sessionId
                sessionTitle
                sessionMode
                role
                highlightedContent
                content
                contextPreview
                rank
                matchedTerms
                createdAt
                sequenceOrder
                sessionMessageCount
              }
              totalCount
              count
              offset
              hasMore
            }
          }
        `;

        const variables: Record<string, unknown> = {
          query: filters.query,
          limit,
          offset: append ? offsetRef.current : 0,
        };

        if (filters.mode) variables.mode = filters.mode;
        if (filters.role) variables.role = filters.role;
        if (filters.sessionTitle) variables.sessionTitle = filters.sessionTitle;
        if (filters.dateFrom) variables.dateFrom = filters.dateFrom;
        if (filters.dateTo) variables.dateTo = filters.dateTo;

        const response = await fetch(GRAPHQL_URL, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ query, variables }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message || 'GraphQL error');
        }

        const data = result.data?.searchChatContent;

        if (!data) {
          throw new Error('No data returned from search');
        }

        const newResults = data.results || [];

        if (append) {
          setResults((prev) => [...prev, ...newResults]);
          offsetRef.current += newResults.length;
        } else {
          setResults(newResults);
          offsetRef.current = newResults.length;
        }

        hasMoreRef.current = data.hasMore;
        setTotalCount(data.totalCount);
      } catch (err) {
        const errorObj =
          err instanceof Error ? err : new Error('Failed to search chat content');
        setError(errorObj);
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
        setIsSearching(false);
      }
    },
    [enabled, limit],
  );

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Search function with debouncing
  const search = useCallback(
    (filters: ChatContentSearchFilters) => {
      setCurrentFilters(filters);

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Reset pagination for new search
      offsetRef.current = 0;
      hasMoreRef.current = true;
      setResults([]);

      // Set up debounce
      debounceTimerRef.current = setTimeout(() => {
        performSearch(filters, false);
      }, debounceMs);
    },
    [performSearch, debounceMs],
  );

  // Refetch current search
  const refetch = useCallback(() => {
    offsetRef.current = 0;
    hasMoreRef.current = true;
    performSearch(currentFilters, false);
  }, [performSearch, currentFilters]);

  // Load next page
  const fetchNextPage = useCallback(() => {
    performSearch(currentFilters, true);
  }, [performSearch, currentFilters]);

  return {
    results,
    isLoading,
    error,
    search,
    refetch,
    hasNextPage: hasMoreRef.current,
    fetchNextPage,
    totalCount,
    isSearching,
  };
}
