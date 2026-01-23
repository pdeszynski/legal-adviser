import * as React from 'react';
import { cn } from '../utils';
import { Skeleton } from './Skeleton';

export interface TableSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Number of rows to display
   * @default 5
   */
  rows?: number;
  /**
   * Number of columns to display
   * @default 4
   */
  columns?: number;
  /**
   * Whether to show header row
   * @default true
   */
  showHeader?: boolean;
  /**
   * Whether to show footer row
   * @default false
   */
  showFooter?: boolean;
  /**
   * Column widths (e.g., ['20%', '30%', '25%', '25%'])
   * If not provided, columns will be evenly distributed
   */
  columnWidths?: string[];
}

const TableSkeleton = React.forwardRef<HTMLDivElement, TableSkeletonProps>(
  (
    {
      rows = 5,
      columns = 4,
      showHeader = true,
      showFooter = false,
      columnWidths,
      className,
      ...props
    },
    ref,
  ) => {
    const defaultColumnWidth = columnWidths ? undefined : `${100 / columns}%`;

    return (
      <div ref={ref} className={cn('w-full space-y-3', className)} {...props}>
        {/* Header */}
        {showHeader && (
          <div className="flex items-center space-x-3 border-b pb-3">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton
                key={`header-${i}`}
                height="1.25rem"
                width={columnWidths?.[i] ?? defaultColumnWidth}
              />
            ))}
          </div>
        )}

        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex items-center space-x-3">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                height="2.5rem"
                width={columnWidths?.[colIndex] ?? defaultColumnWidth}
              />
            ))}
          </div>
        ))}

        {/* Footer */}
        {showFooter && (
          <div className="flex items-center justify-between border-t pt-3">
            <Skeleton width="10rem" height="1.25rem" />
            <div className="flex space-x-2">
              <Skeleton width="2.5rem" height="2rem" />
              <Skeleton width="2.5rem" height="2rem" />
            </div>
          </div>
        )}
      </div>
    );
  },
);

TableSkeleton.displayName = 'TableSkeleton';

export { TableSkeleton };
