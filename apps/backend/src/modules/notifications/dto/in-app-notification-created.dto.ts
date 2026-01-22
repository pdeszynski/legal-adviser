import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import { InAppNotificationType } from '../entities/in-app-notification.entity';

/**
 * In-App Notification Created Payload
 *
 * Emitted when a new in-app notification is created for a user.
 * Used for real-time notification updates via GraphQL subscriptions.
 *
 * Usage (GraphQL):
 * ```graphql
 * subscription {
 *   inAppNotificationCreated(userId: "user-123") {
 *     notificationId
 *     userId
 *     type
 *     message
 *     actionLink
 *     actionLabel
 *     metadata
 *     createdAt
 *   }
 * }
 * ```
 */
@ObjectType('InAppNotificationCreatedPayload')
export class InAppNotificationCreatedPayload {
  @Field(() => ID, { description: 'Notification ID' })
  notificationId: string;

  @Field(() => ID, { description: 'User ID who received the notification' })
  userId: string;

  @Field(() => InAppNotificationType, { description: 'Type of notification' })
  type: InAppNotificationType;

  @Field(() => String, { description: 'Notification message' })
  message: string;

  @Field(() => String, {
    nullable: true,
    description: 'Optional action link for navigation',
  })
  actionLink?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Optional action label for the action link',
  })
  actionLabel?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Additional metadata',
  })
  metadata?: string;

  @Field(() => GraphQLISODateTime, { description: 'Creation timestamp' })
  createdAt: Date;
}
