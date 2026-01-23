import { Skeleton } from '@/*/components/ui/skeleton';

/**
 * Single compact search result skeleton.
 * Matches the layout of omnisearch dropdown results:
 * - Type icon placeholder
 * - Title and type badge
 * - Subtitle
 */
export function SearchResultItemSkeleton() {
  return (
    <div className="w-full flex items-start gap-3 px-3 py-2">
      {/* Type icon placeholder */}
      <Skeleton className="p-1.5 rounded-sm w-6 h-6 flex-shrink-0" />

      {/* Content area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Title */}
          <Skeleton className="h-4 w-32" />
          {/* Type badge */}
          <Skeleton className="h-5 w-16 rounded-full flex-shrink-0" />
        </div>
        {/* Subtitle */}
        <Skeleton className="h-3 w-24 mt-2" />
      </div>
    </div>
  );
}

/**
 * Omnisearch dropdown skeleton.
 * Shows multiple compact search result items with "See all results" footer.
 */
export function OmnisearchSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
      <div className="p-1">
        {Array.from({ length: count }).map((_, index) => (
          <SearchResultItemSkeleton key={index} />
        ))}
      </div>

      {/* "See all results" footer placeholder */}
      <div className="border-t p-2">
        <Skeleton className="h-4 w-24 mx-auto" />
      </div>
    </div>
  );
}

/**
 * Advanced search result skeleton.
 * Matches the layout of ruling search result cards:
 * - Header with signature and badges
 * - Headline/Highlighted snippet placeholder
 * - Summary text
 * - Metadata tags
 * - Relevance score footer
 */
export function AdvancedSearchResultSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header: Signature and Badges */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex flex-col gap-2 items-end ml-4">
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      {/* Headline/Highlighted Snippet placeholder */}
      <div className="mb-3">
        <Skeleton className="h-12 w-full" />
      </div>

      {/* Summary */}
      <div className="space-y-2 mb-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Metadata tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Skeleton className="h-6 w-20 rounded" />
        <Skeleton className="h-6 w-28 rounded" />
      </div>

      {/* Footer with relevance score */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

/**
 * Advanced search results skeleton.
 * Shows multiple ruling card skeletons for initial search loading.
 */
export function AdvancedSearchSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div>
      {/* Query explanation placeholder */}
      <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-md mb-4">
        <Skeleton className="h-4 w-16 mb-1" />
        <Skeleton className="h-4 w-full" />
      </div>

      {/* Results summary placeholder */}
      <div className="mb-4">
        <Skeleton className="h-5 w-48" />
      </div>

      {/* Ruling cards */}
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <AdvancedSearchResultSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

/**
 * Advanced search pagination skeleton.
 * Shows a smaller number of cards for pagination loading states.
 */
export function AdvancedSearchPaginationSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <AdvancedSearchResultSkeleton key={index} />
      ))}
    </div>
  );
}
