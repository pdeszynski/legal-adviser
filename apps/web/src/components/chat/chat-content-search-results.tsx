'use client';

import { cn } from '@legal/ui';
import { Scale, MessageSquare, Search } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format-relative-time';
import type { ChatContentSearchResult } from '@/hooks/use-chat-content-search';

interface ChatContentSearchResultsProps {
  results: ChatContentSearchResult[];
  isLoading: boolean;
  isSearching: boolean;
  onResultClick: (sessionId: string, messageId: string) => void;
  hasNextPage: boolean;
  onLoadMore: () => void;
  totalCount: number;
  query: string;
}

/**
 * Chat Content Search Results Component
 *
 * Displays search results with highlighted matching text,
 * session context, and relevance ranking.
 */
export function ChatContentSearchResults({
  results,
  isLoading,
  isSearching,
  onResultClick,
  hasNextPage,
  onLoadMore,
  totalCount,
  query,
}: ChatContentSearchResultsProps) {
  if (isSearching) {
    return <SearchResultsSkeleton />;
  }

  if (results.length === 0 && query.length >= 2 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No results found</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          No messages match &quot;{query}&quot;. Try different keywords or check your filters.
        </p>
      </div>
    );
  }

  if (results.length === 0 && query.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Search your conversations</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          Enter at least 2 characters to search across all your chat messages.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Found {totalCount} {totalCount === 1 ? 'result' : 'results'}
        </span>
      </div>

      <div className="space-y-3">
        {results.map((result) => (
          <SearchResultItem
            key={result.messageId}
            result={result}
            onClick={() => onResultClick(result.sessionId, result.messageId)}
          />
        ))}
      </div>

      {isLoading && results.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Loading more...
          </div>
        </div>
      )}

      {hasNextPage && !isLoading && (
        <button
          onClick={onLoadMore}
          className="w-full py-3 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Load more results
        </button>
      )}
    </div>
  );
}

interface SearchResultItemProps {
  result: ChatContentSearchResult;
  onClick: () => void;
}

function SearchResultItem({ result, onClick }: SearchResultItemProps) {
  const ModeIcon = result.sessionMode === 'LAWYER' ? Scale : MessageSquare;
  const title = result.sessionTitle || 'Untitled Chat';

  // Parse highlighted content to render markdown-style bolding
  const renderHighlightedContent = (content: string) => {
    const parts = content.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) =>
      index % 2 === 1 ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg border border-border hover:bg-accent hover:border-accent transition-all group"
    >
      <div className="flex items-start gap-3">
        {/* Mode Icon */}
        <div
          className={cn(
            'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0',
            result.sessionMode === 'LAWYER'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
          )}
        >
          <ModeIcon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Session Title */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold truncate">{title}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
              {result.sessionMode === 'LAWYER' ? 'Pro' : 'Simple'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
              {result.role === 'USER' ? 'You' : 'AI'}
            </span>
          </div>

          {/* Highlighted Content Preview */}
          <p className="text-sm text-muted-foreground line-clamp-3">
            {renderHighlightedContent(result.highlightedContent)}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>
              {formatRelativeTime(new Date(result.createdAt))}
            </span>
            <span>•</span>
            <span>Rank: {result.rank.toFixed(2)}</span>
            {result.matchedTerms.length > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  Matched:{' '}
                  {result.matchedTerms.slice(0, 3).map((term) => (
                    <span
                      key={term}
                      className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 rounded"
                    >
                      {term}
                    </span>
                  ))}
                  {result.matchedTerms.length > 3 && (
                    <span>+{result.matchedTerms.length - 3}</span>
                  )}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

/**
 * Skeleton loader for search results
 */
export function SearchResultsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="w-full p-4 rounded-lg border border-border animate-pulse"
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-5 w-1/3 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-2/3 bg-muted rounded" />
              <div className="h-4 w-1/2 bg-muted rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
