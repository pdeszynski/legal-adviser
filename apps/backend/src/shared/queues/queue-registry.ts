import { DynamicModule, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { QueueName } from './base/queue-names';

/**
 * Queue Registry
 *
 * Helper module for registering queues with consistent configuration.
 * This ensures all queues use the same Redis connection and settings.
 */
@Module({})
export class QueueRegistry {
  /**
   * Register a queue with the application
   *
   * @param queueName - The name of the queue (from QUEUE_NAMES)
   * @returns DynamicModule for importing into other modules
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     QueueRegistry.registerQueue(QUEUE_NAMES.DOCUMENT.GENERATION),
   *   ],
   * })
   * export class DocumentModule {}
   * ```
   */
  static registerQueue(queueName: QueueName): DynamicModule {
    return BullModule.registerQueue({
      name: queueName,
    });
  }

  /**
   * Register multiple queues at once
   *
   * @param queueNames - Array of queue names to register
   * @returns DynamicModule for importing into other modules
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     QueueRegistry.registerQueues([
   *       QUEUE_NAMES.DOCUMENT.GENERATION,
   *       QUEUE_NAMES.DOCUMENT.EXPORT_PDF,
   *     ]),
   *   ],
   * })
   * export class DocumentModule {}
   * ```
   */
  static registerQueues(queueNames: QueueName[]): DynamicModule {
    return BullModule.registerQueue(
      ...queueNames.map((name) => ({
        name,
      })),
    );
  }

  /**
   * Get Redis configuration from environment
   *
   * @param configService - NestJS ConfigService instance
   * @returns Redis connection configuration
   */
  static getRedisConfig(configService: ConfigService) {
    return {
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
      password: configService.get<string>('REDIS_PASSWORD'),
      db: configService.get<number>('REDIS_DB', 0),
    };
  }
}

