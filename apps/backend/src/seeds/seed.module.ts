import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { User } from '../modules/users/entities/user.entity';
import { UserSession } from '../modules/users/entities/user-session.entity';
import { LegalDocument } from '../modules/documents/entities/legal-document.entity';
import { LegalAnalysis } from '../modules/documents/entities/legal-analysis.entity';
import { LegalRuling } from '../modules/documents/entities/legal-ruling.entity';
import { LegalQuery } from '../modules/queries/entities/legal-query.entity';
import { AuditLog } from '../modules/audit-log/entities/audit-log.entity';
import { UserPreferences } from '../modules/user-preferences/entities/user-preferences.entity';

// Service
import { SeedService } from './seed.service';

/**
 * SeedModule
 *
 * Module for database seeding functionality.
 * Imports all entity repositories needed for seeding.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserSession,
      LegalDocument,
      LegalAnalysis,
      LegalRuling,
      LegalQuery,
      AuditLog,
      UserPreferences,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
