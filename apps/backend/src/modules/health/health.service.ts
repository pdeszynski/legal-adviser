import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { AiClientService } from '../../shared/ai-client/ai-client.service';
import { QUEUE_NAMES } from '../../shared/queues/base/queue-names';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    aiEngine: ServiceHealth;
  };
  uptime: number;
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectQueue(QUEUE_NAMES.DOCUMENT.GENERATION)
    private readonly documentQueue: Queue,
    private readonly aiClientService: AiClientService,
  ) {}

  async getHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    const results = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkAiEngine(),
    ]);

    const [dbResult, redisResult, aiEngineResult] = results;

    const health: HealthCheckResult = {
      status: this.calculateOverallHealth(results),
      timestamp: new Date().toISOString(),
      services: {
        database: this.extractServiceHealth(dbResult),
        redis: this.extractServiceHealth(redisResult),
        aiEngine: this.extractServiceHealth(aiEngineResult),
      },
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };

    return health;
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      await this.dataSource.query('SELECT 1');

      return {
        status: 'healthy',
        latency: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);

      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const client = this.documentQueue.client;
      await client.ping();

      return {
        status: 'healthy',
        latency: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('Redis health check failed', error);

      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkAiEngine(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      await this.aiClientService.healthCheck();

      return {
        status: 'healthy',
        latency: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('AI Engine health check failed', error);

      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private calculateOverallHealth(
    results: PromiseSettledResult<ServiceHealth>[],
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const healthyCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 'healthy',
    ).length;

    if (healthyCount === results.length) {
      return 'healthy';
    }

    if (healthyCount > 0) {
      return 'degraded';
    }

    return 'unhealthy';
  }

  private extractServiceHealth(
    result: PromiseSettledResult<ServiceHealth>,
  ): ServiceHealth {
    if (result.status === 'fulfilled') {
      return result.value;
    }

    return {
      status: 'unhealthy',
      error: 'Check failed',
    };
  }
}
