'use client';

import { useEffect, useState, useCallback } from 'react';
import { useCustom, useCustomMutation } from '@refinedev/core';
import { Card, CardContent, CardHeader, CardTitle } from '@legal/ui';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  RotateCcw,
  X,
  Filter,
} from 'lucide-react';
import {
  DocumentQueueEntry,
  DocumentQueueListResult,
  RetryDocumentGenerationResult,
  CancelDocumentGenerationResult,
} from '@/generated/graphql';
import { dataProvider } from '@/providers/data-provider';
import { formatRelativeTime } from '@/lib/format-relative-time';

// Document workflow status values
type DocumentWorkflowStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'NOT_FOUND';

// Status badge component
function DocumentStatusBadge({ status }: { status: DocumentWorkflowStatus }) {
  switch (status) {
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="h-3 w-3" />
          Completed
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <XCircle className="h-3 w-3" />
          Failed
        </span>
      );
    case 'RUNNING':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Generating
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
          <X className="h-3 w-3" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      );
  }
}

// Stats card component
function QueueStatCard({
  label,
  count,
  icon: Icon,
  color,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DocumentQueuePage() {
  const [selectedStatus, setSelectedStatus] = useState<DocumentWorkflowStatus | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState(10);

  // Fetch document queue list
  const { query, result } = useCustom<DocumentQueueListResult>({
    url: '',
    method: 'get',
    config: {
      query: {
        operation: 'documentGenerationQueueList',
        args: {
          input: {
            status: selectedStatus,
            limit: 50,
            offset: 0,
          },
        },
        fields: [
          'entries { documentId title documentType workflowStatus documentStatus userId userEmail createdAt updatedAt errorMessage generationTimeMs }',
          'totalCount',
          'pendingCount',
          'runningCount',
          'completedCount',
          'failedCount',
        ],
      },
    },
    queryOptions: {
      enabled: true,
      refetchOnWindowFocus: false,
      refetchInterval: 10000, // Auto-refresh every 10 seconds
    },
  });

  const { data: queueData } = result;
  const { refetch, isLoading } = query;

  // Update last refresh time when data changes
  useEffect(() => {
    if (queueData) {
      setLastRefresh(new Date());
    }
  }, [queueData]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 10));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    refetch();
    setCountdown(10);
  }, [refetch]);

  // Retry mutation
  const retryMutation = useCustomMutation<RetryDocumentGenerationResult>();

  const handleRetry = useCallback(
    async (documentId: string) => {
      try {
        await (retryMutation.mutate as any)({
          url: '',
          method: 'post',
          config: {
            mutation: {
              operation: 'retryDocumentGeneration',
              fields: ['documentId', 'success', 'message', 'workflowId'],
              variables: {
                input: { documentId },
              },
            },
          },
        });
        refetch();
      } catch (error) {
        console.error('Failed to retry document generation:', error);
      }
    },
    [retryMutation, refetch],
  );

  // Cancel mutation
  const cancelMutation = useCustomMutation<CancelDocumentGenerationResult>();

  const handleCancel = useCallback(
    async (documentId: string) => {
      try {
        await (cancelMutation.mutate as any)({
          url: '',
          method: 'post',
          config: {
            mutation: {
              operation: 'cancelDocumentGeneration',
              fields: ['documentId', 'success', 'message'],
              variables: {
                input: { documentId },
              },
            },
          },
        });
        refetch();
      } catch (error) {
        console.error('Failed to cancel document generation:', error);
      }
    },
    [cancelMutation, refetch],
  );

  const entries: DocumentQueueEntry[] = queueData?.entries ?? [];
  const totalCount = queueData?.totalCount ?? 0;
  const pendingCount = queueData?.pendingCount ?? 0;
  const runningCount = queueData?.runningCount ?? 0;
  const completedCount = queueData?.completedCount ?? 0;
  const failedCount = queueData?.failedCount ?? 0;

  // Get count for selected status filter
  const filteredCount =
    selectedStatus === 'PENDING'
      ? pendingCount
      : selectedStatus === 'RUNNING'
        ? runningCount
        : selectedStatus === 'COMPLETED'
          ? completedCount
          : selectedStatus === 'FAILED'
            ? failedCount
            : totalCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Generation Queue</h1>
          <p className="text-muted-foreground">
            Monitor and manage AI document generation workflows
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Next refresh: {countdown}s</span>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <QueueStatCard
          label="Pending"
          count={pendingCount}
          icon={Clock}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500"
        />
        <QueueStatCard
          label="Generating"
          count={runningCount}
          icon={Loader2}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-500"
        />
        <QueueStatCard
          label="Completed"
          count={completedCount}
          icon={CheckCircle}
          color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500"
        />
        <QueueStatCard
          label="Failed"
          count={failedCount}
          icon={XCircle}
          color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500"
        />
      </div>

      {/* Status Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by status:</span>
            <button
              onClick={() => setSelectedStatus(null)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                selectedStatus === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setSelectedStatus('PENDING')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                selectedStatus === 'PENDING'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setSelectedStatus('RUNNING')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                selectedStatus === 'RUNNING'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
              }`}
            >
              Generating ({runningCount})
            </button>
            <button
              onClick={() => setSelectedStatus('COMPLETED')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                selectedStatus === 'COMPLETED'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => setSelectedStatus('FAILED')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                selectedStatus === 'FAILED'
                  ? 'bg-red-500 text-white'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              Failed ({failedCount})
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {selectedStatus ? `${selectedStatus} Documents` : 'All Documents'} ({filteredCount})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && !queueData ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {selectedStatus
                  ? `No ${selectedStatus.toLowerCase()} documents`
                  : 'No documents in the queue'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Document
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      User
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Created
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Time
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.documentId} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{entry.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {entry.documentId.slice(0, 8)}...
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{entry.documentType}</td>
                      <td className="py-3 px-4">
                        <DocumentStatusBadge status={entry.workflowStatus} />
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {entry.userEmail || entry.userId || 'System'}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatRelativeTime(new Date(entry.createdAt))}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {entry.generationTimeMs
                          ? `${(entry.generationTimeMs / 1000).toFixed(1)}s`
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {entry.workflowStatus === 'FAILED' && (
                            <button
                              onClick={() => handleRetry(entry.documentId)}
                              className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-500"
                              title="Retry"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                          {entry.workflowStatus === 'RUNNING' && (
                            <button
                              onClick={() => handleCancel(entry.documentId)}
                              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-500"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                          {entry.errorMessage && (
                            <span
                              className="text-xs text-red-600 dark:text-red-400 max-w-[200px] truncate"
                              title={entry.errorMessage}
                            >
                              {entry.errorMessage}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  );
}
