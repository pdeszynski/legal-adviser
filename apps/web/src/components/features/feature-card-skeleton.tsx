'use client';

import * as React from 'react';
import { cn } from '@legal/ui';
import { Skeleton } from '@legal/ui';

export interface FeatureCardSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional className */
  className?: string;
  /** Delay for entrance animation (in ms) */
  animationDelay?: number;
  /** Whether to show status badge placeholder */
  showStatus?: boolean;
  /** Whether to show CTA button placeholder */
  showCta?: boolean;
}

export const FeatureCardSkeleton = React.forwardRef<HTMLDivElement, FeatureCardSkeletonProps>(
  ({ className, animationDelay = 0, showStatus = true, showCta = true, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), animationDelay);
      return () => clearTimeout(timer);
    }, [animationDelay]);

    return (
      <div
        ref={ref}
        className={cn(
          'group relative overflow-hidden rounded-3xl border border-white/20 bg-white/60 dark:bg-black/20 backdrop-blur-xl p-8',
          !isVisible && 'opacity-0 translate-y-4',
          isVisible && 'opacity-100 translate-y-0 transition-all duration-500',
          className,
        )}
        {...props}
      >
        {/* Icon placeholder */}
        <div className="mb-6 h-12 w-12 rounded-xl">
          <Skeleton width="100%" height="100%" className="rounded-xl" />
        </div>

        {/* Status badge placeholder */}
        {showStatus && (
          <div className="mb-3">
            <Skeleton width="4rem" height="1.5rem" className="rounded-full" />
          </div>
        )}

        {/* Title placeholder */}
        <div className="mb-3 space-y-2">
          <Skeleton width="80%" height="1.75rem" />
          <Skeleton width="40%" height="1.75rem" />
        </div>

        {/* Description placeholder */}
        <div className="space-y-2 mb-6">
          <Skeleton width="100%" height="1rem" />
          <Skeleton width="100%" height="1rem" />
          <Skeleton width="100%" height="1rem" />
          <Skeleton width="70%" height="1rem" />
        </div>

        {/* CTA button placeholder */}
        {showCta && <Skeleton width="100%" height="3rem" className="rounded-lg" />}
      </div>
    );
  },
);

FeatureCardSkeleton.displayName = 'FeatureCardSkeleton';
