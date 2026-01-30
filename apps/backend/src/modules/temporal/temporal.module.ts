/**
 * Temporal Module
 *
 * Provides integration with Temporal workflow orchestration platform.
 * Configures Temporal client connection and provides workflow execution services.
 */

import { DynamicModule, Module, Provider, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  TEMPORAL_MODULE_OPTIONS,
  TEMPORAL_ENV_KEYS,
  TEMPORAL_DEFAULTS,
} from './temporal.constants';
import { TemporalService } from './temporal.service';
import { TemporalWorkerService } from './temporal.worker';
import { TemporalMetricsService } from './temporal-metrics.service';
import { TemporalObservabilityService } from './temporal-observability.service';
import { TemporalMetricsController } from './temporal-metrics.controller';
import { TemporalWorkerStatusController } from './temporal-worker-status.controller';
import { TemporalResolver } from './temporal.resolver';
import { SaosModule } from '../../infrastructure/anti-corruption/saos/saos.module';
import { IsapModule } from '../../infrastructure/anti-corruption/isap/isap.module';
import { DocumentsModule } from '../documents/documents.module';
import { DocumentGenerationStarter } from './workflows/document/document-generation.starter';
import { PdfExportStarter } from './workflows/document/pdf-export.starter';
import { EmailSendingStarter } from './workflows/notification/email-sending.starter';
import { RulingIndexingStarter } from './workflows/billing/ruling-indexing.starter';
import { RulingBackfillStarter } from './workflows/billing/ruling-backfill.starter';
import { RulingIndexingSchedulerService } from './workflows/billing/ruling-scheduler.service';
import { WebhookDeliveryStarter } from './workflows/webhook/webhook-delivery.starter';
import { WebhookReplayStarter } from './workflows/webhook/webhook-replay.starter';
import { ChatCleanupStarter } from './workflows/chat/chat-cleanup.starter';
import { ChatCleanupSchedulerService } from './workflows/chat/chat-cleanup-scheduler.service';
import { AuditLogModule } from '../audit-log/audit-log.module';
import type {
  TemporalModuleAsyncOptions,
  TemporalModuleOptions,
  TemporalModuleConfig,
} from './temporal.interfaces';

/**
 * Temporal Module Configuration Provider
 *
 * Creates the module options from environment variables or provided config.
 */
const temporalOptionsProvider: Provider = {
  provide: TEMPORAL_MODULE_OPTIONS,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): TemporalModuleOptions => ({
    clusterUrl: configService.get<string>(
      TEMPORAL_ENV_KEYS.CLUSTER_URL,
      TEMPORAL_DEFAULTS.CLUSTER_URL,
    ),
    namespace: configService.get<string>(
      TEMPORAL_ENV_KEYS.NAMESPACE,
      TEMPORAL_DEFAULTS.NAMESPACE,
    ),
    clientTimeout: configService.get<number>(
      TEMPORAL_ENV_KEYS.CLIENT_TIMEOUT,
      TEMPORAL_DEFAULTS.CLIENT_TIMEOUT,
    ),
    taskQueue: configService.get<string>(
      TEMPORAL_ENV_KEYS.TASK_QUEUE,
      TEMPORAL_DEFAULTS.TASK_QUEUE,
    ),
    tlsEnabled:
      configService.get<string>(TEMPORAL_ENV_KEYS.TLS_ENABLED, 'false') ===
      'true',
    serverName: configService.get<string>(TEMPORAL_ENV_KEYS.SERVER_NAME),
    serverRootCaCertPath: configService.get<string>(
      TEMPORAL_ENV_KEYS.SERVER_ROOT_CA_CERT_PATH,
    ),
    clientCertPath: configService.get<string>(
      TEMPORAL_ENV_KEYS.CLIENT_CERT_PATH,
    ),
    clientPrivateKeyPath: configService.get<string>(
      TEMPORAL_ENV_KEYS.CLIENT_PRIVATE_KEY_PATH,
    ),
  }),
};

/**
 * Temporal Module
 *
 * NestJS module for Temporal workflow orchestration integration.
 *
 * @example
 * ```typescript
 * // Import with default configuration (from environment variables)
 * import { TemporalModule } from './modules/temporal';
 *
 * @Module({
 *   imports: [TemporalModule],
 * })
 * export class MyModule {}
 *
 * // Import with custom configuration
 * @Module({
 *   imports: [
 *     TemporalModule.forRoot({
 *       clusterUrl: 'temporal.example.com:7233',
 *       namespace: 'production',
 *       taskQueue: 'my-task-queue',
 *     }),
 *   ],
 * })
 * export class MyCustomModule {}
 *
 * // Import with async configuration
 * @Module({
 *   imports: [
 *     TemporalModule.forRootAsync({
 *       imports: [ConfigModule],
 *       useFactory: (configService: ConfigService) => ({
 *         clusterUrl: configService.get('TEMPORAL_URL'),
 *         namespace: configService.get('TEMPORAL_NAMESPACE'),
 *       }),
 *       inject: [ConfigService],
 *     }),
 *   ],
 * })
 * export class MyAsyncModule {}
 * ```
 */
