'use client';

import { useState, useEffect } from 'react';
import { useCustom } from '@refinedev/core';
import {
  Network,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Users,
  Coins,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@legal/ui';
import { Button } from '@legal/ui';
import { format as formatDateFormat, subDays } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Types for the trace data
interface TracesListInput {
  userId?: string;
  sessionId?: string;
  status?: 'SUCCESS' | 'ERROR' | 'UNKNOWN';
  agentType?:
    | 'QA_AGENT'
    | 'CLASSIFIER_AGENT'
    | 'DRAFTING_AGENT'
    | 'CLARIFICATION_AGENT'
    | 'WORKFLOW'
    | 'UNKNOWN';
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

interface TokenUsage {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
}

interface LangfuseTrace {
  id: string;
  name: string;
  timestamp: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  status: 'SUCCESS' | 'ERROR' | 'UNKNOWN';
  level?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'DEFAULT';
  userId?: string;
  sessionId?: string;
  model?: string;
  usage?: TokenUsage;
  observationCount: number;
  agentType:
    | 'QA_AGENT'
    | 'CLASSIFIER_AGENT'
    | 'DRAFTING_AGENT'
    | 'CLARIFICATION_AGENT'
    | 'WORKFLOW'
    | 'UNKNOWN';
}

interface TracesListResponse {
  traces: LangfuseTrace[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  fetchedAt: string;
}

// Agent type labels and colors
const AGENT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  QA_AGENT: {
    label: 'Q&A Agent',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  CLASSIFIER_AGENT: {
    label: 'Classifier',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  },
  DRAFTING_AGENT: {
    label: 'Drafting',
    color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  CLARIFICATION_AGENT: {
    label: 'Clarification',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  },
  WORKFLOW: {
    label: 'Workflow',
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  },
  UNKNOWN: {
    label: 'Unknown',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  },
};

// Date range presets
type DateRangePreset = '1h' | '24h' | '7d' | '30d' | '90d';

const DATE_RANGE_PRESETS: Record<
  DateRangePreset,
  { label: string; getValue: () => { startDate: Date; endDate: Date } }
> = {
  '1h': {
    label: 'Last Hour',
    getValue: () => ({ startDate: new Date(Date.now() - 60 * 60 * 1000), endDate: new Date() }),
  },
  '24h': {
    label: 'Last 24h',
    getValue: () => ({ startDate: subDays(new Date(), 1), endDate: new Date() }),
  },
  '7d': {
    label: 'Last 7 Days',
    getValue: () => ({ startDate: subDays(new Date(), 7), endDate: new Date() }),
  },
  '30d': {
    label: 'Last 30 Days',
    getValue: () => ({ startDate: subDays(new Date(), 30), endDate: new Date() }),
  },
  '90d': {
    label: 'Last 90 Days',
    getValue: () => ({ startDate: subDays(new Date(), 90), endDate: new Date() }),
  },
};

// Utility functions
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDuration(ms?: number): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatDateTime(dateStr: string): string {
  return formatDateFormat(new Date(dateStr), 'MMM d, HH:mm:ss');
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export default function AiTracesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const traceId = searchParams.get('traceId');

  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('24h');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'SUCCESS' | 'ERROR'>('ALL');
  const [selectedAgentType, setSelectedAgentType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Build query input
  const getQueryInput = (): TracesListInput => {
    const { startDate, endDate } = DATE_RANGE_PRESETS[selectedPreset].getValue();

    const input: TracesListInput = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      page: currentPage,
      limit: 20,
      sortBy: 'timestamp',
      sortOrder: 'DESC',
    };

    if (searchTerm) input.searchTerm = searchTerm;
    if (selectedStatus !== 'ALL') input.status = selectedStatus;
    if (selectedAgentType !== 'ALL') input.agentType = selectedAgentType as any;

    return input;
  };

  // Fetch traces
  const { query, result } = useCustom<TracesListResponse>({
    url: '',
    method: 'get',
    config: {
      query: {
        operation: 'langfuseTraces',
        args: { input: getQueryInput() },
        fields: [
          'traces { id name timestamp startTime endTime duration status level userId sessionId model usage { totalTokens promptTokens completionTokens totalCost } observationCount agentType }',
          'totalCount',
          'page',
          'limit',
          'totalPages',
          'fetchedAt',
        ],
      },
    },
    queryOptions: {
      enabled: true,
      refetchOnWindowFocus: false,
      refetchInterval: 30000, // Auto-refresh every 30 seconds
    },
  });

  const { data: tracesData } = result;
  const { refetch, isLoading } = query;

  useEffect(() => {
    if (tracesData) {
      setLastRefresh(new Date());
    }
  }, [tracesData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPreset, selectedStatus, selectedAgentType, searchTerm]);

  const handleRefresh = () => {
    refetch();
  };

  const traces = tracesData?.traces || [];
  const totalCount = tracesData?.totalCount || 0;
  const totalPages = tracesData?.totalPages || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Network className="h-8 w-8 text-primary" />
            AI Engine Traces
          </h1>
          <p className="text-muted-foreground">Real-time AI execution traces via Langfuse</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            >
              {isFilterExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {isFilterExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Date Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <div className="flex flex-wrap gap-2">
                  {(['1h', '24h', '7d', '30d', '90d'] as DateRangePreset[]).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setSelectedPreset(preset)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        selectedPreset === preset
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {DATE_RANGE_PRESETS[preset].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(['ALL', 'SUCCESS', 'ERROR'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        selectedStatus === status
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {status === 'ALL'
                        ? 'All Statuses'
                        : status === 'SUCCESS'
                          ? 'Success'
                          : 'Errors'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Agent Type Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Agent Type</label>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'QA_AGENT', 'CLASSIFIER_AGENT', 'DRAFTING_AGENT', 'WORKFLOW'].map(
                    (type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedAgentType(type)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          selectedAgentType === type
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {type === 'ALL' ? 'All Types' : AGENT_TYPE_CONFIG[type]?.label || type}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Search */}
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by trace ID, user ID, session ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Traces</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : formatNumber(totalCount)}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                '...'
              ) : (
                <>
                  {traces.length > 0
                    ? (
                        (traces.filter((t) => t.status === 'SUCCESS').length / traces.length) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Successful traces</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : traces.filter((t) => t.status === 'ERROR').length}
            </div>
            <p className="text-xs text-muted-foreground">Failed traces</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                '...'
              ) : (
                <>
                  {traces.length > 0 && traces.some((t) => t.duration)
                    ? formatDuration(
                        traces
                          .filter((t) => t.duration)
                          .reduce((sum, t) => sum + (t.duration || 0), 0) /
                          traces.filter((t) => t.duration).length,
                      )
                    : '-'}
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Average execution time</p>
          </CardContent>
        </Card>
      </div>

      {/* Traces List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent AI Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {traces.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No traces found for the selected filters.</p>
              <p className="text-sm mt-2">Try adjusting the date range or filters.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Agent
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        User
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Tokens
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Duration
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
                    {traces.map((trace) => (
                      <tr key={trace.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          {trace.status === 'SUCCESS' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-xs">
                            <div className="font-medium truncate">{trace.name}</div>
                            <div className="text-xs text-muted-foreground truncate font-mono">
                              {trace.id.slice(0, 8)}...
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${AGENT_TYPE_CONFIG[trace.agentType]?.color || AGENT_TYPE_CONFIG.UNKNOWN.color}`}
                          >
                            {AGENT_TYPE_CONFIG[trace.agentType]?.label || trace.agentType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="text-muted-foreground">{trace.userId || '-'}</div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {trace.usage ? (
                            <div>
                              <div>{formatNumber(trace.usage.totalTokens)}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(trace.usage.totalCost)}
                              </div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm">{formatDuration(trace.duration)}</td>
                        <td className="py-3 px-4 text-sm">
                          <div>
                            <div>{formatRelativeTime(trace.timestamp)}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDateTime(trace.timestamp)}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/admin/ai/traces/${trace.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalCount)}{' '}
                    of {formatNumber(totalCount)} traces
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className="hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => router.push('/admin/analytics/tokens')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Analytics</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View detailed token usage and cost analytics
            </p>
          </CardContent>
        </Card>

        <Card
          className="hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => router.push('/admin/system-health')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Monitor AI Engine and system status</p>
          </CardContent>
        </Card>

        <Card
          className="hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => router.push('/admin/users')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Activity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View user activity and AI usage attribution
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
