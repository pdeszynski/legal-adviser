/**
 * BILLING APPLICATION LAYER
 *
 * This module contains the application use cases for billing and subscriptions.
 * Use cases orchestrate domain operations without containing business logic.
 *
 * Use Cases:
 * - CreateSubscriptionUseCase: Create a subscription with a specific plan
 * - CreateTrialSubscriptionUseCase: Create a trial subscription
 * - GetSubscriptionUseCase: Get subscription by ID
 * - GetUserSubscriptionUseCase: Get user's active subscription
 * - ActivateSubscriptionUseCase: Activate a pending subscription
 * - CancelSubscriptionUseCase: Cancel a subscription
 * - UpgradeSubscriptionUseCase: Upgrade to a new plan
 * - ProcessPaymentUseCase: Process a subscription payment
 */

export * from './dto';
export * from './use-cases';
export * from './services';
