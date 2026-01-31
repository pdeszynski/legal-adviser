import React from 'react';
import { Card, CardContent, CardHeader } from '@legal/ui';
import { Skeleton } from '@legal/ui';

/**
 * Skeleton loader for individual admin dashboard stat cards.
 * Matches the layout of the stats cards in the admin dashboard summary grid.
 */
export const AdminStatCardSkeleton: React.FC = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-32 mb-1" />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
  );
};

/**
 * Skeleton loader for the main stats grid containing 4 stat cards.
 * Matches the grid layout: Total Users, Active Sessions, Documents, AI Queries
 */
export const AdminStatsGridSkeleton: React.FC = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <AdminStatCardSkeleton />
      <AdminStatCardSkeleton />
      <AdminStatCardSkeleton />
      <AdminStatCardSkeleton />
    </div>
  );
};

/**
 * Skeleton loader for the token usage and cost stats grid.
 * Contains 3 cards: Total Tokens, Total Cost, System Health
 */
export const AdminTokenStatsGridSkeleton: React.FC = () => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-3 w-36" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Skeleton loader for the Users by Role section.
 * Matches the layout showing 5 role categories in a grid.
 */
export const AdminUsersByRoleSkeleton: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg border border-border bg-muted/20">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-16 mt-1" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Skeleton loader for chart cards in the dashboard.
 * Used for Document Types and AI Cost by Operation pie charts.
 */
export const AdminChartCardSkeleton: React.FC<{ title?: string }> = ({ title }) => {
  return (
    <Card>
      <CardHeader>
        {title ? <Skeleton className="h-6 w-40" /> : <Skeleton className="h-6 w-32" />}
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center">
          <Skeleton className="h-64 w-64 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Skeleton loader for the Document Status Breakdown bar chart.
 */
export const AdminDocumentStatusChartSkeleton: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="h-[250px] flex items-end justify-center gap-4 px-8">
          <Skeleton className="h-40 w-16 rounded-t" />
          <Skeleton className="h-32 w-16 rounded-t" />
          <Skeleton className="h-24 w-16 rounded-t" />
          <Skeleton className="h-16 w-16 rounded-t" />
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Complete admin dashboard skeleton loader for stats sections.
 * Shows all stats cards while data is being fetched.
 */
export const AdminDashboardStatsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <AdminStatsGridSkeleton />

      {/* Users by Role */}
      <AdminUsersByRoleSkeleton />

      {/* Token Usage and Cost */}
      <AdminTokenStatsGridSkeleton />

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <AdminChartCardSkeleton title="Document Types" />
        <AdminChartCardSkeleton title="AI Cost by Operation" />
      </div>

      {/* Document Status Breakdown */}
      <AdminDocumentStatusChartSkeleton />
    </div>
  );
};
