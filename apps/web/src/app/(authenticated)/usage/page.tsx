'use client';

import { useState } from 'react';
import { useTranslate, useCustom } from '@refinedev/core';
import {
  LineChart,
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
} from 'recharts';

interface DailyUsageData {
  date: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
}

interface UsageStatsResponse {
  dailyUsage: DailyUsageData[];
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  periodStart: string;
  periodEnd: string;
}

interface OperationBreakdown {
  operationType: string;
  requestCount: number;
  tokenCount: number;
  cost: number;
}

interface UsageStatsFull {
  breakdownByOperation?: OperationBreakdown[];
}

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

export default function UsageDashboardPage() {
  const translate = useTranslate();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Calculate date range based on selected period
  const getStartDate = () => {
    const now = new Date();
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return startDate.toISOString();
  };

  // Fetch daily usage data
  const { query: dailyQuery, result: dailyUsageData } = useCustom<UsageStatsResponse>({
    url: '',
    method: 'get',
    config: {
      query: {
        operation: 'myDailyUsage',
        args: {
          startDate: getStartDate(),
        },
        fields: [
          'dailyUsage { date totalRequests totalTokens totalCost }',
          'totalRequests',
          'totalTokens',
          'totalCost',
          'periodStart',
          'periodEnd',
        ],
      },
    },
    queryOptions: {
      enabled: true,
      refetchOnWindowFocus: false,
    },
  });
  const { data: _, isLoading: isLoadingDaily } = dailyQuery;

  // Fetch usage stats with breakdown
  const { query: statsQuery, result: statsData } = useCustom<UsageStatsFull>({
    url: '',
    method: 'get',
    config: {
      query: {
        operation: 'myUsageStats',
        args: {
          query: {
            startDate: getStartDate(),
          },
        },
        fields: [
          'totalRequests',
          'totalTokens',
          'totalCost',
          'breakdownByOperation { operationType requestCount tokenCount cost }',
        ],
      },
    },
    queryOptions: {
      enabled: true,
      refetchOnWindowFocus: false,
    },
  });
  const { data: __, isLoading: isLoadingStats } = statsQuery;

  const dailyUsage = dailyUsageData?.data;
  const stats = statsData?.data;

  // Transform daily usage data for charts
  const chartData =
    dailyUsage?.dailyUsage?.map((day) => ({
      ...day,
      formattedDate: formatDate(day.date),
    })) || [];

  // Transform breakdown data for pie chart
  const pieChartData =
    stats?.breakdownByOperation?.map((op) => ({
      name: op.operationType.replace(/_/g, ' '),
      value: op.cost,
      requests: op.requestCount,
      tokens: op.tokenCount,
    })) || [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{translate('usage.title') || 'Usage Dashboard'}</h1>
        <p className="text-gray-600">
          {translate('usage.subtitle') || 'Track your AI usage and costs'}
        </p>
      </div>
      {/* Period Selector */}
      <div className="mb-6 flex gap-2">
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
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Requests */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                {translate('usage.totalRequests') || 'Total Requests'}
              </p>
              <p className="text-3xl font-bold mt-2">
                {isLoadingDaily ? '...' : formatNumber(dailyUsage?.totalRequests || 0)}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Tokens */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                {translate('usage.totalTokens') || 'Total Tokens'}
              </p>
              <p className="text-3xl font-bold mt-2">
                {isLoadingDaily ? '...' : formatNumber(dailyUsage?.totalTokens || 0)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Cost */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                {translate('usage.totalCost') || 'Total Cost'}
              </p>
              <p className="text-3xl font-bold mt-2">
                {isLoadingDaily ? '...' : formatCurrency(dailyUsage?.totalCost || 0)}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Usage Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            {translate('usage.dailyUsage') || 'Daily Usage'}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="tokens" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="cost" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="tokens"
                type="monotone"
                dataKey="totalTokens"
                stroke="#3b82f6"
                name={translate('usage.tokens') || 'Tokens'}
                strokeWidth={2}
              />
              <Line
                yAxisId="cost"
                type="monotone"
                dataKey="totalCost"
                stroke="#10b981"
                name={translate('usage.cost') || 'Cost ($)'}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cost by Operation Type */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            {translate('usage.costByOperation') || 'Cost by Operation'}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value?: number) => (value ? formatCurrency(value) : '')} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Tokens by Day Bar Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">
          {translate('usage.tokensByDay') || 'Tokens by Day'}
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="totalTokens"
              fill="#3b82f6"
              name={translate('usage.tokens') || 'Tokens'}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Operation Breakdown Table */}
      {stats?.breakdownByOperation && stats.breakdownByOperation.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            {translate('usage.operationBreakdown') || 'Operation Breakdown'}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {translate('usage.operation') || 'Operation'}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    {translate('usage.requests') || 'Requests'}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    {translate('usage.tokens') || 'Tokens'}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    {translate('usage.cost') || 'Cost'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.breakdownByOperation.map((op) => (
                  <tr key={op.operationType} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{op.operationType.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      {formatNumber(op.requestCount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">{formatNumber(op.tokenCount)}</td>
                    <td className="py-3 px-4 text-sm text-right">{formatCurrency(op.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Empty State */}
      {!isLoadingDaily && !isLoadingStats && chartData.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-gray-600 text-lg">
            {translate('usage.noData') || 'No usage data available for this period'}
          </p>
        </div>
      )}
    </div>
  );
}
