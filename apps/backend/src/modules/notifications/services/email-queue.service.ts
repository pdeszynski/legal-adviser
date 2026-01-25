/**
 * Email Queue Service
 *
 * Service for queueing email operations via Temporal workflows.
 * Previously supported both Bull and Temporal backends - now Temporal-only.
 *
 * Migration complete: All email queueing now uses Temporal workflows.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailSendingStarter } from '../../temporal/workflows/notification/email-sending.starter';
import { EmailJobData } from '../dto/send-email.input';

/**
 * Queue Email Request
 *
 * Input parameters for queueing a single email.
 */
export interface QueueEmailRequest {
  /** Recipient email address */
  to: string;
  /** Email subject line */
  subject: string;
  /** Email template type */
  template: string;
  /** Template data for variable substitution */
  templateData?: Record<string, unknown>;
  /** User ID associated with this email */
  userId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Queue statistics interface
 */
export interface EmailQueueStats {
  active: number;
  completed: number;
  failed: number;
}

/**
 * Email Queue Service
 *
 * Provides interface for email queue operations via Temporal.
 */
@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly emailSendingStarter: EmailSendingStarter,
  ) {
    this.logger.log('Email queue backend: Temporal');
  }

  /**
   * Get the current backend being used
   */
  getBackend(): string {
    return 'temporal';
  }

  /**
   * Check if using Temporal backend
   */
  isTemporal(): boolean {
    return true;
  }

  /**
   * Queue a single email for sending
   *
   * @param jobData - Email job data
   * @returns Promise that resolves when the email is queued
   */
  async queueEmail(jobData: EmailJobData): Promise<void> {
    try {
      await this.emailSendingStarter.queueEmail({
        to: jobData.to,
        subject: jobData.subject,
        template: jobData.template,
        templateData: jobData.templateData,
        userId: jobData.userId,
        metadata: jobData.metadata,
      });
      this.logger.debug(`Email queued via Temporal for ${jobData.to}`);
    } catch (error) {
      this.logger.error('Failed to queue email via Temporal:', error);
      throw error;
    }
  }

  /**
   * Queue multiple emails for sending
   *
   * @param jobsData - Array of email job data
   * @returns Promise that resolves when the emails are queued
   */
  async queueBulkEmails(jobsData: EmailJobData[]): Promise<void> {
    try {
      await this.emailSendingStarter.queueBulkEmails({
        emails: jobsData.map((job) => ({
          to: job.to,
          subject: job.subject,
          template: job.template,
          templateData: job.templateData,
          userId: job.userId,
          metadata: job.metadata,
        })),
      });
      this.logger.debug(`${jobsData.length} emails queued via Temporal`);
    } catch (error) {
      this.logger.error('Failed to queue bulk emails via Temporal:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   *
   * @returns Queue statistics from Temporal
   */
  async getQueueStats(): Promise<EmailQueueStats> {
    try {
      const stats = await this.emailSendingStarter.getQueueStats();
      return {
        active: stats.active,
        completed: stats.completed,
        failed: stats.failed,
      };
    } catch (error) {
      this.logger.error('Failed to get Temporal queue stats:', error);
      return { active: 0, completed: 0, failed: 0 };
    }
  }
}
