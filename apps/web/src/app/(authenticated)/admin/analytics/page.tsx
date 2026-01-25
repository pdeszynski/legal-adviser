'use client';

import React from 'react';
import { useCustom, useTranslate } from '@refinedev/core';
import { AnalyticsSkeleton } from '@/components/analytics';

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

// Demo Request Analytics Types
interface DemoRequestMetrics {
  totalRequests: number;
  newRequests: number;
  contactedRequests: number;
  scheduledRequests: number;
  qualifiedRequests: number;
  closedRequests: number;
  newToContactedRate: number;
  contactedToScheduledRate: number;
  overallConversionRate: number;
  periodStart: string;
  periodEnd: string;
}

interface DemoRequestStatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

interface DemoRequestLeadSource {
  source: string | null;
  medium: string | null;
  count: number;
  percentage: number;
}

interface DemoRequestCompanySizeDistribution {
  companySize: string;
  count: number;
  percentage: number;
}

interface DemoRequestIndustryBreakdown {
  industry: string;
  count: number;
  percentage: number;
}

interface DemoRequestTopUseCase {
  useCase: string;
  count: number;
}

interface DemoRequestTimeSeriesPoint {
  timestamp: string;
  count: number;
}

interface DemoRequestResponseTimeMetrics {
  avgHoursToContact: number;
  medianHoursToContact: number;
  totalContacted: number;
  calculatedAt: string;
}

interface DemoRequestAnalytics {
  metrics: DemoRequestMetrics;
  statusBreakdown: DemoRequestStatusBreakdown[];
  leadSources: DemoRequestLeadSource[];
  companySizeDistribution: DemoRequestCompanySizeDistribution[];
  industryBreakdown: DemoRequestIndustryBreakdown[];
  topUseCases: DemoRequestTopUseCase[];
  requestsOverTime: DemoRequestTimeSeriesPoint[];
  responseTimeMetrics: DemoRequestResponseTimeMetrics;
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

  // Fetch demo request analytics
  const { query: demoQuery, result: demoResult } = useCustom<DemoRequestAnalytics>({
    url: '/demoRequestAnalytics',
    method: 'get',
  });

  const { data: demoData, isLoading: demoIsLoading, isError: demoIsError } = demoQuery;
  const demoAnalytics = demoResult?.data;

