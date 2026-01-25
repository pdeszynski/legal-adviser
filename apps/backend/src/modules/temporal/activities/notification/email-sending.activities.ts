/**
 * Email Sending Activities
 *
 * Individual activities that can be called within workflows for email operations.
 * These activities handle template rendering, rate limiting, email sending via SendGrid,
 * delivery logging, and dead-letter queue handling.
 *
 * Activities must be deterministic and idempotent where possible.
 * All external service calls (SendGrid) are wrapped in activities.
 */

import { Logger } from '@nestjs/common';
import { EmailTemplateType } from '../../../../modules/notifications/dto/send-email.input';
import { NotificationStatus } from '../../../../modules/notifications/entities/notification.entity';

/**
 * Render Email Template Activity Input
 *
 * Input for rendering an email template with data.
 */
export interface RenderEmailTemplateInput {
  /** Email template type */
  template: EmailTemplateType;
  /** Template data for variable substitution */
  templateData?: Record<string, unknown>;
}

/**
 * Render Email Template Activity Output
 *
 * Output from rendering an email template.
 */
export interface RenderEmailTemplateOutput {
  /** Rendered HTML content */
  html: string;
  /** Rendered plain text content */
  text: string;
  /** Subject line (if available from template) */
  subject: string;
  /** Timestamp of rendering */
  renderedAt: string;
}

/**
 * Check Rate Limit Activity Input
 *
 * Input for checking if sending to an email address is rate-limited.
 */
export interface CheckRateLimitInput {
  /** Recipient email address */
  to: string;
  /** Maximum emails per time window */
  maxEmails?: number;
  /** Time window in seconds */
  timeWindowSeconds?: number;
}

/**
 * Check Rate Limit Activity Output
 *
 * Output from rate limit check.
 */
export interface CheckRateLimitOutput {
  /** Whether the email is allowed to be sent */
  allowed: boolean;
  /** Current count of emails sent in window */
  currentCount: number;
  /** Time when the rate limit window resets */
  resetAt?: string;
  /** Estimated wait time in milliseconds if not allowed */
  waitTimeMs?: number;
}

/**
 * Send Email Via Provider Activity Input
 *
 * Input for sending an email through the email provider (SendGrid).
 */
export interface SendEmailViaProviderInput {
  /** Recipient email address */
  to: string;
  /** Email subject */
  subject: string;
  /** HTML content */
  html: string;
  /** Plain text content */
  text: string;
  /** Whether this is a test/dry run */
  isTest?: boolean;
}

/**
 * Send Email Via Provider Activity Output
 *
 * Output from sending email through provider.
 */
export interface SendEmailViaProviderOutput {
  /** Whether the email was sent successfully */
  success: boolean;
  /** Message ID from provider (if successful) */
  messageId?: string;
  /** Error message (if failed) */
  error?: string;
  /** Timestamp of send attempt */
  sentAt: string;
}

/**
 * Log Delivery Status Activity Input
 *
 * Input for logging email delivery status to database.
 */
export interface LogDeliveryStatusInput {
  /** Notification ID to update */
  notificationId?: string;
  /** Recipient email address */
  to: string;
  /** Subject line */
  subject: string;
  /** Template type */
  template: EmailTemplateType;
  /** Template data */
  templateData?: Record<string, unknown>;
  /** User ID associated with email */
  userId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** New delivery status */
  status: NotificationStatus;
  /** Message ID from provider (if sent) */
  messageId?: string;
  /** Error message (if failed) */
  errorMessage?: string;
}

/**
 * Log Delivery Status Activity Output
 *
 * Output from logging delivery status.
 */
export interface LogDeliveryStatusOutput {
  /** Notification ID */
  notificationId: string;
  /** Current status */
  status: NotificationStatus;
  /** Timestamp of logging */
  loggedAt: string;
}

/**
 * Add to Dead Letter Queue Activity Input
 *
 * Input for adding a failed email to the dead-letter queue.
 */
export interface AddToDeadLetterQueueInput {
  /** Original notification ID */
  notificationId?: string;
  /** Recipient email address */
  to: string;
  /** Subject line */
  subject: string;
  /** Template type */
  template: EmailTemplateType;
  /** Template data */
  templateData?: Record<string, unknown>;
  /** Number of retry attempts made */
  retryCount: number;
  /** Final error message */
  errorMessage: string;
  /** User ID */
  userId?: string;
  /** Metadata */
  metadata?: Record<string, unknown>;
  /** Timestamp of first failure */
  firstFailedAt: string;
}

/**
 * Add to Dead Letter Queue Activity Output
 *
 * Output from adding to dead-letter queue.
 */
