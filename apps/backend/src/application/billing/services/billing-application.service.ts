import { Injectable, Logger } from '@nestjs/common';
import { ServiceResult, successResult, failureResult } from '../../common';
import {
  ApplicationError,
  NotFoundError,
} from '../../common/application-error';
import {
  CreateTrialSubscriptionDto,
  CreateSubscriptionDto,
  CreateSubscriptionResultDto,
  SubscriptionDto,
  ActivateSubscriptionDto,
  CancelSubscriptionDto,
  UpgradeSubscriptionDto,
  ProcessPaymentDto,
} from '../dto';
import { CreateSubscriptionUseCase } from '../use-cases/create-subscription.use-case';
import { CreateTrialSubscriptionUseCase } from '../use-cases/create-trial-subscription.use-case';
import { GetSubscriptionUseCase } from '../use-cases/get-subscription.use-case';
import { GetUserSubscriptionUseCase } from '../use-cases/get-user-subscription.use-case';
import { ActivateSubscriptionUseCase } from '../use-cases/activate-subscription.use-case';
import { CancelSubscriptionUseCase } from '../use-cases/cancel-subscription.use-case';
import { UpgradeSubscriptionUseCase } from '../use-cases/upgrade-subscription.use-case';
import { ProcessPaymentUseCase } from '../use-cases/process-payment.use-case';
import {
  PlanTypeEnum,
  SubscriptionStatusEnum,
} from '../../../domain/billing/value-objects';

/**
 * Billing Application Service
 *
 * This service acts as an orchestrator for billing and subscription operations.
 * It coordinates between use cases, handles cross-cutting concerns,
 * and provides a unified API for the presentation layer.
 *
 * Key responsibilities:
 * - Coordinate multiple use cases when needed
 * - Handle error transformation
 * - Provide consistent result structure
 * - Subscription lifecycle management
 * - Payment processing coordination
 */
@Injectable()
export class BillingApplicationService {
  private readonly logger = new Logger(BillingApplicationService.name);

  constructor(
    private readonly createSubscriptionUseCase: CreateSubscriptionUseCase,
    private readonly createTrialSubscriptionUseCase: CreateTrialSubscriptionUseCase,
    private readonly getSubscriptionUseCase: GetSubscriptionUseCase,
    private readonly getUserSubscriptionUseCase: GetUserSubscriptionUseCase,
    private readonly activateSubscriptionUseCase: ActivateSubscriptionUseCase,
    private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
    private readonly upgradeSubscriptionUseCase: UpgradeSubscriptionUseCase,
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
  ) {}

  /**
   * Creates a new trial subscription for a user.
   *
   * @param dto - Trial subscription data
   * @returns Service result with created subscription info
   */
  async createTrialSubscription(
    dto: CreateTrialSubscriptionDto,
  ): Promise<ServiceResult<CreateSubscriptionResultDto>> {
    try {
      this.logger.log(`Creating trial subscription for user: ${dto.userId}`);
      const result = await this.createTrialSubscriptionUseCase.execute(dto);
      this.logger.log(`Trial subscription created successfully: ${result.id}`);
      return successResult(result);
    } catch (error) {
      return this.handleError<CreateSubscriptionResultDto>(
        error,
        'create trial subscription',
      );
    }
  }

  /**
   * Creates a new subscription with a specific plan.
   *
   * @param dto - Subscription creation data
   * @returns Service result with created subscription info
   */
  async createSubscription(
    dto: CreateSubscriptionDto,
  ): Promise<ServiceResult<CreateSubscriptionResultDto>> {
    try {
      this.logger.log(
        `Creating subscription for user: ${dto.userId} with plan: ${dto.planType}`,
      );
      const result = await this.createSubscriptionUseCase.execute(dto);
      this.logger.log(`Subscription created successfully: ${result.id}`);
      return successResult(result);
    } catch (error) {
      return this.handleError<CreateSubscriptionResultDto>(
        error,
        'create subscription',
      );
    }
  }

