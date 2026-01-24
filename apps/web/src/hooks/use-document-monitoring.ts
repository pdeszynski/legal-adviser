'use client';

import { useEffect, useState, useCallback } from 'react';
import { useCustom } from '@refinedev/core';

/**
 * Document queue metrics for real-time monitoring
 */
export interface DocumentQueueMetrics {
  draftCount: number;
  generatingCount: number;
  completedCount: number;
  failedCount: number;
  calculatedAt: string;
}

/**
 * Document activity entry
 */
export interface DocumentActivityEntry {
  documentId: string;
  title: string;
  status: string;
  documentType?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  errorMessage?: string;
}

/**
 * Recent document activity
 */
export interface RecentDocumentActivity {
  recentCompletions: DocumentActivityEntry[];
  recentFailures: DocumentActivityEntry[];
  currentlyGenerating: DocumentActivityEntry[];
  fetchedAt: string;
}

/**
 * Hook return type
 */
export interface UseDocumentMonitoringReturn {
  queueMetrics: DocumentQueueMetrics | null;
  recentActivity: RecentDocumentActivity | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * useDocumentMonitoring Hook
 *
 * Fetches real-time document queue metrics and recent activity
 * for the admin dashboard. Auto-refreshes every 10 seconds.
 *
 * @returns Document monitoring state and controls
 */
export function useDocumentMonitoring(): UseDocumentMonitoringReturn {
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  // Fetch document queue metrics
  const { query: queueQuery, result: queueResult } = useCustom<DocumentQueueMetrics>({
    url: '',
    method: 'get',
    config: {
      query: {
        operation: 'documentQueueMetrics',
        fields: ['draftCount', 'generatingCount', 'completedCount', 'failedCount', 'calculatedAt'],
      },
    },
    queryOptions: {
      enabled: true,
      refetchOnWindowFocus: false,
      refetchInterval: 10000, // Auto-refresh every 10 seconds
    },
  });

  // Fetch recent document activity
  const { query: activityQuery, result: activityResult } = useCustom<RecentDocumentActivity>({
    url: '',
    method: 'get',
    config: {
      query: {
        operation: 'recentDocumentActivity',
        args: {
          limit: 10,
        },
        fields: [
          'recentCompletions { documentId title status documentType createdAt updatedAt userId }',
          'recentFailures { documentId title status documentType createdAt updatedAt userId }',
          'currentlyGenerating { documentId title status documentType createdAt updatedAt userId }',
          'fetchedAt',
        ],
      },
    },
    queryOptions: {
      enabled: true,
      refetchOnWindowFocus: false,
      refetchInterval: 10000, // Auto-refresh every 10 seconds
    },
  });

  const queueMetrics = queueResult?.data ?? null;
  const recentActivity = activityResult?.data ?? null;

  const isLoading =
    (queueQuery.isLoading || activityQuery.isLoading) && !queueMetrics && !recentActivity;
  const error: Error | null = null; // Refine's useCustom doesn't expose error directly

  // Manual refresh handler
  const refetch = useCallback(() => {
    queueQuery.refetch();
    activityQuery.refetch();
    setLastRefresh(Date.now());
  }, [queueQuery, activityQuery]);

  return {
    queueMetrics,
    recentActivity,
    isLoading,
    error,
    refetch,
  };
}
