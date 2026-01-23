import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';
import { Skeleton } from './Skeleton';

const formSkeletonVariants = cva('', {
  variants: {
    layout: {
      default: 'space-y-6',
      horizontal: 'grid grid-cols-2 gap-6',
      inline: 'flex items-center space-x-4',
    },
  },
  defaultVariants: {
    layout: 'default',
  },
});

export interface FormSkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof formSkeletonVariants> {
  /**
   * Number of form fields to display
   * @default 3
   */
  fields?: number;
  /**
   * Whether to show a title section at the top
   * @default false
   */
  showTitle?: boolean;
  /**
   * Whether to show action buttons at the bottom
   * @default false
   */
  showActions?: boolean;
  /**
   * Field label width (e.g., '20%', '150px')
   * @default '25%'
   */
  labelWidth?: string;
}

const FormSkeleton = React.forwardRef<HTMLDivElement, FormSkeletonProps>(
  (
    {
      fields = 3,
      layout,
      showTitle = false,
      showActions = false,
      labelWidth = '25%',
      className,
      ...props
    },
    ref,
  ) => {
    const isHorizontal = layout === 'horizontal';
    const isInline = layout === 'inline';

    return (
      <div ref={ref} className={cn(formSkeletonVariants({ layout, className }))} {...props}>
        {/* Title */}
        {showTitle && (
          <div className="space-y-2 pb-4">
            <Skeleton width="30%" height="2rem" />
            <Skeleton width="60%" height="1rem" />
          </div>
        )}

        {/* Fields */}
        <div className={cn(isInline ? 'flex items-center space-x-4' : 'space-y-4')}>
          {Array.from({ length: fields }).map((_, i) => (
            <div
              key={`field-${i}`}
              className={cn(isInline && 'flex-1', isHorizontal && 'space-y-2')}
            >
              {/* Label */}
              {!isInline && <Skeleton width={labelWidth} height="1rem" />}
              {/* Input */}
              <Skeleton width={isInline ? '10rem' : '100%'} height="2.5rem" />
            </div>
          ))}
        </div>

        {/* Actions */}
        {showActions && (
          <div className={cn('flex space-x-3 pt-4', showTitle && 'border-t')}>
            <Skeleton width="6rem" height="2.5rem" />
            <Skeleton width="6rem" height="2.5rem" />
          </div>
        )}
      </div>
    );
  },
);

FormSkeleton.displayName = 'FormSkeleton';

export { FormSkeleton, formSkeletonVariants };
