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
  UserRepository,
} from './repositories';
import { User } from '../../modules/users/entities/user.entity';

/**
 * Persistence Module
 *
 * Provides database access and repository implementations.
 * This module wires up the Infrastructure layer components.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, // Main User entity for DDD repository layer
      LegalDocumentOrmEntity,
      TwoFactorAuthOrmEntity,
      DemoRequestOrmEntity,
    ]),
  ],
  providers: [
    // Register the repository implementations
    UserRepository,
    LegalDocumentRepository,
    TwoFactorAuthRepository,
    DemoRequestRepository,
    // Provide the repositories under their interface tokens for dependency injection
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
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
    'IUserRepository',
    UserRepository,
    'ILegalDocumentRepository',
    LegalDocumentRepository,
    'ITwoFactorAuthRepository',
    TwoFactorAuthRepository,
    'IDemoRequestRepository',
    DemoRequestRepository,
  ],
})
export class PersistenceModule {}
