import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalDocumentOrmEntity } from './entities';
import { LegalDocumentRepository } from './repositories';

/**
 * Persistence Module
 *
 * Provides database access and repository implementations.
 * This module wires up the Infrastructure layer components.
 */
@Module({
  imports: [TypeOrmModule.forFeature([LegalDocumentOrmEntity])],
  providers: [
    // Register the repository implementation
    LegalDocumentRepository,
    // Provide the repository under its interface token for dependency injection
    {
      provide: 'ILegalDocumentRepository',
      useClass: LegalDocumentRepository,
    },
  ],
  exports: [
    'ILegalDocumentRepository',
    LegalDocumentRepository,
  ],
})
export class PersistenceModule {}
