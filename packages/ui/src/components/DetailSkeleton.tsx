import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';
import { Skeleton } from './Skeleton';

const detailSkeletonVariants = cva('rounded-lg border bg-card text-card-foreground shadow-sm', {
  variants: {
    size: {
      default: 'p-6',
      sm: 'p-4',
      lg: 'p-8',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export interface DetailSkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof detailSkeletonVariants> {
  /**
   * Whether to show a header with title and actions
   * @default true
   */
  showHeader?: boolean;
  /**
   * Whether to show a primary image/hero section
   * @default false
   */
  showImage?: boolean;
  /**
   * Number of detail sections/rows to display
   * @default 4
   */
  sections?: number;
  /**
   * Whether to show a tab navigation bar
   * @default false
   */
  showTabs?: boolean;
  /**
   * Whether to show action buttons in header
   * @default true
   */
  showActions?: boolean;
}

const DetailSkeleton = React.forwardRef<HTMLDivElement, DetailSkeletonProps>(
  (
    {
      size,
      showHeader = true,
      showImage = false,
      sections = 4,
      showTabs = false,
      showActions = true,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div ref={ref} className={cn(detailSkeletonVariants({ size, className }))} {...props}>
        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between pb-6 border-b">
            <div className="space-y-2">
              <Skeleton width="12rem" height="2rem" />
              <Skeleton width="20rem" height="1rem" />
            </div>
            {showActions && (
              <div className="flex space-x-2">
                <Skeleton width="5rem" height="2.25rem" />
                <Skeleton width="5rem" height="2.25rem" />
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        {showTabs && (
          <div className="flex space-x-6 py-4 border-b">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={`tab-${i}`}
                width="4rem"
                height="1.5rem"
                className={cn('rounded-t', i === 0 && 'border-b-2 border-primary')}
              />
            ))}
          </div>
        )}

        <div className={cn(showHeader && 'pt-6', 'space-y-6')}>
          {/* Image/Hero Section */}
          {showImage && (
            <div className="flex items-start space-x-6 pb-6 border-b">
              <Skeleton width="16rem" height="12rem" />
              <div className="flex-1 space-y-3">
                <Skeleton width="70%" height="1.5rem" />
                <Skeleton width="100%" height="1rem" />
                <Skeleton width="100%" height="1rem" />
                <Skeleton width="60%" height="1rem" />
              </div>
            </div>
          )}

          {/* Detail Sections */}
          <div className="space-y-4">
            {Array.from({ length: sections }).map((_, i) => (
              <div key={`section-${i}`} className="flex items-start space-x-4">
                <Skeleton width="10rem" height="1rem" className="shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton width="40%" height="1rem" />
                  {i < sections - 1 && <Skeleton width="80%" height="0.75rem" />}
                </div>
              </div>
            ))}
          </div>

          {/* Content Body */}
          <div className="space-y-2 pt-4 border-t">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={`body-${i}`} width={i === 4 ? '70%' : '100%'} height="1rem" />
            ))}
          </div>
        </div>
      </div>
    );
  },
);

DetailSkeleton.displayName = 'DetailSkeleton';

export { DetailSkeleton, detailSkeletonVariants };
