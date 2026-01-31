import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Notification } from './entities/notification.entity';
import { InAppNotification } from './entities/in-app-notification.entity';
import { NotificationService } from './services/notification.service';
import { EmailSenderService } from './services/email-sender.service';
import { EmailTemplatesService } from './services/email-templates.service';
import { NotificationManagerService } from './services/notification-manager.service';
import { EmailQueueService } from './services/email-queue.service';
import { EmailNotificationListener } from './listeners/email-notification.listener';
import { SendGridWebhookController } from './controllers/sendgrid-webhook.controller';
import { NotificationManagerResolver } from './notification-manager.resolver';
import { InAppNotificationSubscriptionResolver } from './in-app-notification-subscription.resolver';
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import {
  CreateInAppNotificationInput,
  UpdateInAppNotificationInput,
} from './dto/in-app-notification.dto';
import {
  CreateNotificationInput,
  UpdateNotificationInput,
} from './dto/notification-crud.dto';
import { TemporalModule } from '../temporal/temporal.module';
import { EmailSendingStarter } from '../temporal/workflows/notification/email-sending.starter';

/**
 * Notifications Module
 * Handles email notifications and in-app notifications
 *
 * Features:
 * - Email sending via SendGrid
 * - Email templates for various notification types
 * - Queue-based email processing via Temporal
 * - Event-driven notifications
 * - Notification tracking and history
 * - SendGrid webhook handling for delivery tracking and bounces
 * - In-app notifications with read status tracking
 * - Type-based categorization (info, success, warning, error, system)
 * - Action links for navigation
 * - Unified notification manager with delivery rules
 * - Template-based notification system
 * - User notification preferences
 * - Bulk notification support
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Notification, InAppNotification]),
    // Temporal module for email workflows
    TemporalModule,
    // nestjs-query auto-generated CRUD resolvers for InAppNotification and Notification
    NestjsQueryGraphQLModule.forFeature({
      imports: [
        NestjsQueryTypeOrmModule.forFeature([InAppNotification, Notification]),
      ],
      resolvers: [
        {
          DTOClass: InAppNotification,
          EntityClass: InAppNotification,
          CreateDTOClass: CreateInAppNotificationInput,
          UpdateDTOClass: UpdateInAppNotificationInput,
          enableTotalCount: true,
          enableAggregate: true,
          read: {
            // Enable standard read operations
            many: { name: 'inAppNotifications' },
            one: { name: 'inAppNotification' },
          },
          create: {
            // Enable create mutation
            one: { name: 'createOneInAppNotification' },
            many: { disabled: true },
          },
          update: {
            // Enable update mutation
            one: { name: 'updateOneInAppNotification' },
            many: { disabled: true },
          },
          delete: {
            // Enable delete mutation
            one: { name: 'deleteOneInAppNotification' },
            many: { disabled: true },
          },
        },
        {
          DTOClass: Notification,
          EntityClass: Notification,
          CreateDTOClass: CreateNotificationInput,
          UpdateDTOClass: UpdateNotificationInput,
          enableTotalCount: true,
          enableAggregate: true,
          read: {
            // Enable standard read operations
            many: { name: 'notifications' },
            one: { name: 'notification' },
          },
          create: {
            // Enable create mutation
            one: { name: 'createOneNotification' },
            many: { disabled: true },
          },
          update: {
            // Enable update mutation
            one: { name: 'updateOneNotification' },
            many: { disabled: true },
          },
          delete: {
            // Disable delete - notifications should not be deleted for audit purposes
            one: { disabled: true },
            many: { disabled: true },
          },
        },
      ],
    }),
  ],
  controllers: [SendGridWebhookController],
  providers: [
    // Services
    NotificationService,
    EmailSenderService,
    EmailTemplatesService,
    NotificationManagerService,
    EmailQueueService,

    // Temporal workflow starter
    EmailSendingStarter,

    // Event Listeners
    EmailNotificationListener,

    // Resolvers
    NotificationManagerResolver,
    InAppNotificationSubscriptionResolver,
  ],
  exports: [
    NotificationService,
    EmailQueueService,
    EmailSendingStarter,
    EmailSenderService,
    NotificationManagerService,
  ],
})
export class NotificationsModule {}
