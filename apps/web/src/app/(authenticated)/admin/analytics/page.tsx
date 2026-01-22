'use client';

import React from 'react';
import { useCustom, useTranslate } from '@refinedev/core';

interface UserGrowthMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  adminUsers: number;
  growthRate: number;
  periodStart: string;
  periodEnd: string;
}

interface DocumentMetrics {
  totalDocuments: number;
  completedDocuments: number;
  draftDocuments: number;
  failedDocuments: number;
  generatingDocuments: number;
  successRate: number;
  periodStart: string;
  periodEnd: string;
}

interface DocumentTypeDistribution {
  documentType: string;
  count: number;
  percentage: number;
}

interface QueryMetrics {
  totalQueries: number;
  uniqueUsers: number;
  avgQueriesPerUser: number;
  totalCitations: number;
  avgCitationsPerQuery: number;
  periodStart: string;
  periodEnd: string;
}

interface AiUsageMetrics {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  avgCostPerRequest: number;
  avgTokensPerRequest: number;
  periodStart: string;
  periodEnd: string;
}

interface AiOperationBreakdown {
  operationType: string;
  requestCount: number;
  totalTokens: number;
  totalCost: number;
  costPercentage: number;
}

interface SystemHealthMetrics {
  documentSuccessRate: number;
  avgResponseTime: number;
  activeSessions: number;
  timestamp: string;
}

interface AnalyticsDashboard {
  userGrowth: UserGrowthMetrics;
  documents: DocumentMetrics;
  documentTypeDistribution: DocumentTypeDistribution[];
  queries: QueryMetrics;
  aiUsage: AiUsageMetrics;
  aiOperationBreakdown: AiOperationBreakdown[];
  systemHealth: SystemHealthMetrics;
  generatedAt: string;
}

