import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  SetMetadata,
  Inject,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import type { ISubscriptionRepository } from '../../../domain/billing/repositories';

/**
 * Quota type metadata key for decorator
 */
export const QUOTA_TYPE_KEY = 'quotaType';

/**
 * Quota types for different AI operations
 */
export enum QuotaType {
  QUERY = 'query',
  DOCUMENT = 'document',
}

/**
 * Quota Enforcement Guard
 *
 * Checks if the authenticated user has sufficient quota
 * to perform AI operations (queries, document generation).
 *
 * Usage:
 * @UseGuards(GqlAuthGuard, QuotaGuard)
 * @RequireQuota(QuotaType.QUERY)
 *
 * The guard:
 * 1. Loads the user's active subscription
 * 2. Checks if the quota type is available
 * 3. Throws ForbiddenException if quota exceeded
 *
 * Error messages are user-friendly and include:
 * - Current usage vs limit
 * - Clear call to action (upgrade plan)
 */
@Injectable()
export class QuotaGuard {
  constructor(
    private reflector: Reflector,
    @Inject('ISubscriptionRepository')
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required quota type from decorator metadata
    const quotaType = this.reflector.getAllAndOverride<QuotaType>(
      QUOTA_TYPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!quotaType) {
      // No quota requirement - allow access
      return true;
    }

    // Get GraphQL context
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Load user's subscription
    const subscription = await this.subscriptionRepository.findByUserId(userId);

    if (!subscription) {
      throw new ForbiddenException(
        'No active subscription found. Please start a trial or choose a plan to continue.',
      );
    }

    // Check if subscription is usable
    if (!subscription.status.isUsable()) {
      throw new ForbiddenException(
        `Your subscription is ${subscription.status.toValue()}. Please update your payment method or contact support.`,
      );
    }

    // Check quota based on type
    const quota = subscription.usageQuota;

    switch (quotaType) {
      case QuotaType.QUERY:
        if (!quota.canUseQuery()) {
          throw this.createQuotaExceededException(
            'AI questions',
            quota.queriesUsed,
            quota.queriesLimit,
            quota.periodEnd,
          );
        }
        break;

      case QuotaType.DOCUMENT:
        if (!quota.canUseDocument()) {
          throw this.createQuotaExceededException(
            'AI document generations',
            quota.documentsUsed,
            quota.documentsLimit,
            quota.periodEnd,
          );
        }
        break;

      default:
        throw new ForbiddenException('Invalid quota type');
    }

    return true;
  }

  /**
   * Create user-friendly quota exceeded exception
   */
  private createQuotaExceededException(
    operationName: string,
    used: number,
    limit: number,
    periodEnd: Date,
  ): ForbiddenException {
    const limitText = limit === -1 ? 'unlimited' : limit.toString();
    const periodDate = periodEnd.toLocaleDateString();

    return new ForbiddenException(
      `You have exceeded your ${operationName} limit for this billing period. ` +
        `Usage: ${used}/${limitText}. ` +
        `Your quota will reset on ${periodDate}. ` +
        `Please upgrade your plan to continue.`,
    );
  }
}

/**
 * Quota requirement decorator
 *
 * Specifies which quota type to check for a resolver/mutation.
 *
 * @example
 * @RequireQuota(QuotaType.QUERY)
 * @Mutation(() => LegalQuery)
 * async askLegalQuestion() {
 *   // ...
 * }
 *
 * @example
 * @RequireQuota(QuotaType.DOCUMENT)
 * @Mutation(() => LegalDocument)
 * async generateDocument() {
 *   // ...
 * }
 */
export const RequireQuota = (quotaType: QuotaType): MethodDecorator =>
  SetMetadata(QUOTA_TYPE_KEY, quotaType);
