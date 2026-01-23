import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const skeletonVariants = cva('animate-shimmer rounded-md bg-muted', {
  variants: {
    variant: {
      default: 'bg-muted',
      text: 'h-4 w-full',
      circular: 'rounded-full',
      avatar: 'h-10 w-10 rounded-full',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {
  /**
   * Custom width (e.g., '100%', '200px', '20rem')
   */
  width?: string;
  /**
   * Custom height (e.g., '100%', '200px', '20rem')
   */
  height?: string;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, width, height, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant, className }))}
        style={{
          width,
          height,
          ...style,
        }}
        {...props}
      />
    );
  },
);

Skeleton.displayName = 'Skeleton';

export { Skeleton, skeletonVariants };
