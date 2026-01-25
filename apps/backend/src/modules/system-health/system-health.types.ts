/**
 * System Health Types
 *
 * Defines the types for system health monitoring including service status,
 * Temporal metrics, and error tracking information.
 */

export enum ServiceStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

export interface SystemHealthResponse {
  status: ServiceStatus;
  timestamp: string;
  services: Record<string, ServiceHealth>;
  errors: ErrorTrackingStatus;
  uptime: number;
}

export interface ServiceHealth {
  status: ServiceStatus;
  latency?: number;
  error?: string;
  lastCheck?: string;
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
