import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ApiKey, ApiKeyScope, ApiKeyStatus } from '../entities/api-key.entity';
import {
  CreateApiKeyInput,
  UpdateApiKeyInput,
  ValidateApiKeyInput,
} from '../dto/api-key.dto';

/**
 * ApiKeys Service
 *
 * Handles business logic for API key management:
 * - Creating new API keys with proper hashing
 * - Validating API keys against hashed values
 * - Managing scopes and rate limits
 * - Revoking and expiring keys
 */
@Injectable()
export class ApiKeysService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
  ) {}

  /**
   * Create a new API key
   * Returns the raw key (only shown once) and the entity
   */
  async create(
    userId: string,
    input: CreateApiKeyInput,
  ): Promise<{ entity: ApiKey; rawKey: string }> {
    // Validate scopes
    if (!input.scopes || input.scopes.length === 0) {
      throw new BadRequestException('API key must have at least one scope');
    }

    // Parse expiration date if provided
    let expiresAt: Date | null = null;
    if (input.expiresAt) {
      expiresAt = new Date(input.expiresAt);
      if (expiresAt <= new Date()) {
        throw new BadRequestException('Expiration date must be in the future');
      }
    }

    // Create entity using factory method
    const { entity, rawKey } = ApiKey.create(userId, input.name, input.scopes, {
      rateLimitPerMinute: input.rateLimitPerMinute,
      expiresAt,
      description: input.description,
    });

    // Hash the key before storing
    entity.keyHash = await this.hashKey(rawKey);

    // Save to database
    const saved = await this.apiKeyRepository.save(entity);

    return { entity: saved, rawKey };
  }

  /**
   * Find an API key by ID
   */
  async findById(id: string): Promise<ApiKey> {
    const key = await this.apiKeyRepository.findOne({ where: { id } });
    if (!key) {
      throw new NotFoundException(`API key with ID ${id} not found`);
    }
    return key;
  }

  /**
   * Find all API keys for a user
   */
  async findByUserId(userId: string): Promise<ApiKey[]> {
    return this.apiKeyRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update an API key
   */
  async update(id: string, input: UpdateApiKeyInput): Promise<ApiKey> {
    const key = await this.findById(id);

    // Update fields if provided
    if (input.name !== undefined) {
      key.name = input.name ?? '';
    }

    if (input.scopes !== undefined) {
      if (!input.scopes || input.scopes.length === 0) {
        throw new BadRequestException('API key must have at least one scope');
      }
      key.scopes = input.scopes;
    }

    if (input.rateLimitPerMinute !== undefined) {
      key.rateLimitPerMinute = input.rateLimitPerMinute;
    }

    if (input.expiresAt !== undefined) {
      if (input.expiresAt === null) {
        key.expiresAt = null;
      } else {
        const expiresAt = new Date(input.expiresAt);
        if (expiresAt <= new Date()) {
          throw new BadRequestException(
            'Expiration date must be in the future',
          );
        }
        key.expiresAt = expiresAt;
      }
    }

    if (input.description !== undefined) {
      key.description = input.description;
    }

    return this.apiKeyRepository.save(key);
  }

  /**
   * Delete an API key
   */
  async delete(id: string): Promise<boolean> {
    const key = await this.findById(id);
    await this.apiKeyRepository.remove(key);
    return true;
  }

  /**
   * Revoke an API key
   */
  async revoke(id: string): Promise<ApiKey> {
    const key = await this.findById(id);
    key.revoke();
    return this.apiKeyRepository.save(key);
  }

  /**
   * Validate an API key
   * Returns the key entity if valid, null otherwise
   * Includes user relation for authentication
   */
  async validate(rawKey: string): Promise<ApiKey | null> {
    try {
      // Try to find by key prefix (for efficiency)
      const keyPrefix = ApiKey.getKeyPrefix(rawKey);
      const keys = await this.apiKeyRepository.find({
        where: { keyPrefix },
        relations: ['user'],
      });

      // Check each key with matching prefix
      for (const key of keys) {
        const isValid = await this.compareKey(rawKey, key.keyHash);
        if (isValid) {
          // Check if key is still valid (active and not expired)
          if (!key.isValid()) {
            // Auto-update status if expired
            if (key.expiresAt && key.expiresAt < new Date()) {
              key.status = ApiKeyStatus.EXPIRED;
              await this.apiKeyRepository.save(key);
            }
            return null;
          }
          return key;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate an API key and check scopes
   */
  async validateWithScopes(input: ValidateApiKeyInput): Promise<{
    isValid: boolean;
    apiKey: ApiKey | null;
    message: string;
  }> {
    const apiKey = await this.validate(input.rawKey);

    if (!apiKey) {
      return {
        isValid: false,
        apiKey: null,
        message: 'Invalid API key',
      };
    }

    // Check scopes if required
    if (input.requiredScopes && input.requiredScopes.length > 0) {
      if (!apiKey.hasAllScopes(input.requiredScopes)) {
        return {
          isValid: false,
          apiKey,
          message: `API key missing required scopes: ${input.requiredScopes.join(', ')}`,
        };
      }
    }

    return {
      isValid: true,
      apiKey,
      message: 'API key is valid',
    };
  }

  /**
   * Record usage of an API key
   */
  async recordUsage(id: string, ipAddress: string): Promise<void> {
    const key = await this.findById(id);
    key.recordUsage(ipAddress);
    await this.apiKeyRepository.save(key);
  }

  /**
   * Check if an API key has exceeded its rate limit
   * This is a simplified version - in production, use Redis for distributed rate limiting
   */
  async checkRateLimit(id: string): Promise<boolean> {
    const key = await this.findById(id);

    if (key.rateLimitPerMinute === null) {
      return true; // No limit
    }

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    // In production, this should use a proper rate limiting store (Redis)
    // For now, we'll just return true and let the throttle guard handle it
    return true;
  }

  /**
   * Hash an API key using bcrypt
   */
  private async hashKey(key: string): Promise<string> {
    return bcrypt.hash(key, this.SALT_ROUNDS);
  }

  /**
   * Compare a raw key with a hash
   */
  private async compareKey(key: string, hash: string): Promise<boolean> {
    return bcrypt.compare(key, hash);
  }
}
