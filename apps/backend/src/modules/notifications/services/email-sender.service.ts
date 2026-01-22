import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { EmailJobData } from '../dto/send-email.input';
import { EmailTemplatesService } from './email-templates.service';

/**
 * Email sender service using SendGrid
 * Handles actual sending of emails through SendGrid API
 */
@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailTemplatesService: EmailTemplatesService,
  ) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.fromEmail =
      this.configService.get<string>('EMAIL_FROM_ADDRESS') ||
      'noreply@legal-ai.com';
    this.fromName =
      this.configService.get<string>('EMAIL_FROM_NAME') || 'Legal AI Platform';
    this.isEnabled =
      this.configService.get<string>('EMAIL_ENABLED', 'false') === 'true';

    if (apiKey && this.isEnabled) {
      sgMail.setApiKey(apiKey);
      this.logger.log('SendGrid email service initialized');
    } else {
      this.logger.warn(
        'SendGrid API key not configured or email service disabled. Emails will be logged but not sent.',
      );
    }
  }

  /**
   * Send an email using SendGrid
   */
  async sendEmail(jobData: EmailJobData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // Render template
      const { html, text } = this.emailTemplatesService.renderTemplate(
        jobData.template,
        jobData.templateData || {},
      );

      const msg = {
        to: jobData.to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: jobData.subject,
        text,
        html,
      };

      // If email is disabled, just log it
      if (!this.isEnabled) {
        this.logger.log(
          `[DRY RUN] Would send email to ${jobData.to}: ${jobData.subject}`,
        );
        this.logger.debug(`Email content: ${JSON.stringify(msg, null, 2)}`);
        return {
          success: true,
          messageId: `dry-run-${Date.now()}`,
        };
      }

      // Send email via SendGrid
      const response = await sgMail.send(msg);

      this.logger.log(
        `Email sent successfully to ${jobData.to}: ${jobData.subject}`,
      );

      return {
        success: true,
        messageId: response[0]?.headers?.['x-message-id'] || undefined,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${jobData.to}:`,
        error.message,
        error.stack,
      );

      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Send a test email
   */
  async sendTestEmail(to: string): Promise<boolean> {
    try {
      const result = await this.sendEmail({
        to,
        subject: 'Test Email from Legal AI Platform',
        template: 'system_notification' as any,
        templateData: {
          title: 'Test Email',
          message:
            'This is a test email to verify that the email service is working correctly.',
          actionUrl: 'http://localhost:3000',
          actionText: 'Go to Dashboard',
        },
      });

      return result.success;
    } catch (error) {
      this.logger.error('Failed to send test email:', error);
      return false;
    }
  }

  /**
   * Check if email service is enabled and configured
   */
  isConfigured(): boolean {
    return (
      this.isEnabled && !!this.configService.get<string>('SENDGRID_API_KEY')
    );
  }
}
