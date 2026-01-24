'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@legal/ui';
import { FileText, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { DocumentQueueMetrics } from '@/hooks';

interface DocumentQueueMonitorProps {
  metrics: DocumentQueueMetrics | null;
  isLoading: boolean;
}

export function DocumentQueueMonitor({ metrics, isLoading }: DocumentQueueMonitorProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Queue Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = metrics
    ? metrics.draftCount + metrics.generatingCount + metrics.completedCount + metrics.failedCount
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Queue Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Draft */}
          <div className="flex flex-col items-center p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-500 mb-2" />
            <span className="text-2xl font-bold">{metrics?.draftCount ?? 0}</span>
            <span className="text-sm text-muted-foreground">Draft</span>
          </div>

          {/* Generating */}
          <div className="flex flex-col items-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 relative overflow-hidden">
            {metrics?.generatingCount && metrics.generatingCount > 0 ? (
              <>
                <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
                <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-500 mb-2 animate-spin" />
              </>
            ) : (
              <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-500 mb-2" />
            )}
            <span className="text-2xl font-bold">{metrics?.generatingCount ?? 0}</span>
            <span className="text-sm text-muted-foreground">Generating</span>
          </div>

          {/* Completed */}
          <div className="flex flex-col items-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500 mb-2" />
            <span className="text-2xl font-bold">{metrics?.completedCount ?? 0}</span>
            <span className="text-sm text-muted-foreground">Completed</span>
          </div>

          {/* Failed */}
          <div className="flex flex-col items-center p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-500 mb-2" />
            <span className="text-2xl font-bold">{metrics?.failedCount ?? 0}</span>
            <span className="text-sm text-muted-foreground">Failed</span>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Documents</span>
            <span className="font-semibold">{total}</span>
          </div>
          {metrics && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Success Rate</span>
              <span className="font-semibold text-green-600">
                {total > 0 ? ((metrics.completedCount / total) * 100).toFixed(1) : 0}%
              </span>
            </div>
          )}
        </div>

        {/* Last Updated */}
        {metrics && (
          <div className="mt-4 text-xs text-muted-foreground text-center">
            Last updated: {new Date(metrics.calculatedAt).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