@Module({})
export class TemporalModule {
  /**
   * Register Temporal module with synchronous configuration
   *
   * @param options - Module configuration options
   * @returns Dynamic module
   */
  static forRoot(options: TemporalModuleConfig): DynamicModule {
    const optionsProvider: Provider = {
      provide: TEMPORAL_MODULE_OPTIONS,
      useValue: options,
    };

    return {
      module: TemporalModule,
      imports: [
        ConfigModule,
        AuditLogModule,
        SaosModule,
        IsapModule,
        forwardRef(() => DocumentsModule),
      ],
      controllers: [TemporalMetricsController, TemporalWorkerStatusController],
      providers: [
        optionsProvider,
        TemporalMetricsService,
        TemporalObservabilityService,
        TemporalService,
        TemporalWorkerService,
        TemporalResolver,
        DocumentGenerationStarter,
        PdfExportStarter,
        EmailSendingStarter,
        RulingIndexingStarter,
        RulingBackfillStarter,
        RulingIndexingSchedulerService,
        WebhookDeliveryStarter,
        WebhookReplayStarter,
        ChatCleanupStarter,
        ChatCleanupSchedulerService,
      ],
      exports: [
        TemporalService,
        TemporalWorkerService,
        TemporalMetricsService,
        TemporalObservabilityService,
        TemporalResolver,
        DocumentGenerationStarter,
        PdfExportStarter,
        EmailSendingStarter,
        RulingIndexingStarter,
        RulingBackfillStarter,
        RulingIndexingSchedulerService,
        WebhookDeliveryStarter,
        WebhookReplayStarter,
        ChatCleanupStarter,
        ChatCleanupSchedulerService,
      ],
      global: true,
    };
  }

  /**
   * Register Temporal module with asynchronous configuration
   *
   * @param options - Async module configuration options
   * @returns Dynamic module
   */
  static forRootAsync(options: TemporalModuleAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: TemporalModule,
      imports: [
        ConfigModule,
        AuditLogModule,
        SaosModule,
        IsapModule,
        ...(options.imports || []),
      ],
      controllers: [TemporalMetricsController, TemporalWorkerStatusController],
      providers: [
        ...asyncProviders,
        TemporalMetricsService,
        TemporalObservabilityService,
        TemporalService,
        TemporalWorkerService,
        TemporalResolver,
        DocumentGenerationStarter,
        PdfExportStarter,
        EmailSendingStarter,
        RulingIndexingStarter,
        RulingBackfillStarter,
        RulingIndexingSchedulerService,
        WebhookDeliveryStarter,
        WebhookReplayStarter,
        ChatCleanupStarter,
        ChatCleanupSchedulerService,
      ],
      exports: [
        TemporalService,
        TemporalWorkerService,
        TemporalMetricsService,
        TemporalObservabilityService,
        TemporalResolver,
        DocumentGenerationStarter,
        PdfExportStarter,
        EmailSendingStarter,
        RulingIndexingStarter,
        RulingBackfillStarter,
        RulingIndexingSchedulerService,
        WebhookDeliveryStarter,
        WebhookReplayStarter,
        ChatCleanupStarter,
        ChatCleanupSchedulerService,
      ],
      global: true,
    };
  }

  /**
   * Register Temporal module with default configuration from environment variables
   *
   * @returns Dynamic module
   */
  static forRootWithDefaults(): DynamicModule {
    return {
      module: TemporalModule,
      imports: [
        ConfigModule,
        AuditLogModule,
        SaosModule,
        IsapModule,
        forwardRef(() => DocumentsModule),
      ],
      controllers: [TemporalMetricsController, TemporalWorkerStatusController],
      providers: [
        temporalOptionsProvider,
        TemporalMetricsService,
        TemporalObservabilityService,
        TemporalService,
        TemporalWorkerService,
        TemporalResolver,
        DocumentGenerationStarter,
        PdfExportStarter,
        EmailSendingStarter,
        RulingIndexingStarter,
        RulingBackfillStarter,
        RulingIndexingSchedulerService,
        WebhookDeliveryStarter,
        WebhookReplayStarter,
        ChatCleanupStarter,
        ChatCleanupSchedulerService,
      ],
      exports: [
        TemporalService,
        TemporalWorkerService,
        TemporalMetricsService,
        TemporalObservabilityService,
        TemporalResolver,
        DocumentGenerationStarter,
        PdfExportStarter,
        EmailSendingStarter,
        RulingIndexingStarter,
        RulingBackfillStarter,
        RulingIndexingSchedulerService,
        WebhookDeliveryStarter,
        WebhookReplayStarter,
        ChatCleanupStarter,
        ChatCleanupSchedulerService,
      ],
      global: true,
    };
  }

  /**
   * Create async providers for the module
   *
   * @param options - Async module configuration options
   * @returns Array of providers
   */
  private static createAsyncProviders(
    options: TemporalModuleAsyncOptions,
  ): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: TEMPORAL_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ];
    }

    // For useClass or useExisting patterns
    return [];
  }
}
