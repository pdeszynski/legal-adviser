import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../subscriptions.service';

/**
 * Feature access metadata key for decorator
 */
export const FEATURE_KEY = 'requiredFeature';

/**
 * Feature Access Guard
 *
 * Checks if the authenticated user's subscription includes access to a specific feature.
 *
 * Usage:
 * @UseGuards(GqlAuthGuard, FeatureAccessGuard)
 * @RequireFeature('aiDocumentGeneration')
 *
 * Available features:
 * - aiDocumentGeneration: AI-powered document generation
 * - aiQuestionAnswering: AI question answering
 * - aiRulingSearch: AI ruling search
 * - advancedCaseAnalysis: Advanced case analysis tools
 * - documentTemplates: Access to document templates
 * - documentCollaboration: Document collaboration features
 * - documentVersioning: Document versioning
 * - pdfExport: PDF export functionality
 * - semanticSearch: Semantic search
 * - advancedSearchFilters: Advanced search filters
 * - emailNotifications: Email notifications
 * - realTimeNotifications: Real-time notifications
 * - apiAccess: API access
 * - prioritySupport: Priority support
 * - dedicatedSupport: Dedicated support
 *
 * The guard:
 * 1. Loads the user's active subscription
 * 2. Checks if the feature is included in their plan
 * 3. Throws ForbiddenException if feature is not available
 *
 * Error messages are user-friendly and suggest upgrading the plan.
 */
@Injectable()
export class FeatureAccessGuard {
  constructor(
    private reflector: Reflector,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required feature from decorator metadata
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature) {
      // No feature requirement - allow access
      return true;
    }

    // Get GraphQL context
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Check if user has access to the feature
    const hasAccess = await this.subscriptionsService.canUserAccessFeature(
      userId,
      requiredFeature,
    );

    if (!hasAccess) {
      throw this.createFeatureAccessException(requiredFeature);
    }

    return true;
  }

  /**
   * Create user-friendly feature access exception
   */
  private createFeatureAccessException(feature: string): ForbiddenException {
    const featureNames: Record<string, string> = {
      aiDocumentGeneration: 'AI document generation',
      aiQuestionAnswering: 'AI question answering',
      aiRulingSearch: 'AI ruling search',
      advancedCaseAnalysis: 'advanced case analysis',
      documentTemplates: 'document templates',
      documentCollaboration: 'document collaboration',
      documentVersioning: 'document versioning',
      pdfExport: 'PDF export',
      semanticSearch: 'semantic search',
      advancedSearchFilters: 'advanced search filters',
      emailNotifications: 'email notifications',
      realTimeNotifications: 'real-time notifications',
      apiAccess: 'API access',
      prioritySupport: 'priority support',
      dedicatedSupport: 'dedicated support',
    };

    const featureName = featureNames[feature] || feature;

    return new ForbiddenException(
      `The ${featureName} feature is not available on your current plan. ` +
        `Please upgrade your subscription to access this feature.`,
    );
  }
}

/**
 * Feature access decorator
 *
 * Specifies which feature is required for a resolver/mutation.
 *
 * @example
 * @RequireFeature('aiDocumentGeneration')
 * @Mutation(() => LegalDocument)
 * async generateDocument() {
 *   // ...
 * }
 *
 * @example
 * @RequireFeature('apiAccess')
 * @Query(() => [ApiToken])
 * async getApiTokens() {
 *   // ...
 * }
 */
export const RequireFeature = (feature: string): MethodDecorator =>
  SetMetadata(FEATURE_KEY, feature);
