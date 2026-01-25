import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { HubSpotService } from '../../modules/integrations/hubspot/hubspot.service';
import { EmailSenderService } from '../../modules/notifications/services/email-sender.service';
import { EmailSendProducer } from '../../modules/notifications/queues/email-send.producer';
import { EmailTemplateType } from '../../modules/notifications/dto/send-email.input';
import { LeadTimeline } from '../../modules/integrations/hubspot/dto/hubspot.types';
import {
  DemoRequestInput,
  CompanySize,
  DemoTimeline,
} from './dto/demo-request.graphql-dto';

/**
 * Demo Request Service
 *
 * Handles demo request submissions including:
 * - Lead synchronization with HubSpot CRM
 * - Email notification to internal team
 * - Lead qualification scoring
 *
 * Features:
 * - Generates unique reference IDs for tracking
 * - Graceful degradation when external services are unavailable
 * - Comprehensive logging for audit trail
 */
@Injectable()
export class DemoRequestService {
  private readonly logger = new Logger(DemoRequestService.name);
  private readonly internalNotificationEmail: string;

  constructor(
    private readonly hubSpotService: HubSpotService,
    private readonly emailSenderService: EmailSenderService,
    private readonly emailProducer: EmailSendProducer,
    private readonly configService: ConfigService,
  ) {
    this.internalNotificationEmail =
      this.configService.get<string>('DEMO_REQUEST_NOTIFICATION_EMAIL') ||
      'sales@legal-ai.com';
  }

