import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Webhook } from './entities/webhook.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { WebhooksService } from './services/webhooks.service';
import { WebhookDeliveryService } from './services/webhook-delivery.service';
import { WebhooksResolver } from './webhooks.resolver';
import { WebhookEventListener } from './listeners/webhook-event.listener';
import { TemporalModule } from '../temporal/temporal.module';

/**
 * Webhooks Module
 *
 * Handles webhook configuration and delivery for external integrations.
 *
 * Bounded Context: Webhooks
 * - Aggregates: Webhook, WebhookDelivery
 * - Services: WebhooksService, WebhookDeliveryService
 * - Resolvers: WebhooksResolver
 *
 * Features:
 * - Create and manage webhooks with HTTPS endpoints
 * - Subscribe to domain events (document, query, subscription, etc.)
 * - Configure event subscriptions and authentication headers
 * - Track delivery status and retry failed deliveries
 * - Test webhook endpoints
 * - Temporal workflow for reliable async delivery
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Webhook, WebhookDelivery]),
    TemporalModule.forRootWithDefaults(),
  ],
  providers: [
    WebhooksService,
    WebhookDeliveryService,
    WebhooksResolver,
    WebhookEventListener,
  ],
  exports: [WebhooksService, WebhookDeliveryService],
})
export class WebhooksModule {}
