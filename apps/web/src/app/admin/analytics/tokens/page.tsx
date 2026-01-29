'use client';

import { useState, useEffect } from 'react';
import { useCustom } from '@refinedev/core';
import {
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  Coins,
  AlertTriangle,
  Download,
  Calendar,
  Users,
  Activity,
  Zap,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@legal/ui';
import { Button } from '@legal/ui';
import { format as formatDateFormat, subDays, startOfDay, startOfMonth } from 'date-fns';

// Types for the analytics data
interface DashboardAnalyticsInput {
  startDate?: string;
  endDate?: string;
  period?: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
}

interface TokenUsageAnalytics {
  allTimeTokens: number;
  allTimeCost: number;
  thisMonthTokens: number;
  thisMonthCost: number;
  todayTokens: number;
  todayCost: number;
  avgTokensPerQuery: number;
  trend: TokenUsageTrend[];
  userLeaderboard: UserTokenUsage[];
  byOperation: TokenUsageByOperation[];
  anomalies: UsageAnomaly[];
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
}

interface TokenUsageTrend {
  timestamp: string;
  tokens: number;
  cost: number;
  requests: number;
  changePercentage?: number;
}

interface UserTokenUsage {
  userId: string;
  userEmail?: string;
  userName?: string;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  avgTokensPerRequest: number;
  periodStart: string;
  periodEnd: string;
}

interface TokenUsageByOperation {
  operationType: string;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  tokenPercentage: number;
  costPercentage: number;
  avgTokensPerRequest: number;
}

interface UsageAnomaly {
  userId?: string;
  userEmail?: string;
  detectedAt: string;
  anomalyType: 'SPIKE' | 'UNUSUAL_PATTERN' | 'HIGH_CONSUMER';
  description: string;
  tokenCount: number;
  expectedValue: number;
  deviationPercentage: number;
}

// Date range presets
type DateRangePreset = 'today' | '7d' | '30d' | '90d' | 'thisMonth' | 'thisYear' | 'custom';

interface DateRangePresetConfig {
  label: string;
  getValue: () => { startDate: Date; endDate: Date };
}

const DATE_RANGE_PRESETS: Record<DateRangePreset, DateRangePresetConfig> = {
  today: {
    label: 'Today',
    getValue: () => ({
      startDate: startOfDay(new Date()),
      endDate: new Date(),
    }),
  },
  '7d': {
    label: 'Last 7 Days',
    getValue: () => ({
      startDate: subDays(new Date(), 7),
      endDate: new Date(),
    }),
  },
  '30d': {
    label: 'Last 30 Days',
    getValue: () => ({
      startDate: subDays(new Date(), 30),
      endDate: new Date(),
    }),
  },
  '90d': {
    label: 'Last 90 Days',
    getValue: () => ({
      startDate: subDays(new Date(), 90),
      endDate: new Date(),
    }),
  },
  thisMonth: {
    label: 'This Month',
    getValue: () => ({
      startDate: startOfMonth(new Date()),
      endDate: new Date(),
    }),
  },
  thisYear: {
    label: 'This Year',
    getValue: () => ({
      startDate: new Date(new Date().getFullYear(), 0, 1),
      endDate: new Date(),
    }),
  },
  custom: {
    label: 'Custom',
    getValue: () => ({
      startDate: subDays(new Date(), 30),
      endDate: new Date(),
    }),
  },
};

// Chart colors
const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

// Utility functions
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatPercentage(value: number): string {
  return value.toFixed(1) + '%';
}

function formatDate(dateStr: string): string {
  return formatDateFormat(new Date(dateStr), 'MMM d, yyyy');
}

function formatDateTime(dateStr: string): string {
  return formatDateFormat(new Date(dateStr), 'MMM d, HH:mm');
}

// Operation type display names
const OPERATION_LABELS: Record<string, string> = {
  DOCUMENT_GENERATION: 'Document Generation',
  QUESTION_ANSWERING: 'Q&A',
  RULING_SEARCH: 'Ruling Search',
  CASE_CLASSIFICATION: 'Case Classification',
  EMBEDDING_GENERATION: 'Embeddings',
  SEMANTIC_SEARCH: 'Semantic Search',
  RAG_QUESTION_ANSWERING: 'RAG Q&A',
};

export default function TokenAnalyticsPage() {
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Get date range based on selected preset
  const getDateRange = () => {
    if (selectedPreset === 'custom' && customStartDate && customEndDate) {
      return {
        startDate: new Date(customStartDate).toISOString(),
        endDate: new Date(customEndDate).toISOString(),
      };
    }
    const { startDate, endDate } = DATE_RANGE_PRESETS[selectedPreset].getValue();
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  // Fetch token usage analytics
  const { query, result } = useCustom<TokenUsageAnalytics>({
    url: '',
    method: 'get',
    config: {
      query: {
        operation: 'tokenUsageAnalytics',
        args: {
          input: {
            ...getDateRange(),
          },
        },
        fields: [
          'allTimeTokens',
          'allTimeCost',
          'thisMonthTokens',
          'thisMonthCost',
          'todayTokens',
          'todayCost',
          'avgTokensPerQuery',
          'trend { timestamp tokens cost requests changePercentage }',
          'userLeaderboard { userId userEmail userName totalTokens totalCost requestCount avgTokensPerRequest }',
          'byOperation { operationType totalTokens totalCost requestCount tokenPercentage costPercentage avgTokensPerRequest }',
          'anomalies { userId userEmail detectedAt anomalyType description tokenCount expectedValue deviationPercentage }',
          'periodStart',
          'periodEnd',
          'generatedAt',
        ],
      },
    },
    queryOptions: {
      enabled: true,
      refetchOnWindowFocus: false,
      refetchInterval: 30000, // Auto-refresh every 30 seconds
    },
  });

  const { data: analytics } = result;
  const { refetch, isLoading } = query;

  useEffect(() => {
    if (analytics) {
      setLastRefresh(new Date());
    }
  }, [analytics]);

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = async (format: 'csv' | 'json') => {
    const data = analytics;
    if (!data) return;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `token-usage-${formatDateFormat(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Generate CSV for user leaderboard
      const headers = [
        'User',
        'Email',
        'Total Tokens',
        'Total Cost',
        'Requests',
        'Avg Tokens/Request',
      ];
      const rows = data.userLeaderboard.map((u) => [
        u.userName || 'N/A',
        u.userEmail || 'N/A',
        u.totalTokens.toString(),
        u.totalCost.toFixed(4),
        u.requestCount.toString(),
        u.avgTokensPerRequest.toString(),
      ]);
      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `token-usage-${formatDateFormat(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Prepare chart data
  const trendChartData =
    analytics?.trend?.map((t) => ({
      date: formatDateFormat(new Date(t.timestamp), 'MMM d'),
      tokens: t.tokens,
      cost: t.cost,
      requests: t.requests,
      change: t.changePercentage,
    })) || [];

  const operationPieData =
    analytics?.byOperation?.map((op) => ({
      name: OPERATION_LABELS[op.operationType] || op.operationType,
      value: op.totalTokens,
      cost: op.totalCost,
      requests: op.requestCount,
      percentage: op.tokenPercentage,
      fill: COLORS[Object.keys(OPERATION_LABELS).indexOf(op.operationType) % COLORS.length],
    })) || [];

  const userLeaderboardData = analytics?.userLeaderboard?.slice(0, 10) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Coins className="h-8 w-8 text-amber-500" />
            Token Usage Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive AI token consumption metrics and cost analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(
              ['today', '7d', '30d', '90d', 'thisMonth', 'thisYear', 'custom'] as DateRangePreset[]
            ).map((preset) => (
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
          {selectedPreset === 'custom' && (
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <label className="text-sm">From:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm">To:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                />
              </div>
              <Button size="sm" onClick={handleRefresh}>
                Apply
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* All-Time Tokens */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All-Time Tokens</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : formatNumber(analytics?.allTimeTokens || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total cost: {isLoading ? '...' : formatCurrency(analytics?.allTimeCost || 0)}
            </p>
          </CardContent>
        </Card>

        {/* This Month */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : formatNumber(analytics?.thisMonthTokens || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Cost: {isLoading ? '...' : formatCurrency(analytics?.thisMonthCost || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : formatNumber(analytics?.todayTokens || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Cost: {isLoading ? '...' : formatCurrency(analytics?.todayCost || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Avg Per Query */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Per Query</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : formatNumber(analytics?.avgTokensPerQuery || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Tokens per query</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Token Usage Trend */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Token Usage Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trendChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendChartData}>
                  <defs>
                    <linearGradient id="tokensGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name?: string) => {
                      if (name === 'cost') return formatCurrency(value ?? 0);
                      if (name === 'tokens' || name === 'requests') return formatNumber(value ?? 0);
                      return value ?? 0;
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="tokens"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#tokensGradient)"
                    name="Tokens"
                  />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Cost ($)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Operation Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Operation Type</CardTitle>
          </CardHeader>
          <CardContent>
            {operationPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={operationPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label={(props: any) => `${props.name}: ${props.percentage?.toFixed(0) || 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {operationPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value?: number) => formatNumber(value || 0)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No operation data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost by Operation */}
        <Card>
          <CardHeader>
            <CardTitle>Cost by Operation</CardTitle>
          </CardHeader>
          <CardContent>
            {operationPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={operationPieData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="category" dataKey="name" />
                  <YAxis type="number" />
                  <Tooltip formatter={(value?: number) => formatCurrency(value || 0)} />
                  <Bar dataKey="cost" fill="#10b981" name="Cost ($)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No cost data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Users by Token Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Rank
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    User
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Tokens
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Cost
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Requests
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Avg Tokens/Req
                  </th>
                </tr>
              </thead>
              <tbody>
                {userLeaderboardData.map((user, index) => (
                  <tr key={user.userId} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm font-medium">{index + 1}</td>
                    <td className="py-3 px-4 text-sm">
                      <div>
                        <div className="font-medium">{user.userName || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.userEmail || user.userId}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      {formatNumber(user.totalTokens)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      {formatCurrency(user.totalCost)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      {formatNumber(user.requestCount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      {formatNumber(user.avgTokensPerRequest)}
                    </td>
                  </tr>
                ))}
                {userLeaderboardData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No user data available for this period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Usage Anomalies */}
      {analytics?.anomalies && analytics.anomalies.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Usage Anomalies Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.anomalies.map((anomaly, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-background rounded-lg border border-amber-200 dark:border-amber-800"
                >
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{anomaly.anomalyType.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(anomaly.detectedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{anomaly.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="text-red-600">
                        Actual: {formatNumber(anomaly.tokenCount)} tokens
                      </span>
                      <span className="text-green-600">
                        Expected: {formatNumber(anomaly.expectedValue)} tokens
                      </span>
                      <span className="text-amber-600">
                        Deviation: {formatPercentage(anomaly.deviationPercentage)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operation Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Operation Breakdown Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Operation
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Requests
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Tokens
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Token %
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Cost
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Cost %
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Avg Tokens/Req
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics?.byOperation?.map((op) => (
                  <tr key={op.operationType} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm">
                      {OPERATION_LABELS[op.operationType] || op.operationType}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      {formatNumber(op.requestCount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">{formatNumber(op.totalTokens)}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      {formatPercentage(op.tokenPercentage)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">{formatCurrency(op.totalCost)}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      {formatPercentage(op.costPercentage)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      {formatNumber(op.avgTokensPerRequest)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  );
}
