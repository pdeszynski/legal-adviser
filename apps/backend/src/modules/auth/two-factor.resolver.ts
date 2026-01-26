import { Resolver, Mutation, Query, Context, Args } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { RoleGuard, RequireRole } from './guards/role.guard';
import { UserRole } from './enums/user-role.enum';
import { TwoFactorService } from './two-factor.service';
import {
  EnableTwoFactorResponse,
  VerifyTwoFactorSetupResponse,
  VerifyTwoFactorSetupInput,
  DisableTwoFactorInput,
  RegenerateBackupCodesResponse,
  TwoFactorSettings,
  TwoFactorStatus,
  AdminForceDisableTwoFactorInput,
  AdminForceDisableTwoFactorResponse,
} from './dto/two-factor.graphql-dto';
import { GqlThrottlerGuard } from '../../shared/throttler/gql-throttler.guard';

/**
 * GraphQL Resolver for Two-Factor Authentication
 *
 * Handles 2FA mutations:
 * - enableTwoFactorAuth - Generate TOTP secret and QR code
 * - verifyTwoFactorSetup - Confirm 2FA setup with first token
 * - disableTwoFactorAuth - Remove 2FA with password confirmation
 * - regenerateBackupCodes - Generate new recovery codes
 *
 * All mutations require authentication.
 *
 * Security measures:
 * - Rate limiting on TOTP verification (5 attempts per minute)
 * - Account lockout after 10 failed attempts (30 minute lockout)
 * - All 2FA events logged to audit logs
 * - Password confirmation required for disabling 2FA
 * - JWT sessions invalidated when 2FA is disabled
 */
@Resolver()
export class TwoFactorResolver {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  /**
   * Mutation: Enable Two-Factor Authentication
   * Generates TOTP secret, QR code, and backup codes
   * User must then call verifyTwoFactorSetup to complete setup
   */
  @Mutation(() => EnableTwoFactorResponse, {
    name: 'enableTwoFactorAuth',
    description: 'Generate TOTP secret and QR code for 2FA setup',
  })
  @UseGuards(GqlAuthGuard, RoleGuard, GqlThrottlerGuard)
  @RequireRole(UserRole.USER)
  async enableTwoFactorAuth(
    @Context()
    context: {
      req: {
        user: { id: string };
        ip?: string;
        headers?: Record<string, string>;
      };
    },
  ): Promise<EnableTwoFactorResponse> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const ipAddress = this.extractIpAddress(context);
    const userAgent = this.extractUserAgent(context);

    const result = await this.twoFactorService.enableTwoFactorAuth(
      userId,
      ipAddress,
      userAgent,
    );