export interface AddToDeadLetterQueueOutput {
  /** Dead-letter entry ID */
  deadLetterId: string;
  /** Timestamp of addition */
  addedAt: string;
}

/**
 * Sleep utility for retry backoff
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Email Sending Activities Container Class
 *
 * This class contains all activity implementations for email operations.
 * Activities are registered with Temporal workers and called from workflows.
 */
export class EmailSendingActivities {
  private readonly logger = new Logger(EmailSendingActivities.name);

  // In-memory rate limit tracking (in production, use Redis)
  private readonly rateLimitMap = new Map<
    string,
    { count: number; resetAt: number }
  >();
  private readonly defaultMaxEmails = 10;
  private readonly defaultTimeWindowSeconds = 60;

  constructor(
    private readonly dependencies: {
      emailTemplatesService: {
        renderTemplate: (
          template: EmailTemplateType,
          data: Record<string, unknown>,
        ) => { subject: string; html: string; text: string };
      };
      emailSenderService: {
        sendEmail: (data: {
          to: string;
          subject: string;
          template: EmailTemplateType;
          templateData?: Record<string, unknown>;
        }) => Promise<{ success: boolean; messageId?: string; error?: string }>;
        isConfigured: () => boolean;
      };
      notificationService: {
        createNotification: (data: {
          to: string;
          subject: string;
          template: EmailTemplateType;
          templateData?: Record<string, unknown>;
          userId?: string;
          metadata?: Record<string, unknown>;
        }) => Promise<{ id: string }>;
        updateNotificationStatus: (
          notificationId: string,
          status: NotificationStatus,
          messageId?: string,
          errorMessage?: string,
        ) => Promise<void>;
      };
      deadLetterQueueService?: {
        add: (data: {
          to: string;
          subject: string;
          template: EmailTemplateType;
          templateData?: Record<string, unknown>;
          retryCount: number;
          errorMessage: string;
          userId?: string;
          metadata?: Record<string, unknown>;
          firstFailedAt: string;
        }) => Promise<{ id: string }>;
      };
      configService: {
        get: (key: string) => string | undefined;
      };
    },
  ) {}

  /**
   * Render Email Template Activity
   *
   * Renders an email template with the provided data.
   * This activity is idempotent - same inputs produce same outputs.
   */
  async renderEmailTemplate(
    input: RenderEmailTemplateInput,
  ): Promise<RenderEmailTemplateOutput> {
    this.logger.debug(`Rendering email template: ${input.template}`);

    const rendered = this.dependencies.emailTemplatesService.renderTemplate(
      input.template,
      input.templateData || {},
    );

    return {
      html: rendered.html,
      text: rendered.text,
      subject: rendered.subject,
      renderedAt: new Date().toISOString(),
    };
  }

  /**
   * Check Rate Limit Activity
   *
   * Checks if sending to the given email address is within rate limits.
   * Uses a sliding window counter approach with in-memory storage.
   *
   * In production, use Redis for distributed rate limiting.
   */
  async checkRateLimit(
    input: CheckRateLimitInput,
  ): Promise<CheckRateLimitOutput> {
    const { to, maxEmails, timeWindowSeconds } = input;
    const max = maxEmails ?? this.defaultMaxEmails;
    const windowSeconds = timeWindowSeconds ?? this.defaultTimeWindowSeconds;

    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    // Clean up expired entries
    for (const [email, data] of this.rateLimitMap.entries()) {
      if (data.resetAt < windowStart) {
        this.rateLimitMap.delete(email);
      }
    }

    // Get or create rate limit entry
    let entry = this.rateLimitMap.get(to);
    if (!entry || entry.resetAt < windowStart) {
      entry = { count: 0, resetAt: now + windowSeconds * 1000 };
      this.rateLimitMap.set(to, entry);
    }

    const allowed = entry.count < max;
    const waitTimeMs = allowed ? 0 : entry.resetAt - now;

    if (allowed) {
      // Increment counter (will be incremented when email is actually sent)
      this.logger.debug(
        `Rate limit check passed for ${to}: ${entry.count}/${max} emails`,
      );
    } else {
      this.logger.warn(
        `Rate limit exceeded for ${to}: ${entry.count}/${max} emails, wait ${waitTimeMs}ms`,
      );
    }

    return {
      allowed,
      currentCount: entry.count,
      resetAt: new Date(entry.resetAt).toISOString(),
      waitTimeMs,
    };
  }

