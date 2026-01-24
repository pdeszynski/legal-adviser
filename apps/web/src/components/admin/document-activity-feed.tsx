'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@legal/ui';
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import type { RecentDocumentActivity, DocumentActivityEntry } from '@/hooks';

interface DocumentActivityFeedProps {
  activity: RecentDocumentActivity | null;
  isLoading: boolean;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function DocumentStatusBadge({ status }: { status: string }) {
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
    case 'GENERATING':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Generating
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
          <Clock className="h-3 w-3" />
          {status.toLowerCase()}
        </span>
      );
  }
}

function ActivityItem({ entry }: { entry: DocumentActivityEntry }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0 mt-0.5">
        {entry.status === 'COMPLETED' && (
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
        )}
        {entry.status === 'FAILED' && (
          <XCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
        )}
        {entry.status === 'GENERATING' && (
          <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-500 animate-spin" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm truncate">{entry.title}</span>
          <DocumentStatusBadge status={entry.status} />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{entry.documentType || 'Unknown type'}</span>
          <span>•</span>
          <span>{formatRelativeTime(entry.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
      {message}
    </div>
  );
}

export function DocumentActivityFeed({ activity, isLoading }: DocumentActivityFeedProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Document Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentlyGenerating = activity?.currentlyGenerating ?? [];
  const recentCompletions = activity?.recentCompletions ?? [];
  const recentFailures = activity?.recentFailures ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Document Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Currently Generating */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-500 animate-spin" />
              Currently Generating ({currentlyGenerating.length})
            </h4>
            <div className="space-y-1">
              {currentlyGenerating.length > 0 ? (
                currentlyGenerating.map((entry) => (
                  <ActivityItem key={entry.documentId} entry={entry} />
                ))
              ) : (
                <EmptyState message="No documents currently generating" />
              )}
            </div>
          </div>

          {/* Recent Completions */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
              Recent Completions ({recentCompletions.length})
            </h4>
            <div className="space-y-1">
              {recentCompletions.length > 0 ? (
                recentCompletions.map((entry) => (
                  <ActivityItem key={entry.documentId} entry={entry} />
                ))
              ) : (
                <EmptyState message="No recent completions" />
              )}
            </div>
          </div>

          {/* Recent Failures */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
              Recent Failures ({recentFailures.length})
            </h4>
            <div className="space-y-1">
              {recentFailures.length > 0 ? (
                recentFailures.map((entry) => <ActivityItem key={entry.documentId} entry={entry} />)
              ) : (
                <EmptyState message="No recent failures" />
              )}
            </div>
          </div>
        </div>

        {/* Last Updated */}
        {activity && (
          <div className="mt-6 pt-4 border-t text-xs text-muted-foreground text-center">
            Last updated: {new Date(activity.fetchedAt).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
