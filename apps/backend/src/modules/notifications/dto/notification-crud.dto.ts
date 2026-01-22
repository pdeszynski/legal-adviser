import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEmail,
  IsEnum,
  IsDateString,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import { NotificationStatus } from '../entities/notification.entity';
import { EmailTemplateType } from './send-email.input';

/**
 * DTO for creating a new notification
 * Used by nestjs-query auto-generated createOne mutation
 */
@InputType('CreateNotificationInput')
export class CreateNotificationInput {
  @Field(() => String, { description: 'Recipient email address' })
  @IsEmail({}, { message: 'Recipient email must be a valid email address' })
  @IsNotEmpty({ message: 'Recipient email is required' })
  recipientEmail: string;

  @Field(() => String, {
    nullable: true,
    description: 'User ID (if notification is for a registered user)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'User ID must be a valid UUID v4' })
  userId?: string;

  @Field(() => String, { description: 'Email subject line' })
  @IsString()
  @IsNotEmpty({ message: 'Subject is required' })
  subject: string;

  @Field(() => EmailTemplateType, {
    description: 'Email template type',
  })
  @IsEnum(EmailTemplateType, {
    message: 'Template must be a valid email template type',
  })
  template: EmailTemplateType;

  @Field(() => NotificationStatus, {
    description: 'Notification status',
    nullable: true,
    defaultValue: NotificationStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(NotificationStatus, {
    message: 'Status must be one of: pending, queued, sent, failed, bounced',
  })
  status?: NotificationStatus;

  @Field(() => String, {
    nullable: true,
    description: 'Template data for rendering (JSON string)',
  })
  @IsOptional()
  @IsObject()
  templateData?: Record<string, any>;

  @Field(() => String, {
    nullable: true,
    description: 'SendGrid message ID',
  })
  @IsOptional()
  @IsString()
  messageId?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Error message if sending failed',
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Additional metadata (JSON string)',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @Field(() => String, {
    nullable: true,
    description: 'Timestamp when email was sent',
  })
  @IsOptional()
  @IsDateString()
  sentAt?: string;
}

/**
 * DTO for updating a notification
 * Used by nestjs-query auto-generated updateOne mutation
 */
@InputType('UpdateNotificationInput')
export class UpdateNotificationInput {
  @Field(() => String, {
    nullable: true,
    description: 'Recipient email address',
  })
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @Field(() => String, {
    nullable: true,
    description: 'User ID',
  })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Email subject line',
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @Field(() => EmailTemplateType, {
    nullable: true,
    description: 'Email template type',
  })
  @IsOptional()
  @IsEnum(EmailTemplateType)
  template?: EmailTemplateType;

  @Field(() => NotificationStatus, {
    nullable: true,
    description: 'Notification status',
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @Field(() => String, {
    nullable: true,
    description: 'Template data for rendering (JSON string)',
  })
  @IsOptional()
  @IsObject()
  templateData?: Record<string, any>;

  @Field(() => String, {
    nullable: true,
    description: 'SendGrid message ID',
  })
  @IsOptional()
  @IsString()
  messageId?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Error message if sending failed',
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Additional metadata (JSON string)',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @Field(() => String, {
    nullable: true,
    description: 'Timestamp when email was sent',
  })
  @IsOptional()
  @IsDateString()
  sentAt?: string;
}
