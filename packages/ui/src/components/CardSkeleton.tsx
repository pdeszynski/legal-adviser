import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';
import { Skeleton } from './Skeleton';

const cardSkeletonVariants = cva('rounded-lg border bg-card text-card-foreground shadow-sm', {
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

export interface CardSkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardSkeletonVariants> {
  /**
   * Number of lines of text to show in the body
   * @default 3
   */
  lines?: number;
  /**
   * Whether to show a header section
   * @default true
   */
  showHeader?: boolean;
  /**
   * Whether to show a footer section
   * @default false
   */
  showFooter?: boolean;
  /**
   * Whether to show an avatar/icon in the header
   * @default false
   */
  showAvatar?: boolean;
  /**
   * Whether to show a description below the title
   * @default false
   */
  showDescription?: boolean;
}

const CardSkeleton = React.forwardRef<HTMLDivElement, CardSkeletonProps>(
  (
    {
      size,
      lines = 3,
      showHeader = true,
      showFooter = false,
      showAvatar = false,
      showDescription = false,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div ref={ref} className={cn(cardSkeletonVariants({ size, className }))} {...props}>
        {/* Header */}
        {showHeader && (
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-3">
              {showAvatar && <Skeleton variant="avatar" />}
              <div className="flex-1 space-y-2">
                <Skeleton width="60%" height="1.5rem" />
                {showDescription && <Skeleton width="80%" height="1rem" />}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={cn('space-y-2', showHeader && 'pt-4')}>
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={`line-${i}`} width={i === lines - 1 ? '80%' : '100%'} height="1rem" />
          ))}
        </div>

        {/* Footer */}
        {showFooter && (
          <div className={cn('flex items-center space-x-2', showHeader && 'pt-4')}>
            <Skeleton width="5rem" height="2rem" />
            <Skeleton width="5rem" height="2rem" />
          </div>
        )}
      </div>
    );
  },
);

CardSkeleton.displayName = 'CardSkeleton';

export { CardSkeleton, cardSkeletonVariants };