  /**
   * Retrieves a subscription by ID.
   *
   * @param subscriptionId - The subscription ID
   * @returns Service result with subscription data
   */
  async getSubscription(
    subscriptionId: string,
  ): Promise<ServiceResult<SubscriptionDto>> {
    try {
      this.logger.log(`Getting subscription: ${subscriptionId}`);
      const result = await this.getSubscriptionUseCase.execute({
        subscriptionId,
      });
      return successResult(result);
    } catch (error) {
      return this.handleError<SubscriptionDto>(error, 'get subscription');
    }
  }

  /**
   * Retrieves a user's active subscription.
   *
   * @param userId - The user ID
   * @returns Service result with subscription data
   */
  async getUserSubscription(
    userId: string,
  ): Promise<ServiceResult<SubscriptionDto>> {
    try {
      this.logger.log(`Getting subscription for user: ${userId}`);
      const result = await this.getUserSubscriptionUseCase.execute({ userId });
      return successResult(result);
    } catch (error) {
      return this.handleError<SubscriptionDto>(error, 'get user subscription');
    }
  }

  /**
   * Activates a pending subscription.
   *
   * @param dto - Activation data
   * @returns Service result with activated subscription
   */
  async activateSubscription(
    dto: ActivateSubscriptionDto,
  ): Promise<ServiceResult<SubscriptionDto>> {
    try {
      this.logger.log(`Activating subscription: ${dto.subscriptionId}`);
      const result = await this.activateSubscriptionUseCase.execute(dto);
      this.logger.log(
        `Subscription activated successfully: ${dto.subscriptionId}`,
      );
      return successResult(result);
    } catch (error) {
      return this.handleError<SubscriptionDto>(error, 'activate subscription');
    }
  }

  /**
   * Cancels a subscription.
   *
   * @param dto - Cancellation data
   * @returns Service result with cancelled subscription
   */
  async cancelSubscription(
    dto: CancelSubscriptionDto,
  ): Promise<ServiceResult<SubscriptionDto>> {
    try {
      this.logger.log(
        `Cancelling subscription: ${dto.subscriptionId}, reason: ${dto.reason}`,
      );
      const result = await this.cancelSubscriptionUseCase.execute(dto);
      this.logger.log(
        `Subscription cancelled successfully: ${dto.subscriptionId}`,
      );
      return successResult(result);
    } catch (error) {
      return this.handleError<SubscriptionDto>(error, 'cancel subscription');
    }
  }

  /**
   * Upgrades a subscription to a new plan.
   *
   * @param dto - Upgrade data
   * @returns Service result with upgraded subscription
   */
  async upgradeSubscription(
    dto: UpgradeSubscriptionDto,
  ): Promise<ServiceResult<SubscriptionDto>> {
    try {
      this.logger.log(
        `Upgrading subscription: ${dto.subscriptionId} to plan: ${dto.newPlanType}`,
      );
      const result = await this.upgradeSubscriptionUseCase.execute(dto);
      this.logger.log(
        `Subscription upgraded successfully: ${dto.subscriptionId}`,
      );
      return successResult(result);
    } catch (error) {
      return this.handleError<SubscriptionDto>(error, 'upgrade subscription');
    }
  }

  /**
   * Processes a payment for a subscription.
   *
   * @param dto - Payment data
   * @returns Service result with updated subscription
   */
  async processPayment(
    dto: ProcessPaymentDto,
  ): Promise<ServiceResult<SubscriptionDto>> {
    try {
      this.logger.log(
        `Processing payment for subscription: ${dto.subscriptionId}, amount: ${dto.amount} ${dto.currency}`,
      );
      const result = await this.processPaymentUseCase.execute(dto);
      this.logger.log(
        `Payment processed successfully for: ${dto.subscriptionId}`,
      );
      return successResult(result);
    } catch (error) {
      return this.handleError<SubscriptionDto>(error, 'process payment');
    }
  }

  /**
   * Checks if a user has an active subscription.
   *
   * @param userId - The user ID
   * @returns Service result with subscription status
   */
  async hasActiveSubscription(userId: string): Promise<ServiceResult<boolean>> {
    try {
      const result = await this.getUserSubscription(userId);
      if (!result.success || !result.data) {
        return successResult(false);
      }
      const isActive = result.data.status === SubscriptionStatusEnum.ACTIVE;
      return successResult(isActive);
    } catch (error) {
      return successResult(false);
    }
  }

