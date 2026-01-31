'use client';

import { useQuery } from '@refinedev/core';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useQueryClient } from '@tanstack/react-query';
import type { SaosIndexingHealthStatusQuery, SaosIndexingMetricsQuery } from '@/generated/graphql';

/**
 * SAOS Indexing Status Page
 *
 * Displays comprehensive monitoring of the SAOS/ISAP ruling indexing workflow.
 * Shows metrics, health status, recent activity, errors, and skipped records.
 */

// GraphQL Queries
const SAOS_INDEXING_HEALTH_QUERY = `
  query SaosIndexingHealthStatus {
    saosIndexingHealthStatus {
      status
      description
      metrics {
        totalRulings
        saosRulings
        isapRulings
        rulingsWithFullText
        rulingsMissingFullText
        rulingsWithSummary
        fullTextCoverageRate
        lastIndexingRunAt
        lastRulingAddedAt
        newRulingsLast24Hours
        lastRulingUpdatedAt
        updatedRulingsLast24Hours
        calculatedAt
      }
      byCourtType {
        courtType
        count
        withFullText
        percentage
      }
      recentActivity {
        id
        jobId
        source
        status
        recordsProcessed
        recordsSaved
        recordsSkipped
        recordsWithErrors
        recordsMissingTextContent
        processingTimeMs
        startedAt
        completedAt
      }
      recentErrors {
        id
        source
        errorType
        errorMessage
        rulingSignature
        courtName
        occurredAt
        lastSeenAt
        count
      }
      recentSkipped {
        id
        source
        skipReason
        rulingSignature
        skippedAt
        count
      }
      alerts
      calculatedAt
    }
  }
`;

interface RecentActivity {
  id: string;
  jobId: string;
  source: string;
  status: string;
  recordsProcessed: number;
  recordsSaved: number;
  recordsSkipped: number;
  recordsWithErrors: number;
  recordsMissingTextContent: number;
  processingTimeMs: number;
  startedAt: string;
  completedAt?: string;
}

interface RecentError {
  id: string;
  source: string;
  errorType: string;
  errorMessage: string;
  rulingSignature?: string;
  courtName?: string;
  occurredAt: string;
  lastSeenAt: string;
  count: number;
}

interface RecentSkipped {
  id: string;
  source: string;
  skipReason: string;
  rulingSignature?: string;
  skippedAt: string;
  count: number;
}

interface ByCourtType {
  courtType: string;
  count: number;
  withFullText: number;
  percentage: number;
}

interface SaosIndexingMetrics {
  totalRulings: number;
  saosRulings: number;
  isapRulings: number;
  rulingsWithFullText: number;
  rulingsMissingFullText: number;
  rulingsWithSummary: number;
  fullTextCoverageRate: number;
  lastIndexingRunAt: string | null;
  lastRulingAddedAt: string | null;
  newRulingsLast24Hours: number;
  lastRulingUpdatedAt: string | null;
  updatedRulingsLast24Hours: number;
  calculatedAt: string;
}

