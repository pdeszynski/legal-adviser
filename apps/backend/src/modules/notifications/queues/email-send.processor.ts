import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QUEUE_NAMES } from '../../../shared/queues/base/queue-names';
import { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';
import { EmailJobData } from '../dto/send-email.input';
import { EmailSenderService } from '../services/email-sender.service';
import { NotificationService } from '../services/notification.service';
import { NotificationStatus } from '../entities/notification.entity';

/**
 * Email send queue processor
 * Processes email sending jobs from the queue
 */
@Injectable()
export class EmailSendProcessor implements OnModuleInit {
  private readonly logger = new Logger(EmailSendProcessor.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL.SEND)
    private readonly emailQueue: Queue<EmailJobData>,
    private readonly emailSenderService: EmailSenderService,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Initialize queue processor on module init
   */
  onModuleInit() {
    this.emailQueue.process(this.processEmailJob.bind(this));
    this.logger.log('Email send queue processor initialized');
  }

  /**
   * Process email sending job
   */
  private async processEmailJob(job: Job<EmailJobData>): Promise<void> {
    const { data } = job;
    this.logger.log(
      `Processing email job ${job.id} - Sending to: ${data.to}, Subject: ${data.subject}`,
    );

    let notificationId: string | undefined;

    try {
      // Create notification record
      const notification =
        await this.notificationService.createNotification(data);
      notificationId = notification.id;

      // Update to queued status
      await this.notificationService.updateNotificationStatus(
        notificationId,
        NotificationStatus.QUEUED,
      );

      // Emit event
      this.eventEmitter.emit(EVENT_PATTERNS.EMAIL.QUEUED, {
        jobId: job.id,
        to: data.to,
        subject: data.subject,
        template: data.template,
        notificationId,
      });

      // Send email
      const result = await this.emailSenderService.sendEmail(data);

      if (result.success) {
        // Update notification as sent
        await this.notificationService.updateNotificationStatus(
          notificationId,
          NotificationStatus.SENT,
          result.messageId,
        );

        // Emit success event
        this.eventEmitter.emit(EVENT_PATTERNS.EMAIL.SENT, {
          jobId: job.id,
          to: data.to,
          messageId: result.messageId,
          notificationId,
        });

        this.logger.log(`Email job ${job.id} completed successfully`);
      } else {
        // Update notification as failed
        await this.notificationService.updateNotificationStatus(
          notificationId,
          NotificationStatus.FAILED,
          undefined,
          result.error,
        );

        // Emit failure event
        this.eventEmitter.emit(EVENT_PATTERNS.EMAIL.FAILED, {
          jobId: job.id,
          to: data.to,
          error: result.error,
          notificationId,
        });

        throw new Error(result.error || 'Email sending failed');
      }
    } catch (error) {
      this.logger.error(`Email job ${job.id} failed:`, error.message);

      // Update notification if we have the ID
      if (notificationId) {
        await this.notificationService.updateNotificationStatus(
          notificationId,
          NotificationStatus.FAILED,
          undefined,
          error.message,
        );
      }

      // Emit failure event
      this.eventEmitter.emit(EVENT_PATTERNS.EMAIL.FAILED, {
        jobId: job.id,
        to: data.to,
        error: error.message,
        notificationId,
      });

      throw error; // Re-throw to mark job as failed in Bull
    }
  }
}
