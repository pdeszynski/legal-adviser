import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiClientModule } from './shared/ai-client/ai-client.module';
import { QueueRegistry } from './shared/queues';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
