import React from 'react';
import { Skeleton } from '@/*/components/ui/skeleton';

/**
 * Skeleton loader for metric cards.
 * Matches the layout of MetricCard components in the analytics dashboard.
 */
export const MetricCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32 mt-2" />
    </div>
  );
};

/**
 * Skeleton loader for the metrics row containing 4 metric cards.
 * Used for User Growth Metrics section.
 */
export const MetricsRowSkeleton: React.FC = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
    </div>
  );
};

/**
 * Skeleton loader for the metrics card with 4 metrics inside.
 * Used for Document Generation, Query Activity, and AI Usage sections.
 */
export const MetricsCardSkeleton: React.FC<{ title?: string }> = ({ title }) => {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="p-6 pt-0 grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-28 mb-2" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton loader for the distribution/operation breakdown section.
 * Shows a list with configurable number of items.
 */
export const DistributionListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="p-6 pt-0 border-t">
      <Skeleton className="h-4 w-48 mb-3" />
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <Skeleton className="h-4 w-32" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton loader for the metrics card with distribution breakdown.
 * Combines MetricsCardSkeleton with DistributionListSkeleton.
 */
export const MetricsCardWithDistributionSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="p-6 pt-0 grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-28 mb-2" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
      <DistributionListSkeleton count={4} />
    </div>
  );
};

/**
 * Skeleton loader for the System Health section with 3 metrics.
 */
export const SystemHealthSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="p-6 pt-0 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-36 mb-2" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton loader for the Quick Actions section.
 */
export const QuickActionsSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="p-6 pt-0 space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
};

/**
 * Skeleton loader for the Data Range section.
 */
export const DataRangeSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-4 w-44" />
      </div>
      <div className="p-6 pt-0">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton loader for the analytics dashboard page header.
 */
export const AnalyticsHeaderSkeleton: React.FC = () => {
  return (
    <div>
      <Skeleton className="h-10 w-64 mb-2" />
      <Skeleton className="h-5 w-72" />
    </div>
  );
};

/**
 * Complete analytics dashboard skeleton loader.
 * Shows all analytics sections in loading state matching the actual dashboard layout.
 */
export const AnalyticsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <AnalyticsHeaderSkeleton />

      {/* User Growth Metrics */}
      <MetricsRowSkeleton />

      {/* Document Metrics */}
      <MetricsCardWithDistributionSkeleton />

      {/* Query Metrics */}
      <MetricsCardSkeleton />

      {/* AI Usage Metrics */}
      <MetricsCardWithDistributionSkeleton />

      {/* System Health */}
      <SystemHealthSkeleton />

      {/* Quick Actions and Data Range */}
      <div className="grid gap-4 md:grid-cols-2">
        <QuickActionsSkeleton />
        <DataRangeSkeleton />
      </div>
    </div>
  );
};
