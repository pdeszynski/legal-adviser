/**
 * Webhook Delivery Activities Worker Implementation
 *
 * This file provides the activity implementations with their dependencies
 * to the Temporal worker. It serves as the connection point between
 * the activity definitions and the NestJS dependency injection container.
 *
 * The Temporal worker loads activities from the compiled dist/modules/temporal/activities/webhook/impl.js
 */

import {
  WebhookDeliveryActivities,
  createWebhookDeliveryActivities,
} from './webhook-delivery.activities';

/**
 * Activities implementation for the Temporal worker
 *
 * This file is loaded by the Temporal worker to register activities.
 * The worker calls the exported functions to get activity instances
 * with their dependencies injected.
 */

// Type for the activities object expected by Temporal
export interface Activities {
  // Webhook Delivery activities
  attemptDelivery: WebhookDeliveryActivities['attemptDelivery'];
  isWebhookActive: WebhookDeliveryActivities['isWebhookActive'];
  checkRateLimit: WebhookDeliveryActivities['checkRateLimit'];
  incrementRateLimitCounter: WebhookDeliveryActivities['incrementRateLimitCounter'];
  recordSuccess: WebhookDeliveryActivities['recordSuccess'];
  recordFailure: WebhookDeliveryActivities['recordFailure'];
}

/**
 * Create activities with dependencies
 *
 * This function is called by the Temporal worker to get the activity
 * implementations with their dependencies.
 *
 * @param dependencies - Service dependencies
 * @returns Activities object for Temporal worker
 */
export function createActivities(dependencies: {
  webhookRepository: {
    findOne: (options: { where: { id: string } }) => Promise<{
      id: string;
      status: string;
      failureCount: number;
    } | null>;
    createQueryBuilder: () => {
      update: (entity: any) => {
        set: (data: any) => {
          where: (clause: any) => {
            execute: () => Promise<unknown>;
          };
        };
      };
    };
  };
  deliveryRepository: {
    update: (
      id: string,
      data: {
        status: string;
        httpResponseCode?: number;
        responseBody?: string;
        errorMessage?: string;
        attemptCount: number;
      },
    ) => Promise<unknown>;
  };
}): Activities {
  // Create webhook delivery activities
  const webhookDeliveryActivities = createWebhookDeliveryActivities(
    dependencies.webhookRepository as any, // eslint-disable-line @typescript-eslint/no-unsafe-argument
    dependencies.deliveryRepository as any, // eslint-disable-line @typescript-eslint/no-unsafe-argument
  );

  // Return all activities bound to their implementations
  return {
    attemptDelivery: webhookDeliveryActivities.attemptDelivery.bind(
      webhookDeliveryActivities,
    ),
    isWebhookActive: webhookDeliveryActivities.isWebhookActive.bind(
      webhookDeliveryActivities,
    ),
    checkRateLimit: webhookDeliveryActivities.checkRateLimit.bind(
      webhookDeliveryActivities,
    ),
    incrementRateLimitCounter:
      webhookDeliveryActivities.incrementRateLimitCounter.bind(
        webhookDeliveryActivities,
      ),
    recordSuccess: webhookDeliveryActivities.recordSuccess.bind(
      webhookDeliveryActivities,
    ),
    recordFailure: webhookDeliveryActivities.recordFailure.bind(
      webhookDeliveryActivities,
    ),
  };
}

/**
 * Export activities for direct import
 *
 * This export allows the worker to import activities directly
 * without calling the factory function.
 */
export const activities: Activities = {} as Activities;
