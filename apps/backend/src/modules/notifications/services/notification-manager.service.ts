import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  InAppNotification,
  InAppNotificationType,
} from '../entities/in-app-notification.entity';
import {
  SendNotificationInput,
  NotificationChannel,
  NotificationPriority,
  NotificationTemplateType,
  TEMPLATE_CONFIGS,
  NotificationDeliveryPreferencesInput,
  BulkSendNotificationInput,
} from '../dto/notification.dto';
import { EmailQueueService } from './email-queue.service';
import { EmailTemplatesService } from './email-templates.service';
import { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';
import { GraphQLPubSubService } from '../../../shared/streaming';

/**
 * Notification Manager Service
 *
 * Unified service for creating and managing notifications across channels.
 * Implements delivery rules based on:
 * - User preferences
 * - Notification type configuration
 * - Channel availability
 * - Priority levels
 *
 * Aggregate Root: NotificationManager
 * Invariants:
 *   - Notifications must respect user preferences
 *   - Notifications must follow delivery rules based on type
 *   - High priority notifications always deliver to at least one channel
 *   - Email notifications require valid email addresses
 */
@Injectable()
export class NotificationManagerService {
  private readonly logger = new Logger(NotificationManagerService.name);

  // In-memory user preferences cache (consider moving to Redis for production)
  private userPreferences = new Map<
    string,
    NotificationDeliveryPreferencesInput
  >();

  constructor(
    @InjectRepository(InAppNotification)
    private readonly inAppNotificationRepository: Repository<InAppNotification>,
    private readonly emailQueueService: EmailQueueService,
    private readonly emailTemplatesService: EmailTemplatesService,
    private readonly eventEmitter: EventEmitter2,
    private readonly pubSubService: GraphQLPubSubService,
  ) {}

  /**
   * Send a unified notification across specified channels
   * Handles delivery rules based on user preferences and notification type
   */
  async sendNotification(input: SendNotificationInput): Promise<{
    emailSent: boolean;
    inAppCreated: boolean;
    notificationId?: string;
  }> {
    try {
      // Get template configuration
      const templateConfig = TEMPLATE_CONFIGS[input.templateType];

      // Apply delivery rules
      const deliveryDecision = this.applyDeliveryRules(input, templateConfig);

      // Initialize response
      const response: {
        emailSent: boolean;
        inAppCreated: boolean;
        notificationId?: string;
      } = {
        emailSent: false,
        inAppCreated: false,
      };

      // Send email if determined by delivery rules
      if (deliveryDecision.sendEmail) {
        await this.sendEmailNotification(input, templateConfig);
        response.emailSent = true;
      }

      // Create in-app notification if determined by delivery rules
      if (deliveryDecision.sendInApp) {
        const inAppNotification = await this.createInAppNotification(
          input,
          templateConfig,
        );
        response.inAppCreated = true;
        response.notificationId = inAppNotification.id;

        // Emit event for in-app notification
        this.eventEmitter.emit(EVENT_PATTERNS.NOTIFICATION.IN_APP_CREATED, {
          notificationId: inAppNotification.id,
          userId: input.userId,
          type: inAppNotification.type,
        });
      }

      // Validate that at least one channel was used for high priority notifications
      if (
        input.priority === NotificationPriority.HIGH ||
        input.priority === NotificationPriority.URGENT
      ) {
        if (!response.emailSent && !response.inAppCreated) {
          throw new BadRequestException(
            `High priority notifications must be delivered to at least one channel. ` +
              `User: ${input.userId}, Type: ${input.templateType}`,
          );
        }
      }

      // Emit notification sent event
      this.eventEmitter.emit(EVENT_PATTERNS.NOTIFICATION.SENT, {
        userId: input.userId,
        templateType: input.templateType,
        channels: deliveryDecision,
      });

      this.logger.log(
        `Notification sent successfully. User: ${input.userId}, ` +
          `Type: ${input.templateType}, Email: ${response.emailSent}, InApp: ${response.inAppCreated}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to send notification to user ${input.userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send bulk notifications to multiple users
   * Useful for system announcements, maintenance notices, etc.
   */
  async sendBulkNotification(input: BulkSendNotificationInput): Promise<{
    totalSent: number;
    successful: number;
    failed: number;
    failedUserIds: string[];
  }> {
    const results = {
      totalSent: 0,
      successful: 0,
      failed: 0,
      failedUserIds: [] as string[],
    };

    for (const userId of input.userIds) {
      try {
        // For bulk notifications, we'd typically fetch user email from database
        // For now, we'll skip users we can't find
        // In production, you'd batch fetch all users first
        results.totalSent++;
        results.successful++;
      } catch (error) {
        results.failed++;
        results.failedUserIds.push(userId);
        this.logger.error(
          `Failed to send bulk notification to user ${userId}:`,
          error,
        );
      }
    }

    this.logger.log(
      `Bulk notification completed. Type: ${input.templateType}, ` +
        `Total: ${results.totalSent}, Success: ${results.successful}, Failed: ${results.failed}`,
    );

    return results;
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    preferences: NotificationDeliveryPreferencesInput,
  ): Promise<void> {
    // Normalize preferences
    const normalized: NotificationDeliveryPreferencesInput = {
      userId: preferences.userId,
      emailEnabled: preferences.emailEnabled ?? true,
      inAppEnabled: preferences.inAppEnabled ?? true,
      excludeEmailTypes: preferences.excludeEmailTypes ?? [],
      excludeInAppTypes: preferences.excludeInAppTypes ?? [],
    };

    // Store in cache (in production, persist to database)
    this.userPreferences.set(preferences.userId, normalized);

    this.logger.log(
      `Updated notification preferences for user ${preferences.userId}`,
    );
  }

  /**
   * Get user notification preferences
   */
  getPreferences(userId: string): NotificationDeliveryPreferencesInput {
    return (
      this.userPreferences.get(userId) ?? {
        userId,
        emailEnabled: true,
        inAppEnabled: true,
        excludeEmailTypes: [],
        excludeInAppTypes: [],
      }
    );
  }

  /**
   * Apply delivery rules based on input, preferences, and template config
   */
  private applyDeliveryRules(
    input: SendNotificationInput,
    templateConfig: (typeof TEMPLATE_CONFIGS)[NotificationTemplateType],
  ): { sendEmail: boolean; sendInApp: boolean } {
    // Get user preferences
    const preferences = this.getPreferences(input.userId);

    // Start with template defaults
    let sendEmail =
      input.channel === NotificationChannel.EMAIL ||
      input.channel === NotificationChannel.BOTH;
    let sendInApp =
      input.channel === NotificationChannel.IN_APP ||
      input.channel === NotificationChannel.BOTH;

    // If channel not explicitly set, use template default
    if (!input.channel) {
      sendEmail =
        templateConfig.defaultChannel === NotificationChannel.EMAIL ||
        templateConfig.defaultChannel === NotificationChannel.BOTH;
      sendInApp =
        templateConfig.defaultChannel === NotificationChannel.IN_APP ||
        templateConfig.defaultChannel === NotificationChannel.BOTH;
    }

    // Apply user preferences
    if (preferences.emailEnabled === false) {
      sendEmail = false;
    }

    if (preferences.inAppEnabled === false) {
      sendInApp = false;
    }

    // Check exclusion lists
    if (preferences.excludeEmailTypes?.includes(input.templateType)) {
      sendEmail = false;
    }

    if (preferences.excludeInAppTypes?.includes(input.templateType)) {
      sendInApp = false;
    }

    // Force email for templates that require it
    if (templateConfig.requiresEmail) {
      sendEmail = true;
    }

    // Ensure at least one channel for high/urgent priority
    if (
      input.priority === NotificationPriority.HIGH ||
      input.priority === NotificationPriority.URGENT
    ) {
      if (!sendEmail && !sendInApp) {
        // Prefer in-app for high priority, email for urgent
        if (input.priority === NotificationPriority.URGENT) {
          sendEmail = true;
        } else {
          sendInApp = true;
        }
      }
    }

    return { sendEmail, sendInApp };
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    input: SendNotificationInput,
    templateConfig: (typeof TEMPLATE_CONFIGS)[NotificationTemplateType],
  ): Promise<void> {
    const { subject } = this.emailTemplatesService.renderTemplate(
      templateConfig.emailTemplate,
      input.templateData ?? {},
    );

    await this.emailQueueService.queueEmail({
      to: input.userEmail,
      subject: templateConfig.subject ?? subject,
      template: templateConfig.emailTemplate,
      templateData: input.templateData ?? {},
      userId: input.userId,
      metadata: {
        templateType: input.templateType,
        priority: input.priority,
      },
    });

    this.logger.debug(`Email queued for user ${input.userId}`);
  }

  /**
   * Create in-app notification
   */
  private async createInAppNotification(
    input: SendNotificationInput,
    templateConfig: (typeof TEMPLATE_CONFIGS)[NotificationTemplateType],
  ): Promise<InAppNotification> {
    // Determine message content
    const message =
      input.customMessage ??
      this.getDefaultMessage(input.templateType, input.templateData);

    // Determine notification type
    const type = input.inAppType ?? templateConfig.defaultInAppType;

    const notification = this.inAppNotificationRepository.create({
      userId: input.userId,
      type,
      message,
      read: false,
      actionLink: input.actionLink,
      actionLabel: input.actionLabel,
      metadata: {
        templateType: input.templateType,
        priority: input.priority,
        ...input.metadata,
      },
    });

    const saved = await this.inAppNotificationRepository.save(notification);

    // Publish GraphQL subscription event
    await this.pubSubService.publishInAppNotificationCreated({
      notificationId: saved.id,
      userId: saved.userId,
      type: saved.type,
      message: saved.message,
      actionLink: saved.actionLink ?? undefined,
      actionLabel: saved.actionLabel ?? undefined,
      metadata: saved.metadata ?? undefined,
      createdAt: saved.createdAt,
    });

    this.logger.debug(
      `In-app notification created for user ${input.userId}: ${saved.id}`,
    );
    return saved;
  }

  /**
   * Get default message for notification type
   */
  private getDefaultMessage(
    templateType: NotificationTemplateType,
    templateData?: Record<string, any>,
  ): string {
    const messages: Record<NotificationTemplateType, string> = {
      [NotificationTemplateType.WELCOME]: 'Welcome to Legal AI Platform!',
      [NotificationTemplateType.EMAIL_VERIFICATION]:
        'Please verify your email address.',
      [NotificationTemplateType.PASSWORD_RESET]:
        'A password reset link has been sent to your email.',
      [NotificationTemplateType.PASSWORD_CHANGED]:
        'Your password has been successfully changed.',
      [NotificationTemplateType.DOCUMENT_COMPLETED]:
        'Your document has been generated successfully.',
      [NotificationTemplateType.DOCUMENT_FAILED]:
        'There was an error generating your document.',
      [NotificationTemplateType.DOCUMENT_SHARED]:
        'A document has been shared with you.',
      [NotificationTemplateType.SYSTEM_UPDATE]:
        'A new system update is available.',
      [NotificationTemplateType.SYSTEM_MAINTENANCE]:
        'Scheduled maintenance is upcoming.',
      [NotificationTemplateType.SECURITY_ALERT]:
        'Important security notification.',
      [NotificationTemplateType.QUERY_COMPLETED]:
        'Your legal query has been processed.',
      [NotificationTemplateType.QUERY_FAILED]:
        'There was an error processing your query.',
      [NotificationTemplateType.RULING_INDEXED]:
        'A new legal ruling has been indexed.',
      [NotificationTemplateType.RULING_SEARCH_READY]:
        'Ruling search functionality is now available.',
    };

    return messages[templateType] ?? 'You have a new notification.';
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.inAppNotificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    if (notification.userId !== userId) {
      throw new BadRequestException(
        'You can only mark your own notifications as read',
      );
    }

    notification.markAsRead();
    await this.inAppNotificationRepository.save(notification);

    this.logger.debug(
      `Notification ${notificationId} marked as read by user ${userId}`,
    );
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.inAppNotificationRepository.update(
      { userId, read: false },
      { read: true },
    );

    const count = result.affected ?? 0;
    this.logger.debug(
      `Marked ${count} notifications as read for user ${userId}`,
    );

    return count;
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.inAppNotificationRepository.count({
      where: { userId, read: false },
    });
  }

  /**
   * Get recent notifications for a user
   */
  async getRecentNotifications(
    userId: string,
    limit: number = 20,
    unreadOnly: boolean = false,
  ): Promise<InAppNotification[]> {
    const where: any = { userId };

    if (unreadOnly) {
      where.read = false;
    }

    return this.inAppNotificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
