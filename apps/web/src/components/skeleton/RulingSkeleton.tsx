import { Skeleton } from '@/*/components/ui/skeleton';

/**
 * Single ruling card skeleton.
 * Matches the layout of a ruling search result card including:
 * - Header with signature and court name
 * - Badge placeholders for source and court type
 * - Summary text area
 * - Metadata tags
 * - Relevance score footer
 */
export function RulingCardSkeleton() {
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
 * Ruling search results skeleton.
 * Shows multiple ruling card skeletons for initial search loading.
 */
export function RulingSearchSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {/* Results summary placeholder */}
      <div className="mb-4">
        <Skeleton className="h-5 w-48" />
      </div>

      {/* Ruling cards */}
      {Array.from({ length: count }).map((_, index) => (
        <RulingCardSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * Ruling pagination skeleton.
 * Shows a smaller number of cards for pagination loading states.
 */
export function RulingPaginationSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <RulingCardSkeleton key={index} />
      ))}
    </div>
  );
}
