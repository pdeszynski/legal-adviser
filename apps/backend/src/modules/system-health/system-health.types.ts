/**
 * System Health Types
 *
 * Defines the types for system health monitoring including service status,
 * queue metrics, and error tracking information.
 */

export enum ServiceStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

export interface SystemHealthResponse {
  status: ServiceStatus;
  timestamp: string;
  services: ServiceHealthStatus;
  queues: QueueHealthStatus;
  errors: ErrorTrackingStatus;
  uptime: number;
}

export interface ServiceHealthStatus {
  database: ServiceHealth;
  redis: ServiceHealth;
  aiEngine: ServiceHealth;
  saosApi: ServiceHealth;
  isapApi: ServiceHealth;
}

export interface ServiceHealth {
  status: ServiceStatus;
  latency?: number;
  error?: string;
  lastCheck?: string;
}

export interface QueueHealthStatus {
  documentGeneration: QueueHealth;
  email: QueueHealth;
  webhook: QueueHealth;
}

export interface QueueHealth {
  depth: number;
  active: number;
  delayed: number;
  failed: number;
  lastProcessed?: string;
}

export interface ErrorTrackingStatus {
  totalErrors: number;
  recentErrors: number;
  criticalErrors: number;
  lastError?: ErrorSummary;
}

export interface ErrorSummary {
  message: string;
  type: string;
  timestamp: string;
  count: number;
}
