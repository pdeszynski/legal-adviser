import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HubSpotService } from './hubspot.service';
import { HubSpotResolver } from './hubspot.resolver';
import { HubSpotWebhookService } from './hubspot-webhook.service';
import { HubSpotWebhookController } from './hubspot-webhook.controller';
import { AuditLogModule } from '../../audit-log/audit-log.module';
import { NotificationsModule } from '../../notifications/notifications.module';

/**
 * HubSpot Integration Module
 *
 * Provides CRM synchronization with HubSpot for lead management.
 *
 * Features:
 * - Contact creation from form submissions
 * - Deal creation for qualified leads
 * - List assignment for segmentation
 * - Automatic retry with exponential backoff
 * - Webhook receiver for HubSpot event notifications
 * - Two-way sync between local DemoRequest and HubSpot CRM
 * - Confirmation email sending for early access signups
 *
 * Environment Variables:
 * - HUBSPOT_API_KEY: HubSpot API key for authentication
 * - HUBSPOT_ENABLED: Enable/disable integration (default: false)
 * - HUBSPOT_WEBHOOK_SECRET: Secret for webhook signature verification
 * - HUBSPOT_DEMO_REQUESTS_LIST_ID: Static list ID for demo requests
 * - HUBSPOT_WAITLIST_LIST_ID: Static list ID for waitlist signups
 * - HUBSPOT_DEAL_PIPELINE: Pipeline ID for new deals
 * - HUBSPOT_DEAL_STAGE: Default stage for new deals
 *
 * Webhook Endpoints:
 * - POST /api/webhooks/hubspot - Receives HubSpot webhook events
 * - POST /api/webhooks/hubspot/health - Webhook health check
 */
@Module({
  imports: [ConfigModule, AuditLogModule, NotificationsModule],
  providers: [HubSpotService, HubSpotResolver, HubSpotWebhookService],
  controllers: [HubSpotWebhookController],
  exports: [HubSpotService, HubSpotWebhookService],
})
export class HubSpotModule {}
