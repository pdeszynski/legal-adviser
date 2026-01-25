import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuditLogService } from '../../audit-log/audit-log.service';
import {
  type ChangeDetails,
  AuditActionType,
  AuditResourceType,
} from '../../audit-log/entities/audit-log.entity';
import { HubSpotWebhookService } from './hubspot-webhook.service';
import type { HubSpotWebhookEvent } from './dto/hubspot-webhook.dto';

/**
 * Extended headers interface for webhook requests
 * Includes HubSpot signature headers plus standard HTTP headers
 */
interface WebhookRequestHeaders {
  'x-hubspot-signature': string;
  'x-hubspot-signature-version': string;
  'x-hubspot-request-timestamp'?: string;
  'x-forwarded-for'?: string;
  'user-agent'?: string;
}

/**
 * HubSpot Webhook Controller
 *
 * Receives and processes webhook events from HubSpot CRM to keep
 * local DemoRequest data synchronized with changes in HubSpot.
 *
 * Endpoint: POST /api/webhooks/hubspot
 *
 * Features:
 * - Signature verification using SHA-256 HMAC
 * - Rate limiting to prevent abuse
 * - Audit logging for all received events
 * - Graceful error handling
 *
 * @see https://developers.hubspot.com/docs/api/webhooks
 */
@Controller('api/webhooks')
export class HubSpotWebhookController {
  private readonly logger = new Logger(HubSpotWebhookController.name);

  constructor(
    private readonly webhookService: HubSpotWebhookService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Handle HubSpot webhook events
   *
   * HubSpot sends batches of webhook events for changes to contacts,
   * companies, and deals. Each event is processed individually.
   *
   * Request Headers:
   * - x-hubspot-signature: Base64-encoded SHA-256 HMAC signature
   * - x-hubspot-signature-version: Signature version (v1 or v2)
   * - x-hubspot-request-timestamp: Unix timestamp of request (optional)
   *
   * @param events Array of webhook events from HubSpot
   * @param headers HTTP headers including signature
   * @returns Success response with processed count
   */
  @Post('hubspot')
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() events: HubSpotWebhookEvent[],
    @Headers() headers: WebhookRequestHeaders,
  ): Promise<{ success: boolean; processed: number; message: string }> {
    const startTime = Date.now();

    try {
      // Check if HubSpot integration is enabled
      if (!this.webhookService.isEnabled()) {
        this.logger.warn('HubSpot integration disabled, ignoring webhook');
        return {
          success: true,
          processed: 0,
          message: 'HubSpot integration disabled',
        };
      }

      // Verify signature
      const signature = headers['x-hubspot-signature'];
      const signatureVersion = headers['x-hubspot-signature-version'];
      const timestamp = headers['x-hubspot-request-timestamp'];

      if (!signature || !signatureVersion) {
        this.logger.warn('Missing signature headers');
        throw new BadRequestException('Missing signature headers');
      }

      if (signatureVersion !== 'v1' && signatureVersion !== 'v2') {
        this.logger.warn(`Unsupported signature version: ${signatureVersion}`);
        throw new BadRequestException(
          `Unsupported signature version: ${signatureVersion}`,
        );
      }

      // Verify signature (pass raw body - in NestJS we need to get it differently)
      // Note: NestJS parses the body automatically, so we use JSON.stringify
      // For production, you'd use a raw body parser middleware
      const payload = JSON.stringify(events);
      const isValid = this.webhookService.verifyWebhookSignature(
        payload,
        signature,
        timestamp,
      );

      if (!isValid) {
        this.logger.warn('Invalid webhook signature');
        throw new BadRequestException('Invalid webhook signature');
      }

      this.logger.log(
        `Received ${events.length} HubSpot webhook event(s) at ${new Date().toISOString()}`,
      );

      // Log webhook receipt to audit
      const webhookReceiptChangeDetails: ChangeDetails = {
        context: {
          source: 'hubspot',
          eventCount: events.length,
          timestamp: new Date().toISOString(),
        },
      };
      await this.auditLogService.logAction(
        AuditActionType.CREATE,
        AuditResourceType.WEBHOOK,
        {
          resourceId: `hubspot-${Date.now()}`,
          ipAddress: headers['x-forwarded-for'] || 'unknown',
          userAgent: headers['user-agent'],
          statusCode: HttpStatus.OK,
          changeDetails: webhookReceiptChangeDetails,
        },
      );

      // Process each event
      let processed = 0;
      const errors: string[] = [];

      for (const event of events) {
        try {
          const result = this.webhookService.processWebhookEvent(event);

          if (result.success) {
            processed++;
          } else {
            errors.push(`Event ${event.eventId}: ${result.message}`);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Event ${event.eventId}: ${errorMessage}`);
          this.logger.error(
            `Failed to process webhook event ${event.eventId}:`,
            error,
          );
        }
      }

      const duration = Date.now() - startTime;
      const message =
        errors.length > 0
          ? `Processed ${processed}/${events.length} events (${errors.length} errors)`
          : `Processed ${processed} events successfully`;

      this.logger.log(`HubSpot webhook processed: ${message} (${duration}ms)`);

      // Log processing result to audit
      if (errors.length > 0) {
        const processingErrorChangeDetails: ChangeDetails = {
          context: {
            processed,
            failed: errors.length,
            total: events.length,
            duration,
          },
        };
        await this.auditLogService.logAction(
          AuditActionType.UPDATE,
          AuditResourceType.WEBHOOK,
          {
            resourceId: `hubspot-${startTime}`,
            errorMessage: errors.join('; '),
            changeDetails: processingErrorChangeDetails,
          },
        );
      }

      return {
        success: true,
        processed,
        message,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to process HubSpot webhook (${duration}ms):`,
        error,
      );

      // Log error to audit
      const errorChangeDetails: ChangeDetails = {
        context: {
          source: 'hubspot',
          failed: true,
          duration,
        },
      };
      await this.auditLogService.logAction(
        AuditActionType.CREATE,
        AuditResourceType.WEBHOOK,
        {
          resourceId: `hubspot-${startTime}`,
          statusCode: error instanceof BadRequestException ? 400 : 500,
          errorMessage,
          changeDetails: errorChangeDetails,
        },
      );

      throw error;
    }
  }

  /**
   * Health check endpoint for HubSpot webhook configuration
   *
   * POST /api/webhooks/hubspot/health
   *
   * Returns the current status of the HubSpot webhook integration.
   */
  @Post('hubspot/health')
  @HttpCode(HttpStatus.OK)
  healthCheck(): {
    enabled: boolean;
    signatureConfigured: boolean;
    timestamp: string;
  } {
    return {
      enabled: this.webhookService.isEnabled(),
      signatureConfigured: !!this.webhookService['webhookSecret'],
      timestamp: new Date().toISOString(),
    };
  }
}
