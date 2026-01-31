import {
  Resolver,
  Mutation,
  Query,
  Args,
  ID,
  Field,
  Int,
  ObjectType,
  InputType,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ApiKey, ApiKeyScope, ApiKeyStatus } from './entities/api-key.entity';
import { ApiKeysService } from './services/api-keys.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

/**
 * Input for admin creating an API key for a user
 */
@InputType('AdminCreateApiKeyInput')
export class AdminCreateApiKeyInput {
  @Field(() => ID)
  userId: string;

  @Field(() => String)
  name: string;

  @Field(() => [ApiKeyScope])
  scopes: ApiKeyScope[];

  @Field(() => Int, { nullable: true, defaultValue: 60 })
  rateLimitPerMinute?: number | null;

  @Field(() => String, { nullable: true })
  expiresAt?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;
}

/**
 * Response when admin creates a new API key
 */
@ObjectType('AdminCreateApiKeyResponse')
export class AdminCreateApiKeyResponse {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  rawKey: string;

  @Field(() => String)
  keyPrefix: string;

  @Field(() => String)
  name: string;

  @Field(() => [ApiKeyScope])
  scopes: ApiKeyScope[];

  @Field(() => Int)
  rateLimitPerMinute: number;

  @Field(() => ApiKeyStatus)
  status: ApiKeyStatus;

  @Field(() => String, { nullable: true })
  expiresAt: string | null;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => ID)
  userId: string;

  @Field(() => String)
  createdAt: string;

  @Field(() => String)
  updatedAt: string;
}

/**
 * Input for admin revoking an API key
 */
@InputType('AdminRevokeApiKeyInput')
export class AdminRevokeApiKeyInput {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  reason?: string | null;
}

/**
 * Bulk revoke response
 */
@ObjectType('BulkRevokeApiKeysResponse')
export class BulkRevokeApiKeysResponse {
  @Field(() => Int)
  success: number;

  @Field(() => Int)
  failed: number;

  @Field(() => [String], { nullable: true })
  errors: string[] | null;
}

/**
 * ApiKeys Admin Resolver
 *
 * Admin-only operations for API key management.
 * All operations require authentication and admin role.
 *
 * Operations:
 * - adminCreateApiKey: Create an API key for any user
 * - adminRevokeApiKey: Revoke any API key
 * - adminBulkRevokeApiKeys: Bulk revoke API keys
 * - apiKeysByUser: Get all API keys for a specific user
 */
@Resolver(() => ApiKey)
@UseGuards(GqlAuthGuard, AdminGuard)
export class ApiKeysAdminResolver {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  /**
   * Mutation: Create a new API key for any user
   * Returns the raw key (only shown once) and the created entity
   */
  @Mutation(() => AdminCreateApiKeyResponse, {
    description:
      'Create a new API key for any user. The raw key is only shown once. (admin only)',
  })
  async adminCreateApiKey(
    @Args('input') input: AdminCreateApiKeyInput,
  ): Promise<AdminCreateApiKeyResponse> {
    const { entity, rawKey } = await this.apiKeysService.create(input.userId, {
      name: input.name,
      scopes: input.scopes,
      rateLimitPerMinute: input.rateLimitPerMinute,
      expiresAt: input.expiresAt,
      description: input.description,
    });

    return {
      id: entity.id,
      rawKey,
      keyPrefix: entity.keyPrefix,
      name: entity.name,
      scopes: entity.scopes,
      rateLimitPerMinute: entity.rateLimitPerMinute ?? 60,
      status: entity.status,
      expiresAt: entity.expiresAt?.toISOString() ?? null,
      description: entity.description,
      userId: entity.userId,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  /**
   * Mutation: Revoke any API key
   */
  @Mutation(() => ApiKey, {
    description:
      'Revoke any API key. This action cannot be undone. (admin only)',
  })
  async adminRevokeApiKey(
    @Args('input') input: AdminRevokeApiKeyInput,
  ): Promise<ApiKey> {
    return this.apiKeysService.revoke(input.id);
  }

  /**
   * Mutation: Bulk revoke API keys
   */
  @Mutation(() => BulkRevokeApiKeysResponse, {
    description: 'Revoke multiple API keys at once. (admin only)',
  })
  async adminBulkRevokeApiKeys(
    @Args('ids', { type: () => [ID] }) ids: string[],
  ): Promise<BulkRevokeApiKeysResponse> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const id of ids) {
      try {
        await this.apiKeysService.revoke(id);
        success++;
      } catch (error) {
        failed++;
        errors.push(
          `${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return {
      success,
      failed,
      errors: errors.length > 0 ? errors : null,
    };
  }

  /**
   * Query: Get all API keys for a specific user
   */
  @Query(() => [ApiKey], {
    description: 'Get all API keys for a specific user (admin only)',
  })
  async apiKeysByUser(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<ApiKey[]> {
    return this.apiKeysService.findByUserId(userId);
  }
}
