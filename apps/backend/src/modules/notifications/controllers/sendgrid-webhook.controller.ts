import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import { NotificationService } from '../services/notification.service';
import { NotificationStatus } from '../entities/notification.entity';
import { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';

/**
 * SendGrid webhook event types
 * @see https://docs.sendgrid.com/for-developers/tracking-events/event
 */
enum SendGridEventType {
  DELIVERED = 'delivered',
  PROCESSED = 'processed',
  DROPPED = 'dropped',
  DEFERRED = 'deferred',
  BOUNCE = 'bounce',
  BLOCKED = 'blocked',
  OPEN = 'open',
  CLICK = 'click',
  SPAM_REPORT = 'spamreport',
  UNSUBSCRIBE = 'unsubscribe',
  GROUP_UNSUBSCRIBE = 'group_unsubscribe',
  GROUP_RESUBSCRIBE = 'group_resubscribe',
}

/**
 * SendGrid webhook event payload structure
 */
interface SendGridWebhookEvent {
  email: string;
  timestamp: number;
  event: SendGridEventType;
  'smtp-id'?: string;
  sg_message_id?: string;
  reason?: string;
  status?: string;
  response?: string;
  type?: string;
  url?: string;
  useragent?: string;
  ip?: string;
  [key: string]: any;
}

/**
 * SendGrid webhook controller
 * Handles delivery status, bounces, and other email events from SendGrid
 */
@Controller('webhooks/sendgrid')
export class SendGridWebhookController {
  private readonly logger = new Logger(SendGridWebhookController.name);
  private readonly webhookVerificationKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.webhookVerificationKey = this.configService.get<string>(
      'SENDGRID_WEBHOOK_VERIFICATION_KEY',
      '',
    );
  }

  /**
   * Handle SendGrid webhook events
   * @see https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook
   */
  @Post('events')
  async handleWebhook(
    @Body() events: SendGridWebhookEvent[],
    @Headers('x-twilio-email-event-webhook-signature') signature?: string,
    @Headers('x-twilio-email-event-webhook-timestamp') timestamp?: string,
  ): Promise<{ success: boolean; processed: number }> {
    try {
      // Verify webhook signature if verification key is configured
      if (this.webhookVerificationKey && signature && timestamp) {
        const isValid = this.verifyWebhookSignature(
          JSON.stringify(events),
          signature,
          timestamp,
        );

        if (!isValid) {
          this.logger.warn('Invalid webhook signature received');
          throw new BadRequestException('Invalid webhook signature');
        }
      } else if (this.webhookVerificationKey) {
        this.logger.warn(
          'Webhook verification key configured but signature/timestamp missing',
        );
      }

      this.logger.log(`Received ${events.length} SendGrid webhook event(s)`);

      // Process each event
      let processed = 0;
      for (const event of events) {
        try {
          await this.processWebhookEvent(event);
          processed++;
        } catch (error) {
          this.logger.error(
            `Failed to process webhook event for ${event.email}:`,
            error.message,
          );
          // Continue processing other events even if one fails
        }
      }

      return { success: true, processed };
    } catch (error) {
      this.logger.error('Failed to process webhook:', error);
      throw error;
    }
  }

  /**
   * Process individual webhook event
   */
  private async processWebhookEvent(
    event: SendGridWebhookEvent,
  ): Promise<void> {
    const { email, event: eventType, sg_message_id, reason, status } = event;

    this.logger.debug(
      `Processing ${eventType} event for ${email} (message: ${sg_message_id})`,
    );

    // Find notification by message ID
    const notification = sg_message_id
      ? await this.notificationService.findByMessageId(sg_message_id)
      : null;

    if (!notification) {
      this.logger.warn(
        `Notification not found for message ID: ${sg_message_id}`,
      );
      return;
    }

    // Handle different event types
    switch (eventType) {
      case SendGridEventType.DELIVERED:
        await this.handleDelivered(notification.id, event);
        break;

      case SendGridEventType.BOUNCE:
      case SendGridEventType.BLOCKED:
      case SendGridEventType.DROPPED:
        await this.handleBounce(notification.id, event);
        break;

      case SendGridEventType.DEFERRED:
        await this.handleDeferred(notification.id, event);
        break;

      case SendGridEventType.SPAM_REPORT:
        await this.handleSpamReport(notification.id, event);
        break;

      case SendGridEventType.UNSUBSCRIBE:
        await this.handleUnsubscribe(notification.id, event);
        break;

      default:
        this.logger.debug(`Unhandled event type: ${eventType}`);
    }
  }

  /**
   * Handle delivered event
   */
  private async handleDelivered(
    notificationId: string,
    event: SendGridWebhookEvent,
  ): Promise<void> {
    await this.notificationService.updateNotificationStatus(
      notificationId,
      NotificationStatus.SENT,
    );

    this.eventEmitter.emit(EVENT_PATTERNS.EMAIL.SENT, {
      notificationId,
      email: event.email,
      timestamp: event.timestamp,
      messageId: event.sg_message_id,
    });

    this.logger.log(
      `Email delivered successfully to ${event.email} (${notificationId})`,
    );
  }

  /**
   * Handle bounce/blocked/dropped events
   */
  private async handleBounce(
    notificationId: string,
    event: SendGridWebhookEvent,
  ): Promise<void> {
    const errorMessage = `${event.event}: ${event.reason || event.status || 'Unknown reason'}`;

    await this.notificationService.updateNotificationStatus(
      notificationId,
      NotificationStatus.BOUNCED,
      undefined,
      errorMessage,
    );

    this.eventEmitter.emit(EVENT_PATTERNS.EMAIL.BOUNCED, {
      notificationId,
      email: event.email,
      type: event.event,
      reason: event.reason,
      status: event.status,
      timestamp: event.timestamp,
      messageId: event.sg_message_id,
    });

    this.logger.warn(
      `Email bounced for ${event.email} (${notificationId}): ${errorMessage}`,
    );
  }

  /**
   * Handle deferred event (temporary delivery failure)
   */
  private async handleDeferred(
    notificationId: string,
    event: SendGridWebhookEvent,
  ): Promise<void> {
    const reason = event.reason || event.response || 'Temporarily deferred';

    this.logger.warn(
      `Email deferred for ${event.email} (${notificationId}): ${reason}`,
    );

    // Don't change status for deferred - it might still be delivered
    // Just emit event for monitoring
    this.eventEmitter.emit('email.deferred', {
      notificationId,
      email: event.email,
      reason,
      timestamp: event.timestamp,
      messageId: event.sg_message_id,
    });
  }

  /**
   * Handle spam report
   */
  private async handleSpamReport(
    notificationId: string,
    event: SendGridWebhookEvent,
  ): Promise<void> {
    this.logger.warn(
      `Spam report received for ${event.email} (${notificationId})`,
    );

    // Update notification with metadata
    const notification =
      await this.notificationService.findById(notificationId);
    if (notification) {
      await this.notificationService.updateNotification(notificationId, {
        metadata: {
          ...notification.metadata,
          spamReport: {
            timestamp: event.timestamp,
            reportedAt: new Date(event.timestamp * 1000),
          },
        },
      });
    }

    this.eventEmitter.emit('email.spam_reported', {
      notificationId,
      email: event.email,
      timestamp: event.timestamp,
      messageId: event.sg_message_id,
    });
  }

  /**
   * Handle unsubscribe event
   */
  private async handleUnsubscribe(
    notificationId: string,
    event: SendGridWebhookEvent,
  ): Promise<void> {
    this.logger.log(
      `Unsubscribe received for ${event.email} (${notificationId})`,
    );

    // Update notification with metadata
    const notification =
      await this.notificationService.findById(notificationId);
    if (notification) {
      await this.notificationService.updateNotification(notificationId, {
        metadata: {
          ...notification.metadata,
          unsubscribed: {
            timestamp: event.timestamp,
            unsubscribedAt: new Date(event.timestamp * 1000),
          },
        },
      });
    }

    this.eventEmitter.emit('email.unsubscribed', {
      notificationId,
      email: event.email,
      timestamp: event.timestamp,
      messageId: event.sg_message_id,
    });
  }

  /**
   * Verify SendGrid webhook signature
   * @see https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook-security
   */
  private verifyWebhookSignature(
    payload: string,
    signature: string,
    timestamp: string,
  ): boolean {
    try {
      // Create verification string: timestamp + payload
      const verificationString = timestamp + payload;

      // Create HMAC SHA256 hash
      const hmac = crypto.createHmac('sha256', this.webhookVerificationKey);
      hmac.update(verificationString);
      const computedSignature = hmac.digest('base64');

      // Compare signatures
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature),
      );
    } catch (error) {
      this.logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }
}