  /**
   * Send Email Via Provider Activity
   *
   * Sends an email through the configured email provider (SendGrid).
   * This activity communicates with an external service and should have
   * appropriate retry policies configured at the workflow level.
   */
  async sendEmailViaProvider(
    input: SendEmailViaProviderInput,
  ): Promise<SendEmailViaProviderOutput> {
    const { to, subject, html, text, isTest } = input;

    this.logger.log(`Sending email to ${to}: ${subject}`);

    if (!this.dependencies.emailSenderService.isConfigured()) {
      this.logger.warn(
        'Email service not configured, returning dry-run success',
      );
      return {
        success: true,
        messageId: `dry-run-${Date.now()}`,
        sentAt: new Date().toISOString(),
      };
    }

    try {
      // For now, we use the existing EmailSenderService which handles template rendering internally
      // In the future, we may want to add a method that sends pre-rendered content
      const result = await this.dependencies.emailSenderService.sendEmail({
        to,
        subject,
        template: 'system_notification' as EmailTemplateType,
        templateData: {
          title: subject,
          message: text, // Use text content as message
          html, // Include HTML for reference
        },
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        sentAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        sentAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Log Delivery Status Activity
   *
   * Creates or updates a notification record in the database.
   * This activity is idempotent - calling multiple times with the same
   * notificationId will update the status.
   */
  async logDeliveryStatus(
    input: LogDeliveryStatusInput,
  ): Promise<LogDeliveryStatusOutput> {
    const {
      notificationId,
      to,
      subject,
      template,
      templateData,
      userId,
      metadata,
      status,
      messageId,
      errorMessage,
    } = input;

    this.logger.debug(
      `Logging delivery status for ${to}: ${status}${notificationId ? ` (notification: ${notificationId})` : ''}`,
    );

    try {
      if (notificationId) {
        // Update existing notification
        await this.dependencies.notificationService.updateNotificationStatus(
          notificationId,
          status,
          messageId,
          errorMessage,
        );

        return {
          notificationId,
          status,
          loggedAt: new Date().toISOString(),
        };
      } else {
        // Create new notification record
        const notification =
          await this.dependencies.notificationService.createNotification({
            to,
            subject,
            template,
            templateData,
            userId,
            metadata,
          });

        // Update the status if not pending
        if (status !== NotificationStatus.PENDING) {
          await this.dependencies.notificationService.updateNotificationStatus(
            notification.id,
            status,
            messageId,
            errorMessage,
          );
        }

        return {
          notificationId: notification.id,
          status,
          loggedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      this.logger.error('Failed to log delivery status:', error);
      throw error;
    }
  }

  /**
   * Add to Dead Letter Queue Activity
   *
   * Adds a permanently failed email to the dead-letter queue for manual inspection.
   * This activity should be called after all retry attempts are exhausted.
   */
  async addToDeadLetterQueue(
    input: AddToDeadLetterQueueInput,
  ): Promise<AddToDeadLetterQueueOutput> {
    const {
      notificationId,
      to,
      subject,
      template,
      templateData,
      retryCount,
      errorMessage,
      userId,
      metadata,
      firstFailedAt,
    } = input;

    this.logger.error(
      `Adding email to dead-letter queue: ${to} | ${subject} | Retries: ${retryCount} | Error: ${errorMessage}`,
    );

    if (!this.dependencies.deadLetterQueueService) {
      this.logger.warn('Dead-letter queue service not available, skipping');
      return {
        deadLetterId: notificationId || 'unknown',
        addedAt: new Date().toISOString(),
      };
    }

    try {
      const deadLetterEntry =
        await this.dependencies.deadLetterQueueService.add({
          to,
          subject,
          template,
          templateData,
          retryCount,
          errorMessage,
          userId,
          metadata,
          firstFailedAt,
        });

      return {
        deadLetterId: deadLetterEntry.id,
        addedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to add to dead-letter queue:', error);
      throw error;
    }
  }

  /**
   * Increment Rate Limit Counter
   *
   * Increments the rate limit counter for an email address after successful send.
   * This should be called after an email is successfully sent.
   */
  async incrementRateLimitCounter(to: string): Promise<void> {
    const entry = this.rateLimitMap.get(to);
    if (entry) {
      entry.count++;
    }
  }
}

/**
 * Activity registration function
 *
 * Creates and returns the activities object with all dependencies injected.
 * This function is called by the Temporal worker to register activities.
 */
export type EmailSendingActivitiesImpl = InstanceType<
  typeof EmailSendingActivities
>;

export const createEmailSendingActivities = (
  dependencies: EmailSendingActivities['dependencies'],
): EmailSendingActivities => {
  return new EmailSendingActivities(dependencies);
};
