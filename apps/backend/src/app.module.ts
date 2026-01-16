import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiClientModule } from './shared/ai-client/ai-client.module';
import { StreamingModule } from './shared/streaming';
import { QueueRegistry } from './shared/queues';
import { UsersModule } from './modules/users/users.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { QueriesModule } from './modules/queries/queries.module';
// Strict Layered Architecture - new modules following DDD patterns
import { PresentationModule } from './presentation/presentation.module';

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
    AiClientModule,
    StreamingModule,
    UsersModule,
    DocumentsModule,
    AuditLogModule,
    QueriesModule,
    // Strict Layered Architecture Module (Presentation -> Application -> Domain <- Infrastructure)
    PresentationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
