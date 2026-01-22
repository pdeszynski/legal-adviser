import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';
import {
  Notification,
  NotificationStatus,
} from '../entities/notification.entity';
import { EmailJobData } from '../dto/send-email.input';

/**
 * Notification service for managing notification records
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a notification record
   */
  async createNotification(jobData: EmailJobData): Promise<Notification> {
    try {
      const notification = this.notificationRepository.create({
        recipientEmail: jobData.to,
        userId: jobData.userId,
        subject: jobData.subject,
        template: jobData.template,
        templateData: jobData.templateData
          ? JSON.stringify(jobData.templateData)
          : undefined,
        metadata: jobData.metadata
          ? JSON.stringify(jobData.metadata)
          : undefined,
        status: NotificationStatus.PENDING,
      });

      const saved = await this.notificationRepository.save(notification);

      this.eventEmitter.emit(EVENT_PATTERNS.NOTIFICATION.CREATED, {
        notificationId: saved.id,
        recipientEmail: saved.recipientEmail,
        userId: saved.userId,
      });

      return saved;
    } catch (error) {
      this.logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Update notification status
   */
  async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus,
    messageId?: string,
    errorMessage?: string,
  ): Promise<void> {
    try {
      const updateData: Partial<Notification> = {
        status,
        messageId,
        errorMessage,
      };

      if (status === NotificationStatus.SENT) {
        updateData.sentAt = new Date();
      }

      await this.notificationRepository.update(notificationId, updateData);

      if (status === NotificationStatus.SENT) {
        this.eventEmitter.emit(EVENT_PATTERNS.NOTIFICATION.EMAIL_SENT, {
          notificationId,
          messageId,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to update notification ${notificationId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Find notification by ID
   */
  async findById(id: string): Promise<Notification | null> {
    return this.notificationRepository.findOne({ where: { id } });
  }

  /**
   * Find notifications by user ID
   */
  async findByUserId(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find notifications by email
   */
  async findByEmail(email: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { recipientEmail: email },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find notification by message ID
   */
  async findByMessageId(messageId: string): Promise<Notification | null> {
    return this.notificationRepository.findOne({ where: { messageId } });
  }

  /**
   * Update notification with partial data
   */
  async updateNotification(
    notificationId: string,
    data: Partial<Notification>,
  ): Promise<void> {
    try {
      await this.notificationRepository.update(notificationId, data);
    } catch (error) {
      this.logger.error(
        `Failed to update notification ${notificationId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getStatistics(): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
  }> {
    const [total, sent, failed, pending] = await Promise.all([
      this.notificationRepository.count(),
      this.notificationRepository.count({
        where: { status: NotificationStatus.SENT },
      }),
      this.notificationRepository.count({
        where: { status: NotificationStatus.FAILED },
      }),
      this.notificationRepository.count({
        where: { status: NotificationStatus.PENDING },
      }),
    ]);

    return { total, sent, failed, pending };
  }
}
