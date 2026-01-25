import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ApiKeysService } from './services/api-keys.service';
import { ApiKey } from './entities/api-key.entity';
import {
  CreateApiKeyInput,
  UpdateApiKeyInput,
  CreateApiKeyResponse,
  ValidateApiKeyInput,
  ValidateApiKeyResponse,
} from './dto/api-key.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

/**
 * ApiKeys Resolver
 *
 * Provides GraphQL mutations and queries for API key management.
 * All operations require authentication except validateApiKey.
 */
@Resolver(() => ApiKey)
@UseGuards(GqlAuthGuard)
export class ApiKeysResolver {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  /**
   * Create a new API key
   * Returns the raw key (only shown once) and the created entity
   */
  @Mutation(() => CreateApiKeyResponse, {
    description: 'Create a new API key. The raw key is only shown once.',
  })
  async createApiKey(
    @Args('input') input: CreateApiKeyInput,
    @Context() context: { req: { user: { id: string } } },
  ): Promise<CreateApiKeyResponse> {
    const userId = context.req.user.id;
    const { entity, rawKey } = await this.apiKeysService.create(userId, input);

    return {
      id: entity.id,
      rawKey,
      keyPrefix: entity.keyPrefix,
      name: entity.name,
      scopes: entity.scopes,
      rateLimitPerMinute: entity.rateLimitPerMinute ?? 60,
      status: entity.status,
      expiresAt: entity.expiresAt,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Update an API key
   */
  @Mutation(() => ApiKey, {
    description:
      'Update an existing API key (name, scopes, rate limit, expiration)',
  })
  async updateApiKey(
    @Args('id', { type: () => String }) id: string,
    @Args('input') input: UpdateApiKeyInput,
    @Context() context: { req: { user: { id: string } } },
  ): Promise<ApiKey> {
    const userId = context.req.user.id;
    const key = await this.apiKeysService.update(id, input);

    // Ensure user can only update their own keys
    if (key.userId !== userId) {
      throw new Error('Access denied');
    }

    return key;
  }

  /**
   * Revoke an API key
   */
  @Mutation(() => ApiKey, {
    description: 'Revoke an API key. This action cannot be undone.',
  })
  async revokeApiKey(
    @Args('id', { type: () => String }) id: string,
    @Context() context: { req: { user: { id: string } } },
  ): Promise<ApiKey> {
    const userId = context.req.user.id;
    const key = await this.apiKeysService.revoke(id);

    // Ensure user can only revoke their own keys
    if (key.userId !== userId) {
      throw new Error('Access denied');
    }

    return key;
  }

  /**
   * Delete an API key
   */
  @Mutation(() => Boolean, {
    description: 'Delete an API key permanently. This action cannot be undone.',
  })
  async deleteApiKey(
    @Args('id', { type: () => String }) id: string,
    @Context() context: { req: { user: { id: string } } },
  ): Promise<boolean> {
    const userId = context.req.user.id;
    const key = await this.apiKeysService.findById(id);

    // Ensure user can only delete their own keys
    if (key.userId !== userId) {
      throw new Error('Access denied');
    }

    return this.apiKeysService.delete(id);
  }

  /**
   * Validate an API key (public endpoint for external services)
   */
  @Public()
  @Query(() => ValidateApiKeyResponse, {
    description: 'Validate an API key and check if it has the required scopes',
  })
  async validateApiKey(
    @Args('input') input: ValidateApiKeyInput,
  ): Promise<ValidateApiKeyResponse> {
    const result = await this.apiKeysService.validateWithScopes(input);

    return {
      isValid: result.isValid,
      apiKeyId: result.apiKey?.id ?? null,
      userId: result.apiKey?.userId ?? null,
      scopes: result.apiKey?.scopes ?? null,
      status: result.apiKey?.status ?? null,
      message: result.message,
    };
  }

  /**
   * Get all API keys for the current user
   */
  @Query(() => [ApiKey], {
    description: 'Get all API keys for the current user',
  })
  async myApiKeys(
    @Context() context: { req: { user: { id: string } } },
  ): Promise<ApiKey[]> {
    const userId = context.req.user.id;
    return this.apiKeysService.findByUserId(userId);
  }
}