export default function AnalyticsPage() {
  const translate = useTranslate();

  const { query, result } = useCustom<AnalyticsDashboard>({
    url: '/analyticsDashboard',
    method: 'get',
  });

  const { data, isLoading, isError } = query;
  const dashboard = result?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-red-500">Failed to load analytics data.</p>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Platform-wide analytics and metrics</p>
      </div>

      {/* User Growth Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={formatNumber(dashboard.userGrowth.totalUsers)}
          icon="👥"
          trend={
            dashboard.userGrowth.growthRate > 0 ? (
              <span className="text-green-600">
                +{formatPercentage(dashboard.userGrowth.growthRate)}
              </span>
            ) : (
              <span className="text-red-600">
                {formatPercentage(dashboard.userGrowth.growthRate)}
              </span>
            )
          }
          trendLabel="vs. previous period"
        />
        <MetricCard
          title="Active Users"
          value={formatNumber(dashboard.userGrowth.activeUsers)}
          icon="✅"
        />
        <MetricCard
          title="New Users"
          value={formatNumber(dashboard.userGrowth.newUsers)}
          icon="🆕"
        />
        <MetricCard
          title="Admin Users"
          value={formatNumber(dashboard.userGrowth.adminUsers)}
          icon="🔐"
        />
      </div>

      {/* Document Metrics */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">Document Generation</h3>
          <p className="text-sm text-muted-foreground">
            Document generation metrics and success rates
          </p>
        </div>
        <div className="p-6 pt-0 grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Documents</p>
            <p className="text-2xl font-bold">{formatNumber(dashboard.documents.totalDocuments)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold">
              {formatNumber(dashboard.documents.completedDocuments)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Success Rate</p>
            <p className="text-2xl font-bold">
              {formatPercentage(dashboard.documents.successRate)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Generating</p>
            <p className="text-2xl font-bold">
              {formatNumber(dashboard.documents.generatingDocuments)}
            </p>
          </div>
        </div>
        {dashboard.documentTypeDistribution.length > 0 && (
          <div className="p-6 pt-0 border-t">
            <p className="text-sm font-medium mb-3">Document Type Distribution</p>
            <div className="space-y-2">
              {dashboard.documentTypeDistribution.map((type) => (
                <div key={type.documentType} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{type.documentType}</span>
                  <div className="flex items-center gap-4">
                    <span>{formatNumber(type.count)}</span>
                    <span className="font-medium">{formatPercentage(type.percentage)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Query Metrics */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">Query Activity</h3>
          <p className="text-sm text-muted-foreground">Legal question and answer metrics</p>
        </div>
        <div className="p-6 pt-0 grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Queries</p>
            <p className="text-2xl font-bold">{formatNumber(dashboard.queries.totalQueries)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Unique Users</p>
            <p className="text-2xl font-bold">{formatNumber(dashboard.queries.uniqueUsers)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Queries/User</p>
            <p className="text-2xl font-bold">{dashboard.queries.avgQueriesPerUser.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Citations</p>
            <p className="text-2xl font-bold">{formatNumber(dashboard.queries.totalCitations)}</p>
          </div>
        </div>
      </div>

      {/* AI Usage Metrics */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">AI Usage & Costs</h3>
          <p className="text-sm text-muted-foreground">Token usage and cost breakdown</p>
        </div>
        <div className="p-6 pt-0 grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold">{formatNumber(dashboard.aiUsage.totalRequests)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Tokens</p>
            <p className="text-2xl font-bold">{formatNumber(dashboard.aiUsage.totalTokens)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-bold">{formatCurrency(dashboard.aiUsage.totalCost)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Cost/Request</p>
            <p className="text-2xl font-bold">
              {formatCurrency(dashboard.aiUsage.avgCostPerRequest)}
            </p>
          </div>
        </div>
        {dashboard.aiOperationBreakdown.length > 0 && (
          <div className="p-6 pt-0 border-t">
            <p className="text-sm font-medium mb-3">Operation Breakdown</p>
            <div className="space-y-2">
              {dashboard.aiOperationBreakdown.map((op) => (
                <div key={op.operationType} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {op.operationType.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-4">
                    <span>{formatNumber(op.requestCount)} reqs</span>
                    <span>{formatNumber(op.totalTokens)} tokens</span>
                    <span className="font-medium">{formatCurrency(op.totalCost)}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatPercentage(op.costPercentage)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* System Health */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">System Health</h3>
          <p className="text-sm text-muted-foreground">Platform performance indicators</p>
        </div>
        <div className="p-6 pt-0 grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Document Success Rate</p>
            <p className="text-2xl font-bold">
              {formatPercentage(dashboard.systemHealth.documentSuccessRate)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active Sessions</p>
            <p className="text-2xl font-bold">
              {formatNumber(dashboard.systemHealth.activeSessions)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Updated</p>
            <p className="text-sm font-medium">
              {new Date(dashboard.generatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">Quick Actions</h3>
            <p className="text-sm text-muted-foreground">Common admin tasks</p>
          </div>
          <div className="p-6 pt-0 space-y-2">
            <a
              href="/admin/users"
              className="block w-full rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Manage Users
            </a>
            <a
              href="/admin/audit-logs"
              className="block w-full rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              View Audit Logs
            </a>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">Data Range</h3>
            <p className="text-sm text-muted-foreground">Analytics period coverage</p>
          </div>
          <div className="p-6 pt-0">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Period Start:</dt>
                <dd className="font-medium">
                  {new Date(dashboard.userGrowth.periodStart).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Period End:</dt>
                <dd className="font-medium">
                  {new Date(dashboard.userGrowth.periodEnd).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: string;
  trend?: React.ReactNode;
  trendLabel?: string;
}

function MetricCard({ title, value, icon, trend, trendLabel }: MetricCardProps) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">{title}</h3>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {trend && trendLabel && (
          <p className="text-xs text-muted-foreground">
            {trend} {trendLabel}
          </p>
        )}
      </div>
    </div>
  );
}
