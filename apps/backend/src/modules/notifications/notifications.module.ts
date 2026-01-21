import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { QUEUE_NAMES } from '../../shared/queues/base/queue-names';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './services/notification.service';
import { EmailSenderService } from './services/email-sender.service';
import { EmailTemplatesService } from './services/email-templates.service';
import { EmailSendProcessor } from './queues/email-send.processor';
import { EmailSendProducer } from './queues/email-send.producer';
import { EmailNotificationListener } from './listeners/email-notification.listener';
import { SendGridWebhookController } from './controllers/sendgrid-webhook.controller';

/**
 * Notifications Module
 * Handles email notifications and system notifications
 *
 * Features:
 * - Email sending via SendGrid
 * - Email templates for various notification types
 * - Queue-based email processing
 * - Event-driven notifications
 * - Notification tracking and history
 * - SendGrid webhook handling for delivery tracking and bounces
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Notification]),
    BullModule.registerQueue({
      name: QUEUE_NAMES.EMAIL.SEND,
    }),
  ],
  controllers: [SendGridWebhookController],
  providers: [
    // Services
    NotificationService,
    EmailSenderService,
    EmailTemplatesService,

    // Queue
    EmailSendProcessor,
    EmailSendProducer,

    // Event Listeners
    EmailNotificationListener,
  ],
  exports: [
    NotificationService,
    EmailSendProducer,
    EmailSenderService,
  ],
})
export class NotificationsModule {}
