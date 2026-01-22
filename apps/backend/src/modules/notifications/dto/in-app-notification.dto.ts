import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsBoolean,
  IsUrl,
  IsIn,
  IsObject,
  validateOrReject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { InAppNotificationType } from '../entities/in-app-notification.entity';

/**
 * Sanitize string input by trimming whitespace and removing potentially dangerous characters
 */
const sanitizeString = (value: unknown): string | unknown => {
  if (typeof value === 'string') {
    return value
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/\s+/g, ' '); // Normalize whitespace
  }
  return value;
};

/**
 * DTO for creating a new in-app notification
 * Used by nestjs-query auto-generated createOne mutation
 */
@InputType('CreateInAppNotificationInput')
export class CreateInAppNotificationInput {
  @Field(() => String, { description: 'User ID to receive the notification' })
  @IsUUID('4', { message: 'User ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @Field(() => String, {
    description: 'Type of notification for UI styling',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsIn(['info', 'success', 'warning', 'error', 'system'], {
    message: 'Type must be one of: info, success, warning, error, system',
  })
  type?: InAppNotificationType;

  @Field(() => String, { description: 'The notification message content' })
  @IsString()
  @IsNotEmpty({ message: 'Message is required' })
  @MinLength(1, { message: 'Message must be at least 1 character long' })
  @MaxLength(5000, {
    message: 'Message must be at most 5000 characters long',
  })
  @Transform(({ value }) => sanitizeString(value))
  message: string;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Read status - defaults to false (unread)',
  })
  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'Optional action link for navigation (e.g., /documents/123)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Action link must be at most 500 characters' })
  @Transform(({ value }) => (value ? sanitizeString(value) : value))
  actionLink?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Optional action label for the action link button',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: 'Action label must be at most 100 characters',
  })
  @Transform(({ value }) => (value ? sanitizeString(value) : value))
  actionLabel?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Additional metadata for extensibility (JSON string)',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * DTO for updating an in-app notification
 * Used by nestjs-query auto-generated updateOne mutation
 */
@InputType('UpdateInAppNotificationInput')
export class UpdateInAppNotificationInput {
  @Field(() => String, {
    nullable: true,
    description: 'Type of notification for UI styling',
  })
  @IsOptional()
  @IsString()
  @IsIn(['info', 'success', 'warning', 'error', 'system'], {
    message: 'Type must be one of: info, success, warning, error, system',
  })
  type?: InAppNotificationType;

  @Field(() => String, {
    nullable: true,
    description: 'The notification message content',
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Message must be at least 1 character long' })
  @MaxLength(5000, {
    message: 'Message must be at most 5000 characters long',
  })
  @Transform(({ value }) => (value ? sanitizeString(value) : value))
  message?: string;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Read status',
  })
  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'Optional action link for navigation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Action link must be at most 500 characters' })
  @Transform(({ value }) => (value ? sanitizeString(value) : value))
  actionLink?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Optional action label for the action link button',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: 'Action label must be at most 100 characters',
  })
  @Transform(({ value }) => (value ? sanitizeString(value) : value))
  actionLabel?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Additional metadata for extensibility (JSON string)',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * DTO for marking a notification as read
 */
@InputType('MarkNotificationAsReadInput')
export class MarkNotificationAsReadInput {
  @Field(() => String, { description: 'Notification ID to mark as read' })
  @IsUUID('4', { message: 'Notification ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Notification ID is required' })
  id: string;
}

/**
 * DTO for marking a notification as unread
 */
@InputType('MarkNotificationAsUnreadInput')
export class MarkNotificationAsUnreadInput {
  @Field(() => String, { description: 'Notification ID to mark as unread' })
  @IsUUID('4', { message: 'Notification ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Notification ID is required' })
  id: string;
}

/**
 * DTO for marking all notifications as read for a user
 */
@InputType('MarkAllNotificationsAsReadInput')
export class MarkAllNotificationsAsReadInput {
  @Field(() => String, {
    description: 'User ID to mark all notifications as read',
  })
  @IsUUID('4', { message: 'User ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;
}
