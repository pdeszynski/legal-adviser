import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { ApiKeysService } from '../../api-keys/services/api-keys.service';

/**
 * Validated user from API key authentication
 * Matches JWT ValidatedUser structure for consistency
 */
export interface ValidatedApiKeyUser {
  userId: string;
  username: string;
  email: string;
  roles: string[];
  apiKeyId: string;
  authMethod: 'api-key';
}

/**
 * API Key Strategy for Passport authentication
 *
 * Uses passport-http-bearer strategy to validate API keys.
 * Supports both Authorization header and X-API-Key header.
 *
 * Header formats:
 * - Authorization: Bearer pk_1234...
 * - X-API-Key: pk_1234...
 *
 * Enforces scope-based access control and rate limits.
 */
@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private readonly apiKeysService: ApiKeysService) {
    super({
      // Custom token extraction to support both headers
      passReqToCallback: true,
    });
  }

  /**
   * Validate API key from request
   * Called automatically by Passport after token extraction
   */
  async validate(req: any, token: string): Promise<ValidatedApiKeyUser> {
    // First, try to get API key from Authorization header (already extracted by passport-http-bearer)
    let apiKey = token;

    // If not found, try X-API-Key header
    if (!apiKey) {
      apiKey = req.headers?.['x-api-key'];
    }

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Validate the API key
    const keyEntity = await this.apiKeysService.validate(apiKey);

    if (!keyEntity) {
      throw new UnauthorizedException('Invalid or expired API key');
    }

    // Get user information from the key entity
    const user = keyEntity.user;

    if (!user) {
      throw new UnauthorizedException('User not found for this API key');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Record usage of the API key
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
    await this.apiKeysService.recordUsage(keyEntity.id, ipAddress);

    // Return user data with API key metadata
    return {
      userId: user.id,
      username: user.username || user.email,
      email: user.email,
      roles: [user.role || 'user'],
      apiKeyId: keyEntity.id,
      authMethod: 'api-key',
    };
  }
}
