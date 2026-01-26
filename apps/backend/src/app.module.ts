import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiClientModule } from './shared/ai-client/ai-client.module';
import { StreamingModule } from './shared/streaming';
import { CsrfModule } from './shared/csrf';
import { EncryptionModule } from './shared/encryption/encryption.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { QueriesModule } from './modules/queries/queries.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthModule } from './modules/health/health.module';
import { BillingModule } from './modules/billing/billing.module';
import { UsageTrackingModule } from './modules/usage-tracking/usage-tracking.module';
import { UserPreferencesModule } from './modules/user-preferences/user-preferences.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { BackupModule } from './modules/backup/backup.module';
import { DatabaseModule } from './database/database.module';
import { CollaborationModule } from './modules/collaboration/collaboration.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { SystemHealthModule } from './modules/system-health/system-health.module';
// Temporal - Workflow orchestration for long-running processes
import { TemporalModule } from './modules/temporal/temporal.module';
import { HubSpotModule } from './modules/integrations/hubspot/hubspot.module';
import { DemoRequestModule } from './modules/demo-request/demo-request.module';
import { InterestRequestModule } from './modules/interest-request/interest-request.module';
// Authorization - Role-Based Access Control following DDD
import { AuthorizationModule } from './modules/authorization/authorization.module';
// Persisted Queries - Automatic Persisted Queries (APQ) support
import {
  PersistedQueriesModule,
  createPersistedQueriesPlugin,
} from './modules/persisted-queries';
// Strict Layered Architecture - new modules following DDD patterns
import { PresentationModule } from './presentation/presentation.module';
// Interceptors
import { AuditLoggingInterceptor } from './shared/interceptors/audit-logging.interceptor';
import { EventDispatcherModule } from './shared/events/event-dispatcher.module';
// Error tracking
import { SentryModule } from './common/sentry/sentry.module';
// Structured logging
import { LoggerModule } from './shared/logger';
import { LoggingInterceptor } from './shared/logger';
// Exception filters
import { GqlAuthExceptionFilter } from './modules/auth/exceptions';
// Inject the PersistedQueriesService to use in GraphQL module
import { PersistedQueriesService } from './modules/persisted-queries';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Persisted Queries Module - Must be imported before GraphQLModule
    PersistedQueriesModule,
    // Encryption Module - Global module for TOTP secret encryption
    EncryptionModule,
    // GraphQL Module - Code-First approach per constitution
    // Subscriptions enabled via graphql-ws for real-time document status updates
    // Includes Automatic Persisted Queries (APQ) support
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [PersistedQueriesService],
      useFactory: (persistedQueriesService: PersistedQueriesService) => ({
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        sortSchema: true,
        playground: process.env.NODE_ENV !== 'production',
        introspection: process.env.NODE_ENV !== 'production',
        // Pass Express request and response to GraphQL context
        context: ({
          req,
          res,
        }: {
          req: Record<string, any>;
          res: Record<string, any>;
        }) => ({ req, res }),
        // Enable GraphQL subscriptions via WebSocket (graphql-ws protocol)
        subscriptions: {
          'graphql-ws': {
            path: '/graphql',
            onConnect: () => {
              // Connection established - could add auth validation here
              console.log('GraphQL subscription client connected');
            },
            onDisconnect: () => {
              console.log('GraphQL subscription client disconnected');
            },
          },
        },
        // Apollo Server plugins for persisted queries support
        plugins: [createPersistedQueriesPlugin(persistedQueriesService)],
      }),
    }),
    // Database Module - Centralized TypeORM configuration
    DatabaseModule,
    // Event-driven communication between modules
    EventEmitterModule.forRoot({
      // Use wildcards to support event patterns like 'user.*'
      wildcard: true,
      // Set a reasonable max listeners limit
      maxListeners: 20,
      // Enable verbose error logging in development
      verboseMemoryLeak: process.env.NODE_ENV !== 'production',
      // Ignore case when matching event names
      ignoreErrors: false,
    }),
    // Task scheduling for periodic jobs (ruling indexing, etc.)
    ScheduleModule.forRoot(),
    // Rate limiting to protect against abuse - configurable per-IP and per-user limits
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            // Default rate limit: 100 requests per minute per IP
            ttl: configService.get<number>('THROTTLE_TTL') || 60000,
            limit: configService.get<number>('THROTTLE_LIMIT') || 100,
          },
          {
            name: 'strict',
            // Strict rate limit for expensive operations: 10 requests per minute per IP
            ttl: 60000,
            limit: 10,
          },
        ],
      }),
      inject: [ConfigService],
    }),
    AiClientModule,
    StreamingModule,
    // CSRF Protection for GraphQL mutations (double-submit cookie pattern)
    CsrfModule,
    UsersModule,
    AuthModule,
    BillingModule,
    DocumentsModule,
    AuditLogModule,
    QueriesModule,
    NotificationsModule,
    UsageTrackingModule,
    UserPreferencesModule,
    AnalyticsModule,
    ApiKeysModule,
    BackupModule,
    CollaborationModule,
    SubscriptionsModule,
    SystemSettingsModule,
    WebhooksModule,
    SystemHealthModule,
    // Temporal - Workflow orchestration
    TemporalModule.forRootWithDefaults(),
    // HubSpot Integration for lead management
    HubSpotModule,
    // Demo Request Module - Public demo request submissions
    DemoRequestModule,
    // Interest Request Module - Public early access interest submissions
    InterestRequestModule,
    // Authorization - Role-Based Access Control
    AuthorizationModule,
    // Domain Event System - Event dispatcher for reliable event delivery
    EventDispatcherModule,
    // Error tracking with Sentry
    SentryModule,
    // Structured logging with Winston
    LoggerModule.forRoot({
      level: process.env.LOG_LEVEL || 'info',
      json: process.env.NODE_ENV === 'production',
      colorize: process.env.NODE_ENV !== 'production',
    }),
    // Health check endpoints
    HealthModule,
    // Strict Layered Architecture Module (Presentation -> Application -> Domain <- Infrastructure)
    PresentationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Throttler is no longer applied globally to avoid issues with dashboard requests
    // Use @UseGuards(GqlThrottlerGuard) on specific routes that need rate limiting (e.g., login)
    // Apply audit logging interceptor globally to capture all GraphQL mutations
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLoggingInterceptor,
    },
    // Apply structured logging interceptor globally
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Apply GraphQL authentication exception filter globally
    // This ensures proper HTTP status codes (401, 403) are returned for auth errors
    {
      provide: APP_FILTER,
      useClass: GqlAuthExceptionFilter,
    },
  ],
})
export class AppModule {}