  /**
   * Submit a demo request
   *
   * Process:
   * 1. Generate reference ID
   * 2. Sync lead to HubSpot
   * 3. Send notification email to internal team
   * 4. Return success response
   *
   * @param request Demo request input data
   * @returns Response with success status and confirmation message
   */
  async submitDemoRequest(request: DemoRequestInput): Promise<{
    success: boolean;
    message: string;
    referenceId: string;
    qualified?: boolean;
  }> {
    // Generate unique reference ID for tracking
    const referenceId = randomUUID();
    this.logger.log(
      `Demo request submitted: ${referenceId} - ${request.email} from ${request.company}`,
    );

    // Parse full name into first and last name
    const nameParts = request.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Map company size enum to HubSpot format
    const companySizeMap: Record<CompanySize, string> = {
      [CompanySize.SOLO]: '1',
      [CompanySize.SMALL_2_10]: '2-10',
      [CompanySize.SMALL_11_50]: '11-50',
      [CompanySize.MEDIUM_51_200]: '51-200',
      [CompanySize.LARGE_201_500]: '201-500',
      [CompanySize.ENTERPRISE_500_PLUS]: '500+',
    };

    // Map timeline enum to HubSpot LeadTimeline
    const timelineMap: Record<DemoTimeline, LeadTimeline> = {
      [DemoTimeline.ASAP]: LeadTimeline.IMMEDIATE,
      [DemoTimeline.WITHIN_WEEK]: LeadTimeline.WITHIN_MONTH,
      [DemoTimeline.WITHIN_MONTH]: LeadTimeline.WITHIN_MONTH,
      [DemoTimeline.WITHIN_QUARTER]: LeadTimeline.WITHIN_QUARTER,
      [DemoTimeline.EXPLORING]: LeadTimeline.EXPLORING,
    };

    let qualified = false;

    // Sync to HubSpot
    try {
      const hubSpotResult = await this.hubSpotService.syncLead(
        {
          email: request.email,
          firstName,
          lastName,
          company: request.company,
          useCase: request.useCase,
          timeline: timelineMap[request.timeline],
          companySize: companySizeMap[request.companySize],
          message: this.formatMessage(request),
          source: 'demo_request_form',
        },
        'demo',
      );

      qualified = hubSpotResult.qualification.qualified;

      if (hubSpotResult.contactId) {
        this.logger.log(
          `Demo request ${referenceId} synced to HubSpot: ${hubSpotResult.contactId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to sync demo request ${referenceId} to HubSpot:`,
        error,
      );
      // Continue even if HubSpot sync fails
    }

    // Send notification email to internal team
    try {
      await this.sendInternalNotification(request, referenceId, qualified);
    } catch (error) {
      this.logger.error(
        `Failed to send notification email for demo request ${referenceId}:`,
        error,
      );
      // Continue even if email fails
    }

    // Queue confirmation email to the requester
    try {
      await this.queueConfirmationEmail(request, referenceId, qualified);
    } catch (error) {
      this.logger.error(
        `Failed to queue confirmation email for demo request ${referenceId}:`,
        error,
      );
      // Continue even if email queuing fails
    }

    return {
      success: true,
      message: this.getConfirmationMessage(qualified),
      referenceId,
      qualified,
    };
  }

  /**
   * Format additional message with demo request details
   */
  private formatMessage(request: DemoRequestInput): string {
    const parts: string[] = [];

    parts.push(`Use Case: ${request.useCase}`);
    parts.push(`Industry: ${request.industry}`);
    parts.push(`Timeline: ${request.timeline}`);

    if (request.budget) {
      parts.push(`Budget: ${request.budget}`);
    }

    if (request.preferredDemoTime) {
      parts.push(`Preferred Time: ${request.preferredDemoTime}`);
    }

    return parts.join('\n');
  }

  /**
   * Send notification email to internal team about new demo request
   */
  private async sendInternalNotification(
    request: DemoRequestInput,
    referenceId: string,
    qualified: boolean,
  ): Promise<void> {
    const subject = qualified
      ? `🔥 Qualified Demo Request: ${request.company}`
      : `New Demo Request: ${request.company}`;

    const qualificationStatus = qualified ? '✅ QUALIFIED' : '⏳ Standard';

    const emailContent = {
      to: this.internalNotificationEmail,
      subject,
      template: EmailTemplateType.SYSTEM_NOTIFICATION,
      templateData: {
        title: 'New Demo Request',
        message: `
          <h2>Demo Request Details</h2>
          <p><strong>Reference ID:</strong> ${referenceId}</p>
          <p><strong>Qualification:</strong> ${qualificationStatus}</p>

          <h3>Contact Information</h3>
          <ul>
            <li><strong>Name:</strong> ${request.fullName}</li>
            <li><strong>Email:</strong> ${request.email}</li>
            <li><strong>Company:</strong> ${request.company}</li>
            <li><strong>Company Size:</strong> ${request.companySize}</li>
            <li><strong>Industry:</strong> ${request.industry}</li>
          </ul>

          <h3>Request Details</h3>
          <ul>
            <li><strong>Use Case:</strong> ${request.useCase}</li>
            <li><strong>Timeline:</strong> ${request.timeline}</li>
            ${request.budget ? `<li><strong>Budget:</strong> ${request.budget}</li>` : ''}
            ${request.preferredDemoTime ? `<li><strong>Preferred Time:</strong> ${request.preferredDemoTime}</li>` : ''}
          </ul>
        `.replace(/\s+/g, ' '),
        actionUrl: `mailto:${request.email}`,
        actionText: 'Contact Lead',
      },
    };

    await this.emailSenderService.sendEmail(emailContent);
    this.logger.log(
      `Notification email sent for demo request ${referenceId} to ${this.internalNotificationEmail}`,
    );
  }

  /**
   * Get confirmation message based on qualification status
   */
  private getConfirmationMessage(qualified: boolean): string {
    if (qualified) {
      return 'Thank you for your interest! Your request has been received and our team will contact you within 24 hours to schedule your personalized demo.';
    }
    return 'Thank you for your interest! We have received your request and a team member will reach out to you shortly to discuss your needs and schedule a demo.';
  }

  /**
   * Queue confirmation email to the requester
   * Sent asynchronously via the email queue
   */
  private async queueConfirmationEmail(
    request: DemoRequestInput,
    referenceId: string,
    qualified: boolean,
  ): Promise<void> {
    const nameParts = request.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';

    await this.emailProducer.queueEmail({
      to: request.email,
      subject: 'Thank You for Your Demo Request - Legal AI Platform',
      template: EmailTemplateType.DEMO_REQUEST_CONFIRMATION,
      templateData: {
        firstName,
        email: request.email,
        company: request.company,
        referenceId,
        qualified,
        timeline: request.timeline,
        frontendUrl: this.configService.get<string>(
          'FRONTEND_URL',
          'http://localhost:3000',
        ),
      },
      metadata: {
        eventType: 'demo.request.submitted',
        referenceId,
        qualified,
        company: request.company,
      },
    });

    this.logger.log(
      `Confirmation email queued for demo request ${referenceId} to ${request.email}`,
    );
  }
}
