import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { ApiKey } from './entities/api-key.entity';
import { ApiKeysService } from './services/api-keys.service';
import { ApiKeysResolver } from './api-keys.resolver';
import { ApiKeysAdminResolver } from './api-keys-admin.resolver';

/**
 * API Keys Module
 *
 * Handles API key management for programmatic access.
 *
 * Bounded Context: API Keys
 * - Aggregates: ApiKey
 * - Services: ApiKeysService
 * - Resolvers: ApiKeysResolver (user operations), ApiKeysAdminResolver (admin operations)
 *
 * Features:
 * - Create API keys with hashed storage
 * - Manage scopes and permissions
 * - Set rate limits per key
 * - Configure expiration dates
 * - Revoke and delete keys
 * - Admin CRUD operations via nestjs-query
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ApiKey]),
    // nestjs-query for auto-generated CRUD resolvers (admin only)
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([ApiKey])],
      resolvers: [
        {
          DTOClass: ApiKey,
          EntityClass: ApiKey,
          enableTotalCount: true,
          enableAggregate: true,
          guards: [], // Guards applied at resolver level
          read: {
            many: { name: 'apiKeys' },
            one: { name: 'apiKey' },
          },
          create: {
            one: { name: 'createOneApiKey' },
          },
          update: {
            one: { name: 'updateOneApiKey' },
          },
          delete: {
            one: { name: 'deleteOneApiKey' },
          },
        },
      ],
    }),
  ],
  providers: [ApiKeysService, ApiKeysResolver, ApiKeysAdminResolver],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
