import {
  InputType,
  Field,
  Int,
  ArgsType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  IsEnum,
  IsUUID,
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsNotEmpty,
  IsArray,
} from 'class-validator';
import { InAppNotificationType } from '../entities/in-app-notification.entity';
import { EmailTemplateType } from './send-email.input';

/**
 * Notification channel types
 */
export enum NotificationChannel {
  EMAIL = 'email',
  IN_APP = 'in_app',
  BOTH = 'both',
}

/**
 * Priority levels for notifications
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Notification template types with predefined configurations
 */
export enum NotificationTemplateType {
  // User notifications
  WELCOME = 'welcome',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  PASSWORD_CHANGED = 'password_changed',

  // Document notifications
  DOCUMENT_COMPLETED = 'document_completed',
  DOCUMENT_FAILED = 'document_failed',
  DOCUMENT_SHARED = 'document_shared',

  // System notifications
  SYSTEM_UPDATE = 'system_update',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SECURITY_ALERT = 'security_alert',

  // AI Query notifications
  QUERY_COMPLETED = 'query_completed',
  QUERY_FAILED = 'query_failed',

  // Legal Ruling notifications
  RULING_INDEXED = 'ruling_indexed',
  RULING_SEARCH_READY = 'ruling_search_ready',
}

registerEnumType(NotificationChannel, {
  name: 'NotificationChannel',
  description: 'Notification channel types',
});

registerEnumType(NotificationPriority, {
  name: 'NotificationPriority',
  description: 'Priority levels for notifications',
});

registerEnumType(NotificationTemplateType, {
  name: 'NotificationTemplateType',
  description: 'Notification template types',
});

/**
 * DTO for sending a unified notification
 * Handles both email and in-app notifications based on delivery rules
 */
