import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import {
  HubSpotWebhookEvent,
  HubSpotDealStage,
  DEAL_STAGE_TO_STATUS,
  WebhookProcessResult,
} from './dto/hubspot-webhook.dto';

/**
 * HubSpot Webhook Service
 *
 * Handles incoming webhook events from HubSpot CRM to keep local
 * DemoRequest data synchronized with changes made in HubSpot.
 *
 * Features:
 * - Webhook signature verification for security
 * - Contact property change handling
 * - Deal stage change to DemoRequest status mapping
 * - Contact deletion handling
 * - Audit logging for all webhook events
 * - Graceful error handling with detailed logging
 */
@Injectable()
export class HubSpotWebhookService {
  private readonly logger = new Logger(HubSpotWebhookService.name);
  private readonly webhookSecret: string;
  private readonly enabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.webhookSecret =
      this.configService.get<string>('HUBSPOT_WEBHOOK_SECRET') || '';
    this.enabled = this.configService.get<string>('HUBSPOT_ENABLED') === 'true';

    if (!this.webhookSecret && this.enabled) {
      this.logger.warn(
        'HUBSPOT_WEBHOOK_SECRET not configured - webhooks will not verify signatures',
      );
    }
  }

  /**
   * Check if HubSpot integration is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Verify HubSpot webhook signature
   *
   * HubSpot signs webhook payloads using SHA-256 HMAC with the app secret.
   * The signature is base64-encoded and included in the x-hubspot-signature header.
   *
   * @param payload Raw request body as string
   * @param signature Signature from x-hubspot-signature header
   * @param timestamp Timestamp from x-hubspot-request-timestamp header (optional)
   * @returns True if signature is valid
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    timestamp?: string,
  ): boolean {
    if (!this.webhookSecret) {
      this.logger.warn(
        'Webhook secret not configured - skipping signature verification',
      );
      return true; // Allow if not configured (development mode)
    }

    try {
      // Check timestamp to prevent replay attacks (if provided)
      // HubSpot recommends rejecting requests older than 5 minutes
      if (timestamp) {
        const requestTime = parseInt(timestamp, 10);
        const currentTime = Math.floor(Date.now() / 1000);
        const timeDiff = Math.abs(currentTime - requestTime);

        // 5 minutes = 300 seconds
        if (timeDiff > 300) {
          this.logger.warn(
            `Webhook timestamp too old: ${timeDiff}s difference`,
          );
          return false;
        }
      }

      // Create HMAC SHA256 hash
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      hmac.update(payload);
      const computedSignature = hmac.digest('base64');

      // Compare signatures using timing-safe comparison
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature),
      );

      if (!isValid) {
        this.logger.warn('Invalid webhook signature');
      }

      return isValid;
    } catch (error) {
      this.logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Process HubSpot webhook event
   *
   * Routes the event to the appropriate handler based on subscription type.
   *
   * @param event HubSpot webhook event
   * @returns Processing result
   */
  processWebhookEvent(event: HubSpotWebhookEvent): WebhookProcessResult {
    const { subscriptionType, objectId } = event;

    this.logger.debug(
      `Processing HubSpot webhook: ${subscriptionType} for object ${objectId}`,
    );

    try {
      // Route to appropriate handler
      switch (subscriptionType) {
        case 'contact.propertyChange':
          return this.handleContactPropertyChange(event);

        case 'deal.propertyChange':
          return this.handleDealPropertyChange(event);

        case 'contact.deletion':
          return this.handleContactDeletion(event);

        case 'deal.deletion':
          return this.handleDealDeletion(event);

        default:
          this.logger.debug(`Unhandled subscription type: ${subscriptionType}`);
          return {
            success: true,
            message: `Event type ${subscriptionType} not processed`,
          };
      }
    } catch (error) {
      this.logger.error(
        `Error processing webhook event ${subscriptionType} for object ${objectId}:`,
        error,
      );

      // Emit webhook error event for monitoring
      this.eventEmitter.emit('hubspot.webhook.error', {
        subscriptionType,
        objectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        message: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle contact property change events
   *
   * Currently monitors for changes that should sync to the local DemoRequest.
   * The main sync is through deal stage changes, but contact updates can
   * trigger logging for audit purposes.
   */
  private handleContactPropertyChange(
    event: HubSpotWebhookEvent,
  ): WebhookProcessResult {
    const { objectId, propertyName, propertyValue } = event;

    this.logger.log(
      `Contact property ${propertyName} changed for contact ${objectId} to: ${propertyValue}`,
    );

    // Emit event for audit logging
    this.eventEmitter.emit('hubspot.contact.changed', {
      contactId: objectId.toString(),
      propertyName,
      propertyValue,
      timestamp: event.occurredAt,
    });

    // Note: We don't update DemoRequest on contact property changes alone
    // The main status sync comes from deal stage changes
    return {
      success: true,
      message: 'Contact property change logged',
    };
  }

  /**
   * Handle deal property change events
   *
   * This is the main handler for syncing HubSpot deal stage changes to
   * local DemoRequest status.
   */
  private handleDealPropertyChange(
    event: HubSpotWebhookEvent,
  ): WebhookProcessResult {
    const { objectId, propertyName, propertyValue } = event;

    // Only process deal stage changes
    if (propertyName !== 'dealstage') {
      return {
        success: true,
        message: `Property ${propertyName} change not processed`,
      };
    }

    const newStage = propertyValue as HubSpotDealStage;
    const newStatus = DEAL_STAGE_TO_STATUS[newStage];

    if (!newStatus) {
      this.logger.warn(`Unknown deal stage: ${newStage}`);
      return {
        success: false,
        message: `Unknown deal stage: ${newStage}`,
      };
    }

    this.logger.log(
      `Deal ${objectId} stage changed to ${newStage} -> status: ${newStatus}`,
    );

    // Find the associated DemoRequest via deal association
    // In a real implementation, we would:
    // 1. Query HubSpot API to get the associated contact
    // 2. Find DemoRequest by hubspotContactId
    // 3. Update the status

    // For now, emit an event that can be handled by other modules
    this.eventEmitter.emit('hubspot.deal.stage_changed', {
      dealId: objectId.toString(),
      dealStage: newStage,
      newStatus,
      timestamp: event.occurredAt,
    });

    return {
      success: true,
      message: `Deal stage change processed: ${newStage} -> ${newStatus}`,
    };
  }

  /**
   * Handle contact deletion events
   *
   * When a contact is deleted in HubSpot, we may want to mark the
   * associated DemoRequest as closed or retain it for audit purposes.
   */
  private handleContactDeletion(
    event: HubSpotWebhookEvent,
  ): WebhookProcessResult {
    const { objectId } = event;

    this.logger.log(`Contact ${objectId} deleted in HubSpot`);

    // Emit event for other modules to handle
    this.eventEmitter.emit('hubspot.contact.deleted', {
      contactId: objectId.toString(),
      timestamp: event.occurredAt,
    });

    // Note: We don't delete local DemoRequest records for audit purposes
    // They remain as historical records
    return {
      success: true,
      message: 'Contact deletion logged',
    };
  }

  /**
   * Handle deal deletion events
   */
  private handleDealDeletion(event: HubSpotWebhookEvent): WebhookProcessResult {
    const { objectId } = event;

    this.logger.log(`Deal ${objectId} deleted in HubSpot`);

    // Emit event for other modules to handle
    this.eventEmitter.emit('hubspot.deal.deleted', {
      dealId: objectId.toString(),
      timestamp: event.occurredAt,
    });

    return {
      success: true,
      message: 'Deal deletion logged',
    };
  }

  /**
   * Get DemoRequest by HubSpot contact ID
   *
   * This would be implemented to query the local database for a
   * DemoRequest associated with the given HubSpot contact ID.
   *
   * Note: This is a placeholder - actual implementation depends on
   * the DemoRequest repository pattern used in the module.
   */
  findDemoRequestByContactId(
    contactId: string,
  ): { id: string; status: string } | null {
    // This would query the actual repository
    // For now, emit an event for other modules to handle
    this.eventEmitter.emit('hubspot.webhook.find_demo_request', {
      contactId,
    });

    return null;
  }
}