  /**
   * Checks if a user can use a specific feature based on their subscription.
   *
   * @param userId - The user ID
   * @param featureName - The feature to check
   * @returns Service result with access status
   */
  async canUseFeature(
    userId: string,
    featureName: string,
  ): Promise<ServiceResult<boolean>> {
    try {
      const result = await this.getUserSubscription(userId);
      if (!result.success || !result.data) {
        return successResult(false);
      }

      const subscription = result.data;
      if (subscription.status !== SubscriptionStatusEnum.ACTIVE) {
        return successResult(false);
      }

      // Check if feature is included in plan
      const hasFeature = subscription.plan.features.includes(featureName);
      return successResult(hasFeature);
    } catch (error) {
      return this.handleError<boolean>(error, 'check feature access');
    }
  }

  /**
   * Checks if a user has remaining quota for queries.
   *
   * @param userId - The user ID
   * @returns Service result with quota status
   */
  async hasQueryQuota(userId: string): Promise<ServiceResult<boolean>> {
    try {
      const result = await this.getUserSubscription(userId);
      if (!result.success || !result.data) {
        return successResult(false);
      }

      const hasQuota = result.data.usageQuota.queriesRemaining > 0;
      return successResult(hasQuota);
    } catch (error) {
      return this.handleError<boolean>(error, 'check query quota');
    }
  }

  /**
   * Checks if a user has remaining quota for documents.
   *
   * @param userId - The user ID
   * @returns Service result with quota status
   */
  async hasDocumentQuota(userId: string): Promise<ServiceResult<boolean>> {
    try {
      const result = await this.getUserSubscription(userId);
      if (!result.success || !result.data) {
        return successResult(false);
      }

      const hasQuota = result.data.usageQuota.documentsRemaining > 0;
      return successResult(hasQuota);
    } catch (error) {
      return this.handleError<boolean>(error, 'check document quota');
    }
  }

  /**
   * Gets subscription statistics for reporting.
   *
   * @param userId - The user ID
   * @returns Service result with subscription statistics
   */
  async getSubscriptionStatistics(userId: string): Promise<
    ServiceResult<{
      planType: PlanTypeEnum;
      status: SubscriptionStatusEnum;
      queriesUsedPercentage: number;
      documentsUsedPercentage: number;
      daysUntilRenewal: number;
    }>
  > {
    try {
      this.logger.log(`Getting subscription statistics for user: ${userId}`);
      const result = await this.getUserSubscription(userId);

      if (!result.success || !result.data) {
        return failureResult('NOT_FOUND', 'No subscription found for user');
      }

      const subscription = result.data;
      const now = new Date();
      const renewalDate = new Date(subscription.currentPeriodEnd);
      const daysUntilRenewal = Math.ceil(
        (renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      return successResult({
        planType: subscription.plan.planType,
        status: subscription.status,
        queriesUsedPercentage: subscription.usageQuota.queriesPercentUsed,
        documentsUsedPercentage: subscription.usageQuota.documentsPercentUsed,
        daysUntilRenewal: Math.max(0, daysUntilRenewal),
      });
    } catch (error) {
      return this.handleError(error, 'get subscription statistics');
    }
  }

  /**
   * Handles errors and transforms them into service results.
   */
  private handleError<T>(error: unknown, operation: string): ServiceResult<T> {
    if (error instanceof NotFoundError) {
      this.logger.warn(`Not found during ${operation}: ${error.message}`);
      return failureResult('NOT_FOUND', error.message, error.details);
    }

    if (error instanceof ApplicationError) {
      this.logger.warn(
        `Application error during ${operation}: ${error.message}`,
      );
      return failureResult(error.code, error.message, error.details);
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(`Unexpected error during ${operation}: ${errorMessage}`);
    return failureResult('INTERNAL_ERROR', `Failed to ${operation}`, {
      originalError: errorMessage,
    });
  }
}
