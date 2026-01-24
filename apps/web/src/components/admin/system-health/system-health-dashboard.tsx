'use client';

import {
  Database,
  Server,
  Cpu,
  Globe,
  Layers,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@legal/ui';

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

interface SystemHealthDashboardProps {
  data: SystemHealthResponse;
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

// Service card component
interface ServiceCardProps {
  name: string;
  service: ServiceHealth;
  icon: React.ReactNode;
}

function ServiceCard({ name, service, icon }: ServiceCardProps) {
  const normalizedStatus = normalizeStatus(service.status);

  return (
    <Card
      className={`border-l-4 ${
        normalizedStatus === 'healthy'
          ? 'border-l-green-500'
          : normalizedStatus === 'degraded'
            ? 'border-l-amber-500'
            : 'border-l-red-500'
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {name}
        </CardTitle>
        {getStatusIcon(normalizedStatus)}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <span className={`text-xl font-bold ${getStatusColor(normalizedStatus)}`}>
            {normalizedStatus.toUpperCase()}
          </span>
          {service.latency !== undefined && (
            <span className="text-sm text-muted-foreground">{service.latency}ms</span>
          )}
        </div>
        {service.error && (
          <p className="text-xs text-red-600 mt-1 truncate" title={service.error}>
            {service.error}
          </p>
        )}
        {service.lastCheck && (
          <p className="text-xs text-muted-foreground mt-1">
            Checked {new Date(service.lastCheck).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Queue card component
interface QueueCardProps {
  name: string;
  queue: QueueHealth;
  icon: React.ReactNode;
}

function QueueCard({ name, queue, icon }: QueueCardProps) {
  const total = queue.depth + queue.active + queue.delayed + queue.failed;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {name}
        </CardTitle>
        <Layers className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Waiting:</span>
            <span className="font-medium">{queue.depth}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Active:</span>
            <span className="font-medium">{queue.active}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delayed:</span>
            <span className="font-medium">{queue.delayed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Failed:</span>
            <span className="font-medium text-red-600">{queue.failed}</span>
          </div>
        </div>
        {total > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">{total}</span>
            </div>
          </div>
        )}
        {queue.lastProcessed && (
          <p className="text-xs text-muted-foreground mt-2">
            Last: {new Date(queue.lastProcessed).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function SystemHealthDashboard({ data }: SystemHealthDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Services Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Server className="h-5 w-5" />
          Service Status
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ServiceCard
            name="PostgreSQL Database"
            service={data.services.database}
            icon={<Database className="h-4 w-4 text-blue-500" />}
          />
          <ServiceCard
            name="Redis Cache"
            service={data.services.redis}
            icon={<Server className="h-4 w-4 text-red-500" />}
          />
          <ServiceCard
            name="AI Engine"
            service={data.services.aiEngine}
            icon={<Cpu className="h-4 w-4 text-purple-500" />}
          />
          <ServiceCard
            name="SAOS API"
            service={data.services.saosApi}
            icon={<Globe className="h-4 w-4 text-green-500" />}
          />
          <ServiceCard
            name="ISAP API"
            service={data.services.isapApi}
            icon={<Globe className="h-4 w-4 text-orange-500" />}
          />
        </div>
      </div>

      {/* Queues Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Queue Status
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <QueueCard
            name="Document Generation"
            queue={data.queues.documentGeneration}
            icon={<Layers className="h-4 w-4 text-blue-500" />}
          />
          <QueueCard
            name="Email"
            queue={data.queues.email}
            icon={<Layers className="h-4 w-4 text-amber-500" />}
          />
          <QueueCard
            name="Webhook"
            queue={data.queues.webhook}
            icon={<Layers className="h-4 w-4 text-green-500" />}
          />
        </div>
      </div>

      {/* Errors Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Error Tracking
        </h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold">{data.errors.totalErrors}</p>
                <p className="text-sm text-muted-foreground">Total Errors</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-amber-600">{data.errors.recentErrors}</p>
                <p className="text-sm text-muted-foreground">Recent (5min)</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p
                  className={`text-3xl font-bold ${data.errors.criticalErrors > 0 ? 'text-red-600' : ''}`}
                >
                  {data.errors.criticalErrors}
                </p>
                <p className="text-sm text-muted-foreground">Critical</p>
              </div>
            </div>

            {data.errors.lastError && (
              <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Last Error</p>
                <p className="text-xs text-muted-foreground mt-1">{data.errors.lastError.type}</p>
                <p className="text-sm mt-1 truncate" title={data.errors.lastError.message}>
                  {data.errors.lastError.message}
                </p>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>{new Date(data.errors.lastError.timestamp).toLocaleString()}</span>
                  <span>Count: {data.errors.lastError.count}</span>
                </div>
              </div>
            )}

            {data.errors.totalErrors === 0 && (
              <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-600 dark:text-green-400">No Errors</p>
                <p className="text-xs text-muted-foreground">System is running smoothly</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
