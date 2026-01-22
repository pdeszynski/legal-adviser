import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Webhook } from './entities/webhook.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { WebhooksService } from './services/webhooks.service';
import { WebhookDeliveryService } from './services/webhook-delivery.service';
import { WebhooksResolver } from './webhooks.resolver';
import { WebhookDeliveryProducer } from './queues/webhook-delivery.producer';
import { WebhookDeliveryProcessor } from './queues/webhook-delivery.processor';
import { WebhookEventListener } from './listeners/webhook-event.listener';
import { QUEUE_NAMES } from '../../shared/queues/base/queue-names';

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
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Webhook, WebhookDelivery]),
    BullModule.registerQueue({
      name: QUEUE_NAMES.WEBHOOK.DELIVER,
    }),
  ],
  providers: [
    WebhooksService,
    WebhookDeliveryService,
    WebhooksResolver,
    WebhookDeliveryProducer,
    WebhookDeliveryProcessor,
    WebhookEventListener,
  ],
  exports: [WebhooksService, WebhookDeliveryService],
})
export class WebhooksModule {}
