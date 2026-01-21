import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { GqlThrottlerGuard } from './shared/throttler/gql-throttler.guard';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
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
// Strict Layered Architecture - new modules following DDD patterns
import { PresentationModule } from './presentation/presentation.module';
// Interceptors
import { AuditLoggingInterceptor } from './shared/interceptors/audit-logging.interceptor';
import { EventDispatcherModule } from './shared/events/event-dispatcher.module';

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
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<string>('NODE_ENV') !== 'production', // true for dev, false for prod
        extra: {
          max: 20, // Connection pool max size
          idleTimeoutMillis: 30000,
        },
      }),
      inject: [ConfigService],
    }),
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
    DocumentsModule,
    AuditLogModule,
    QueriesModule,
    NotificationsModule,
    // Domain Event System - Event dispatcher for reliable event delivery
    EventDispatcherModule,
    // Strict Layered Architecture Module (Presentation -> Application -> Domain <- Infrastructure)
    PresentationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply throttler guard globally to all GraphQL and HTTP endpoints
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
    // Apply audit logging interceptor globally to capture all GraphQL mutations
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLoggingInterceptor,
    },
  ],
})
export class AppModule {}
