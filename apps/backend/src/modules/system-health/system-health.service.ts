import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Job, Queue } from 'bull';
import { AiClientService } from '../../shared/ai-client/ai-client.service';
import { QUEUE_NAMES } from '../../shared/queues/base/queue-names';
import { SaosAdapter } from '../../infrastructure/anti-corruption/saos/saos.adapter';
import { IsapAdapter } from '../../infrastructure/anti-corruption/isap/isap.adapter';
import {
  SystemHealthResponse,
  ServiceStatus,
  ServiceHealth,
  QueueHealth,
  ErrorTrackingStatus,
  ErrorSummary,
} from './system-health.types';

@Injectable()
export class SystemHealthService {
  private readonly logger = new Logger(SystemHealthService.name);
  private readonly startTime = Date.now();
  private errorCache: Map<
    string,
    { count: number; lastSeen: Date; message: string }
  > = new Map();

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectQueue(QUEUE_NAMES.DOCUMENT.GENERATION)
    private readonly documentQueue: Queue,
    @InjectQueue(QUEUE_NAMES.EMAIL.SEND)
    private readonly emailQueue: Queue,
    @InjectQueue(QUEUE_NAMES.WEBHOOK.DELIVER)
    private readonly webhookQueue: Queue,
    private readonly aiClientService: AiClientService,
    private readonly saosAdapter: SaosAdapter,
    private readonly isapAdapter: IsapAdapter,
  ) {}

  async getSystemHealth(): Promise<SystemHealthResponse> {
    const timestamp = new Date().toISOString();

    const [
      database,
      redis,
      aiEngine,
      saosApi,
      isapApi,
      documentGenerationQueue,
      emailQueue,
      webhookQueue,
    ] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkAiEngine(),
      this.checkSaosApi(),
      this.checkIsapApi(),
      this.getQueueHealth(this.documentQueue),
      this.getQueueHealth(this.emailQueue),
      this.getQueueHealth(this.webhookQueue),
    ]);

    const services = {
      database,
      redis,
      aiEngine,
      saosApi,
      isapApi,
    };

    const queues = {
      documentGeneration: documentGenerationQueue,
      email: emailQueue,
      webhook: webhookQueue,
    };

    const errors = this.getErrorTrackingStatus();

    return {
      status: this.calculateOverallStatus({ services, queues }),
      timestamp,
      services,
      queues,
      errors,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      await this.dataSource.query('SELECT 1');

      return {
        status: ServiceStatus.HEALTHY,
        latency: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      this.trackError('database', error);
      this.logger.error('Database health check failed', error);

      return {
        status: ServiceStatus.UNHEALTHY,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const client = this.documentQueue.client;
      await client.ping();

      return {
        status: ServiceStatus.HEALTHY,
        latency: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      this.trackError('redis', error);
      this.logger.error('Redis health check failed', error);

      return {
        status: ServiceStatus.UNHEALTHY,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
      };
    }
  }

  private async checkAiEngine(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      await this.aiClientService.healthCheck();

      return {
        status: ServiceStatus.HEALTHY,
        latency: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      this.trackError('aiEngine', error);
      this.logger.error('AI Engine health check failed', error);

      return {
        status: ServiceStatus.DEGRADED,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
      };
    }
  }

  private async checkSaosApi(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const isHealthy = await this.saosAdapter.healthCheck();

      return {
        status: isHealthy ? ServiceStatus.HEALTHY : ServiceStatus.DEGRADED,
        latency: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      this.trackError('saosApi', error);
      this.logger.warn(
        'SAOS API health check failed (external service may be down)',
        error,
      );

      return {
        status: ServiceStatus.DEGRADED,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
      };
    }
  }

  private async checkIsapApi(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const isHealthy = await this.isapAdapter.healthCheck();

      return {
        status: isHealthy ? ServiceStatus.HEALTHY : ServiceStatus.DEGRADED,
        latency: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      this.trackError('isapApi', error);
      this.logger.warn(
        'ISAP API health check failed (external service may be down)',
        error,
      );

      return {
        status: ServiceStatus.DEGRADED,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
      };
    }
  }

  private async getQueueHealth(queue: Queue): Promise<QueueHealth> {
    try {
      const [waiting, active, delayed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getDelayedCount(),
        queue.getFailedCount(),
      ]);

      // Get the last processed job timestamp
      const completedJobs = await queue.getCompleted(0, 1);
      const lastProcessed =
        completedJobs.length > 0
          ? new Date(
              (completedJobs[0] as Job).finishedOn || Date.now(),
            ).toISOString()
          : undefined;

      return {
        depth: waiting,
        active,
        delayed,
        failed,
        lastProcessed,
      };
    } catch (error) {
      this.logger.error(`Queue health check failed for ${queue.name}`, error);

      return {
        depth: 0,
        active: 0,
        delayed: 0,
        failed: 0,
      };
    }
  }

  private getErrorTrackingStatus(): ErrorTrackingStatus {
    const totalErrors = Array.from(this.errorCache.values()).reduce(
      (sum, entry) => sum + entry.count,
      0,
    );

    const recentErrors = Array.from(this.errorCache.values()).filter(
      (entry) => entry.lastSeen > new Date(Date.now() - 5 * 60 * 1000),
    ).length;

    const criticalErrors = Array.from(this.errorCache.values()).filter(
      (entry) =>
        entry.message.toLowerCase().includes('critical') ||
        entry.message.toLowerCase().includes('fatal'),
    ).length;

    let lastError: ErrorSummary | undefined;
    if (this.errorCache.size > 0) {
      const sorted = Array.from(this.errorCache.entries()).sort(
        (a, b) => b[1].lastSeen.getTime() - a[1].lastSeen.getTime(),
      );
      const [type, data] = sorted[0];
      lastError = {
        message: data.message,
        type,
        timestamp: data.lastSeen.toISOString(),
        count: data.count,
      };
    }

    return {
      totalErrors,
      recentErrors,
      criticalErrors,
      lastError,
    };
  }

  private trackError(service: string, error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const key = `${service}:${message}`;

    const existing = this.errorCache.get(key);
    if (existing) {
      existing.count++;
      existing.lastSeen = new Date();
    } else {
      this.errorCache.set(key, {
        count: 1,
        lastSeen: new Date(),
        message,
      });
    }

    // Clean old errors (older than 1 hour)
    const cutoff = Date.now() - 60 * 60 * 1000;
    for (const [key, entry] of this.errorCache.entries()) {
      if (entry.lastSeen.getTime() < cutoff) {
        this.errorCache.delete(key);
      }
    }
  }

  private calculateOverallStatus(data: {
    services: Record<string, ServiceHealth>;
    queues: Record<string, QueueHealth>;
  }): ServiceStatus {
    const allServices = Object.values(data.services);
    const healthyCount = allServices.filter(
      (s) => s.status === ServiceStatus.HEALTHY,
    ).length;

    // All core services must be healthy
    if (allServices.every((s) => s.status === ServiceStatus.HEALTHY)) {
      return ServiceStatus.HEALTHY;
    }

    // If any critical service (database, redis) is unhealthy, system is unhealthy
    if (
      data.services.database.status === ServiceStatus.UNHEALTHY ||
      data.services.redis.status === ServiceStatus.UNHEALTHY
    ) {
      return ServiceStatus.UNHEALTHY;
    }

    // External API issues result in degraded state
    return ServiceStatus.DEGRADED;
  }
}
