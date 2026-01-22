import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from './entities/api-key.entity';
import { ApiKeysService } from './services/api-keys.service';
import { ApiKeysResolver } from './api-keys.resolver';

/**
 * API Keys Module
 *
 * Handles API key management for programmatic access.
 *
 * Bounded Context: API Keys
 * - Aggregates: ApiKey
 * - Services: ApiKeysService
 * - Resolvers: ApiKeysResolver
 *
 * Features:
 * - Create API keys with hashed storage
 * - Manage scopes and permissions
 * - Set rate limits per key
 * - Configure expiration dates
 * - Revoke and delete keys
 */
@Module({
  imports: [TypeOrmModule.forFeature([ApiKey])],
  providers: [ApiKeysService, ApiKeysResolver],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
