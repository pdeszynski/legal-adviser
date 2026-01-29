'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { ChatHistoryList } from '@/components/chat/chat-history-list';
import { ChatHistoryFilters } from '@/components/chat/chat-history-filters';
import { ChatContentSearchResults } from '@/components/chat/chat-content-search-results';
import { useChatHistory, type ChatSession } from '@/hooks/use-chat-history';
import { useChatContentSearch } from '@/hooks/use-chat-content-search';
import type { ChatSessionFilters } from '@/hooks/use-chat-history';
import type { ChatContentSearchFilters } from '@/hooks/use-chat-content-search';

/**
 * Chat History Page
 *
 * Displays user's past chat sessions with filtering, search, and pagination.
 * Accessible at /chat/history
 *
 * Features:
 * - Search by session title (existing)
 * - Full-text search across message content (new)
 * - Filter by mode, pinned status, date range
 * - Pagination with load more
 */
export default function ChatHistoryPage() {
  const router = useRouter();

  // Search mode toggle
  const [searchMode, setSearchMode] = useState<'sessions' | 'content'>('sessions');

  // Session list filters
  const [sessionFilters, setSessionFilters] = useState<ChatSessionFilters>({
    mode: undefined,
    isPinned: undefined,
    search: '',
  });

  // Optimistic updates for sessions
  const [optimisticSessions, setOptimisticSessions] = useState<ChatSession[]>([]);

  // Content search filters
  const [contentFilters, setContentFilters] = useState<ChatContentSearchFilters>({
    query: '',
  });

  const { sessions, isLoading, error, hasNextPage, fetchNextPage, totalCount, refetch } =
    useChatHistory(sessionFilters);

  // Compute sessions with optimistic updates applied
  const sessionsWithUpdates = useMemo((): ChatSession[] => {
    if (optimisticSessions.length === 0) {
      return sessions;
    }

    // Create a map of optimistic updates
    const optimisticMap = new Map(optimisticSessions.map((s) => [s.id, s]));

    // Apply updates to sessions
    return sessions.map((session) => {
      const optimistic = optimisticMap.get(session.id);
      if (optimistic) {
        return optimistic;
      }
      return session;
    });
  }, [sessions, optimisticSessions]);

  const {
    results: searchResults,
    isLoading: isSearchLoading,
    isSearching,
    error: searchError,
    search,
    fetchNextPage: fetchMoreSearchResults,
    hasNextPage: hasMoreSearchResults,
    totalCount: searchTotalCount,
  } = useChatContentSearch({ limit: 20 });

  // Handle session click - navigate to chat with session restoration
  const handleSessionClick = useCallback(
    (sessionId: string) => {
      router.push(`/chat?session=${sessionId}`);
    },
    [router],
  );

  // Handle search result click - navigate to chat with session and message
  const handleSearchResultClick = useCallback(
    (sessionId: string, messageId: string) => {
      router.push(`/chat?session=${sessionId}#message-${messageId}`);
    },
    [router],
  );

  // Handle session filter changes
  const handleSessionFilterChange = useCallback((newFilters: Partial<ChatSessionFilters>) => {
    setSessionFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Handle content search filter changes
  const handleContentSearchChange = useCallback((query: string) => {
    setContentFilters((prev) => ({ ...prev, query }));
    search({ ...contentFilters, query });
  }, [contentFilters, search]);

  // Handle advanced filter changes for content search
  const handleContentFilterChange = useCallback((newFilters: Partial<ChatContentSearchFilters>) => {
    setContentFilters((prev) => ({ ...prev, ...newFilters }));
    search({ ...contentFilters, ...newFilters });
  }, [contentFilters, search]);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    router.push('/chat');
  }, [router]);

  // Handle session deleted - refetch the session list
  const handleSessionDeleted = useCallback(() => {
    refetch();
  }, [refetch]);

  // Handle session pinned - optimistically update UI
  const handleSessionPinned = useCallback(
    (sessionId: string, isPinned: boolean) => {
      // Store optimistic update - just the changed session
      setOptimisticSessions((prev) => {
        // Find if we already have an optimistic update for this session
        const existing = prev.find((s) => s.id === sessionId);
        if (existing) {
          return prev.map((s) => (s.id === sessionId ? { ...s, isPinned } : s));
        }
        // Find the session in the main list to create optimistic update
        const session = sessions.find((s) => s.id === sessionId);
        if (session) {
          return [...prev, { ...session, isPinned }];
        }
        return prev;
      });

      // Clear optimistic updates after backend confirms (via refetch)
      // Use a longer delay to let the mutation complete
      setTimeout(() => {
        setOptimisticSessions([]);
        refetch();
      }, 500);
    },
    [sessions, refetch],
  );

  return (
    <div className="container mx-auto h-[calc(100vh-8rem)] py-6 px-4">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Chat History</h1>
            <p className="text-muted-foreground">
              {searchMode === 'content'
                ? searchTotalCount > 0
                  ? `${searchTotalCount} result${searchTotalCount !== 1 ? 's' : ''} found`
                  : 'Search across all your messages'
                : totalCount > 0
                  ? `${totalCount} conversation${totalCount !== 1 ? 's' : ''}`
                  : 'No conversations yet'}
            </p>
          </div>
          <button
            onClick={handleNewChat}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>
        </div>

        {/* Search Mode Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setSearchMode('sessions')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              searchMode === 'sessions'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Browse Sessions
          </button>
          <button
            onClick={() => setSearchMode('content')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              searchMode === 'content'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Search Messages
          </button>
        </div>

        {/* Filters / Search */}
        {searchMode === 'sessions' ? (
          <ChatHistoryFilters filters={sessionFilters} onFilterChange={handleSessionFilterChange} />
        ) : (
          <ContentSearchBar
            query={contentFilters.query}
            onQueryChange={handleContentSearchChange}
            mode={contentFilters.mode}
            onModeChange={(mode) => handleContentFilterChange({ mode })}
          />
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {searchMode === 'sessions' ? (
            <>
              {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4">
                  Error loading chat history: {error.message}
                </div>
              )}

              <ChatHistoryList
                sessions={sessionsWithUpdates}
                isLoading={isLoading}
                onSessionClick={handleSessionClick}
                hasNextPage={hasNextPage}
                onLoadMore={fetchNextPage}
                onSessionDeleted={handleSessionDeleted}
                onSessionPinned={handleSessionPinned}
              />
            </>
          ) : (
            <>
              {searchError && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4">
                  Error searching messages: {searchError.message}
                </div>
              )}

              <ChatContentSearchResults
                results={searchResults}
                isLoading={isSearchLoading}
                isSearching={isSearching}
                onResultClick={handleSearchResultClick}
                hasNextPage={hasMoreSearchResults}
                onLoadMore={fetchMoreSearchResults}
                totalCount={searchTotalCount}
                query={contentFilters.query}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface ContentSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  mode?: 'LAWYER' | 'SIMPLE';
  onModeChange?: (mode: 'LAWYER' | 'SIMPLE' | undefined) => void;
}

function ContentSearchBar({ query, onQueryChange, mode, onModeChange }: ContentSearchBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="Search all messages..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full pl-4 pr-10 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        )}
      </div>

      {/* Mode Filter */}
      {onModeChange && (
        <div className="flex rounded-lg border border-border overflow-hidden">
          <FilterButton
            active={mode === undefined}
            onClick={() => onModeChange(undefined)}
          >
            All
          </FilterButton>
          <FilterButton
            active={mode === 'LAWYER'}
            onClick={() => onModeChange('LAWYER')}
          >
            Pro
          </FilterButton>
          <FilterButton
            active={mode === 'SIMPLE'}
            onClick={() => onModeChange('SIMPLE')}
          >
            Simple
          </FilterButton>
        </div>
      )}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-background hover:bg-muted text-foreground'
      }`}
    >
      {children}
    </button>
  );
}
