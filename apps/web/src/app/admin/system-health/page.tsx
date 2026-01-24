'use client';

import { useEffect, useState } from 'react';
import { useCustom } from '@refinedev/core';
import {
  Activity,
  Database,
  Server,
  Cpu,
  Globe,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@legal/ui';
import { SystemHealthDashboard } from '@/components/admin/system-health/system-health-dashboard';

interface ServiceHealth {
  status: 'healthy' | 'HEALTHY' | 'degraded' | 'DEGRADED' | 'unhealthy' | 'UNHEALTHY';
  latency?: number;
  error?: string;
  lastCheck?: string;
}

// Normalize status from enum to lowercase
const normalizeStatus = (status: string): 'healthy' | 'degraded' | 'unhealthy' => {
  const lower = status.toLowerCase();
  if (lower === 'healthy') return 'healthy';
  if (lower === 'degraded') return 'degraded';
  return 'unhealthy';
};

interface QueueHealth {
  depth: number;
  active: number;
  delayed: number;
  failed: number;
  lastProcessed?: string;
}

interface ErrorSummary {
  message: string;
  type: string;
  timestamp: string;
  count: number;
}

interface ErrorTrackingStatus {
  totalErrors: number;
  recentErrors: number;
  criticalErrors: number;
  lastError?: ErrorSummary;
}

interface ServiceHealthStatus {
  database: ServiceHealth;
  redis: ServiceHealth;
  aiEngine: ServiceHealth;
  saosApi: ServiceHealth;
  isapApi: ServiceHealth;
}

interface QueueHealthStatus {
  documentGeneration: QueueHealth;
  email: QueueHealth;
  webhook: QueueHealth;
}

interface SystemHealthResponse {
  status: 'healthy' | 'HEALTHY' | 'degraded' | 'DEGRADED' | 'unhealthy' | 'UNHEALTHY';
  timestamp: string;
  services: ServiceHealthStatus;
  queues: QueueHealthStatus;
  errors: ErrorTrackingStatus;
  uptime: number;
}

// Format uptime to readable time
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Get status color class
function getStatusColor(status: 'healthy' | 'degraded' | 'unhealthy'): string {
  switch (status) {
    case 'healthy':
      return 'text-green-600';
    case 'degraded':
      return 'text-amber-600';
    case 'unhealthy':
      return 'text-red-600';
  }
}

// Get status background class
function getStatusBg(status: 'healthy' | 'degraded' | 'unhealthy'): string {
  switch (status) {
    case 'healthy':
      return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
    case 'degraded':
      return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800';
    case 'unhealthy':
      return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
  }
}

// Get status icon
function getStatusIcon(status: 'healthy' | 'degraded' | 'unhealthy') {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'degraded':
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    case 'unhealthy':
      return <XCircle className="h-5 w-5 text-red-600" />;
  }
}

export default function SystemHealthPage() {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState(30);

  // Fetch system health data
  const { query, result } = useCustom<SystemHealthResponse>({
    url: '',
    method: 'get',
    config: {
      query: {
        operation: 'systemHealth',
        fields: [
          'status',
          'timestamp',
          'uptime',
          'services { database { status latency error lastCheck } redis { status latency error lastCheck } aiEngine { status latency error lastCheck } saosApi { status latency error lastCheck } isapApi { status latency error lastCheck } }',
          'queues { documentGeneration { depth active delayed failed lastProcessed } email { depth active delayed failed lastProcessed } webhook { depth active delayed failed lastProcessed } }',
          'errors { totalErrors recentErrors criticalErrors lastError { message type timestamp count } }',
        ],
      },
    },
    queryOptions: {
      enabled: true,
      refetchOnWindowFocus: false,
      refetchInterval: 30000, // Auto-refresh every 30 seconds
    },
  });

  const { data: healthData, isLoading } = result;
  const { refetch } = query;

  // Update last refresh time when data changes
  useEffect(() => {
    if (healthData?.data) {
      setLastRefresh(new Date());
    }
  }, [healthData]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 30));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Manual refresh handler
  const handleRefresh = () => {
    refetch();
  };

  const data = healthData?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">
            Monitor service status, queue depths, and system errors
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

      {/* Overall Status Banner */}
      {data && (
        <Card className={`border ${getStatusBg(normalizeStatus(data.status))}`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(normalizeStatus(data.status))}
                <div>
                  <p className="font-semibold text-lg capitalize">{normalizeStatus(data.status)}</p>
                  <p className="text-sm text-muted-foreground">
                    System uptime: {formatUptime(data.uptime)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Last updated</p>
                <p className="text-sm font-medium">{lastRefresh.toLocaleTimeString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <SystemHealthDashboard data={data} />
      ) : (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Failed to load system health data</p>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {lastRefresh.toLocaleString()}
      </div>
    </div>
  );
}