interface SaosIndexingHealthStatus {
  status: string;
  description: string;
  metrics: SaosIndexingMetrics;
  byCourtType: ByCourtType[];
  recentActivity: RecentActivity[];
  recentErrors: RecentError[];
  recentSkipped: RecentSkipped[];
  alerts: string[];
  calculatedAt: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'HEALTHY':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Healthy
        </Badge>
      );
    case 'WARNING':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Warning
        </Badge>
      );
    case 'CRITICAL':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Critical
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getActivityStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Completed
        </Badge>
      );
    case 'RUNNING':
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="h-3 w-3 mr-1" />
          Running
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Failed
        </Badge>
      );
    case 'PARTIAL':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Partial
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return 'Never';
  return new Date(timestamp).toLocaleString();
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export default function SaosIndexingStatusPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<SaosIndexingHealthStatus>({
    queryKey: ['saosIndexingHealthStatus'],
    queryFn: async () => {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: SAOS_INDEXING_HEALTH_QUERY,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch SAOS indexing status');
      }

      const json = await response.json();
      return json.data.saosIndexingHealthStatus;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const healthStatus = data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">SAOS Indexing Status</h1>
          <p className="text-muted-foreground">
            Monitor the SAOS/ISAP ruling indexing workflow
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SAOS Indexing Status</h1>
          <p className="text-muted-foreground">
            Monitor the SAOS/ISAP ruling indexing workflow
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {healthStatus && (
        <>
          {/* Health Status Banner */}
          <Card
            className={`border-2 ${
              healthStatus.status === 'HEALTHY'
                ? 'bg-green-50 border-green-200'
                : healthStatus.status === 'WARNING'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                {getStatusBadge(healthStatus.status)}
                <div>
                  <p className="font-medium">{healthStatus.description}</p>
                  {healthStatus.alerts.length > 0 && (
                    <ul className="mt-2 text-sm text-muted-foreground">
                      {healthStatus.alerts.map((alert, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3" />
                          {alert}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Rulings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {healthStatus.metrics.totalRulings.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {healthStatus.metrics.saosRulings.toLocaleString()} SAOS +{' '}
                  {healthStatus.metrics.isapRulings.toLocaleString()} ISAP
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Full Text Coverage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {healthStatus.metrics.fullTextCoverageRate.toFixed(1)}%
                </div>
                <Progress
                  value={healthStatus.metrics.fullTextCoverageRate}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {healthStatus.metrics.rulingsWithFullText.toLocaleString()} of{' '}
                  {healthStatus.metrics.totalRulings.toLocaleString()} rulings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>New Rulings (24h)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {healthStatus.metrics.newRulingsLast24Hours}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last added: {formatTimestamp(healthStatus.metrics.lastRulingAddedAt)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Last Indexing Run</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {formatTimestamp(healthStatus.metrics.lastIndexingRunAt)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {healthStatus.metrics.updatedRulingsLast24Hours} updates in 24h
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for detailed views */}
          <Tabs defaultValue="activity" className="space-y-4">
            <TabsList>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="courts">By Court Type</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
              <TabsTrigger value="skipped">Skipped Records</TabsTrigger>
            </TabsList>

            {/* Recent Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Indexing Activity</CardTitle>
                  <CardDescription>
                    Latest indexing jobs and their results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {healthStatus.recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No recent activity recorded
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job ID</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Processed</TableHead>
                          <TableHead className="text-right">Saved</TableHead>
                          <TableHead className="text-right">Skipped</TableHead>
                          <TableHead className="text-right">Errors</TableHead>
                          <TableHead className="text-right">Missing Text</TableHead>
                          <TableHead className="text-right">Duration</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {healthStatus.recentActivity.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell className="font-mono text-xs">
                              {activity.jobId.slice(0, 8)}...
                            </TableCell>
                            <TableCell>{activity.source}</TableCell>
                            <TableCell>{getActivityStatusBadge(activity.status)}</TableCell>
                            <TableCell className="text-right">
                              {activity.recordsProcessed}
                            </TableCell>
                            <TableCell className="text-right">
                              {activity.recordsSaved}
                            </TableCell>
                            <TableCell className="text-right">
                              {activity.recordsSkipped}
                            </TableCell>
                            <TableCell className="text-right">
                              {activity.recordsWithErrors > 0 ? (
                                <span className="text-red-600 font-medium">
                                  {activity.recordsWithErrors}
                                </span>
                              ) : (
                                activity.recordsWithErrors
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {activity.recordsMissingTextContent > 0 ? (
                                <span className="text-yellow-600 font-medium">
                                  {activity.recordsMissingTextContent}
                                </span>
                              ) : (
                                activity.recordsMissingTextContent
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatDuration(activity.processingTimeMs)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatTimestamp(activity.startedAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* By Court Type Tab */}
            <TabsContent value="courts">
              <Card>
                <CardHeader>
                  <CardTitle>Rulings by Court Type</CardTitle>
                  <CardDescription>
                    Distribution of indexed rulings by court type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {healthStatus.byCourtType.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No court type data available
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Court Type</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                          <TableHead className="text-right">With Full Text</TableHead>
                          <TableHead className="text-right">Coverage</TableHead>
                          <TableHead className="text-right">Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {healthStatus.byCourtType.map((court) => (
                          <TableRow key={court.courtType}>
                            <TableCell className="font-medium">
                              {court.courtType.replace(/_/g, ' ')}
                            </TableCell>
                            <TableCell className="text-right">
                              {court.count.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {court.withFullText.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Progress
                                value={
                                  court.count > 0
                                    ? (court.withFullText / court.count) * 100
                                    : 0
                                }
                                className="ml-auto w-24"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              {court.percentage.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Errors Tab */}
            <TabsContent value="errors">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Indexing Errors</CardTitle>
                  <CardDescription>
                    Errors encountered during recent indexing runs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {healthStatus.recentErrors.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No recent errors recorded
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Source</TableHead>
                          <TableHead>Error Type</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Signature</TableHead>
                          <TableHead>Court</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                          <TableHead>Last Seen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {healthStatus.recentErrors.map((error) => (
                          <TableRow key={error.id}>
                            <TableCell>{error.source}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{error.errorType}</Badge>
                            </TableCell>
                            <TableCell className="max-w-md truncate" title={error.errorMessage}>
                              {error.errorMessage}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {error.rulingSignature || '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {error.courtName || '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={error.count > 1 ? 'destructive' : 'secondary'}>
                                {error.count}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatTimestamp(error.lastSeenAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Skipped Records Tab */}
            <TabsContent value="skipped">
              <Card>
                <CardHeader>
                  <CardTitle>Skipped Records</CardTitle>
                  <CardDescription>
                    Records that were skipped during indexing with reasons
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {healthStatus.recentSkipped.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No skipped records recorded
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Source</TableHead>
                          <TableHead>Skip Reason</TableHead>
                          <TableHead>Signature</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                          <TableHead>Last Skipped</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {healthStatus.recentSkipped.map((skip) => (
                          <TableRow key={skip.id}>
                            <TableCell>{skip.source}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{skip.skipReason}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {skip.rulingSignature || '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {skip.count > 1 ? (
                                <Badge variant="outline">{skip.count} times</Badge>
                              ) : (
                                skip.count
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatTimestamp(skip.skippedAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Last Updated */}
          <p className="text-xs text-muted-foreground text-right">
            Last updated: {formatTimestamp(healthStatus.calculatedAt)}
          </p>
        </>
      )}
    </div>
  );
}
