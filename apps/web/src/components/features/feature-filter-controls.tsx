'use client';

import * as React from 'react';
import { cn } from '@legal/ui';
import { Input } from '@legal/ui';
import { Search, X } from 'lucide-react';

export type FeatureFilterValue = 'all' | 'ai-tools' | 'research' | 'collaboration' | 'platform';

export interface FeatureFilterOption {
  value: FeatureFilterValue;
  label: string;
  count?: number;
}

export interface FeatureFilterControlsProps {
  /** Current filter value */
  filter: FeatureFilterValue;
  /** Callback when filter changes */
  onFilterChange: (filter: FeatureFilterValue) => void;
  /** Current search query */
  search: string;
  /** Callback when search changes */
  onSearchChange: (search: string) => void;
  /** Available filter options */
  filterOptions?: FeatureFilterOption[];
  /** Optional className */
  className?: string;
  /** Show search bar */
  showSearch?: boolean;
  /** Total results count */
  resultsCount?: number;
}

const defaultFilterOptions: FeatureFilterOption[] = [
  { value: 'all', label: 'All Features' },
  { value: 'ai-tools', label: 'AI Tools' },
  { value: 'research', label: 'Research' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'platform', label: 'Platform' },
];

export const FeatureFilterControls = React.forwardRef<HTMLDivElement, FeatureFilterControlsProps>(
  (
    {
      filter,
      onFilterChange,
      search,
      onSearchChange,
      filterOptions = defaultFilterOptions,
      className,
      showSearch = true,
      resultsCount,
    },
    ref,
  ) => {
    const [isSearchFocused, setIsSearchFocused] = React.useState(false);

    const handleClearSearch = () => {
      onSearchChange('');
    };

    return (
      <div ref={ref} className={cn('w-full py-8 bg-muted/30', className)}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => {
                const isActive = filter === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => onFilterChange(option.value)}
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                      'hover:bg-accent',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-background text-muted-foreground',
                    )}
                  >
                    {option.label}
                    {option.count !== undefined && (
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          isActive ? 'bg-primary-foreground/20' : 'bg-muted-foreground/10',
                        )}
                      >
                        {option.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search Bar */}
            {showSearch && (
              <div className="relative w-full lg:w-auto lg:min-w-[300px]">
                <div
                  className={cn(
                    'relative flex items-center transition-all duration-200',
                    isSearchFocused && 'ring-2 ring-ring ring-offset-2 rounded-md',
                  )}
                >
                  <Search
                    className={cn(
                      'absolute left-3 h-4 w-4 transition-colors',
                      isSearchFocused ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                  <Input
                    type="search"
                    placeholder="Search features..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className="pl-10 pr-10 h-10"
                  />
                  {search && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Results count */}
          {resultsCount !== undefined && (
            <div className="mt-4 text-sm text-muted-foreground">
              {resultsCount === 0
                ? 'No features found'
                : `Showing ${resultsCount} feature${resultsCount !== 1 ? 's' : ''}`}
            </div>
          )}
        </div>
      </div>
    );
  },
);

FeatureFilterControls.displayName = 'FeatureFilterControls';
