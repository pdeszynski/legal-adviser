'use client';

import { useEffect, useState } from 'react';
import { useCustom } from '@refinedev/core';
import {
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
} from 'recharts';
import {
  Users,
  FileText,
  MessageSquare,
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@legal/ui';
import { useDocumentMonitoring } from '@/hooks';
import { DocumentQueueMonitor, DocumentActivityFeed } from '@/components/admin';
import type { AnalyticsDashboard } from '@/generated/graphql';

// Import additional types for chart data
import type { DocumentTypeDistribution, AiOperationBreakdown } from '@/generated/graphql';

// Use generated types from admin.graphql

// Colors for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Format percentage
function formatPercentage(value: number): string {
  return value.toFixed(1) + '%';
}

export default function AdminDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Document monitoring hook with real-time updates
  const {
    queueMetrics,
    recentActivity,
    isLoading: isMonitoringLoading,
    refetch: refetchMonitoring,
  } = useDocumentMonitoring();

  // Calculate date range based on selected period
  const getStartDate = () => {
    const now = new Date();
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return startDate.toISOString();
  };

  // Fetch analytics dashboard data
  const { query, result } = useCustom<AnalyticsDashboard>({
    url: '',
    method: 'get',
    config: {
      query: {
        operation: 'analyticsDashboard',
        args: {
          input: {
            startDate: getStartDate(),
          },
        },
        fields: [
          'userGrowth { totalUsers activeUsers newUsers adminUsers growthRate periodStart periodEnd }',
          'documents { totalDocuments completedDocuments draftDocuments failedDocuments generatingDocuments successRate periodStart periodEnd }',
          'documentTypeDistribution { documentType count percentage }',
          'queries { totalQueries uniqueUsers avgQueriesPerUser totalCitations avgCitationsPerQuery periodStart periodEnd }',
          'aiUsage { totalRequests totalTokens totalCost avgCostPerRequest avgTokensPerRequest periodStart periodEnd }',
          'aiOperationBreakdown { operationType requestCount totalTokens totalCost costPercentage }',
          'systemHealth { documentSuccessRate avgResponseTime activeSessions timestamp }',
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

  const { data: dashboard } = result;
  const { refetch, isLoading } = query;

  // Update last refresh time when data changes
  useEffect(() => {
    if (dashboard) {
      setLastRefresh(new Date());
    }
  }, [dashboard]);

  // Manual refresh handler
  const handleRefresh = () => {
    refetch();
    refetchMonitoring();
  };

  const analytics = dashboard;

  // Transform document type distribution for pie chart
  const documentTypeChartData =
    analytics?.documentTypeDistribution?.map((item: DocumentTypeDistribution) => ({
      name: item.documentType,
      value: item.count,
      percentage: item.percentage,
    })) || [];

  // Transform AI operation breakdown for pie chart
  const aiOperationChartData =
    analytics?.aiOperationBreakdown?.map((item: AiOperationBreakdown) => ({
      name: item.operationType.replace(/_/g, ' '),
      value: item.totalCost,
      requests: item.requestCount,
      tokens: item.totalTokens,
      percentage: item.costPercentage,
    })) || [];

  // Calculate time until next refresh
  const [countdown, setCountdown] = useState(30);
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 30));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">System-wide statistics and real-time metrics</p>
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

      {/* Period Selector */}
      <div className="flex gap-2">
        {[
          { value: '7d' as const, label: '7 Days' },
          { value: '30d' as const, label: '30 Days' },
          { value: '90d' as const, label: '90 Days' },
        ].map((period) => (
          <button
            key={period.value}
            onClick={() => setSelectedPeriod(period.value)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              selectedPeriod === period.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Summary Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : formatNumber(analytics?.userGrowth?.totalUsers || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.userGrowth?.newUsers || 0} new this period
            </p>
            {analytics?.userGrowth?.growthRate !== undefined && (
              <div
                className={`flex items-center gap-1 text-xs mt-1 ${
                  analytics.userGrowth.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {analytics.userGrowth.growthRate >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {formatPercentage(Math.abs(analytics.userGrowth.growthRate))} growth
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Sessions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : analytics?.systemHealth?.activeSessions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.userGrowth?.activeUsers || 0} active users
            </p>
          </CardContent>
        </Card>

        {/* Documents Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : formatNumber(analytics?.documents?.totalDocuments || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.documents?.generatingDocuments || 0} generating now
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-green-600">
                {analytics?.documents?.completedDocuments || 0} completed
              </span>
              <span className="text-xs text-red-600">
                {analytics?.documents?.failedDocuments || 0} failed
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Queries Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Queries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : formatNumber(analytics?.queries?.totalQueries || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(analytics?.queries?.uniqueUsers || 0)} unique users
            </p>
            <p className="text-xs text-muted-foreground">
              {analytics?.queries?.avgQueriesPerUser?.toFixed(1) || 0} avg per user
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Token Usage and Cost Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Tokens */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : formatNumber(analytics?.aiUsage?.totalTokens || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.aiUsage?.totalRequests || 0} requests
            </p>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <span className="text-lg">$</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : formatCurrency(analytics?.aiUsage?.totalCost || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg {formatCurrency(analytics?.aiUsage?.avgCostPerRequest || 0)}/request
            </p>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading
                ? '...'
                : formatPercentage(analytics?.systemHealth?.documentSuccessRate || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Document success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Real-Time Document Monitoring */}
      <div className="grid gap-4 md:grid-cols-2">
        <DocumentQueueMonitor metrics={queueMetrics} isLoading={isMonitoringLoading} />
        <DocumentActivityFeed activity={recentActivity} isLoading={isMonitoringLoading} />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Document Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Document Types</CardTitle>
          </CardHeader>
          <CardContent>
            {documentTypeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={documentTypeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(params: any) =>
                      `${params.name}: ${params.percentage?.toFixed(0) || 0}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {documentTypeChartData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value?: number) => formatNumber(value || 0)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No document data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Cost by Operation */}
        <Card>
          <CardHeader>
            <CardTitle>AI Cost by Operation</CardTitle>
          </CardHeader>
          <CardContent>
            {aiOperationChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={aiOperationChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(params: any) =>
                      `${params.name}: ${params.percentage?.toFixed(0) || 0}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {aiOperationChartData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value?: number) => formatCurrency(value || 0)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No cost data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Document Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Document Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics?.documents ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={[
                  {
                    name: 'Completed',
                    value: analytics.documents.completedDocuments,
                    fill: '#10b981',
                  },
                  {
                    name: 'Draft',
                    value: analytics.documents.draftDocuments,
                    fill: '#f59e0b',
                  },
                  {
                    name: 'Generating',
                    value: analytics.documents.generatingDocuments,
                    fill: '#3b82f6',
                  },
                  {
                    name: 'Failed',
                    value: analytics.documents.failedDocuments,
                    fill: '#ef4444',
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value?: number) => formatNumber(value || 0)} />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              Loading...
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Operation Breakdown Table */}
      {analytics?.aiOperationBreakdown && analytics.aiOperationBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI Operation Breakdown</CardTitle>
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
                      Cost
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.aiOperationBreakdown.map((op: AiOperationBreakdown) => (
                    <tr key={op.operationType} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm">{op.operationType.replace(/_/g, ' ')}</td>
                      <td className="py-3 px-4 text-sm text-right">
                        {formatNumber(op.requestCount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        {formatNumber(op.totalTokens)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        {formatCurrency(op.totalCost)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        {formatPercentage(op.costPercentage)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  );
}