@InputType()
export class SendNotificationInput {
  @Field(() => String, { description: 'User ID to receive the notification' })
  @IsUUID('4', { message: 'User ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @Field(() => String, { description: 'User email address' })
  @IsString()
  @IsNotEmpty({ message: 'Email is required' })
  userEmail: string;

  @Field(() => NotificationTemplateType, {
    description: 'Type of notification template to use',
  })
  @IsEnum(NotificationTemplateType, {
    message: 'Template type must be a valid notification type',
  })
  templateType: NotificationTemplateType;

  @Field(() => NotificationChannel, {
    description: 'Channel to send notification through',
    nullable: true,
    defaultValue: NotificationChannel.BOTH,
  })
  @IsOptional()
  @IsEnum(NotificationChannel, {
    message: 'Channel must be one of: email, in_app, both',
  })
  channel?: NotificationChannel;

  @Field(() => NotificationPriority, {
    description: 'Priority level of the notification',
    nullable: true,
    defaultValue: NotificationPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(NotificationPriority, {
    message: 'Priority must be one of: low, normal, high, urgent',
  })
  priority?: NotificationPriority;

  @Field(() => String, {
    description: 'Data for template rendering (JSON string)',
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  templateData?: Record<string, any>;

  @Field(() => String, {
    description: 'Optional custom message for in-app notification',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  customMessage?: string;

  @Field(() => InAppNotificationType, {
    description: 'Type of in-app notification for UI styling',
    nullable: true,
  })
  @IsOptional()
  @IsEnum(InAppNotificationType, {
    message: 'Type must be one of: info, success, warning, error, system',
  })
  inAppType?: InAppNotificationType;

  @Field(() => String, {
    description: 'Optional action link for navigation',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  actionLink?: string;

  @Field(() => String, {
    description: 'Optional action label for the action link button',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  actionLabel?: string;

  @Field(() => String, {
    description: 'Additional metadata for tracking',
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Template configuration mapping
 * Maps template types to their default configurations
 */
export const TEMPLATE_CONFIGS: Record<
  NotificationTemplateType,
  {
    emailTemplate: EmailTemplateType;
    defaultInAppType: InAppNotificationType;
    defaultChannel: NotificationChannel;
    requiresEmail: boolean;
    subject?: string;
  }
> = {
  [NotificationTemplateType.WELCOME]: {
    emailTemplate: EmailTemplateType.WELCOME,
    defaultInAppType: InAppNotificationType.SUCCESS,
    defaultChannel: NotificationChannel.BOTH,
    requiresEmail: true,
  },
  [NotificationTemplateType.EMAIL_VERIFICATION]: {
    emailTemplate: EmailTemplateType.SYSTEM_NOTIFICATION,
    defaultInAppType: InAppNotificationType.INFO,
    defaultChannel: NotificationChannel.EMAIL,
    requiresEmail: true,
    subject: 'Verify Your Email Address',
  },
  [NotificationTemplateType.PASSWORD_RESET]: {
    emailTemplate: EmailTemplateType.SYSTEM_NOTIFICATION,
    defaultInAppType: InAppNotificationType.WARNING,
    defaultChannel: NotificationChannel.EMAIL,
    requiresEmail: true,
    subject: 'Reset Your Password',
  },
  [NotificationTemplateType.PASSWORD_CHANGED]: {
    emailTemplate: EmailTemplateType.SYSTEM_NOTIFICATION,
    defaultInAppType: InAppNotificationType.SUCCESS,
    defaultChannel: NotificationChannel.BOTH,
    requiresEmail: true,
    subject: 'Your Password Has Been Changed',
  },
  [NotificationTemplateType.DOCUMENT_COMPLETED]: {
    emailTemplate: EmailTemplateType.DOCUMENT_COMPLETED,
    defaultInAppType: InAppNotificationType.SUCCESS,
    defaultChannel: NotificationChannel.BOTH,
    requiresEmail: false,
  },
  [NotificationTemplateType.DOCUMENT_FAILED]: {
    emailTemplate: EmailTemplateType.DOCUMENT_FAILED,
    defaultInAppType: InAppNotificationType.ERROR,
    defaultChannel: NotificationChannel.BOTH,
    requiresEmail: false,
  },
  [NotificationTemplateType.DOCUMENT_SHARED]: {
    emailTemplate: EmailTemplateType.SYSTEM_NOTIFICATION,
    defaultInAppType: InAppNotificationType.INFO,
    defaultChannel: NotificationChannel.IN_APP,
    requiresEmail: false,
    subject: 'Document Shared With You',
  },
  [NotificationTemplateType.SYSTEM_UPDATE]: {
    emailTemplate: EmailTemplateType.SYSTEM_NOTIFICATION,
    defaultInAppType: InAppNotificationType.INFO,
    defaultChannel: NotificationChannel.IN_APP,
    requiresEmail: false,
    subject: 'System Update',
  },
  [NotificationTemplateType.SYSTEM_MAINTENANCE]: {
    emailTemplate: EmailTemplateType.SYSTEM_NOTIFICATION,
    defaultInAppType: InAppNotificationType.WARNING,
    defaultChannel: NotificationChannel.BOTH,
    requiresEmail: false,
    subject: 'Scheduled Maintenance',
  },
  [NotificationTemplateType.SECURITY_ALERT]: {
    emailTemplate: EmailTemplateType.SYSTEM_NOTIFICATION,
    defaultInAppType: InAppNotificationType.ERROR,
    defaultChannel: NotificationChannel.BOTH,
    requiresEmail: true,
    subject: 'Security Alert',
  },
  [NotificationTemplateType.QUERY_COMPLETED]: {
    emailTemplate: EmailTemplateType.SYSTEM_NOTIFICATION,
    defaultInAppType: InAppNotificationType.SUCCESS,
    defaultChannel: NotificationChannel.IN_APP,
    requiresEmail: false,
    subject: 'Your Legal Query is Ready',
  },
  [NotificationTemplateType.QUERY_FAILED]: {
    emailTemplate: EmailTemplateType.SYSTEM_NOTIFICATION,
    defaultInAppType: InAppNotificationType.ERROR,
    defaultChannel: NotificationChannel.IN_APP,
    requiresEmail: false,
    subject: 'Query Processing Failed',
  },
  [NotificationTemplateType.RULING_INDEXED]: {
    emailTemplate: EmailTemplateType.SYSTEM_NOTIFICATION,
    defaultInAppType: InAppNotificationType.INFO,
    defaultChannel: NotificationChannel.IN_APP,
    requiresEmail: false,
    subject: 'New Legal Ruling Indexed',
  },
  [NotificationTemplateType.RULING_SEARCH_READY]: {
    emailTemplate: EmailTemplateType.SYSTEM_NOTIFICATION,
    defaultInAppType: InAppNotificationType.SUCCESS,
    defaultChannel: NotificationChannel.IN_APP,
    requiresEmail: false,
    subject: 'Ruling Search is Ready',
  },
};

/**
 * User notification delivery preferences input
 */
@InputType()
export class NotificationDeliveryPreferencesInput {
  @Field(() => String, { description: 'User ID' })
  @IsUUID('4')
  userId: string;

  @Field(() => Boolean, {
    description: 'Enable email notifications',
    nullable: true,
    defaultValue: true,
  })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @Field(() => Boolean, {
    description: 'Enable in-app notifications',
    nullable: true,
    defaultValue: true,
  })
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @Field(() => [NotificationTemplateType], {
    description: 'Notification types to exclude from email',
    nullable: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationTemplateType, { each: true })
  excludeEmailTypes?: NotificationTemplateType[];

  @Field(() => [NotificationTemplateType], {
    description: 'Notification types to exclude from in-app',
    nullable: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationTemplateType, { each: true })
  excludeInAppTypes?: NotificationTemplateType[];
}

/**
 * User notification delivery preferences output type
 */
@ObjectType('NotificationDeliveryPreferences')
export class NotificationDeliveryPreferences {
  @Field(() => String, { description: 'User ID' })
  userId: string;

  @Field(() => Boolean, { description: 'Enable email notifications' })
  emailEnabled: boolean;

  @Field(() => Boolean, { description: 'Enable in-app notifications' })
  inAppEnabled: boolean;

  @Field(() => [NotificationTemplateType], {
    description: 'Notification types to exclude from email',
    nullable: true,
  })
  excludeEmailTypes?: NotificationTemplateType[];

  @Field(() => [NotificationTemplateType], {
    description: 'Notification types to exclude from in-app',
    nullable: true,
  })
  excludeInAppTypes?: NotificationTemplateType[];
}

/**
 * Bulk send notification input
 */
@InputType()
export class BulkSendNotificationInput {
  @Field(() => [String], { description: 'List of user IDs' })
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];

  @Field(() => NotificationTemplateType, {
    description: 'Type of notification template to use',
  })
  @IsEnum(NotificationTemplateType)
  templateType: NotificationTemplateType;

  @Field(() => NotificationChannel, {
    description: 'Channel to send notification through',
    nullable: true,
  })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @Field(() => String, {
    description: 'Data for template rendering (JSON string)',
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  templateData?: Record<string, any>;

  @Field(() => String, {
    description: 'Custom message override',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  customMessage?: string;
}

/**
 * Response for bulk notification send
 */
@ObjectType('BulkSendNotificationResponse')
export class BulkSendNotificationResponse {
  @Field(() => Int, { description: 'Total number of notifications sent' })
  totalSent: number;

  @Field(() => Int, { description: 'Number of successful notifications' })
  successful: number;

  @Field(() => Int, { description: 'Number of failed notifications' })
  failed: number;

  @Field(() => [String], {
    description: 'List of user IDs that failed',
    nullable: true,
  })
  failedUserIds?: string[];
}

/**
 * Response for single notification send
 */
@ObjectType('SendNotificationResponse')
export class SendNotificationResponse {
  @Field(() => Boolean, {
    description: 'Whether the email notification was sent',
  })
  emailSent: boolean;

  @Field(() => Boolean, {
    description: 'Whether the in-app notification was created',
  })
  inAppCreated: boolean;

  @Field(() => String, {
    description: 'ID of the created in-app notification',
    nullable: true,
  })
  notificationId?: string;
}
