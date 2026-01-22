import { Resolver, Subscription, Args } from '@nestjs/graphql';
import { GraphQLPubSubService } from '../../shared/streaming';
import { InAppNotificationCreatedPayload } from './dto/in-app-notification-created.dto';

/**
 * In-App Notification Subscriptions Resolver
 *
 * Provides GraphQL subscriptions for real-time in-app notification updates.
 * Clients can subscribe to receive new notifications as they are created.
 *
 * Usage (GraphQL):
 * ```graphql
 * subscription {
 *   inAppNotificationCreated {
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
 *
 * Or subscribe to notifications for a specific user:
 * ```graphql
 * subscription {
 *   inAppNotificationCreated(userId: "user-123") {
 *     notificationId
 *     type
 *     message
 *   }
 * }
 * ```
 *
 * WebSocket Connection:
 * Clients connect via ws://host/graphql using the graphql-ws protocol.
 */
@Resolver()
export class InAppNotificationSubscriptionResolver {
  constructor(private readonly pubSubService: GraphQLPubSubService) {}

  /**
   * Subscribe to in-app notification created events
   *
   * Clients can filter by:
   * - userId: Subscribe to notifications for a specific user
   * - No filter: Subscribe to all in-app notifications (use with caution)
   *
   * @param userId - Optional user ID to filter events
   * @returns AsyncIterator of InAppNotificationCreatedPayload events
   */
  @Subscription(() => InAppNotificationCreatedPayload, {
    name: 'inAppNotificationCreated',
    description: 'Subscribe to new in-app notifications',
    filter: (
      payload: { inAppNotificationCreated: InAppNotificationCreatedPayload },
      variables: { userId?: string },
    ) => {
      const event = payload.inAppNotificationCreated;

      // If userId is provided, filter by it
      if (variables.userId && event.userId !== variables.userId) {
        return false;
      }

      // If no filter provided or filter matches, include the event
      return true;
    },
    resolve: (payload: {
      inAppNotificationCreated: InAppNotificationCreatedPayload;
    }) => payload.inAppNotificationCreated,
  })
  inAppNotificationCreated(
    @Args('userId', {
      type: () => String,
      nullable: true,
      description: 'Filter by user ID',
    })
    _userId?: string,
  ): AsyncIterator<unknown> {
    return this.pubSubService.getInAppNotificationCreatedIterator();
  }
}
