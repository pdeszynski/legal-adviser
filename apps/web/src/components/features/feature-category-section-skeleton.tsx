'use client';

import * as React from 'react';
import { cn } from '@legal/ui';
import { Skeleton } from '@legal/ui';
import { FeatureCardSkeleton } from './feature-card-skeleton';

export interface FeatureCategorySectionSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional className */
  className?: string;
  /** Number of skeleton cards to display */
  cardCount?: number;
  /** Number of columns for grid layout */
  columns?: 1 | 2 | 3;
  /** Show category header */
  showHeader?: boolean;
}

const gridColumns = {
  1: 'grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 lg:grid-cols-3',
};

export const FeatureCategorySectionSkeleton = React.forwardRef<
  HTMLDivElement,
  FeatureCategorySectionSkeletonProps
>(({ className, cardCount = 3, columns = 3, showHeader = true }, ref) => {
  return (
    <div ref={ref} className={cn('w-full py-16', className)}>
      <div className="container mx-auto px-4 md:px-6">
        {/* Category Header */}
        {showHeader && (
          <div className="mb-12 max-w-3xl space-y-3">
            <Skeleton width="40%" height="2.5rem" />
            <Skeleton width="80%" height="1.25rem" />
            <Skeleton width="60%" height="1.25rem" />
          </div>
        )}

        {/* Features Grid */}
        <div className={cn('grid gap-8', gridColumns[columns])}>
          {Array.from({ length: cardCount }).map((_, index) => (
            <FeatureCardSkeleton key={index} animationDelay={index * 100} />
          ))}
        </div>
      </div>
    </div>
  );
});

FeatureCategorySectionSkeleton.displayName = 'FeatureCategorySectionSkeleton';