  if (isLoading) {
    return <AnalyticsSkeleton />;
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

  // Format numbers
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

  // Funnel stages for demo request conversion
  const funnelStages = demoAnalytics
    ? [
        { name: 'Submitted', count: demoAnalytics.metrics.totalRequests, color: 'bg-blue-500' },
        {
          name: 'Contacted',
          count: demoAnalytics.metrics.contactedRequests,
          color: 'bg-indigo-500',
        },
        {
          name: 'Scheduled',
          count: demoAnalytics.metrics.scheduledRequests,
          color: 'bg-purple-500',
        },
        { name: 'Qualified', count: demoAnalytics.metrics.qualifiedRequests, color: 'bg-pink-500' },
        { name: 'Closed', count: demoAnalytics.metrics.closedRequests, color: 'bg-green-500' },
      ]
    : [];

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
      {/* Demo Request Analytics */}
      {demoAnalytics && (
        <>
          {/* Demo Request Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Demo Requests"
              value={formatNumber(demoAnalytics.metrics.totalRequests)}
              icon="📊"
            />
            <MetricCard
              title="New Requests"
              value={formatNumber(demoAnalytics.metrics.newRequests)}
              icon="🆕"
            />
            <MetricCard
              title="Contacted"
              value={formatNumber(demoAnalytics.metrics.contactedRequests)}
              icon="📞"
            />
            <MetricCard
              title="Closed Deals"
              value={formatNumber(demoAnalytics.metrics.closedRequests)}
              icon="💼"
            />
          </div>

          {/* Demo Request Funnel */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="font-semibold leading-none tracking-tight">Sales Funnel</h3>
              <p className="text-sm text-muted-foreground">Demo request conversion pipeline</p>
            </div>
            <div className="p-6 pt-0 space-y-3">
              {funnelStages.map((stage, index) => (
                <div key={stage.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.name}</span>
                    <span>{formatNumber(stage.count)}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stage.color} transition-all`}
                      style={{
                        width: `${
                          demoAnalytics.metrics.totalRequests > 0
                            ? (stage.count / demoAnalytics.metrics.totalRequests) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 pt-0 border-t grid gap-4 md:grid-cols-3 text-sm">
              <div>
                <p className="text-muted-foreground">New → Contacted</p>
                <p className="font-medium">
                  {formatPercentage(demoAnalytics.metrics.newToContactedRate)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Contacted → Scheduled</p>
                <p className="font-medium">
                  {formatPercentage(demoAnalytics.metrics.contactedToScheduledRate)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Overall Conversion</p>
                <p className="font-medium">
                  {formatPercentage(demoAnalytics.metrics.overallConversionRate)}
                </p>
              </div>
            </div>
          </div>

          {/* Response Time & Lead Sources */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight">Response Time</h3>
                <p className="text-sm text-muted-foreground">Average time to contact new leads</p>
              </div>
              <div className="p-6 pt-0 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Average</p>
                  <p className="text-2xl font-bold">
                    {demoAnalytics.responseTimeMetrics.avgHoursToContact.toFixed(1)}h
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Median</p>
                  <p className="text-2xl font-bold">
                    {demoAnalytics.responseTimeMetrics.medianHoursToContact.toFixed(1)}h
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight">Lead Sources</h3>
                <p className="text-sm text-muted-foreground">Where demo requests come from</p>
              </div>
              {demoAnalytics.leadSources.length > 0 ? (
                <div className="p-6 pt-0 space-y-2">
                  {demoAnalytics.leadSources.slice(0, 5).map((source, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {source.source || source.medium || 'Direct'}
                      </span>
                      <div className="flex items-center gap-4">
                        <span>{formatNumber(source.count)}</span>
                        <span className="font-medium">{formatPercentage(source.percentage)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 pt-0 text-sm text-muted-foreground">
                  No lead source data available yet.
                </div>
              )}
            </div>
          </div>

          {/* Company Size & Industry Breakdown */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight">Company Size</h3>
                <p className="text-sm text-muted-foreground">Distribution by company size</p>
              </div>
              {demoAnalytics.companySizeDistribution.length > 0 ? (
                <div className="p-6 pt-0 space-y-2">
                  {demoAnalytics.companySizeDistribution.map((size) => (
                    <div
                      key={size.companySize}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">{size.companySize}</span>
                      <div className="flex items-center gap-4">
                        <span>{formatNumber(size.count)}</span>
                        <span className="font-medium">{formatPercentage(size.percentage)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 pt-0 text-sm text-muted-foreground">
                  No company size data available yet.
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight">Industries</h3>
                <p className="text-sm text-muted-foreground">Distribution by industry</p>
              </div>
              {demoAnalytics.industryBreakdown.length > 0 ? (
                <div className="p-6 pt-0 space-y-2">
                  {demoAnalytics.industryBreakdown.map((industry) => (
                    <div
                      key={industry.industry}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {industry.industry
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                      <div className="flex items-center gap-4">
                        <span>{formatNumber(industry.count)}</span>
                        <span className="font-medium">{formatPercentage(industry.percentage)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 pt-0 text-sm text-muted-foreground">
                  No industry data available yet.
                </div>
              )}
            </div>
          </div>

          {/* Top Use Cases */}
          {demoAnalytics.topUseCases.length > 0 && (
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight">Top Use Cases</h3>
                <p className="text-sm text-muted-foreground">
                  Most mentioned use cases in demo requests
                </p>
              </div>
              <div className="p-6 pt-0 space-y-2">
                {demoAnalytics.topUseCases.map((useCase, index) => (
                  <div key={index} className="flex items-start justify-between text-sm gap-4">
                    <span className="text-muted-foreground flex-1">{useCase.useCase}</span>
                    <span className="font-medium whitespace-nowrap">
                      {formatNumber(useCase.count)} mentions
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
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
