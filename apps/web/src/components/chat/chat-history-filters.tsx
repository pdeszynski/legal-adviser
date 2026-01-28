'use client';

import { cn } from '@legal/ui';
import { Search, Filter, X } from 'lucide-react';
import type { ChatSessionFilters, ChatMode } from '@/hooks/use-chat-history';

interface ChatHistoryFiltersProps {
  filters: ChatSessionFilters;
  onFilterChange: (filters: Partial<ChatSessionFilters>) => void;
}

/**
 * Chat History Filters Component
 *
 * Provides filtering options for chat history including:
 * - Search by title
 * - Filter by mode (Lawyer/Simple)
 * - Filter by pinned status
 */
export function ChatHistoryFilters({
  filters,
  onFilterChange,
}: ChatHistoryFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFilterChange({ search: value });
  };

  const handleModeChange = (mode: ChatMode | undefined) => {
    onFilterChange({ mode });
  };

  const handlePinnedChange = (isPinned: boolean | undefined) => {
    onFilterChange({ isPinned });
  };

  const hasActiveFilters =
    filters.mode !== undefined || filters.isPinned !== undefined || filters.search;

  const clearFilters = () => {
    onFilterChange({ mode: undefined, isPinned: undefined, search: '' });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
        {filters.search && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Mode Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex rounded-lg border border-border overflow-hidden">
          <FilterButton
            active={filters.mode === undefined}
            onClick={() => handleModeChange(undefined)}
          >
            All
          </FilterButton>
          <FilterButton
            active={filters.mode === 'LAWYER'}
            onClick={() => handleModeChange('LAWYER')}
          >
            Pro
          </FilterButton>
          <FilterButton
            active={filters.mode === 'SIMPLE'}
            onClick={() => handleModeChange('SIMPLE')}
          >
            Simple
          </FilterButton>
        </div>
      </div>

      {/* Pinned Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex rounded-lg border border-border overflow-hidden">
          <FilterButton
            active={filters.isPinned === undefined}
            onClick={() => handlePinnedChange(undefined)}
          >
            All
          </FilterButton>
          <FilterButton
            active={filters.isPinned === true}
            onClick={() => handlePinnedChange(true)}
          >
            Pinned
          </FilterButton>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-background hover:bg-muted text-foreground',
      )}
    >
      {children}
    </button>
  );
}
