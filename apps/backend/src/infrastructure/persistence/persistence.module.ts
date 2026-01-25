import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  LegalDocumentOrmEntity,
  TwoFactorAuthOrmEntity,
  DemoRequestOrmEntity,
} from './entities';
import {
  LegalDocumentRepository,
  TwoFactorAuthRepository,
  DemoRequestRepository,
} from './repositories';

/**
 * Persistence Module
 *
 * Provides database access and repository implementations.
 * This module wires up the Infrastructure layer components.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      LegalDocumentOrmEntity,
      TwoFactorAuthOrmEntity,
      DemoRequestOrmEntity,
    ]),
  ],
  providers: [
    // Register the repository implementations
    LegalDocumentRepository,
    TwoFactorAuthRepository,
    DemoRequestRepository,
    // Provide the repositories under their interface tokens for dependency injection
    {
      provide: 'ILegalDocumentRepository',
      useClass: LegalDocumentRepository,
    },
    {
      provide: 'ITwoFactorAuthRepository',
      useClass: TwoFactorAuthRepository,
    },
    {
      provide: 'IDemoRequestRepository',
      useClass: DemoRequestRepository,
    },
  ],
  exports: [
    'ILegalDocumentRepository',
    LegalDocumentRepository,
    'ITwoFactorAuthRepository',
    TwoFactorAuthRepository,
    'IDemoRequestRepository',
    DemoRequestRepository,
  ],
})
export class PersistenceModule {}
