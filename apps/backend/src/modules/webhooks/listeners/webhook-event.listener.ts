import { OnEvent } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { WebhookDeliveryService } from '../services/webhook-delivery.service';
import { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';

/**
 * Webhook Event Listener
 *
 * Listens to domain events and triggers webhook deliveries.
 * Acts as a bridge between the event system and the webhook delivery system.
 *
 * Events handled:
 * - document.created
 * - document.updated
 * - document.generation.completed
 * - document.exported
 * - query.asked
 * - query.answered
 * - user.created
 * - user.updated
 * - subscription.created
 * - subscription.upgraded
 * - subscription.cancelled
 */
@Injectable()
export class WebhookEventListener {
  private readonly logger = new Logger(WebhookEventListener.name);

  constructor(
    private readonly webhookDeliveryService: WebhookDeliveryService,
  ) {}

  /**
   * Handle document.created event
   */
  @OnEvent(EVENT_PATTERNS.DOCUMENT.CREATED)
  async handleDocumentCreated(payload: {
    documentId: string;
    userId: string;
    documentType: string;
    [key: string]: unknown;
  }) {
    this.logger.debug(`Document created event received: ${payload.documentId}`);

    await this.webhookDeliveryService.triggerWebhook(
      EVENT_PATTERNS.DOCUMENT.CREATED,
      payload,
    );
  }

  /**
   * Handle document.updated event
   */
  @OnEvent(EVENT_PATTERNS.DOCUMENT.UPDATED)
  async handleDocumentUpdated(payload: {
    documentId: string;
    userId: string;
    [key: string]: unknown;
  }) {
    this.logger.debug(`Document updated event received: ${payload.documentId}`);

    await this.webhookDeliveryService.triggerWebhook(
      EVENT_PATTERNS.DOCUMENT.UPDATED,
      payload,
    );
  }

  /**
   * Handle document.generation.completed event
   */
  @OnEvent(EVENT_PATTERNS.DOCUMENT.GENERATION_COMPLETED)
  async handleDocumentGenerationCompleted(payload: {
    documentId: string;
    userId: string;
    [key: string]: unknown;
  }) {
    this.logger.debug(
      `Document generation completed event received: ${payload.documentId}`,
    );

    await this.webhookDeliveryService.triggerWebhook(
      EVENT_PATTERNS.DOCUMENT.GENERATION_COMPLETED,
      payload,
    );
  }

  /**
   * Handle document.exported event
   */
  @OnEvent(EVENT_PATTERNS.DOCUMENT.EXPORTED)
  async handleDocumentExported(payload: {
    documentId: string;
    userId: string;
    format: string;
    [key: string]: unknown;
  }) {
    this.logger.debug(
      `Document exported event received: ${payload.documentId}`,
    );

    await this.webhookDeliveryService.triggerWebhook(
      EVENT_PATTERNS.DOCUMENT.EXPORTED,
      payload,
    );
  }

  /**
   * Handle query.asked event
   */
  @OnEvent(EVENT_PATTERNS.QUERY.ASKED)
  async handleQueryAsked(payload: {
    queryId: string;
    userId: string;
    question: string;
    [key: string]: unknown;
  }) {
    this.logger.debug(`Query asked event received: ${payload.queryId}`);

    await this.webhookDeliveryService.triggerWebhook(
      EVENT_PATTERNS.QUERY.ASKED,
      payload,
    );
  }

  /**
   * Handle query.answered event
   */
  @OnEvent(EVENT_PATTERNS.QUERY.ANSWERED)
  async handleQueryAnswered(payload: {
    queryId: string;
    userId: string;
    question: string;
    answer: string;
    [key: string]: unknown;
  }) {
    this.logger.debug(`Query answered event received: ${payload.queryId}`);

    await this.webhookDeliveryService.triggerWebhook(
      EVENT_PATTERNS.QUERY.ANSWERED,
      payload,
    );
  }

  /**
   * Handle user.created event
   */
  @OnEvent(EVENT_PATTERNS.USER.CREATED)
  async handleUserCreated(payload: {
    userId: string;
    email: string;
    [key: string]: unknown;
  }) {
    this.logger.debug(`User created event received: ${payload.userId}`);

    await this.webhookDeliveryService.triggerWebhook(
      EVENT_PATTERNS.USER.CREATED,
      payload,
    );
  }

  /**
   * Handle user.updated event
   */
  @OnEvent(EVENT_PATTERNS.USER.UPDATED)
  async handleUserUpdated(payload: { userId: string; [key: string]: unknown }) {
    this.logger.debug(`User updated event received: ${payload.userId}`);

    await this.webhookDeliveryService.triggerWebhook(
      EVENT_PATTERNS.USER.UPDATED,
      payload,
    );
  }

  /**
   * Handle subscription.created event
   */
  @OnEvent(EVENT_PATTERNS.SUBSCRIPTION.CREATED)
  async handleSubscriptionCreated(payload: {
    subscriptionId: string;
    userId: string;
    planId: string;
    [key: string]: unknown;
  }) {
    this.logger.debug(
      `Subscription created event received: ${payload.subscriptionId}`,
    );

    await this.webhookDeliveryService.triggerWebhook(
      EVENT_PATTERNS.SUBSCRIPTION.CREATED,
      payload,
    );
  }

  /**
   * Handle subscription.upgraded event
   */
  @OnEvent(EVENT_PATTERNS.SUBSCRIPTION.UPGRADED)
  async handleSubscriptionUpgraded(payload: {
    subscriptionId: string;
    userId: string;
    fromPlanId: string;
    toPlanId: string;
    [key: string]: unknown;
  }) {
    this.logger.debug(
      `Subscription upgraded event received: ${payload.subscriptionId}`,
    );

    await this.webhookDeliveryService.triggerWebhook(
      EVENT_PATTERNS.SUBSCRIPTION.UPGRADED,
      payload,
    );
  }

  /**
   * Handle subscription.cancelled event
   */
  @OnEvent(EVENT_PATTERNS.SUBSCRIPTION.CANCELLED)
  async handleSubscriptionCancelled(payload: {
    subscriptionId: string;
    userId: string;
    [key: string]: unknown;
  }) {
    this.logger.debug(
      `Subscription cancelled event received: ${payload.subscriptionId}`,
    );

    await this.webhookDeliveryService.triggerWebhook(
      EVENT_PATTERNS.SUBSCRIPTION.CANCELLED,
      payload,
    );
  }
}