    return {
      secret: result.secret,
      qrCodeDataUrl: result.qrCodeDataUrl,
      backupCodes: result.backupCodes,
    };
  }

  /**
   * Mutation: Verify Two-Factor Setup
   * Confirms 2FA setup by validating first TOTP token
   * Must be called after enableTwoFactorAuth
   *
   * Rate limited to 5 attempts per minute
   */
  @Mutation(() => VerifyTwoFactorSetupResponse, {
    name: 'verifyTwoFactorSetup',
    description: 'Verify 2FA setup with first TOTP token to enable',
  })
  @UseGuards(GqlAuthGuard, RoleGuard, GqlThrottlerGuard)
  @RequireRole(UserRole.USER)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyTwoFactorSetup(
    @Context()
    context: {
      req: {
        user: { id: string };
        ip?: string;
        headers?: Record<string, string>;
      };
    },
    @Args('input') input: VerifyTwoFactorSetupInput,
  ): Promise<VerifyTwoFactorSetupResponse> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const ipAddress = this.extractIpAddress(context);
    const userAgent = this.extractUserAgent(context);

    const result = await this.twoFactorService.verifyTwoFactorSetup(
      userId,
      input.token,
      ipAddress,
      userAgent,
    );

    return {
      success: result.success,
      backupCodes: result.backupCodes,
    };
  }

  /**
   * Mutation: Disable Two-Factor Authentication
   * Removes 2FA with password confirmation
   * Invalidates all existing JWT sessions
   */
  @Mutation(() => Boolean, {
    name: 'disableTwoFactorAuth',
    description: 'Disable 2FA with password confirmation',
  })
  @UseGuards(GqlAuthGuard, RoleGuard, GqlThrottlerGuard)
  @RequireRole(UserRole.USER)
  async disableTwoFactorAuth(
    @Context()
    context: {
      req: {
        user: { id: string };
        ip?: string;
        headers?: Record<string, string>;
      };
    },
    @Args('input') input: DisableTwoFactorInput,
  ): Promise<boolean> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const ipAddress = this.extractIpAddress(context);
    const userAgent = this.extractUserAgent(context);

    await this.twoFactorService.disableTwoFactorAuth(
      userId,
      input.password,
      ipAddress,
      userAgent,
    );

    return true;
  }

  /**
   * Mutation: Regenerate Backup Codes
   * Creates new recovery codes and invalidates old ones
   */
  @Mutation(() => RegenerateBackupCodesResponse, {
    name: 'regenerateBackupCodes',
    description: 'Generate new backup codes (invalidates old ones)',
  })
  @UseGuards(GqlAuthGuard, RoleGuard, GqlThrottlerGuard)
  @RequireRole(UserRole.USER)
  async regenerateBackupCodes(
    @Context()
    context: {
      req: {
        user: { id: string };
        ip?: string;
        headers?: Record<string, string>;
      };
    },
  ): Promise<RegenerateBackupCodesResponse> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const ipAddress = this.extractIpAddress(context);
    const userAgent = this.extractUserAgent(context);

    const result = await this.twoFactorService.regenerateBackupCodes(
      userId,
      ipAddress,
      userAgent,
    );

    return { codes: result.codes };
  }

  /**
   * Query: Get Two-Factor Settings
   * Returns current 2FA status, remaining backup codes count, and last verified date
   */
  @Query(() => TwoFactorSettings, {
    name: 'twoFactorSettings',
    description: 'Get current 2FA settings and status',
    nullable: true,
  })
  @UseGuards(GqlAuthGuard, RoleGuard)
  @RequireRole(UserRole.USER)
  async twoFactorSettings(
    @Context() context: { req: { user: { id: string } } },
  ): Promise<TwoFactorSettings | null> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const enabled = await this.twoFactorService.isTwoFactorEnabled(userId);
    const remainingCount =
      await this.twoFactorService.getRemainingBackupCodesCount(userId);
    const lastVerifiedAt =
      await this.twoFactorService.getLastVerifiedAt(userId);

    // Determine status based on enabled state
    // TODO: Add PENDING status check if user has started but not completed setup
    const status = enabled ? TwoFactorStatus.ENABLED : TwoFactorStatus.DISABLED;

    return {
      status,
      enabled,
      remainingBackupCodes: enabled ? remainingCount : null,
      lastVerifiedAt,
    };
  }

  /**
   * Mutation: Admin Force-Disable Two-Factor Authentication
   * Allows admin to disable 2FA for a user without password confirmation
   * Used when user is locked out of their authenticator app
   * Invalidates all existing JWT sessions
   */
  @Mutation(() => AdminForceDisableTwoFactorResponse, {
    name: 'adminForceDisableTwoFactor',
    description: 'Admin force-disable 2FA for a user (requires admin role)',
  })
  @UseGuards(GqlAuthGuard, RoleGuard, GqlThrottlerGuard)
  @RequireRole(UserRole.ADMIN)
  async adminForceDisableTwoFactor(
    @Context()
    context: {
      req: {
        user: { id: string };
        ip?: string;
        headers?: Record<string, string>;
      };
    },
    @Args('input') input: AdminForceDisableTwoFactorInput,
  ): Promise<AdminForceDisableTwoFactorResponse> {
    const adminUserId = context.req.user?.id;
    if (!adminUserId) {
      throw new UnauthorizedException('Admin user not authenticated');
    }

    const ipAddress = this.extractIpAddress(context);
    const userAgent = this.extractUserAgent(context);

    return this.twoFactorService.adminForceDisableTwoFactor(
      input.userId,
      adminUserId,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Extract IP address from GraphQL context
   * Handles proxy headers (X-Forwarded-For, X-Real-IP)
   */
  private extractIpAddress(context: {
    req: { ip?: string; headers?: Record<string, string> };
  }): string | null {
    const headers = context.req.headers || {};
    const forwarded = headers['x-forwarded-for'];
    if (forwarded) {
      const ips = forwarded.split(',');
      return ips[0].trim();
    }

    const realIp = headers['x-real-ip'];
    if (realIp) {
      return realIp;
    }

    return context.req.ip || null;
  }

  /**
   * Extract user agent from GraphQL context
   */
  private extractUserAgent(context: {
    req: { headers?: Record<string, string> };
  }): string | null {
    const headers = context.req.headers || {};
    return headers['user-agent'] || null;
  }
}
