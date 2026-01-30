import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

// Entities
import { User } from '../modules/users/entities/user.entity';
import { UserSession } from '../modules/users/entities/user-session.entity';
import { RoleEntity, UserRoleEntity } from '../modules/authorization/entities';
import { LegalDocument } from '../modules/documents/entities/legal-document.entity';
import { LegalAnalysis } from '../modules/documents/entities/legal-analysis.entity';
import { LegalRuling } from '../modules/documents/entities/legal-ruling.entity';
import { LegalQuery } from '../modules/queries/entities/legal-query.entity';
import { AuditLog } from '../modules/audit-log/entities/audit-log.entity';
import { UserPreferences } from '../modules/user-preferences/entities/user-preferences.entity';

// Modules
import { EncryptionModule } from '../shared/encryption/encryption.module';

import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

/**
 * Standalone module for seeding that doesn't require the full app
 * This allows running seeds without starting the full NestJS application
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'password'),
        database: configService.get<string>('DB_DATABASE', 'legal_ai_db'),
        entities: [
          User,
          UserSession,
          RoleEntity,
          UserRoleEntity,
          LegalDocument,
          LegalAnalysis,
          LegalRuling,
          LegalQuery,
          AuditLog,
          UserPreferences,
        ],
        synchronize: true, // Enable for dev seeding
      }),
      inject: [ConfigService],
    }),
    EncryptionModule, // Required for encrypting TOTP secrets in seed data
    SeedModule,
  ],
})
class SeedAppModule {}

/**
 * CLI entry point for database seeding
 *
 * Usage:
 *   npx ts-node src/seeds/seed.command.ts           # Seed if database is empty
 *   npx ts-node src/seeds/seed.command.ts --clean   # Clear and re-seed
 *   npx ts-node src/seeds/seed.command.ts --status  # Check seeding status
 */
async function bootstrap() {
  const logger = new Logger('SeedCommand');
  const args = process.argv.slice(2);

  const shouldClean = args.includes('--clean') || args.includes('-c');
  const showStatus = args.includes('--status') || args.includes('-s');
  const showHelp = args.includes('--help') || args.includes('-h');

  if (showHelp) {
    console.log(`
Database Seeding CLI

Usage:
  npx ts-node src/seeds/seed.command.ts [options]

Options:
  --clean, -c     Clear existing data before seeding
  --status, -s    Show current database seeding status
  --help, -h      Show this help message

Examples:
  npx ts-node src/seeds/seed.command.ts           # Seed if database is empty
  npx ts-node src/seeds/seed.command.ts --clean   # Clear and re-seed
  npx ts-node src/seeds/seed.command.ts --status  # Check seeding status
    `);
    process.exit(0);
  }

  logger.log('Initializing seed application...');

  const app = await NestFactory.createApplicationContext(SeedAppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const seedService = app.get(SeedService);

  try {
    if (showStatus) {
      const isSeeded = await seedService.isSeeded();
      const stats = await seedService.getStats();

      logger.log('=== Database Status ===');
      logger.log(`Seeded: ${isSeeded ? 'Yes' : 'No'}`);
      logger.log(`Users: ${stats.users}`);
      logger.log(`User Preferences: ${stats.userPreferences}`);
      logger.log(`Sessions: ${stats.sessions}`);
      logger.log(`Documents: ${stats.documents}`);
      logger.log(`Analyses: ${stats.analyses}`);
      logger.log(`Rulings: ${stats.rulings}`);
      logger.log(`Queries: ${stats.queries}`);
      logger.log(`Audit Logs: ${stats.auditLogs}`);
      logger.log('=======================');
    } else {
      await seedService.seed(shouldClean);
    }

    logger.log('Seed command completed successfully');
  } catch (error) {
    logger.error('Seed command failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }

  process.exit(0);
}

bootstrap();
