import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';
import { Skeleton } from './Skeleton';

const dashboardSkeletonVariants = cva('space-y-6', {
  variants: {},
  defaultVariants: {},
});

export interface DashboardSkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof dashboardSkeletonVariants> {
  /**
   * Number of stat cards to display
   * @default 4
   */
  statCards?: number;
  /**
   * Whether to show a main chart section
   * @default true
   */
  showChart?: boolean;
  /**
   * Number of activity items to display
   * @default 5
   */
  activityItems?: number;
  /**
   * Whether to show a sidebar layout
   * @default false
   */
  showSidebar?: boolean;
}

const StatCardSkeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-lg border bg-card p-6 shadow-sm', className)} {...props}>
      <Skeleton width="40%" height="1rem" />
      <Skeleton width="60%" height="2.5rem" className="mt-3" />
      <Skeleton width="30%" height="0.75rem" className="mt-3" />
    </div>
  ),
);
StatCardSkeleton.displayName = 'StatCardSkeleton';

const ActivityItemSkeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-start space-x-3', className)} {...props}>
      <Skeleton variant="avatar" />
      <div className="flex-1 space-y-2">
        <Skeleton width="70%" height="1rem" />
        <Skeleton width="40%" height="0.75rem" />
      </div>
    </div>
  ),
);
ActivityItemSkeleton.displayName = 'ActivityItemSkeleton';

const DashboardSkeleton = React.forwardRef<HTMLDivElement, DashboardSkeletonProps>(
  (
    {
      statCards = 4,
      showChart = true,
      activityItems = 5,
      showSidebar = false,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div ref={ref} className={cn(dashboardSkeletonVariants(), className)} {...props}>
        {/* Page Header */}
        <div className="space-y-2">
          <Skeleton width="15rem" height="2rem" />
          <Skeleton width="30rem" height="1rem" />
        </div>

        <div className={cn(showSidebar ? 'grid grid-cols-1 lg:grid-cols-4 gap-6' : 'space-y-6')}>
          {/* Main Content */}
          <div className={cn(showSidebar ? 'lg:col-span-3 space-y-6' : 'space-y-6')}>
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: statCards }).map((_, i) => (
                <StatCardSkeleton key={`stat-${i}`} />
              ))}
            </div>

            {/* Chart Section */}
            {showChart && (
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton width="10rem" height="1.5rem" />
                  <div className="flex space-x-2">
                    <Skeleton width="4rem" height="2rem" />
                    <Skeleton width="4rem" height="2rem" />
                  </div>
                </div>
                {/* Chart Area */}
                <div className="h-64 flex items-end space-x-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton
                      key={`bar-${i}`}
                      width="100%"
                      height={`${30 + Math.random() * 70}%`}
                      className="flex-1"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <Skeleton width="10rem" height="1.5rem" className="mb-4" />
              <div className="space-y-4">
                {Array.from({ length: activityItems }).map((_, i) => (
                  <ActivityItemSkeleton key={`activity-${i}`} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          {showSidebar && (
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Actions */}
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <Skeleton width="8rem" height="1.25rem" className="mb-3" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={`action-${i}`} width="100%" height="2.25rem" />
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <Skeleton width="8rem" height="1.25rem" className="mb-3" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={`notif-${i}`} className="flex space-x-2">
                      <Skeleton variant="circular" width="0.75rem" height="0.75rem" />
                      <Skeleton width="100%" height="0.875rem" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

DashboardSkeleton.displayName = 'DashboardSkeleton';

export { DashboardSkeleton, dashboardSkeletonVariants, StatCardSkeleton, ActivityItemSkeleton };
