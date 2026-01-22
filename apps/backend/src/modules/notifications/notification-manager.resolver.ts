import {
  Resolver,
  Mutation,
  Query,
  Args,
  Context,
  ObjectType,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationManagerService } from './services/notification-manager.service';
import {
  SendNotificationInput,
  NotificationDeliveryPreferencesInput,
  BulkSendNotificationInput,
  SendNotificationResponse,
  BulkSendNotificationResponse,
  NotificationDeliveryPreferences,
} from './dto/notification.dto';
import { InAppNotification } from './entities/in-app-notification.entity';

/**
 * Notification Manager Resolver
 *
 * GraphQL resolver for notification management operations.
 * Provides mutations for sending notifications and managing preferences.
 */
@Resolver(() => InAppNotification)
export class NotificationManagerResolver {
  constructor(
    private readonly notificationManager: NotificationManagerService,
  ) {}

  /**
   * Send a unified notification across channels
   */
  @Mutation(() => SendNotificationResponse, {
    description: 'Send a notification to a user across specified channels',
  })
  async sendNotification(
    @Args('input') input: SendNotificationInput,
  ): Promise<SendNotificationResponse> {
    return this.notificationManager.sendNotification(input);
  }

  /**
   * Update user notification preferences
   */
  @Mutation(() => String, {
    description: 'Update notification preferences for a user',
  })
  async updateNotificationPreferences(
    @Args('input') input: NotificationDeliveryPreferencesInput,
  ): Promise<string> {
    await this.notificationManager.updatePreferences(input);
    return 'Preferences updated successfully';
  }

  /**
   * Get user notification preferences
   */
  @Query(() => NotificationDeliveryPreferences, {
    description: 'Get notification preferences for a user',
  })
  async notificationPreferences(
    @Args('userId') userId: string,
  ): Promise<NotificationDeliveryPreferences> {
    const prefs = this.notificationManager.getPreferences(userId);
    // Convert to proper output type with defaults
    return {
      userId: prefs.userId,
      emailEnabled: prefs.emailEnabled ?? true,
      inAppEnabled: prefs.inAppEnabled ?? true,
      excludeEmailTypes: prefs.excludeEmailTypes,
      excludeInAppTypes: prefs.excludeInAppTypes,
    };
  }

  /**
   * Mark notification as read
   */
  @Mutation(() => String, {
    description: 'Mark a notification as read',
  })
  async markNotificationAsRead(
    @Args('notificationId') notificationId: string,
    @Args('userId') userId: string,
  ): Promise<string> {
    await this.notificationManager.markAsRead(notificationId, userId);
    return 'Notification marked as read';
  }

  /**
   * Mark all notifications as read for a user
   */
  @Mutation(() => Number, {
    description: 'Mark all notifications as read for a user',
  })
  async markAllNotificationsAsRead(
    @Args('userId') userId: string,
  ): Promise<number> {
    return this.notificationManager.markAllAsRead(userId);
  }

  /**
   * Get unread notification count
   */
  @Query(() => Number, {
    description: 'Get count of unread notifications for a user',
  })
  async unreadNotificationCount(
    @Args('userId') userId: string,
  ): Promise<number> {
    return this.notificationManager.getUnreadCount(userId);
  }

  /**
   * Get recent notifications
   */
  @Query(() => [InAppNotification], {
    description: 'Get recent notifications for a user',
  })
  async recentNotifications(
    @Args('userId') userId: string,
    @Args('limit', { nullable: true }) limit?: number,
    @Args('unreadOnly', { nullable: true }) unreadOnly?: boolean,
  ): Promise<InAppNotification[]> {
    return this.notificationManager.getRecentNotifications(
      userId,
      limit ?? 20,
      unreadOnly ?? false,
    );
  }

  /**
   * Send bulk notifications
   */
  @Mutation(() => BulkSendNotificationResponse, {
    description: 'Send bulk notifications to multiple users',
  })
  async sendBulkNotifications(
    @Args('input') input: BulkSendNotificationInput,
  ): Promise<BulkSendNotificationResponse> {
    return this.notificationManager.sendBulkNotification(input);
  }
}
