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
import { RoleEntity, UserRoleEntity } from '../modules/authorization/entities';

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
      RoleEntity,
      UserRoleEntity,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
