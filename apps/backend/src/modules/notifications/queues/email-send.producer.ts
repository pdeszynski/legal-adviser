import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { QUEUE_NAMES } from '../../../shared/queues/base/queue-names';
import { EmailJobData } from '../dto/send-email.input';

/**
 * Email send queue producer
 * Adds email sending jobs to the queue
 */
@Injectable()
export class EmailSendProducer {
  private readonly logger = new Logger(EmailSendProducer.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL.SEND)
    private readonly emailQueue: Queue<EmailJobData>,
  ) {}

  /**
   * Queue an email to be sent
   */
  async queueEmail(jobData: EmailJobData): Promise<void> {
    try {
      await this.emailQueue.add(jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      });

      this.logger.log(`Email queued for ${jobData.to}: ${jobData.subject}`);
    } catch (error) {
      this.logger.error('Failed to queue email:', error);
      throw error;
    }
  }

  /**
   * Queue multiple emails
   */
  async queueBulkEmails(jobsData: EmailJobData[]): Promise<void> {
    try {
      const jobs = jobsData.map((data) => ({
        data,
        opts: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }));

      await this.emailQueue.addBulk(jobs as any);

      this.logger.log(`${jobsData.length} emails queued for sending`);
    } catch (error) {
      this.logger.error('Failed to queue bulk emails:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const [waiting, active, completed, failed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }
}
