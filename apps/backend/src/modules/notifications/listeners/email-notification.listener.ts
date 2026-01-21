import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';
import { EmailSendProducer } from '../queues/email-send.producer';
import { EmailTemplateType } from '../dto/send-email.input';

/**
 * Email notification event listener
 * Listens to domain events and triggers email notifications
 */
@Injectable()
export class EmailNotificationListener {
  private readonly logger = new Logger(EmailNotificationListener.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly emailProducer: EmailSendProducer,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  /**
   * Handle user created event - send welcome email
   */
  @OnEvent(EVENT_PATTERNS.USER.CREATED)
  async handleUserCreated(event: any) {
    try {
      this.logger.log(`Handling user.created event for user: ${event.userId}`);

      // Queue welcome email
      await this.emailProducer.queueEmail({
        to: event.email,
        subject: 'Welcome to Legal AI Platform',
        template: EmailTemplateType.WELCOME,
        templateData: {
          email: event.email,
          firstName: event.firstName,
          loginUrl: `${this.frontendUrl}/login`,
        },
        userId: event.userId,
        metadata: {
          eventType: EVENT_PATTERNS.USER.CREATED,
          eventId: event.eventId,
        },
      });

      this.logger.log(`Welcome email queued for user: ${event.userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to queue welcome email for user ${event.userId}:`,
        error,
      );
    }
  }

  /**
   * Handle document generation completed - send notification email
   */
  @OnEvent(EVENT_PATTERNS.DOCUMENT.GENERATION_COMPLETED)
  async handleDocumentGenerationCompleted(event: any) {
    try {
      this.logger.log(
        `Handling document.generation.completed event for document: ${event.documentId}`,
      );

      // We need to get user email - in production, we'd fetch from user service
      // For now, we'll use the event data if available
      if (!event.userEmail) {
        this.logger.warn(
          `No user email in event data for document ${event.documentId}, skipping email`,
        );
        return;
      }

      // Queue document completed email
      await this.emailProducer.queueEmail({
        to: event.userEmail,
        subject: 'Your Legal Document is Ready',
        template: EmailTemplateType.DOCUMENT_COMPLETED,
        templateData: {
          documentId: event.documentId,
          documentType: event.documentType,
          firstName: event.firstName,
          documentUrl: `${this.frontendUrl}/documents/show/${event.documentId}`,
        },
        userId: event.userId,
        metadata: {
          eventType: EVENT_PATTERNS.DOCUMENT.GENERATION_COMPLETED,
          eventId: event.eventId,
          documentId: event.documentId,
        },
      });

      this.logger.log(
        `Document completed email queued for document: ${event.documentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue document completed email for document ${event.documentId}:`,
        error,
      );
    }
  }

  /**
   * Handle document generation failed - send error notification
   */
  @OnEvent(EVENT_PATTERNS.DOCUMENT.GENERATION_FAILED)
  async handleDocumentGenerationFailed(event: any) {
    try {
      this.logger.log(
        `Handling document.generation.failed event for document: ${event.documentId}`,
      );

      // We need to get user email
      if (!event.userEmail) {
        this.logger.warn(
          `No user email in event data for document ${event.documentId}, skipping email`,
        );
        return;
      }

      // Queue document failed email
      await this.emailProducer.queueEmail({
        to: event.userEmail,
        subject: 'Document Generation Failed',
        template: EmailTemplateType.DOCUMENT_FAILED,
        templateData: {
          documentId: event.documentId,
          documentType: event.documentType,
          firstName: event.firstName,
          errorMessage: event.errorMessage,
        },
        userId: event.userId,
        metadata: {
          eventType: EVENT_PATTERNS.DOCUMENT.GENERATION_FAILED,
          eventId: event.eventId,
          documentId: event.documentId,
        },
      });

      this.logger.log(
        `Document failed email queued for document: ${event.documentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue document failed email for document ${event.documentId}:`,
        error,
      );
    }
  }

  /**
   * Handle document shared - send notification to shared user
   */
  @OnEvent(EVENT_PATTERNS.DOCUMENT.SHARED)
  async handleDocumentShared(event: any) {
    try {
      this.logger.log(
        `Handling document.shared event for document: ${event.documentId}`,
      );

      if (!event.sharedWithEmail) {
        this.logger.warn(
          `No shared user email in event data for document ${event.documentId}, skipping email`,
        );
        return;
      }

      // Queue document shared notification
      await this.emailProducer.queueEmail({
        to: event.sharedWithEmail,
        subject: 'A Legal Document Has Been Shared With You',
        template: EmailTemplateType.SYSTEM_NOTIFICATION,
        templateData: {
          title: 'Document Shared',
          message: `${event.ownerName || 'A user'} has shared a legal document with you. You now have ${event.permission || 'read'} access to the document.`,
          actionUrl: `${this.frontendUrl}/documents/show/${event.documentId}`,
          actionText: 'View Document',
          firstName: event.sharedWithName,
        },
        userId: event.sharedWithUserId,
        metadata: {
          eventType: EVENT_PATTERNS.DOCUMENT.SHARED,
          eventId: event.eventId,
          documentId: event.documentId,
        },
      });

      this.logger.log(
        `Document shared email queued for document: ${event.documentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue document shared email for document ${event.documentId}:`,
        error,
      );
    }
  }

  /**
   * Handle user session started - optional welcome back email
   */
  @OnEvent(EVENT_PATTERNS.USER.SESSION_STARTED)
  async handleSessionStarted(event: any) {
    // This is an example of an event we might listen to but not send emails for
    // You could implement "welcome back" emails here if needed
    this.logger.debug(
      `User session started for user: ${event.userId} - no email sent`,
    );
  }
}
