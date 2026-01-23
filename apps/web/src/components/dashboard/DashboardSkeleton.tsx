import React from 'react';
import { Skeleton } from '@/*/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@legal/ui';

/**
 * Skeleton loader for individual stat cards.
 * Matches the layout of the stat cards in the mini stats row.
 */
export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
};

/**
 * Skeleton loader for the stats row containing 4 stat cards.
 */
export const StatsRowSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
  );
};

/**
 * Skeleton loader for individual activity items in the timeline.
 * Matches the layout of ActivityItem components.
 */
export const ActivityItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-start gap-3 p-3">
      {/* Icon placeholder */}
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      {/* Content placeholder */}
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-full max-w-[200px]" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
};

/**
 * Skeleton loader for the activity timeline card.
 * Shows a configurable number of activity item skeletons.
 */
export const ActivityTimelineSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {Array.from({ length: count }).map((_, i) => (
            <ActivityItemSkeleton key={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Skeleton loader for individual document list items.
 * Matches the layout of document items in the recent documents list.
 */
export const DocumentItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        {/* File icon placeholder */}
        <Skeleton className="h-10 w-10 rounded-lg" />
        {/* Document info placeholder */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      {/* Status badge placeholder */}
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
};

/**
 * Skeleton loader for the recent documents list.
 * Shows a configurable number of document item skeletons.
 */
export const RecentDocumentsSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border flex justify-between items-center">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-16" />
      </div>
      {/* Document list */}
      <div className="divide-y divide-border">
        {Array.from({ length: count }).map((_, i) => (
          <DocumentItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton loader for action cards in the main actions grid.
 * Matches the layout of the Create Document, Legal Q&A, and Browse Cases cards.
 */
export const ActionCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      {/* Icon placeholder */}
      <Skeleton className="h-12 w-12 rounded-lg mb-4" />
      {/* Title placeholder */}
      <Skeleton className="h-6 w-32 mb-2" />
      {/* Description placeholder */}
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      {/* Action link placeholder */}
      <Skeleton className="h-5 w-24" />
    </div>
  );
};

/**
 * Skeleton loader for the main actions grid.
 * Shows 3 action card skeletons.
 */
export const ActionsGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <ActionCardSkeleton />
      <ActionCardSkeleton />
      <ActionCardSkeleton />
    </div>
  );
};

/**
 * Skeleton loader for the hero section.
 * Matches the layout of the welcome banner.
 */
export const HeroSectionSkeleton: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 rounded-2xl border border-primary/10">
      <Skeleton className="h-10 w-64 mb-2" />
      <Skeleton className="h-6 w-full max-w-2xl" />
    </div>
  );
};

/**
 * Complete dashboard skeleton loader.
 * Shows all dashboard sections in loading state.
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <HeroSectionSkeleton />
      <ActionsGridSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <StatsRowSkeleton />
          <RecentDocumentsSkeleton count={5} />
        </div>
        <div className="space-y-6">
          <ActivityTimelineSkeleton count={5} />
        </div>
      </div>
    </div>
  );
};
