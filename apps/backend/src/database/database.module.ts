import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Database Module - Centralized TypeORM configuration
 *
 * This module is Global, meaning it only needs to be imported once in AppModule.
 * All other modules can use TypeOrmModule.forFeature() without additional imports.
 *
 * Environment Configuration:
 * - Local development: DB_HOST=localhost (default in .env)
 * - Docker: DB_HOST=postgres (overridden in docker-compose.yml)
 *
 * Note: ConfigModule must be loaded before this module (it is global in AppModule).
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      // Explicitly type as postgres string literal to avoid driver resolution issues
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'legal_ai_db',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
      extra: {
        max: 20,
        idleTimeoutMillis: 30000,
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
