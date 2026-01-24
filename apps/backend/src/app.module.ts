import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
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
import { QueueRegistry } from './shared/queues';
import { CsrfModule } from './shared/csrf';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // GraphQL Module - Code-First approach per constitution
    // Subscriptions enabled via graphql-ws for real-time document status updates
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
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
    // Asynchronous task processing (AI document generation, PDF exports, email notifications)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: QueueRegistry.getRedisConfig(configService),
      }),
      inject: [ConfigService],
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
